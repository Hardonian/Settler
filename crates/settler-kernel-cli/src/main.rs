use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use sha2::{Digest, Sha256};
use std::io::{self, Read};

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
    result: Option<KernelResult>,
    error: Option<KernelError>,
}

#[derive(Debug, Serialize)]
struct KernelResult {
    schema_version: &'static str,
    canonical_json: String,
    input_hash: String,
    normalized_hash: String,
    rule_hash: String,
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

fn success(result: KernelResult) -> KernelResponse {
    KernelResponse {
        ok: true,
        result: Some(result),
        error: None,
    }
}

fn failure(code: &'static str, message: impl Into<String>) -> KernelResponse {
    KernelResponse {
        ok: false,
        result: None,
        error: Some(KernelError {
            code,
            message: message.into(),
        }),
    }
}

fn run(req: KernelRequest) -> KernelResponse {
    match req.operation.as_str() {
        "canonicalize_hash" => {
            let input_json = match serde_json::to_string(&req.payload) {
                Ok(v) => v,
                Err(e) => return failure("KERNEL_SERIALIZATION_FAILED", e.to_string()),
            };
            let canonical = canonicalize(&req.payload);
            let canonical_json = match serde_json::to_string(&canonical) {
                Ok(v) => v,
                Err(e) => return failure("KERNEL_SERIALIZATION_FAILED", e.to_string()),
            };

            success(KernelResult {
                schema_version: "v1",
                canonical_json: canonical_json.clone(),
                input_hash: hash_str(&input_json),
                normalized_hash: hash_str(&canonical_json),
                rule_hash: hash_str("canonicalize_hash@v1"),
            })
        }
        other => failure(
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
                serde_json::to_string(&failure("KERNEL_INVALID_REQUEST", err.to_string()))
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
            left.result.as_ref().unwrap().normalized_hash,
            right.result.as_ref().unwrap().normalized_hash
        );
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
