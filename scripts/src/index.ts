import {
  LCDClient,
  MsgStoreCode,
  MnemonicKey,
  MsgExecuteContract,
  MsgInstantiateContract,
  Coin,
  Coins,
} from '@terra-money/terra.js';
import * as fs from 'fs';

export async function main() {
  // test1 key from local terra accounts
  const mk = new MnemonicKey({
    // This is a localTerra mnemonic. DO NOT USE THIS FOR REAL COINs
    mnemonic:
      'notice oak worry limit wrap speak medal online prefer cluster roof addict wrist behave treat actual wasp year salad speed social layer crew genius',
  });

  // connect to local terra
  const terra = new LCDClient({
    URL: 'http://localhost:1317',
    chainID: 'localterra',
    //URL: 'https://tequila-fcd.terra.dev,
    //chainID: 'tequila-0004'
    gasPrices: '0.15uluna',
    gasAdjustment: 1.2,
  });

  const wallet = terra.wallet(mk);
  // Create Contract code
  const storeCode = new MsgStoreCode(
    wallet.key.accAddress,
    fs.readFileSync('../artifacts/terra_multisend.wasm').toString('base64'),
  );

  const storeCodeTx = await wallet.createAndSignTx({
    msgs: [storeCode],
  });
  const storeCodeTxResult = await terra.tx.broadcast(storeCodeTx);
  console.log(storeCodeTxResult);
  const codeId = storeCodeTxResult.logs[0].events[1].attributes[1].value;

  console.log('CodeId', codeId);

  let feeAmount = 100;
  let initMsg = {
    fee: { denom: 'uluna', amount: feeAmount.toString() },
  };

  const instantiate = new MsgInstantiateContract(
    wallet.key.accAddress, // owner
    Number(codeId), // code ID
    { ...initMsg }, // InitMsg
    {}, // init coins
    false, // migratable
  );
  const instantiateTx = await wallet.createAndSignTx({
    msgs: [instantiate],
  });
  const instantiateTxResult = await terra.tx.broadcast(instantiateTx);
  const contractAddress =
    instantiateTxResult.logs[0].events[0].attributes[2].value;
  console.log('Contract address', contractAddress);

  // Uncomment to test sending tokens on LocalTerra

  // Execute a transfer message
  //let payment1 = {
  //  recipient: 'terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp',
  //  pay: [
  //    {
  //      denom: 'uluna',
  //      amount: '100000000',
  //    },
  //  ],
  //};
  //let payment2 = {
  //  recipient: 'terra1757tkx08n0cqrw7p86ny9lnxsqeth0wgp0em95',
  //  pay: [
  //    {
  //      denom: 'uluna',
  //      amount: '100000000',
  //    },
  //  ],
  //};

  //let executeMsg = {
  //  multi_send: {
  //    payments: [payment1, payment2],
  //  },
  //};

  //let ulunaCoin = new Coin('uluna', 200000000 + feeAmount);
  //let coins = new Coins([ulunaCoin]);
  //const execute = new MsgExecuteContract(
  //  wallet.key.accAddress, // sender
  //  contractAddress, // contract account address
  //  { ...executeMsg }, // handle msg
  //  coins, // coins
  //);

  //const executeTx = await wallet.createAndSignTx({
  //  msgs: [execute],
  //});

  //const executeTxResult = await terra.tx.broadcast(executeTx);
  //console.log('ExecuteTxResult', executeTxResult);
}

main();
