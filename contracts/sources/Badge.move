/// Badge module — on-chain badge resources auto-minted to creators.
/// Badge names map to thresholds defined here.
module memedao::badge {
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::timestamp;

    // Vote thresholds per badge tier
    const THRESHOLD_PROOF_LORD:    u64 = 10;
    const THRESHOLD_MEME_OVERLORD: u64 = 7;
    const THRESHOLD_FORK_WIZARD:   u64 = 4;
    const THRESHOLD_SHELBY_SAGE:   u64 = 1;

    const E_BADGE_EXISTS: u64 = 1;

    struct Badge has key, store {
        name:       String,
        meme_id:    u64,
        awarded_at: u64,
        tier:       u8,    // 1=Shelby Sage … 4=Proof Lord
    }

    /// Determine which badge tier to mint based on vote count.
    public fun badge_for_votes(votes: u64): (String, u8) {
        if (votes >= THRESHOLD_PROOF_LORD) {
            (string::utf8(b"Proof Lord"), 4)
        } else if (votes >= THRESHOLD_MEME_OVERLORD) {
            (string::utf8(b"Meme Overlord"), 3)
        } else if (votes >= THRESHOLD_FORK_WIZARD) {
            (string::utf8(b"Fork Wizard"), 2)
        } else if (votes >= THRESHOLD_SHELBY_SAGE) {
            (string::utf8(b"Shelby Sage"), 1)
        } else {
            (string::utf8(b"Ngmi"), 0)
        }
    }

    /// Auto-mint the highest-tier badge the creator has earned.
    /// No-ops if a badge of equal or higher tier already exists.
    public fun try_mint_badge(
        recipient: &signer,
        meme_id:   u64,
        votes:     u64,
    ) {
        let addr = signer::address_of(recipient);
        if (exists<Badge>(addr)) {
            let existing = borrow_global<Badge>(addr);
            let (_, new_tier) = badge_for_votes(votes);
            if (new_tier <= existing.tier) { return };
            // Upgrade: move old badge out, drop it, move new one in
            let Badge { name: _, meme_id: _, awarded_at: _, tier: _ } = move_from<Badge>(addr);
        };
        let (name, tier) = badge_for_votes(votes);
        if (tier == 0) { return };
        move_to(recipient, Badge {
            name,
            meme_id,
            awarded_at: timestamp::now_microseconds(),
            tier,
        });
    }

    #[view]
    public fun get_badge(addr: address): (String, u64, u64, u8) acquires Badge {
        if (!exists<Badge>(addr)) {
            return (string::utf8(b""), 0, 0, 0)
        };
        let b = borrow_global<Badge>(addr);
        (b.name, b.meme_id, b.awarded_at, b.tier)
    }

    #[view]
    public fun badge_name(addr: address): String acquires Badge {
        if (!exists<Badge>(addr)) { return string::utf8(b"Ngmi") };
        borrow_global<Badge>(addr).name
    }
}
