import * as os from "os";

export interface DeviceInfo {
  os: string;
  arch: string;
  capabilities: Record<string, boolean>;
}

export function getDeviceInfo(): DeviceInfo {
  return {
    os: os.platform(),
    arch: os.arch(),
    capabilities: {
      cpu: true,
      gpu: detectGPU(),
      npu: detectNPU(),
      onnx_runtime: detectONNXRuntime(),
      tensorrt: detectTensorRT(),
      executorch: false,
      webgpu: detectWebGPU(),
      wasm: true,
    },
  };
}

export function detectGPU(): boolean {
  try {
    // Check for CUDA (NVIDIA)
    if (process.env.CUDA_PATH || process.env.CUDA_HOME) {
      return true;
    }

    // Check for Metal (macOS)
    if (os.platform() === "darwin" && os.arch() === "arm64") {
      return true; // Apple Silicon has Metal GPU
    }

    // Check for ROCm (AMD)
    if (process.env.ROCM_PATH) {
      return true;
    }

    // Try to load CUDA bindings (if available)
    try {
      require("cuda");
      return true;
    } catch {
      // CUDA not available
    }

    return false;
  } catch {
    return false;
  }
}

export function detectNPU(): boolean {
  try {
    // Check for Apple Neural Engine (ANE)
    if (os.platform() === "darwin" && os.arch() === "arm64") {
      // Apple Silicon (M1/M2/M3) has ANE
      return true;
    }

    // Check for Intel NPU
    if (process.env.INTEL_NPU) {
      return true;
    }

    // Check for Qualcomm NPU
    if (os.arch() === "arm64" && process.env.QUALCOMM_NPU) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function detectONNXRuntime(): boolean {
  try {
    // Try to load ONNX Runtime
    require("onnxruntime-node");
    return true;
  } catch {
    try {
      // Try alternative package name
      require("onnxruntime");
      return true;
    } catch {
      return false;
    }
  }
}

export function detectTensorRT(): boolean {
  try {
    // Check for TensorRT environment
    if (process.env.TENSORRT_PATH || process.env.LD_LIBRARY_PATH?.includes("tensorrt")) {
      return true;
    }

    // Try to load TensorRT bindings
    try {
      require("tensorrt");
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

export function detectWebGPU(): boolean {
  try {
    // WebGPU is primarily a browser API
    // In Node.js, check for dawn-node or similar
    try {
      require("@webgpu/node");
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}
