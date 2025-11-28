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
    .action(() => {
        tee.outlayer.init()
    })

program.command('generate')
    .description('Generate deposit address')
    .argument('<publicKey>', 'Public key for the deposit address')
    .action((publicKey) => {
        tee.outlayer.generate(publicKey)
    })

program.command('forward')
    .description('Get the signed forward logic')
    .action(() => {
        forwarder.forward()
    })

program.parse()
