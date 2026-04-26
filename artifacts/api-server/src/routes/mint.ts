import { Router, type IRouter } from "express";
import {
  Account,
  AccountAuthenticator,
  AccountAddress,
  Aptos,
  AptosConfig,
  Deserializer,
  Ed25519PrivateKey,
  Network,
  SimpleTransaction,
} from "@aptos-labs/ts-sdk";

const router: IRouter = Router();

const SHELBYNET_URL = "https://api.shelbynet.shelby.xyz/v1";
const MODULE_ADDR =
  process.env.VITE_MODULE_ADDR ||
  "0xa57871e9081ed8f5a92c445c3941d16e3ad05a1f6549b3a6bfba32ec390f28fe";
const DEPLOYER_ADDR = MODULE_ADDR;
const PRIVATE_KEY = process.env.SHELBY_DEPLOYER_PRIVATE_KEY || "";

function getAptos() {
  return new Aptos(
    new AptosConfig({
      network: Network.CUSTOM,
      fullnode: SHELBYNET_URL,
    })
  );
}

function getDeployer() {
  if (!PRIVATE_KEY) throw new Error("SHELBY_DEPLOYER_PRIVATE_KEY not set");
  return Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(PRIVATE_KEY),
    address: AccountAddress.fromString(DEPLOYER_ADDR),
  });
}

/**
 * POST /api/mint/build
 * Body: { senderAddress, title, objectId, proofHash }
 * Returns: { txBytes: base64 }  — a fee-payer transaction the user must sign
 */
router.post("/mint/build", async (req, res) => {
  try {
    const { senderAddress, title, objectId, proofHash } = req.body as {
      senderAddress: string;
      title: string;
      objectId: string;
      proofHash: string;
    };

    if (!senderAddress || !title || !objectId || !proofHash) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const aptos = getAptos();
    const deployer = getDeployer();

    const tx = await aptos.transaction.build.simple({
      sender: AccountAddress.fromString(senderAddress),
      withFeePayer: true,
      data: {
        function: `${MODULE_ADDR}::meme_dao_royale::mint_meme`,
        typeArguments: [],
        functionArguments: [
          MODULE_ADDR,
          title,
          objectId,
          proofHash,
        ],
      },
    });

    // Set the fee payer to the deployer address
    tx.feePayerAddress = AccountAddress.fromString(DEPLOYER_ADDR);

    const txBytes = Buffer.from(tx.bcsToBytes()).toString("base64");

    res.json({ txBytes });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("mint/build error:", msg);
    res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/mint/submit
 * Body: { txBytes: base64, senderAuthBytes: base64 }
 * Returns: { txHash }
 */
router.post("/mint/submit", async (req, res) => {
  try {
    const { txBytes, senderAuthBytes } = req.body as {
      txBytes: string;
      senderAuthBytes: string;
    };

    if (!txBytes || !senderAuthBytes) {
      res.status(400).json({ error: "Missing txBytes or senderAuthBytes" });
      return;
    }

    const aptos = getAptos();
    const deployer = getDeployer();

    // Deserialize the transaction
    const txRaw = Buffer.from(txBytes, "base64");
    const tx = SimpleTransaction.deserialize(new Deserializer(txRaw));

    // Deserialize sender's signature from Petra
    const sigRaw = Buffer.from(senderAuthBytes, "base64");
    const senderAuthenticator = AccountAuthenticator.deserialize(
      new Deserializer(sigRaw)
    );

    // Deployer signs as fee payer — pays gas with their ShelbyUSD balance
    const feePayerAuthenticator = aptos.transaction.sign.asFeePayer({
      signer: deployer,
      transaction: tx,
    });

    // Submit with both signatures
    const committed = await aptos.transaction.submit.simple({
      transaction: tx,
      senderAuthenticator,
      feePayerAuthenticator,
    });

    // Wait for confirmation
    const result = await aptos.waitForTransaction({
      transactionHash: committed.hash,
    });

    res.json({
      txHash: committed.hash,
      success: result.success,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("mint/submit error:", msg);
    res.status(500).json({ error: msg });
  }
});

export default router;
