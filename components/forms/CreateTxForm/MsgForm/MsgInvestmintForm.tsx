import { MsgInvestmintEncodeObject } from "@cybercongress/cyber-js/src/encodeobjects"
import { parseCoins } from "@cosmjs/stargate";
import { longify } from "@cosmjs/stargate/build/queryclient";
import { useEffect, useState } from "react";
import { MsgGetter } from "..";
import { MsgCodecs, MsgTypeUrls } from "../../../../types/txMsg";
import Input from "../../../inputs/Input";
import Select from "../../../inputs/Select";
import StackableContainer from "../../../layout/StackableContainer";
import { Uint53 } from "@cosmjs/math";
import { MsgInvestmint } from "../../../../../cyber-js/build/codec/cyber/resources/v1beta1/tx";

const MsgInvestmintForm = ({ senderAddress, setMsgGetter, deleteMsg }: MsgInvestmintFormProps) => {
  const [amount, setAmount] = useState("");
  const [resource, setResource] = useState("");
  const [length, setLength] = useState("0");

  const [amountError, setAmountError] = useState("");
  const [resourceError, setResourceError] = useState("");
  const [lengthError, setLengthError] = useState("");

  useEffect(() => {
    const isMsgValid = (): boolean => {
      setAmountError("");
      setResourceError("");
      setLengthError("");

      if (resource !== "millivolt" && resource !== "milliampere") {
        setResourceError("Resource must be millivolt or milliampere");
        return false;
      }

      return true;
    };

    const msgValue = MsgCodecs[MsgTypeUrls.Investmint].fromPartial({
      neuron: senderAddress,
      amount: parseCoins(amount)[0],
      resource: resource,
      length: length,
    });

    const msg: MsgInvestmintEncodeObject = { typeUrl: MsgTypeUrls.Investmint, value: msgValue };

    setMsgGetter({ isMsgValid, msg });
  }, [senderAddress, setMsgGetter]);

  return (
    <StackableContainer lessPadding lessMargin>
      <button className="remove" onClick={() => deleteMsg()}>
        ✕
      </button>
      <h2>MsgCyberlink</h2>
      <div className="form-item">
        <Input
          label="Amount"
          name="amount"
          value={amount}
          onChange={({ target }) => {
            setAmount(target.value);
            setAmountError("");
          }}
          error={amountError}
        />
      </div>
      <div className="form-item">
        <Input
          label="resource"
          name="to-particle"
          value={resource}
          onChange={({ target }) => {
            setResource(target.value);
            setResourceError("");
          }}
          error={resourceError}
        />
      </div>
      <div className="form-item">
        <Input
          label="length"
          name="length"
          value={length}
          onChange={({ target }) => {
            setLength(target.value);
            setLengthError("");
          }}
          error={lengthError}
        />
      </div>
      <style jsx>{`
          .form-item {
              margin-top: 1.5em;
          }

          .form-item label {
              font-style: italic;
              font-size: 12px;
          }

          .form-select {
              display: flex;
              flex-direction: column;
              gap: 0.8em;
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
      `}</style>
    </StackableContainer>
  );
};

interface MsgInvestmintFormProps {
  readonly senderAddress: string;
  readonly setMsgGetter: (msgGetter: MsgGetter) => void;
  readonly deleteMsg: () => void;
}

export default MsgInvestmintForm;
