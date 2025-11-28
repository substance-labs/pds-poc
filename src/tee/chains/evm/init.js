const ethers = require('ethers')

module.exports.getEvmInitMessage = ({ protocol, chainId }) => {
    const version = '0x00'
    const protocolCode = ethers.zeroPadValue('0x01', 4)
    const chainCode = ethers.zeroPadValue(ethers.toBeHex(chainId), 4)
    const command = ethers.zeroPadValue('0x00', 4)
    return ethers.concat([
        version,
        protocolCode,
        chainCode,
        command
    ])
}