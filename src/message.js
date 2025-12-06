const ethers = require('ethers')

const encodeMessage = ({ version, protocol, command, payload }) => {
    return ethers.concat([
        version,
        protocol,
        command,
        payload
    ])
}

const decodeMessage = (message) => {
    const version = ethers.dataSlice(message, 0, 1)
    const protocol = ethers.dataSlice(message, 1, 5)
    const command = ethers.dataSlice(message, 5, 9)
    const payload = ethers.dataSlice(message, 9)
    return {
        version,
        protocol,
        command,
        payload
    }
}

module.exports = {
    encodeMessage,
    decodeMessage
}