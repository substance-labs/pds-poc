require('dotenv').config()
const { keyStores, utils } = require("near-api-js")
const { KeyPairSigner } = require("@near-js/signers")
const { Account } = require("@near-js/accounts")
const { JsonRpcProvider } = require("@near-js/providers")
const { getEvmInitMessage } = require('./chains/evm')
const path = require("path")
const os = require("os")


// TODO: export all the configuration to env
module.exports.init = async ({ protocol, chainId }) => {
    const homedir = os.homedir()
    const CREDENTIALS_DIR = ".near-credentials"
    const credentialsPath = path.join(homedir, CREDENTIALS_DIR)
    const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath)

    const url = process.env["NEAR_RPC_URL"]
    const accountId = process.env["NEAR_ACCOUNT_ID"]
    const network = process.env["NEAR_NETWORK"]
    const contractId = process.env["OUTLAYER_CONTRACT"]

    const keyPair = await keyStore.getKey(network, accountId)
    const connectionInfo = { url }
    const signer = new KeyPairSigner(keyPair)
    const provider = new JsonRpcProvider(connectionInfo, { retries: 3 })
    const account = new Account(accountId, provider, signer)

    const methodName = "request_execution"

    let message = null;
    switch (protocol) {
        case "evm":
            message = getEvmInitMessage({ protocol, chainId })
            break;
        default:
            throw new Error(`Unsupported protocol ${protocol}`)
    }

    const args = {
        code_source: {
            GitHub: {
                repo: "https://github.com/gitmp01/rust-pds-poc",
                commit: "168301dab1ed40dfd4b0c37d348bd5681324a961",
                build_target: "wasm32-wasip1",
            }
        },
        secrets_ref: {
            profile: "default",
            account_id: accountId
        },
        resource_limits: {
            max_instructions: 10000000,
            max_memory_mb: 128,
            max_execution_seconds: 60,
        },
        input_data: JSON.stringify({ message }),
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