"use client";

import axios from "axios";

export async function prepareTransaction(params: {
  contractAddress: string;
  address: string;
  value: number;
}): Promise<{ isPrepared: boolean; result: string | undefined }> {
  const { contractAddress, address, value } = params;
  console.log("sendTransaction", {
    contractAddress,
  });

  const transaction = JSON.stringify(
    {
      address,
      value,
    },
    null,
    2
  );
  let args = JSON.stringify({
    contractAddress,
  });

  let answer = await zkCloudWorkerRequest({
    command: "execute",
    transactions: [transaction],
    task: "prepareTx",
    args,
    metadata: `prepareTx`,
    mode: "async",
  });

  console.log(`zkCloudWorker answer:`, answer);
  const jobId = answer.jobId;
  console.log(`jobId:`, jobId);
  let result: string | undefined = undefined;
  let status = "";
  while (result === undefined && status !== "failed") {
    await sleep(1000);
    answer = await zkCloudWorkerRequest({
      command: "jobResult",
      jobId,
    });
    console.log(`jobResult api call result:`, answer);
    result = answer.result;
    status = answer.jobStatus;
    if (result !== undefined) console.log(`jobResult result:`, result);
  }
  if (status === "failed") {
    return { isPrepared: false, result };
  } else if (result === undefined) {
    return { isPrepared: false, result: "job error" };
  } else return { isPrepared: true, result };
}

export async function sendTransaction(params: {
  serializedTransaction: string;
  signedData: string;
  contractAddress: string;
  address: string;
  value: number;
}): Promise<{ isSent: boolean; hash: string }> {
  const { serializedTransaction, signedData, contractAddress, address, value } =
    params;
  console.log("sendTransaction", {
    serializedTransaction,
    signedData,
    contractAddress,
  });

  let args = JSON.stringify({
    contractAddress,
  });

  const transaction = JSON.stringify(
    {
      serializedTransaction,
      signedData,
      address,
      value,
    },
    null,
    2
  );

  let answer = await zkCloudWorkerRequest({
    command: "execute",
    transactions: [transaction],
    task: "proveAndSend",
    args,
    metadata: `prove and send`,
    mode: "async",
  });

  console.log(`zkCloudWorker answer:`, answer);
  const jobId = answer.jobId;
  console.log(`jobId:`, jobId);
  let result;
  while (result === undefined && answer.jobStatus !== "failed") {
    await sleep(5000);
    answer = await zkCloudWorkerRequest({
      command: "jobResult",
      jobId,
    });
    console.log(`jobResult api call result:`, answer);
    result = answer.result;
    if (result !== undefined) console.log(`jobResult result:`, result);
  }
  if (answer.jobStatus === "failed") {
    return { isSent: false, hash: result };
  } else if (result === undefined) {
    return { isSent: false, hash: "job error" };
  } else return { isSent: true, hash: result };
}

async function zkCloudWorkerRequest(params: any) {
  const { command, task, transactions, args, metadata, mode, jobId } = params;
  const apiData = {
    auth: process.env.NEXT_PUBLIC_ZKCW_AUTH,
    command: command,
    jwtToken: process.env.NEXT_PUBLIC_ZKCW_JWT,
    data: {
      task,
      transactions: transactions ?? [],
      args,
      repo: "sign-demo",
      developer: "DFST",
      metadata,
      mode: mode ?? "sync",
      jobId,
    },
    chain: `devnet`,
  };
  const endpoint = process.env.NEXT_PUBLIC_ZKCW_ENDPOINT + "devnet";

  const response = await axios.post(endpoint, apiData);
  return response.data;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
