const cbor = require('cbor');
const { BIP32Factory } = require('bip32')
const ecc = require('tiny-secp256k1')
const crypto = require('crypto')
const { ethers } = require('ethers')
const { encodeMessage } = require('../../../message')

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



// We expect all the values as hex-strings and without 0x
// actions is an array of the form:
//   {
//      to: '0x',
//      calldata: '0x',
//      value: '0',
//   }
module.exports.generateEvmAddress = async ({
    version,
    protocol,
    chainId,
    publicKey,
    chainCode,
    action,
}) => {
    const { to, value, calldata } = action

    // const commitmentParams = [chainId, nonce, gasPrice, gas, to, value, calldata]
    const commitmentParams = [chainId, to, value, calldata]
    const commitmentHashHex = getCommitmentHash(commitmentParams)

    const bip32 = BIP32Factory(ecc)
    const deterministicPath = hexToBip32Path(commitmentHashHex)
    const publicKeyBytes = ethers.getBytes(publicKey)
    const chainCodeBytes = ethers.getBytes(chainCode)
    const parent = bip32.fromPublicKey(publicKeyBytes, chainCodeBytes)
    const child = parent.derivePath('m/' + deterministicPath)

    const address = getChildAddress(child)
    const command = "0x00000001" // Process deposit
    const payload = cbor.encode(commitmentParams);
    const message = encodeMessage({ version, protocol, command, payload })

    console.log("Output:", JSON.stringify({
        address,
        message
    }))
}