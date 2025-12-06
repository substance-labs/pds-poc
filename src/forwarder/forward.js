const cbor = require('cbor')
const ethers = require('ethers')
const { Account } = require("@near-js/accounts")
const { keyStores, utils } = require("near-api-js")
const { KeyPairSigner } = require("@near-js/signers")
const { getCallArgs } = require('../get-call-args')
const { JsonRpcProvider } = require("@near-js/providers")
const { decodeMessage, encodeMessage } = require('../message')

const path = require("path")
const os = require("os")


module.exports.forward = async (generatePayload) => {
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

    const {
        version,
        protocol,
        command,
        payload
    } = decodeMessage(generatePayload)
    const forwardingParams = cbor.decode(ethers.getBytes(payload))
    const nonce = "0"
    const gasPrice = "20000000"
    const gasLimit = "50000"

    forwardingParams.push(nonce, gasPrice, gasLimit)
    const encoded = encodeMessage({ version, protocol, command, payload: cbor.encode(forwardingParams) })
    const args = getCallArgs(encoded)

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
