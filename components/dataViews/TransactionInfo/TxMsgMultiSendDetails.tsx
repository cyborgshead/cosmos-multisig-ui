import { MsgMultiSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { useChains } from "../../../context/ChainsContext";
import { printableCoins } from "../../../lib/displayHelpers";
import HashView from "../HashView";

interface TxMsgMultiSendDetailsProps {
  readonly msgValue: MsgMultiSend;
}

const TxMsgMultiSendDetails = ({ msgValue }: TxMsgMultiSendDetailsProps) => {
  const { chain } = useChains();

  return (
    <>
      <li>
        <h3>MsgMultiSend</h3>
      </li>
      <li>
        <label>Inputs:</label>
        <ul>
          {msgValue.inputs.map((input, index) => (
            <li key={index}>
              <div>
                <strong>Address:</strong> <HashView hash={input.address} />
              </div>
              <div>
                <strong>Amount:</strong> {printableCoins(input.coins, chain) || "None"}
              </div>
            </li>
          ))}
        </ul>
      </li>
      <li>
        <label>Outputs:</label>
        <ul>
          {msgValue.outputs.map((output, index) => (
            <li key={index}>
              <div>
                <strong>Address:</strong> <HashView hash={output.address} />
              </div>
              <div>
                <strong>Amount:</strong> {printableCoins(output.coins, chain) || "None"}
              </div>
            </li>
          ))}
        </ul>
      </li>
      <style jsx>{`
        li:not(:has(h3)) {
          background: rgba(255, 255, 255, 0.03);
          padding: 6px 10px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
        }
        li + li:nth-child(2) {
          margin-top: 25px;
        }
        li + li {
          margin-top: 10px;
        }
        li > div {
          padding: 3px 6px;
        }
        label {
          font-size: 14px;
          font-weight: bold;
          background: rgba(255, 255, 255, 0.1);
          padding: 3px 6px;
          border-radius: 5px;
          display: block;
          margin-bottom: 10px;
        }
        ul {
          list-style-type: none;
          padding-left: 0;
        }
        ul li {
          margin-bottom: 10px;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px;
          border-radius: 5px;
        }
        strong {
          margin-right: 5px;
        }
      `}</style>
    </>
  );
};

export default TxMsgMultiSendDetails;
