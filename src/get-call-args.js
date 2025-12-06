module.exports.getCallArgs = (message, overwrite = {}) => {
    const codeObj = process.env['OUTLAYER_REPO_URL']
        ? {
            GitHub: {
                repo: process.env['OUTLAYER_REPO_URL'],
                commit: process.env['OUTLAYER_COMMIT'] || 'main',
                build_target: "wasm32-wasip1",
            }
        }
        : {
            WasmUrl: {
                url: process.env['OUTLAYER_WASM_URL'],
                hash: process.env['OUTLAYER_HASH'],
                build_target: "wasm32-wasip1"
            }
        }
    return {
        code_source: { ...codeObj },
        secrets_ref: {
            profile: "default",
            account_id: process.env['OUTLAYER_SECRET_ACCOUNT_ID']
        },
        resource_limits: {
            max_instructions: 100000000,
            max_memory_mb: 256,
            max_execution_seconds: 120,
        },
        input_data: JSON.stringify({ message }),
        ...overwrite
    }
}