## Setup

```
npm i
```

Copy `example.env` to .env and set the `NEAR_ACCOUNT_ID`, `NEAR_RPC_URL`, 
`EVM_RPC_URL`, `EVM_CHAIN_ID` environment variables.

See the help with 

```
./index.js -h
```

### Usage

As a first thing you may want to initialize the TEE.

```
./index.js init
```

Next, you can take the output from the initialization and 
use it to generate the deposit address:

```
./index.js generate --amount 0.000044 --token 0x63706e401c06ac8513145b7687a14804d17f814b 0x0000000001000021050202110...e0c39
```

Finally get the signed transaction by running

```
./index.js forward <payload>
```

where `payload` is taken from the generation output.

Then broadcast the resulting transaction by using any online service.

