const { connect, keyStores, utils, KeyPair } = require("near-api-js")
const { KeyPairSigner } = require("@near-js/signers")
const { Account } = require("@near-js/accounts")
const { JsonRpcProvider, ConnectionInfo } = require("@near-js/providers")
const path = require("path")
const os = require("os")

// TODO: export all the configuration to env
module.exports.init = async () => {
    const homedir = os.homedir()
    const CREDENTIALS_DIR = ".near-credentials"
    const credentialsPath = path.join(homedir, CREDENTIALS_DIR)
    const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath)

    const url = "https://rpc.mainnet.near.org"
    const accountId = "substance-test-1.near"
    const keyPair = await keyStore.getKey("mainnet", accountId)
    const connectionInfo = { url }
    const signer = new KeyPairSigner(keyPair)
    const provider = new JsonRpcProvider(connectionInfo, { retries: 3 })
    const account = new Account(accountId, provider, signer)

    const contractId = "outlayer.near"
    const methodName = "request_execution"
    const args = {
        code_source: {
            repo: "https://github.com/gitmp01/rust-pds-poc",
            commit: "master",
            build_target: "wasm32-wasip1",
        },
        resource_limits: {
            max_instructions: 10000000,
            max_memory_mb: 128,
            max_execution_seconds: 60,
        },
        input_data: JSON.stringify({ message: "helloworld!" }),
    }

    const gas = "300000000000000" // 300 Tgas
    const deposit = utils.format.parseNearAmount("0.1")

    try {
        const result = await account.callFunction({
            contractId,
            methodName,
            args,
            gas,
            deposit,
        })

        console.log("Transaction successful:", result)
    } catch (error) {
        console.error("Transaction failed:", error)
    }
}