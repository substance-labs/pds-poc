const { ethers } = require('ethers')
const { BIP32Factory } = require('bip32')
const ecc = require('tiny-secp256k1')
const crypto = require('crypto')
const erc20Interface = new ethers.Interface([
    "function transfer(address to, uint256 amount) returns (bool)"
])

/**
 * Converts a 32-byte hex string into a BIP32 derivation path
 * @param {string} hexString - A hex string of 32 bytes (64 hex characters)
 * @returns {string} BIP32 derivation path (e.g., "123456789/987654321/...")
 */
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
const networkCodes = {
    "00000001": "evm"
}

module.exports.generate = (initMaterial) => {
    const material = initMaterial.replace('0x', '')
    const version = material.slice(0, 2)
    const networkCode = material.slice(2, 18)
    const publicKey = material.slice(18, 84)
    const chainCode = material.slice(84)

    const recipientAddress = "0xCEf67989ae740cC9c92fa7385F003F84EAAFd915".toLowerCase()
    const transferAmount = ethers.parseEther("0.0001")
    const chainId = "8453"
    const nonce = "0"
    const gasPrice = "20000000000"
    const gas = "20000"
    const to = "0x63706e401c06ac8513145b7687a14804d17f814b" // AAVE on Base
    const value = "0"

    const calldata = erc20Interface.encodeFunctionData("transfer", [
        recipientAddress,
        transferAmount
    ])

    const hash = crypto.createHash('sha256')
    for (const str of [chainId, nonce, gasPrice, gas, to, value, calldata]) {
        hash.update(str)
    }

    const commitmentHashHex = hash.digest('hex')
    const deterministicPath = hexToBip32Path(commitmentHashHex)

    console.log(`calldata: ${calldata}`)
    console.log(`commitment hash: ${commitmentHashHex}`)

    // This is ethereum specific
    // const rootDerivationPath = "m/44'/60'/0'/0/0/";
    // const derivationPath = rootDerivationPath + deterministicPath

    const bip32 = BIP32Factory(ecc)
    const publicKeyBytes = Uint8Array.from(Buffer.from(publicKey, 'hex'))
    const chainCodeBytes = Uint8Array.from(Buffer.from(chainCode, 'hex'))
    const node = bip32.fromPublicKey(publicKeyBytes, chainCodeBytes)

    const child = node.derivePath('m/' + deterministicPath)

    const uncompressedPublicKey = Buffer.from(ecc.pointCompress(child.publicKey, false)).toString('hex')

    const address = ethers.computeAddress(`0x${uncompressedPublicKey}`)

    console.log('address:', address)

}