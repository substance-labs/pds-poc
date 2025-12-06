const { ethers } = require('ethers')
const { generateEvmAddress } = require('./chains/evm')

const erc20Interface = new ethers.Interface([
    "function transfer(address to, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)"

])

const getFields = (initMaterial) => {
    const version = ethers.dataSlice(initMaterial, 0, 1)
    const protocol = ethers.dataSlice(initMaterial, 1, 5)
    const command = ethers.dataSlice(initMaterial, 5, 9)
    const publicKey = ethers.dataSlice(initMaterial, 9, 42)
    const chainCode = ethers.dataSlice(initMaterial, 42)

    return {
        version,
        protocol,
        command,
        publicKey,
        chainCode,
    }
}

module.exports.generate = async ({ initMaterial, chainId, amount, token, recipient }) => {
    // FIXME: this works only w/ tokens having 18 decimals
    const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL || 'http://localhost:8545')
    const contract = new ethers.Contract(token, erc20Interface, provider)
    const recipientAddress = recipient.toLowerCase()
    const decimals = await contract.decimals()

    const parsedAmount = ethers.parseUnits(amount, decimals)

    const calldata = erc20Interface.encodeFunctionData("transfer", [
        recipientAddress,
        parsedAmount
    ])

    const action = { to: token, calldata, value: "0" }

    const {
        version,
        protocol,
        publicKey,
        chainCode,
    } = getFields(initMaterial)

    switch (ethers.toNumber(protocol)) {
        case 1:
            generateEvmAddress({
                version,
                protocol,
                chainId,
                publicKey,
                chainCode,
                action,
            })
            break
        default:
            throw new Error(`Unsupported protocol ${protocol}`)
    }
}