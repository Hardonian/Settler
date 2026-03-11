use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use sha2::{Digest, Sha256};
use std::io::{self, Read};

const KERNEL_PROTOCOL_VERSION: &str = "v1";

#[derive(Debug, Deserialize)]
struct KernelRequest {
    operation: String,
    payload: Value,
}

#[derive(Debug, Serialize)]
struct KernelError {
    code: &'static str,
    message: String,
}

#[derive(Debug, Serialize)]
struct KernelResponse {
    ok: bool,
    operation: String,
    protocol_version: &'static str,
    kernel_version: &'static str,
    result: Option<Value>,
    error: Option<KernelError>,
}

#[derive(Debug, Serialize)]
struct HashResult {
    schema_version: &'static str,
    canonical_json: String,
    input_hash: String,
    normalized_hash: String,
    rule_hash: String,
}

#[derive(Debug, Serialize)]
struct HandshakeResult {
    operation: &'static str,
    protocol_version: &'static str,
    kernel_version: &'static str,
    supported_operations: Vec<&'static str>,
}

fn hash_str(value: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(value.as_bytes());
    hex::encode(hasher.finalize())
}

fn canonicalize(value: &Value) -> Value {
    match value {
        Value::Array(arr) => Value::Array(arr.iter().map(canonicalize).collect()),
        Value::Object(obj) => {
            let mut keys = obj.keys().cloned().collect::<Vec<_>>();
            keys.sort();
            let mut out = Map::new();
            for key in keys {
                if let Some(v) = obj.get(&key) {
                    out.insert(key, canonicalize(v));
                }
            }
            Value::Object(out)
        }
        _ => value.clone(),
    }
}

fn success(operation: &str, result: Value) -> KernelResponse {
    KernelResponse {
        ok: true,
        operation: operation.to_string(),
        protocol_version: KERNEL_PROTOCOL_VERSION,
        kernel_version: env!("CARGO_PKG_VERSION"),
        result: Some(result),
        error: None,
    }
}

fn failure(operation: &str, code: &'static str, message: impl Into<String>) -> KernelResponse {
    KernelResponse {
        ok: false,
        operation: operation.to_string(),
        protocol_version: KERNEL_PROTOCOL_VERSION,
        kernel_version: env!("CARGO_PKG_VERSION"),
        result: None,
        error: Some(KernelError {
            code,
            message: message.into(),
        }),
    }
}

fn build_hash_result(payload: &Value, rule: &'static str) -> Result<HashResult, String> {
    let input_json = serde_json::to_string(payload).map_err(|e| e.to_string())?;
    let canonical = canonicalize(payload);
    let canonical_json = serde_json::to_string(&canonical).map_err(|e| e.to_string())?;
    Ok(HashResult {
        schema_version: "v1",
        canonical_json: canonical_json.clone(),
        input_hash: hash_str(&input_json),
        normalized_hash: hash_str(&canonical_json),
        rule_hash: hash_str(rule),
    })
}

fn run(req: KernelRequest) -> KernelResponse {
    match req.operation.as_str() {
        "handshake" => {
            let result = HandshakeResult {
                operation: "handshake",
                protocol_version: KERNEL_PROTOCOL_VERSION,
                kernel_version: env!("CARGO_PKG_VERSION"),
                supported_operations: vec!["handshake", "canonicalize_hash", "proof_bundle_hash"],
            };
            match serde_json::to_value(result) {
                Ok(value) => success("handshake", value),
                Err(e) => failure("handshake", "KERNEL_SERIALIZATION_FAILED", e.to_string()),
            }
        }
        "canonicalize_hash" => match build_hash_result(&req.payload, "canonicalize_hash@v1") {
            Ok(result) => match serde_json::to_value(result) {
                Ok(value) => success("canonicalize_hash", value),
                Err(e) => failure(
                    "canonicalize_hash",
                    "KERNEL_SERIALIZATION_FAILED",
                    e.to_string(),
                ),
            },
            Err(e) => failure("canonicalize_hash", "KERNEL_SERIALIZATION_FAILED", e),
        },
        "proof_bundle_hash" => match build_hash_result(&req.payload, "proof_bundle_hash@v1") {
            Ok(result) => match serde_json::to_value(result) {
                Ok(value) => success("proof_bundle_hash", value),
                Err(e) => failure(
                    "proof_bundle_hash",
                    "KERNEL_SERIALIZATION_FAILED",
                    e.to_string(),
                ),
            },
            Err(e) => failure("proof_bundle_hash", "KERNEL_SERIALIZATION_FAILED", e),
        },
        other => failure(
            other,
            "KERNEL_UNKNOWN_OPERATION",
            format!("Unsupported operation: {other}"),
        ),
    }
}

fn main() {
    let mut input = String::new();
    if io::stdin().read_to_string(&mut input).is_err() {
        println!(
            "{}",
            serde_json::to_string(&failure(
                "stdin",
                "KERNEL_IO_READ_FAILED",
                "failed to read stdin payload"
            ))
            .unwrap_or_else(|_| "{\"ok\":false}".to_string())
        );
        std::process::exit(1);
    }

    let request: KernelRequest = match serde_json::from_str(&input) {
        Ok(value) => value,
        Err(err) => {
            println!(
                "{}",
                serde_json::to_string(&failure("parse", "KERNEL_INVALID_REQUEST", err.to_string()))
                    .unwrap_or_else(|_| "{\"ok\":false}".to_string())
            );
            std::process::exit(1);
        }
    };

    let response = run(request);
    let response_json =
        serde_json::to_string(&response).unwrap_or_else(|_| "{\"ok\":false}".to_string());
    println!("{}", response_json);

    if !response.ok {
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn canonicalize_hash_is_deterministic() {
        let payload = serde_json::json!({"b":1,"a":{"z":2,"y":3}});
        let left = run(KernelRequest {
            operation: "canonicalize_hash".to_string(),
            payload: payload.clone(),
        });
        let right = run(KernelRequest {
            operation: "canonicalize_hash".to_string(),
            payload,
        });
        assert!(left.ok);
        assert_eq!(
            left.result.as_ref().unwrap()["normalized_hash"],
            right.result.as_ref().unwrap()["normalized_hash"]
        );
    }

    #[test]
    fn proof_bundle_hash_uses_distinct_rule_hash() {
        let payload = serde_json::json!({"proof":"bundle"});
        let response = run(KernelRequest {
            operation: "proof_bundle_hash".to_string(),
            payload,
        });
        assert!(response.ok);
        assert_ne!(
            response.result.as_ref().unwrap()["rule_hash"],
            Value::String(hash_str("canonicalize_hash@v1"))
        );
    }

    #[test]
    fn handshake_returns_protocol_and_version() {
        let response = run(KernelRequest {
            operation: "handshake".to_string(),
            payload: serde_json::json!({}),
        });
        assert!(response.ok);
        assert_eq!(response.protocol_version, "v1");
        assert!(!response.kernel_version.is_empty());
    }

    #[test]
    fn unknown_operation_returns_typed_error() {
        let response = run(KernelRequest {
            operation: "nope".to_string(),
            payload: serde_json::json!({}),
        });
        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().unwrap().code,
            "KERNEL_UNKNOWN_OPERATION"
        );
    }
}
