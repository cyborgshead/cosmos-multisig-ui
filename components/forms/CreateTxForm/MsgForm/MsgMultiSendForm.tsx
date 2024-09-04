import { useEffect, useState, useMemo, useCallback } from "react";
import { MsgGetter } from "..";
import { useChains } from "../../../../context/ChainsContext";
import { displayCoinToBaseCoin } from "../../../../lib/coinHelpers";
import { checkAddress, exampleAddress, trimStringsObj } from "../../../../lib/displayHelpers";
import { RegistryAsset } from "../../../../types/chainRegistry";
import { MsgCodecs, MsgTypeUrls } from "../../../../types/txMsg";
import Button from "../../../inputs/Button";
import Input from "../../../inputs/Input";
import Select from "../../../inputs/Select";
import StackableContainer from "../../../layout/StackableContainer";
import { MsgMultiSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";
import { EncodeObject } from "@cosmjs/proto-signing";

interface MsgMultiSendEncodeObject extends EncodeObject {
    readonly typeUrl: "/cosmos.bank.v1beta1.MsgMultiSend";
    readonly value: Partial<MsgMultiSend>;
}

interface InputOutput {
  address: string;
  denom: string;
  amount: string;
}

interface MsgMultiSendFormProps {
  readonly senderAddress: string;
  readonly setMsgGetter: (msgGetter: MsgGetter) => void;
  readonly deleteMsg: () => void;
}

const calculateTotals = (entries: InputOutput[]) => {
  return entries.reduce((acc, entry) => {
    const { denom, amount } = entry;
    if (!acc[denom]) {
      acc[denom] = 0;
    }
    acc[denom] += Number(amount);
    return acc;
  }, {} as { [denom: string]: number });
};

const MsgMultiSendForm = ({ senderAddress, setMsgGetter, deleteMsg }: MsgMultiSendFormProps) => {
  const { chain } = useChains();

  const [inputs, setInputs] = useState<InputOutput[]>([
    { address: senderAddress, denom: "boot", amount: "0" }
  ]);
  const [outputs, setOutputs] = useState<InputOutput[]>([
    { address: exampleAddress(0, "bostrom"), denom: "boot", amount: "0" }
  ]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [msgGetter, setMsgGetterLocal] = useState<MsgGetter | null>(null);

  const totalInputs = useMemo(() => calculateTotals(inputs), [inputs]);
  const totalOutputs = useMemo(() => calculateTotals(outputs), [outputs]);
  const allDenoms = useMemo(() => [...new Set([...Object.keys(totalInputs), ...Object.keys(totalOutputs)])], [totalInputs, totalOutputs]);

  const addInput = useCallback(() => setInputs(prev => [...prev, { address: "", denom: "boot", amount: "0" }]), []);
  const addOutput = useCallback(() => setOutputs(prev => [...prev, { address: "", denom: "boot", amount: "0" }]), []);

  const updateInput = useCallback((index: number, field: keyof InputOutput, value: string) => {
    setInputs(prev => prev.map((input, i) => i === index ? { ...input, [field]: value } : input));
  }, []);

  const updateOutput = useCallback((index: number, field: keyof InputOutput, value: string) => {
    setOutputs(prev => prev.map((output, i) => i === index ? { ...output, [field]: value } : output));
  }, []);

  const removeInput = useCallback((index: number) => {
    setInputs(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  }, []);

  const removeOutput = useCallback((index: number) => {
    setOutputs(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  }, []);

  const isMsgValid = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {};

    const validateEntry = (entry: InputOutput, prefix: string) => {
      const addressErrorMsg = checkAddress(entry.address, chain.addressPrefix);
      if (addressErrorMsg) {
        newErrors[`${prefix}Address`] = `Invalid address: ${addressErrorMsg}`;
      }

      if (!entry.denom) {
        newErrors[`${prefix}Denom`] = "Denom is required";
      }

      if (!entry.amount || Number(entry.amount) < 0) {
        newErrors[`${prefix}Amount`] = "Amount must be 0 or greater";
      }
    };

    inputs.forEach((input, index) => validateEntry(input, `input${index}`));
    outputs.forEach((output, index) => validateEntry(output, `output${index}`));

    allDenoms.forEach(denom => {
      if (totalInputs[denom] !== totalOutputs[denom]) {
        newErrors[`totalAmount_${denom}`] = `Total input and output for ${denom} must be equal`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs, outputs, allDenoms, totalInputs, totalOutputs, chain.addressPrefix]);

  useEffect(() => {
    const createMsgValue = () => {
      if (!isMsgValid()) {
        return null;
      }

      try {
        const msgInputs = inputs.map((input) => ({
          address: input.address,
          coins: [displayCoinToBaseCoin({ denom: input.denom, amount: input.amount }, chain.assets)],
        }));

        const msgOutputs = outputs.map((output) => ({
          address: output.address,
          coins: [displayCoinToBaseCoin({ denom: output.denom, amount: output.amount }, chain.assets)],
        }));

        return MsgCodecs[MsgTypeUrls.MultiSend].fromPartial({
          inputs: msgInputs,
          outputs: msgOutputs,
        });
      } catch (error) {
        console.error("Error creating message value:", error);
        setErrors((prev) => ({ ...prev, general: `Error creating message: ${error instanceof Error ? error.message : String(error)}` }));
        return null;
      }
    };

    const msgValue = createMsgValue();
    if (msgValue === null) {
      setMsgGetterLocal(null);
      return;
    }

    const msg: MsgMultiSendEncodeObject = {
      typeUrl: MsgTypeUrls.MultiSend,
      value: msgValue,
    };

    const newMsgGetter = { isMsgValid, msg };
    setMsgGetterLocal(newMsgGetter);
    setMsgGetter(newMsgGetter);

  }, [chain.assets, inputs, outputs, isMsgValid, setMsgGetter]);

  return (
    <StackableContainer lessPadding lessMargin>
      <button className="remove" onClick={() => deleteMsg()}>
        ✕
      </button>
      <h2>MsgMultiSend</h2>
      
      <h3>Inputs</h3>
      {inputs.map((input, index) => (
        <div key={`input-${index}`} className="form-group">
          <Input
            label={`Input ${index + 1} Address`}
            value={input.address}
            onChange={(e) => updateInput(index, "address", e.target.value)}
            error={errors[`input${index}Address`]}
            placeholder={`E.g. ${exampleAddress(0, chain.addressPrefix)}`}
          />
          <Input
            label={`Input ${index + 1} Denom`}
            value={input.denom}
            onChange={(e) => updateInput(index, "denom", e.target.value)}
            error={errors[`input${index}Denom`]}
          />
          <Input
            type="text"
            pattern="[0-9]*"
            label={`Input ${index + 1} Amount`}
            value={input.amount}
            onChange={(e) => updateInput(index, "amount", e.target.value.replace(/[^0-9]/g, ''))}
            error={errors[`input${index}Amount`]}
          />
          <Button label="Remove" onClick={() => removeInput(index)} disabled={inputs.length === 1} />
        </div>
      ))}
      <Button label="Add Input" onClick={addInput} />

      <h3>Outputs</h3>
      {outputs.map((output, index) => (
        <div key={`output-${index}`} className="form-group">
          <Input
            label={`Output ${index + 1} Address`}
            value={output.address}
            onChange={(e) => updateOutput(index, "address", e.target.value)}
            error={errors[`output${index}Address`]}
            placeholder={`E.g. ${exampleAddress(0, chain.addressPrefix)}`}
          />
          <Input
            label={`Output ${index + 1} Denom`}
            value={output.denom}
            onChange={(e) => updateOutput(index, "denom", e.target.value)}
            error={errors[`output${index}Denom`]}
          />
          <Input
            type="text"
            pattern="[0-9]*"
            label={`Output ${index + 1} Amount`}
            value={output.amount}
            onChange={(e) => updateOutput(index, "amount", e.target.value.replace(/[^0-9]/g, ''))}
            error={errors[`output${index}Amount`]}
          />
          <Button label="Remove" onClick={() => removeOutput(index)} disabled={outputs.length === 1} />
        </div>
      ))}
      <Button label="Add Output" onClick={addOutput} />

      <div className="summary" style={{ border: '1px solid white' }}>
        <h3>Totals</h3>
        <table>
          <thead>
            <tr>
              <th>Denom</th>
              <th>Total Input</th>
              <th>Total Output</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>
            {allDenoms.map(denom => (
              <tr key={denom}>
                <td>{denom}</td>
                <td>{totalInputs[denom] || 0}</td>
                <td>{totalOutputs[denom] || 0}</td>
                <td>
                  {(totalInputs[denom] || 0) - (totalOutputs[denom] || 0)}
                  {errors[`totalAmount_${denom}`] && (
                    <span className="error"> ⚠️</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {Object.values(errors).map((error, index) => (
          <p key={index} className="error">{error}</p>
        ))}
      </div>

      <style jsx>{`
        .form-group {
          margin-bottom: 1em;
          padding: 1em;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 5px;
        }
        h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        button.remove {
          background: rgba(255, 255, 255, 0.2);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: none;
          color: white;
          position: absolute;
          right: 10px;
          top: 10px;
        }
        .summary {
          margin-top: 1em;
          padding: 1em;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1em;
        }
        th, td {
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.5em;
          text-align: right;
        }
        th {
          background-color: rgba(255, 255, 255, 0.05);
        }
        td:first-child {
          text-align: left;
        }
        .error {
          color: red;
        }
      `}</style>
    </StackableContainer>
  );
};

export default MsgMultiSendForm;
