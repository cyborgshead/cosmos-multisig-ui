import { MsgGrant } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { useChains } from "../../../context/ChainsContext";
import HashView from "../HashView";
import { Any } from "cosmjs-types/google/protobuf/any";
import { Timestamp } from "cosmjs-types/google/protobuf/timestamp";
import { fromTimestamp } from "cosmjs-types/helpers";

interface TxMsgGrantDetailsProps {
  readonly msgValue: MsgGrant;
}

const TxMsgGrantDetails = ({ msgValue }: TxMsgGrantDetailsProps) => {
  const { chain } = useChains();

  const parseAuthorization = (auth: Any | undefined) => {
    if (!auth) return { type: "Unknown", msg: "Not specified" };
    try {
      return {
        type: auth.typeUrl || "Unknown",
        msg: auth.value || "Unknown"
      };
    } catch (error) {
      return { type: "Unknown", msg: "Unknown" };
    }
  };

  const formatDate = (timestamp: Timestamp | string | undefined) => {
    if (!timestamp) {
      return "No expiration";
    }

    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    };
    const locale = 'en-US'; // Set your desired locale here

    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString(locale, options);
    }

    if (typeof timestamp === 'object' && 'seconds' in timestamp && 'nanos' in timestamp) {
      return fromTimestamp(timestamp).toLocaleString(locale, options);
    }

    return "Invalid timestamp";
  };
  
  const { type, msg } = parseAuthorization(msgValue.grant?.authorization);

  return (
    <>
      <li>
        <h3>MsgGrant</h3>
      </li>
      <li>
        <label>Granter:</label>
        <div title={msgValue.granter}>
          <HashView hash={msgValue.granter} />
        </div>
      </li>
      <li>
        <label>Grantee:</label>
        <div title={msgValue.grantee}>
          <HashView hash={msgValue.grantee} />
        </div>
      </li>
      <li>
        <label>Authorization Type:</label>
        <div>{type}</div>
      </li>
      <li>
        <label>Authorized Message:</label>
        <div>{msg}</div>
      </li>
      <li>
        <label>Expiration:</label>
        <div>{formatDate(msgValue.grant?.expiration)}</div>
      </li>
      <style jsx>{`
        li:not(:has(h3)) {
          background: rgba(255, 255, 255, 0.03);
          padding: 6px 10px;
          border-radius: 8px;
          display: flex;
          align-items: center;
        }
        li + li:nth-child(2) {
          margin-top: 25px;
        }
        li + li {
          margin-top: 10px;
        }
        li div {
          padding: 3px 6px;
        }
        label {
          font-size: 12px;
          background: rgba(255, 255, 255, 0.1);
          padding: 3px 6px;
          border-radius: 5px;
          display: block;
          margin-right: 10px;
        }
      `}</style>
    </>
  );
};

export default TxMsgGrantDetails;
