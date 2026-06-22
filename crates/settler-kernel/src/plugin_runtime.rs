use wasmtime::*;

pub struct PluginRuntime {
    engine: Engine,
}

impl PluginRuntime {
    pub fn new() -> Result<Self> {
        let engine = Engine::default();
        Ok(PluginRuntime { engine })
    }

    pub fn execute_plugin(&self, wasm_bytes: &[u8], function_name: &str) -> Result<i32> {
        let module = Module::new(&self.engine, wasm_bytes)?;
        let mut store = Store::new(&self.engine, ());
        let instance = Instance::new(&mut store, &module, &[])?;
        let func = instance.get_typed_func::<(), i32>(&mut store, function_name)?;
        func.call(&mut store, ())
    }
}
