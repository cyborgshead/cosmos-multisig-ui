import { DbTransactionParsedDataJson } from "@/graphql";
import { createDbTx } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/utils";
import { Account, calculateFee } from "@cosmjs/stargate";
import { assert, sleep } from "@cosmjs/utils";
import { NextRouter, withRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";
import { useChains } from "../../../context/ChainsContext";
import Button from "../../inputs/Button";
import Input from "../../inputs/Input";
import StackableContainer from "../../layout/StackableContainer";

interface CreateTxFormProps {
  readonly router: NextRouter;
  readonly senderAddress: string;
  readonly accountOnChain: Account;
}

const CreateTxJsonForm = ({ router, senderAddress, accountOnChain }: CreateTxFormProps) => {
  const { chain } = useChains();

  const [processing, setProcessing] = useState(false);
  const [rawJson, setRawJson] = useState("");
  const [memo, setMemo] = useState("");
  const [gasLimit, setGasLimit] = useState(200000); // Default gas limit
  const [gasLimitError, setGasLimitError] = useState("");

  const createTx = async () => {
    const loadingToastId = toast.loading("Creating transaction");
    setProcessing(true);
    await sleep(500);

    try {
      assert(typeof accountOnChain.accountNumber === "number", "accountNumber missing");

      let msgs;
      try {
        msgs = JSON.parse(rawJson);
        if (!Array.isArray(msgs)) {
          throw new Error("JSON must be an array of messages");
        }
      } catch (e) {
        toastError({
          description: "Invalid JSON format for messages",
          fullError: e instanceof Error ? e : undefined,
        });
        return;
      }

      if (!Number.isSafeInteger(gasLimit) || gasLimit <= 0) {
        setGasLimitError("gas limit must be a positive integer");
        return;
      }

      const txData: DbTransactionParsedDataJson = {
        accountNumber: accountOnChain.accountNumber,
        sequence: accountOnChain.sequence,
        chainId: chain.chainId,
        msgs,
        fee: calculateFee(gasLimit, chain.gasPrice),
        memo,
      };

      const txId = await createDbTx(accountOnChain.address, chain.chainId, txData);
      toastSuccess("Transaction created with ID", txId);
      router.push(`/${chain.registryName}/${senderAddress}/transaction/${txId}`);
    } catch (e) {
      console.error("Failed to create transaction:", e);
      toastError({
        description: "Failed to create transaction",
        fullError: e instanceof Error ? e : undefined,
      });
    } finally {
      setProcessing(false);
      toast.dismiss(loadingToastId);
    }
  };

  return (
    <StackableContainer
      lessPadding
      divProps={{ style: { width: "min(690px, 90vw)", maxWidth: "690px" } }}
    >
      <h2>Create New Transaction</h2>
      <div className="form-item">
        <label htmlFor="raw-json">Raw JSON Messages</label>
        <textarea
          id="raw-json"
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          rows={10}
          placeholder="Enter raw JSON array of messages here"
        />
      </div>
      <div className="form-item">
        <Input
          type="number"
          label="Gas Limit"
          name="gas-limit"
          value={gasLimit}
          onChange={({ target }) => setGasLimit(Number(target.value))}
          error={gasLimitError}
        />
      </div>
      <div className="form-item">
        <Input
          label="Gas Price"
          name="gas-price"
          value={chain.gasPrice}
          disabled={true}
        />
      </div>
      <div className="form-item">
        <Input
          label="Memo"
          name="memo"
          value={memo}
          onChange={({ target }) => setMemo(target.value)}
        />
      </div>
      <Button
        label="Create Transaction"
        onClick={createTx}
        disabled={!rawJson.trim()}
        loading={processing}
      />
      <style jsx>{`
        .form-item {
          margin-top: 1.5em;
        }
        textarea {
          width: 100%;
          padding: 0.5em;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-family: monospace;
        }
      `}</style>
    </StackableContainer>
  );
};

export default withRouter(CreateTxJsonForm);
