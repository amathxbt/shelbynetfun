import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export const SHELBYNET_NODE_URL = "https://api.shelbynet.shelby.xyz/v1";

export const APTOS_NODE_URL =
  import.meta.env.VITE_APTOS_NODE_URL || SHELBYNET_NODE_URL;

// Module address: deployed on Shelbynet
export const MODULE_ADDR =
  import.meta.env.VITE_MODULE_ADDR ||
  "0xa57871e9081ed8f5a92c445c3941d16e3ad05a1f6549b3a6bfba32ec390f28fe";

export const MODULE_NAME = "meme_dao_royale";

export const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: APTOS_NODE_URL,
});

export const aptos = new Aptos(aptosConfig);
