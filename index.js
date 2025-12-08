#!/usr/bin/env node

require('dotenv').config()
const { Command } = require('commander')
const tee = require('./src/tee')
const forwarder = require('./src/forwarder')
const program = new Command()

program
    .name('pds-poc')
    .description('Passive deposit service CLI')
    .version('0.1.0')

program.command('init')
    .description('Initialize tee')
    .option('--protocol, -p', 'protocol', 'evm')
    .option('--chain-id, -c', 'chain id', 8453)
    .action((options) => {
        const { protocol, chainId } = options
        tee.init({ protocol, chainId })
    })

program.command('generate')
    .description('Generate deposit address')
    .argument('<init>', 'Public key for the deposit address')
    .option('--chain-id, -c <chainId>', 'chain id', '8453')
    .option('--amount, -a <amount>', 'amount to transfer', '0.0001')
    .option('--token, -t <token>', 'token to transfer', '0x63706e401c06ac8513145b7687a14804d17f814b')
    .option('--recipient, -r <recipient>', 'recipient', '0xCEf67989ae740cC9c92fa7385F003F84EAAFd915')
    .action((init, options) => {
        tee.generate({ initMaterial: init, ...options })
    })

program.command('forward')
    .description('Get the signed forward logic')
    .option('--gas-limit -g, <gas>', 'gas limit', '50000')
    .option('--gas-price, -p <gasPrice>', 'gas price', "200000")
    .option('--nonce, -n <nonce>', 'nonce', "0")
    .argument('<generatePayload>', 'Payload returned with the address generation')
    .action((generatePayload, options) => {
        console.log('options:', options)
        forwarder.forward({ generatePayload, ...options })
    })

program.parse()
