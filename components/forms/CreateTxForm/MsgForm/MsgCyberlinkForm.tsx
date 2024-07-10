import { MsgCyberlinkEncodeObject } from "@cybercongress/cyber-js/src/encodeobjects"
import { Link } from "@cybercongress/cyber-js/src/codec/cyber/graph/v1beta1/types"
import { useEffect, useState } from "react";
import { MsgGetter } from "..";
import { MsgCodecs, MsgTypeUrls } from "../../../../types/txMsg";
import Input from "../../../inputs/Input";
import Select from "../../../inputs/Select";
import StackableContainer from "../../../layout/StackableContainer";

const MsgCyberlinkForm = ({ senderAddress, setMsgGetter, deleteMsg }: MsgCyberlinkFormProps) => {
  const [fromParticle, setFromParticle] = useState("");
  const [toParticle, setToParticle] = useState("");

  const [particleError, setParticleError] = useState("");

  useEffect(() => {
    const isMsgValid = (): boolean => {
      setParticleError("");

      if (fromParticle.length != 46 && toParticle.length != 46) {
        setParticleError("Failed particle hash validation");
        return false;
      }

      return true;
    };

    const msgValue = MsgCodecs[MsgTypeUrls.Cyberlink].fromPartial({
      neuron: senderAddress,
      links: [Link.fromJSON({
        to: toParticle,
        from: fromParticle,
      })],
    });

    const msg: MsgCyberlinkEncodeObject = { typeUrl: MsgTypeUrls.Cyberlink, value: msgValue };

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
          label="From Particle"
          name="from-particle"
          value={fromParticle}
          onChange={({ target }) => {
            setFromParticle(target.value);
            setParticleError("");
          }}
          error={particleError}
        />
      </div>
      <div className="form-item">
        <Input
          label="To Particle"
          name="to-particle"
          value={toParticle}
          onChange={({ target }) => {
            setToParticle(target.value);
            setParticleError("");
          }}
          error={particleError}
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

interface MsgCyberlinkFormProps {
  readonly senderAddress: string;
  readonly setMsgGetter: (msgGetter: MsgGetter) => void;
  readonly deleteMsg: () => void;
}

export default MsgCyberlinkForm;
