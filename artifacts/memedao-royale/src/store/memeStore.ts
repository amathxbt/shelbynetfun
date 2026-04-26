/**
 * Client-side meme store.
 * In production, all reads come from Aptos view functions;
 * writes are Move entry transactions.
 * For the MVP demo, we seed with mock data and layer real
 * on-chain reads on top.
 */
import { create } from "zustand";
import type { Meme } from "../lib/types";

interface MemeStore {
  memes: Meme[];
  votedIds: Set<number>;
  addMeme: (m: Meme) => void;
  vote: (id: number) => void;
  hasVoted: (id: number) => boolean;
  setMemes: (memes: Meme[]) => void;
}

const SEED_MEMES: Meme[] = [
  {
    id: 1,
    title: "Shelby Moon Apes Club",
    shelbyObjectId: "shelby_a1b2c3d4e5f60001",
    proofHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    creator: "0xdead00000000000000000000000000000000000000000000000000000000beef",
    parentId: 0,
    voteCount: 42,
    timestampUs: Date.now() * 1000 - 3600_000_000,
    isLegendary: true,
    imageUrl: "https://picsum.photos/seed/meme1/400/400",
  },
  {
    id: 2,
    title: "When the precompile returns empty bytes",
    shelbyObjectId: "shelby_b2c3d4e5f6a10002",
    proofHash: "b2c3d4e5f6b2c3d4e5f6b2c3d4e5f6b2c3d4e5f6b2c3d4e5f6b2c3d4e5f6b2c3",
    creator: "0xcafe00000000000000000000000000000000000000000000000000000000babe",
    parentId: 0,
    voteCount: 7,
    timestampUs: Date.now() * 1000 - 7200_000_000,
    isLegendary: false,
    imageUrl: "https://picsum.photos/seed/meme2/400/400",
  },
  {
    id: 3,
    title: "Remix of Moon Apes — Now With ShelbyUSD",
    shelbyObjectId: "shelby_c3d4e5f6a1b20003",
    proofHash: "c3d4e5f6c3d4e5f6c3d4e5f6c3d4e5f6c3d4e5f6c3d4e5f6c3d4e5f6c3d4e5f6",
    creator: "0xface00000000000000000000000000000000000000000000000000000000feed",
    parentId: 1,
    voteCount: 3,
    timestampUs: Date.now() * 1000 - 1800_000_000,
    isLegendary: false,
    imageUrl: "https://picsum.photos/seed/meme3/400/400",
  },
  {
    id: 4,
    title: "Proof Lord of the Arena",
    shelbyObjectId: "shelby_d4e5f6a1b2c30004",
    proofHash: "d4e5f6d4e5f6d4e5f6d4e5f6d4e5f6d4e5f6d4e5f6d4e5f6d4e5f6d4e5f6d4e5",
    creator: "0xdead00000000000000000000000000000000000000000000000000000000beef",
    parentId: 0,
    voteCount: 15,
    timestampUs: Date.now() * 1000 - 900_000_000,
    isLegendary: false,
    imageUrl: "https://picsum.photos/seed/meme4/400/400",
  },
];

export const useMemeStore = create<MemeStore>((set, get) => ({
  memes: SEED_MEMES,
  votedIds: new Set<number>(),

  addMeme: (m) => set((s) => ({ memes: [m, ...s.memes] })),

  vote: (id) =>
    set((s) => {
      const memes = s.memes.map((m) => {
        if (m.id !== id) return m;
        const newCount = m.voteCount + 1;
        return {
          ...m,
          voteCount: newCount,
          isLegendary: m.isLegendary || newCount >= 10,
        };
      });
      const votedIds = new Set(s.votedIds);
      votedIds.add(id);
      return { memes, votedIds };
    }),

  hasVoted: (id) => get().votedIds.has(id),

  setMemes: (memes) => set({ memes }),
}));
