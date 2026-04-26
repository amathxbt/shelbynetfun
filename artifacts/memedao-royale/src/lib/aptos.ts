import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export const SHELBYNET_NODE_URL =
  import.meta.env.VITE_APTOS_NODE_URL || "https://api.shelbynet.shelby.network/v1";

export const MODULE_ADDR =
  import.meta.env.VITE_MODULE_ADDR || "0xcafe0000deadbeef0000cafe0000dead";

export const MODULE_NAME = "meme_dao_royale";

export const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: SHELBYNET_NODE_URL,
});

export const aptos = new Aptos(aptosConfig);

export const SHELBYNET_NETWORK_CONFIG = {
  name: "Shelbynet",
  chainId: "1",
  url: SHELBYNET_NODE_URL,
};
