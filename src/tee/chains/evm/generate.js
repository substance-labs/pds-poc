const cbor = require('cbor');
const { BIP32Factory } = require('bip32')
const ecc = require('tiny-secp256k1')
const crypto = require('crypto')
const { ethers } = require('ethers')

function hexToBip32Path(hexString) {
    const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
    if (cleanHex.length !== 64) {
        throw new Error(`Expected 64 hex characters (32 bytes), got ${cleanHex.length}`);
    }

    if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
        throw new Error('Invalid hex string: contains non-hexadecimal characters');
    }

    const path = [];
    const nonHardenedLimit = 2 ** 31 - 1
    for (let i = 0; i < 64; i += 8) {
        const chunk = cleanHex.slice(i, i + 8);
        const value = parseInt(chunk, 16) % nonHardenedLimit;
        path.push(value.toString());
    }

    return path.join('/');
}

const getCommitmentHash = (commitmentParams) => {
    const hash = crypto.createHash('sha256')
    for (const str of commitmentParams) {
        hash.update(str)
    }
    return hash.digest('hex')
}

const getChildAddress = (child) => {
    const uncompressedPublicKey = Buffer.from(ecc.pointCompress(child.publicKey, false)).toString('hex')
    return ethers.computeAddress(`0x${uncompressedPublicKey}`)
}

const getProcessDepositPayload = ({ version, networkCode, commitmentParams }) => {
    const processDepositCommandCode = "0x00000001"
    return ethers.concat([
        version,
        networkCode,
        processDepositCommandCode,
        cbor.encode(commitmentParams)
    ])
}

// We expect all the values as hex-strings and without 0x
// actions is an array of the form:
//   {
//      to: '0x',
//      calldata: '0x',
//      value: '0',
//   }
module.exports.generateEvmAddress = async ({
    version,
    networkCode,
    publicKey,
    chainCode,
    actions,
}) => {
    const chainId = parseInt(ethers.dataSlice(networkCode, 4, 8), 16).toString()
    const nonce = "0"
    // FIXME: retrieve from RPC node
    const gasPrice = "20000000"
    const gas = "50000"

    const { to, value, calldata } = actions[0]

    const commitmentParams = [chainId, nonce, gasPrice, gas, to, value, calldata]
    const commitmentHashHex = getCommitmentHash(commitmentParams)

    const bip32 = BIP32Factory(ecc)
    const deterministicPath = hexToBip32Path(commitmentHashHex)
    const publicKeyBytes = ethers.getBytes(publicKey)
    const chainCodeBytes = ethers.getBytes(chainCode)
    const parent = bip32.fromPublicKey(publicKeyBytes, chainCodeBytes)
    const child = parent.derivePath('m/' + deterministicPath)

    const address = getChildAddress(child)
    const payload = getProcessDepositPayload({ version, networkCode, commitmentParams })

    console.log("Output:", JSON.stringify({
        address,
        payload
    }))
}