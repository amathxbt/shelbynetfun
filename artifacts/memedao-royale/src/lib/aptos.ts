import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const DEVNET_NODE_URL = "https://fullnode.devnet.aptoslabs.com/v1";

export const APTOS_NODE_URL =
  import.meta.env.VITE_APTOS_NODE_URL || DEVNET_NODE_URL;

// Module address: deployed on Aptos devnet
export const MODULE_ADDR =
  import.meta.env.VITE_MODULE_ADDR ||
  "0xa57871e9081ed8f5a92c445c3941d16e3ad05a1f6549b3a6bfba32ec390f28fe";

export const MODULE_NAME = "meme_dao_royale";

export const aptosConfig = new AptosConfig({
  network: Network.DEVNET,
});

export const aptos = new Aptos(aptosConfig);
