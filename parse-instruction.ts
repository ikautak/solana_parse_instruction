import { createSolanaRpc, signature } from '@solana/kit';
const JSONBig = require('json-bigint');

type ParsedSystemProgramInstruction = {
  parsed: {
    info: {
      destination: string;
      lamports: bigint;
      source: string;
    };
    type: string;
  };
  program: string;
  programId: string;
  stackHeight: number;
};

type ParsedTokenProgramInstruction = {
  parsed: {
    info: {
      amount: string;
      authority: string;
      destination: string;
      source: string;
    };
    type: string;
  };
  program: string;
  programId: string;
  stackHeight: number;
};

const main = async (): Promise<void> => {
  const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
  const sig =
    //'5AfKCk6vdLG6oz4awD9ZBFsEpYr2LEZD9JkT7HZnsvjenMUZn5Pm2gtPViRZ1snikzzKwiZUzDuyioB9hDaVUZ55'; // sol
    //'ehZL2P8NGWqFU4pEuGAa9hUYq9156tZZWgonmActoNqSAxodVVjAnVA6ogGCPdHuNCRJ78pxpJtPm5qafRVjsp7'; // token
    '4AQ9vJt4fjHX53XcMCk3wsPKWjPG6QegHLQS2aDMZ44GmkG4fafjUS3WFFaCd1GCS2SEq6rUP1TsmysySWX4ZsnU'; // simple token
  const transaction = await rpc
    .getTransaction(signature(sig), {
      commitment: 'finalized',
      encoding: 'jsonParsed',
      maxSupportedTransactionVersion: 0,
    })
    .send();
  console.log(JSONBig.stringify(transaction, null, 2));

  if (transaction === null) {
    throw Error('transaction null');
  }

  if (transaction.meta === null) {
    throw Error('meta null');
  }
  if (transaction.meta.postTokenBalances) {
    for (const postTokenBalance of transaction.meta.postTokenBalances) {
      console.log(postTokenBalance);
    }
  }

  const accountKeys = transaction.transaction.message.accountKeys;

  if (transaction.meta.innerInstructions) {
    for (const innerInstruction of transaction.meta.innerInstructions) {
      for (const instruction of innerInstruction.instructions) {
        if (instruction.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
          const tokenProgramInstruction = instruction as ParsedTokenProgramInstruction;
          const info = tokenProgramInstruction.parsed.info;
          console.log(`${info.source} -> ${info.destination} ${info.amount} authority ${info.authority}`);

          const srcIndex = accountKeys.findIndex((accountKey) => accountKey.pubkey === info.source);
          const srcOwner = transaction.meta.postTokenBalances?.find(
            (postTokenBalance) => postTokenBalance.accountIndex === srcIndex,
          )?.owner;
          const destIndex = accountKeys.findIndex((accountKey) => accountKey.pubkey === info.destination);
          const dest = transaction.meta.postTokenBalances?.find(
            (postTokenBalance) => postTokenBalance.accountIndex === destIndex,
          );
          const destOwner = dest?.owner;

          console.log(`${srcOwner} -> ${destOwner} ${info.amount} mint ${dest?.mint}`);
        }
      }
    }
  }

  for (const keys of accountKeys) {
    console.log(keys);
  }

  for (const instruction of transaction.transaction.message.instructions) {
    if (instruction.programId === '11111111111111111111111111111111') {
      const systemProgramInstruction = instruction as ParsedSystemProgramInstruction;
      const info = systemProgramInstruction.parsed.info;
      console.log(`${info.source} -> ${info.destination} ${info.lamports} lamports`);
    } else if (instruction.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
      const tokenProgramInstruction = instruction as ParsedTokenProgramInstruction;
      const info = tokenProgramInstruction.parsed.info;
      console.log(`${info.source} -> ${info.destination} ${info.amount} authority ${info.authority}`);

      const srcIndex = accountKeys.findIndex((accountKey) => accountKey.pubkey === info.source);
      const srcOwner = transaction.meta.postTokenBalances?.find(
        (postTokenBalance) => postTokenBalance.accountIndex === srcIndex,
      )?.owner;
      const destIndex = accountKeys.findIndex((accountKey) => accountKey.pubkey === info.destination);
      const dest = transaction.meta.postTokenBalances?.find(
        (postTokenBalance) => postTokenBalance.accountIndex === destIndex,
      );
      const destOwner = dest?.owner;

      console.log(`${srcOwner} -> ${destOwner} ${info.amount} mint ${dest?.mint}`);
    }
    console.log(instruction);
  }
};

main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  },
);
