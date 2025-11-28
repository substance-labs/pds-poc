const { ethers } = require('ethers')
const { generateEvmAddress } = require('./chains/evm')

const erc20Interface = new ethers.Interface([
    "function transfer(address to, uint256 amount) returns (bool)"
])

const PROTOCOL_CODES = {
    1: "evm",
    2: "btc"
}

const getFields = (initMaterial) => {
    const version = ethers.dataSlice(initMaterial, 0, 1)
    const networkCode = ethers.dataSlice(initMaterial, 1, 9)
    const protocolCode = ethers.dataSlice(initMaterial, 1, 5)
    const chainIdCode = ethers.dataSlice(initMaterial, 5, 9)
    const publicKey = ethers.dataSlice(initMaterial, 9, 42)
    const chainCode = ethers.dataSlice(initMaterial, 42)

    return {
        version,
        networkCode,
        protocolCode,
        chainIdCode,
        publicKey,
        chainCode,
    }
}

module.exports.generate = (initMaterial) => {
    const amount = ethers.parseEther("0.0001")
    const contract = "0x63706e401c06ac8513145b7687a14804d17f814b" // AAVE on Base
    const recipientAddress = "0xCEf67989ae740cC9c92fa7385F003F84EAAFd915".toLowerCase()
    const calldata = erc20Interface.encodeFunctionData("transfer", [
        recipientAddress,
        amount
    ])

    const actions = [{ to: contract, calldata, value: "0" }]

    const {
        version,
        networkCode,
        protocolCode,
        publicKey,
        chainCode,
    } = getFields(initMaterial)

    const protocol = PROTOCOL_CODES[ethers.toNumber(protocolCode)]

    switch (protocol) {
        case "evm":
            generateEvmAddress({
                version,
                networkCode,
                publicKey,
                chainCode,
                actions,
            })
            break
        default:
            throw new Error(`Unsupported protocol ${protocol}`)
    }
}