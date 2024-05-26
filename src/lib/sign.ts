"use client";

//import { contractCloud } from "./cloud";
//import { contract } from "./contract";
import { prepareTransaction, sendTransaction } from "./send";
import { getAccount } from "./cloud";

export async function sign(value: number): Promise<string | undefined> {
  console.log(value);
  const address = await getAccount();
  if (address === undefined) {
    console.log("No account");
    return undefined;
  }
  const contractAddress =
    "B62qk7nXjEzGJdyQFNVs5UauASTQJgiJSBpHJmDcFTiYQrDDTGDsNFT";

  console.time("prepared tx");
  const { isPrepared, result } = await prepareTransaction({
    value,
    address,
    contractAddress,
  });
  console.log("prepare tx", { isPrepared, result });
  console.timeEnd("prepared tx");
  if (isPrepared === false || result === undefined) {
    console.log("Transaction not prepared");
    return undefined;
  }
  const {
    transaction,
    serializedTransaction,
    fee,
    memo,
  }: {
    transaction: string;
    serializedTransaction: string;
    fee: number;
    memo: string;
  } = JSON.parse(result);

  const txResult = await (window as any).mina?.sendTransaction({
    transaction,
    onlySign: true,
    feePayer: {
      fee: fee,
      memo: memo,
    },
  });

  const signedData = txResult?.signedData;
  if (signedData === undefined) {
    console.log("No signed data");
    return undefined;
  }
  console.time("ProvedAndSent");
  const { isSent, hash } = await sendTransaction({
    serializedTransaction,
    signedData,
    contractAddress,
    address,
    value,
  });
  console.timeEnd("ProvedAndSent");
  if (isSent === false || hash === undefined) {
    console.log("Transaction not sent");
    return undefined;
  }
  return hash;
}
