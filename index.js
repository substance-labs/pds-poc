#!/usr/bin/env node

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
    .argument('<publicKey>', 'Public key for the deposit address')
    .action((publicKey) => {
        tee.generate(publicKey)
    })

program.command('forward')
    .description('Get the signed forward logic')
    .action(() => {
        forwarder.forward()
    })

program.parse()
