const { getEvmInitMessage } = require('./init')
const { generateEvmAddress } = require('./generate')
const message = require('../../../message')

module.exports = {
    ...message,
    getEvmInitMessage,
    generateEvmAddress,
}