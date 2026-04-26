/**
 * Client-side meme store.
 * All reads come from Aptos devnet view functions.
 * Writes are Move entry transactions signed by Petra wallet.
 */
import { create } from "zustand";
import type { Meme } from "../lib/types";
import { MODULE_ADDR, APTOS_NODE_URL } from "../lib/aptos";

function hexToStr(hex: string): string {
  if (!hex || hex === "0x") return "";
  const raw = hex.startsWith("0x") ? hex.slice(2) : hex;
  const pairs = raw.match(/.{1,2}/g) ?? [];
  try {
    return new TextDecoder().decode(
      new Uint8Array(pairs.map((b) => parseInt(b, 16)))
    );
  } catch {
    return raw;
  }
}

async function callView(fn: string, args: string[]): Promise<unknown[]> {
  const res = await fetch(`${APTOS_NODE_URL}/view`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      function: fn,
      type_arguments: [],
      arguments: args,
    }),
  });
  if (!res.ok) throw new Error(`View call failed: ${res.status}`);
  return res.json();
}

interface MemeStore {
  memes: Meme[];
  votedIds: Set<number>;
  loading: boolean;
  addMeme: (m: Meme) => void;
  vote: (id: number) => void;
  hasVoted: (id: number) => boolean;
  setMemes: (memes: Meme[]) => void;
  fetchFromChain: () => Promise<void>;
}

export const useMemeStore = create<MemeStore>((set, get) => ({
  memes: [],
  votedIds: new Set<number>(),
  loading: false,

  addMeme: (m) => set((s) => ({ memes: [m, ...s.memes] })),

  vote: (id) =>
    set((s) => {
      const memes = s.memes.map((m) => {
        if (m.id !== id) return m;
        const newCount = m.voteCount + 1;
        return { ...m, voteCount: newCount, isLegendary: m.isLegendary || newCount >= 10 };
      });
      const votedIds = new Set(s.votedIds);
      votedIds.add(id);
      return { memes, votedIds };
    }),

  hasVoted: (id) => get().votedIds.has(id),
  setMemes: (memes) => set({ memes }),

  fetchFromChain: async () => {
    set({ loading: true });
    try {
      const countResult = await callView(
        `${MODULE_ADDR}::meme_dao_royale::get_meme_count`,
        [MODULE_ADDR]
      );
      const count = parseInt(countResult[0] as string, 10);

      const memes: Meme[] = [];
      for (let i = 0; i < count; i++) {
        const row = await callView(
          `${MODULE_ADDR}::meme_dao_royale::get_meme_by_index`,
          [MODULE_ADDR, i.toString()]
        );
        // row = [id, creator, title_hex, image_url_hex, proof_hash_hex, vote_count, parent_id, is_legendary]
        const [idRaw, creator, titleHex, imageUrlHex, proofHashHex, voteCountRaw, parentIdRaw, isLegendary] = row as [
          string, string, string, string, string, string, string, boolean
        ];
        const imageUrl = hexToStr(imageUrlHex);
        memes.push({
          id: parseInt(idRaw, 10),
          creator: creator as string,
          title: hexToStr(titleHex) || `Meme #${idRaw}`,
          imageUrl: imageUrl || undefined,
          proofHash: hexToStr(proofHashHex),
          shelbyObjectId: hexToStr(imageUrlHex),
          voteCount: parseInt(voteCountRaw, 10),
          parentId: parseInt(parentIdRaw, 10),
          isLegendary: isLegendary as boolean,
          timestampUs: Date.now() * 1000,
        });
      }
      set({ memes });
    } catch (e) {
      console.error("[memeStore] fetchFromChain error:", e);
    } finally {
      set({ loading: false });
    }
  },
}));
