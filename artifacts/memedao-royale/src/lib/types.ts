export interface Meme {
  id: number;
  title: string;
  shelbyObjectId: string;
  proofHash: string;
  creator: string;
  parentId: number;
  voteCount: number;
  timestampUs: number;
  isLegendary: boolean;
  imageUrl?: string;
}

export interface LegendaryBadge {
  memeId: number;
  awardedAt: number;
}

export interface ArenaStats {
  totalMemes: number;
  totalVotes: number;
  legendaryCount: number;
}
