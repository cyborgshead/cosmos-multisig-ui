import { DbTransactionParsedDataJson } from "@/graphql";
import { MsgCodecs, MsgTypeUrl, MsgTypeUrls } from "@/types/txMsg";
import { EncodeObject } from "@cosmjs/proto-signing";

const gasOfMsg = (msgType: MsgTypeUrl): number => {
  switch (msgType) {
    // Bank
    case MsgTypeUrls.Send:
      return 100_000;
    case MsgTypeUrls.MultiSend:
      return 4_200_000;
    // Staking
    case MsgTypeUrls.Delegate:
      // This is enough for 1 delegation and 1 autoclaim. But it is probably too low for
      // a lot of auto-claims. See https://github.com/cosmos/cosmos-multisig-ui/issues/177.
      return 400_000;
    case MsgTypeUrls.Undelegate:
      return 400_000;
    case MsgTypeUrls.BeginRedelegate:
      return 400_000;
    // Distribution
    case MsgTypeUrls.FundCommunityPool:
      return 100_000;
    case MsgTypeUrls.SetWithdrawAddress:
      return 100_000;
    case MsgTypeUrls.WithdrawDelegatorReward:
      return 100_000;
    // Vesting
    case MsgTypeUrls.CreateVestingAccount:
      return 100_000;
    // Governance
    case MsgTypeUrls.Vote:
      return 100_000;
    // IBC
    case MsgTypeUrls.Transfer:
      return 180_000;
    // CosmWasm
    case MsgTypeUrls.InstantiateContract:
      return 150_000;
    case MsgTypeUrls.InstantiateContract2:
      return 150_000;
    case MsgTypeUrls.UpdateAdmin:
      return 150_000;
    case MsgTypeUrls.ExecuteContract:
      return 150_000;
    case MsgTypeUrls.MigrateContract:
      return 150_000;
    case MsgTypeUrls.Cyberlink:
      return 420_000;
    case MsgTypeUrls.Investmint:
      return 420_000;
    case MsgTypeUrls.Grant:
      return 420_000;
    case MsgTypeUrls.Revoke:
      return 420_000;
    case MsgTypeUrls.Exec:
      return 420_000;
    default:
      throw new Error("Unknown msg type");
  }
};

export const gasOfTx = (msgTypes: readonly MsgTypeUrl[]): number => {
  const txFlatGas = 100_000;
  const totalTxGas = msgTypes.reduce((acc, msgType) => acc + gasOfMsg(msgType), txFlatGas);
  return totalTxGas;
};

export const isKnownMsgTypeUrl = (typeUrl: string): typeUrl is MsgTypeUrl =>
  Object.values(MsgTypeUrls).includes(typeUrl as MsgTypeUrl);

export const exportMsgToJson = (msg: EncodeObject): EncodeObject => {
  if (isKnownMsgTypeUrl(msg.typeUrl)) {
    return { ...msg, value: MsgCodecs[msg.typeUrl].toJSON(msg.value) };
  }

  throw new Error("Unknown msg type");
};

const importMsgFromJson = (msg: EncodeObject): EncodeObject => {
  if (isKnownMsgTypeUrl(msg.typeUrl)) {
    if (msg.typeUrl === MsgTypeUrls.Grant) {
      // Handle MsgGrant manually
      const grantValue = msg.value as {
        grant?: {
          authorization?: {
            typeUrl?: string;
            value?: string;
          };
        };
      };
      if (grantValue.grant && grantValue.grant.authorization) {
        const auth = grantValue.grant.authorization;
        grantValue.grant.authorization = {
          typeUrl: auth.typeUrl,
          value: auth.value
        };
      }
      return { ...msg, value: grantValue };
    } else {
      // Use MsgCodecs for other message types
      const parsedValue = MsgCodecs[msg.typeUrl].fromJSON(msg.value);
      return { ...msg, value: parsedValue };
    }
  }

  throw new Error("Unknown msg type");
};

export const dbTxFromJson = (txJson: string): DbTransactionParsedDataJson | null => {
  try {
    const parsedDbTx: DbTransactionParsedDataJson = JSON.parse(txJson);
    const dbTx = { ...parsedDbTx, msgs: parsedDbTx.msgs.map(importMsgFromJson) };

    return dbTx;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error parsing tx JSON from DB: ${error.message}`);
    } else {
      console.error("Unknown error when parsing tx JSON from DB");
    }

    return null;
  }
};

interface MsgTypeCount {
  readonly msgType: string;
  readonly count: number;
}

export const msgTypeCountsFromJson = (txJson: string): readonly MsgTypeCount[] => {
  const tx = dbTxFromJson(txJson);
  if (!tx) {
    return [];
  }

  const msgTypeCounts: { [msgType: string]: number } = {};

  const msgTypes = tx.msgs.map(({ typeUrl }) => {
    const parts = typeUrl.split(".Msg");
    return parts.length > 1 ? parts[1] : typeUrl;
  });

  for (const msgType of msgTypes) {
    if (msgTypeCounts[msgType]) {
      msgTypeCounts[msgType]++;
    } else {
      msgTypeCounts[msgType] = 1;
    }
  }

  return Object.entries(msgTypeCounts).map(([msgType, count]) => ({ msgType, count }));
};
