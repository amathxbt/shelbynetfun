// Badge module - on-chain badge resources auto-minted to creators.
module memedao::badge {
    use std::signer;
    use std::vector;

    const PROOF_LORD_THRESHOLD:   u64 = 10;
    const MEME_OVERLORD_THRESHOLD: u64 = 25;

    struct BadgeStore has key {
        badges: vector<Badge>,
    }

    struct Badge has store, drop, copy {
        kind:      u8,   // 1=ProofLord, 2=MemeOverlord
        meme_id:   u64,
        vote_count: u64,
    }

    public entry fun init_badges(account: &signer) {
        let addr = signer::address_of(account);
        if (!exists<BadgeStore>(addr)) {
            move_to(account, BadgeStore { badges: vector::empty() });
        };
    }

    public entry fun check_and_award(
        creator: &signer,
        meme_id: u64,
        vote_count: u64,
    ) acquires BadgeStore {
        let addr = signer::address_of(creator);
        if (!exists<BadgeStore>(addr)) return;
        let store = borrow_global_mut<BadgeStore>(addr);

        if (vote_count >= MEME_OVERLORD_THRESHOLD) {
            vector::push_back(&mut store.badges, Badge { kind: 2, meme_id, vote_count });
        } else if (vote_count >= PROOF_LORD_THRESHOLD) {
            vector::push_back(&mut store.badges, Badge { kind: 1, meme_id, vote_count });
        };
    }

    #[view]
    public fun get_badge_count(addr: address): u64 acquires BadgeStore {
        if (!exists<BadgeStore>(addr)) return 0;
        vector::length(&borrow_global<BadgeStore>(addr).badges)
    }
}
