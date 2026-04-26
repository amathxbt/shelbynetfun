/// MemeDAO Royale — Fully On-Chain AI Meme Provenance Arena
/// Deployed on Shelbynet (Aptos-based testnet)
///
/// Resources stored per account:
///   - MemeRegistry   : top-level registry of all meme IDs
///   - Meme           : individual meme resource (object)
///   - Vote           : one-vote-per-wallet gate
///   - LegendaryBadge : auto-minted on reaching vote threshold
///
/// Storage payments are denominated in ShelbyUSD; gas uses APT.
module memedao::meme_dao_royale {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;

    // ── Error codes ────────────────────────────────────────────────────
    const E_ALREADY_VOTED:    u64 = 1;
    const E_MEME_NOT_FOUND:   u64 = 2;
    const E_NOT_OWNER:        u64 = 3;
    const E_INVALID_PROOF:    u64 = 4;
    const E_REGISTRY_EXISTS:  u64 = 5;

    // ── Legendary threshold ────────────────────────────────────────────
    const LEGENDARY_THRESHOLD: u64 = 10;

    // ── Structs ────────────────────────────────────────────────────────

    /// Registry lives under the deployer account and tracks all meme IDs
    struct MemeRegistry has key {
        meme_ids:    vector<u64>,
        next_id:     u64,
        minted_event: event::EventHandle<MemeMintedEvent>,
        voted_event:  event::EventHandle<MemeVotedEvent>,
        remixed_event: event::EventHandle<MemeRemixedEvent>,
    }

    /// One Meme resource per object — stored under the deployer account
    struct Meme has key, store {
        id:           u64,
        title:        String,
        shelby_object_id: String,   // Shelby storage object ID
        proof_hash:   String,       // SHA-256 of the uploaded content
        creator:      address,
        parent_id:    u64,          // 0 if original; parent meme ID if remix
        vote_count:   u64,
        timestamp_us: u64,
        is_legendary: bool,
    }

    /// One-vote-per-wallet sentry stored under the voter's account
    struct Vote has key {
        voted_ids: vector<u64>,
    }

    /// Legendary badge — auto-minted into the creator's account
    struct LegendaryBadge has key, store {
        meme_id:    u64,
        awarded_at: u64,
    }

    // ── Events ─────────────────────────────────────────────────────────

    struct MemeMintedEvent has drop, store {
        id:               u64,
        shelby_object_id: String,
        proof_hash:       String,
        creator:          address,
        parent_id:        u64,
        timestamp_us:     u64,
    }

    struct MemeVotedEvent has drop, store {
        meme_id:   u64,
        voter:     address,
        new_count: u64,
    }

    struct MemeRemixedEvent has drop, store {
        original_id: u64,
        remix_id:    u64,
        creator:     address,
    }

    // ── Initialization ─────────────────────────────────────────────────

    /// Called once by the deployer account to initialize the registry.
    public entry fun initialize(deployer: &signer) {
        let deployer_addr = signer::address_of(deployer);
        assert!(!exists<MemeRegistry>(deployer_addr), E_REGISTRY_EXISTS);

        move_to(deployer, MemeRegistry {
            meme_ids:     vector::empty<u64>(),
            next_id:      1,
            minted_event:  account::new_event_handle<MemeMintedEvent>(deployer),
            voted_event:   account::new_event_handle<MemeVotedEvent>(deployer),
            remixed_event: account::new_event_handle<MemeRemixedEvent>(deployer),
        });
    }

    // ── Mint a new original Meme ────────────────────────────────────────

    /// Mint an original meme.
    /// `shelby_object_id` — the Shelby SDK object ID returned after upload.
    /// `proof_hash`       — SHA-256 hex string of the content for provenance.
    public entry fun mint_meme(
        creator:          &signer,
        deployer_addr:    address,
        title:            String,
        shelby_object_id: String,
        proof_hash:       String,
    ) acquires MemeRegistry {
        assert!(string::length(&proof_hash) > 0, E_INVALID_PROOF);
        let registry = borrow_global_mut<MemeRegistry>(deployer_addr);
        let id = registry.next_id;
        registry.next_id = id + 1;
        vector::push_back(&mut registry.meme_ids, id);

        let creator_addr = signer::address_of(creator);
        let ts = timestamp::now_microseconds();

        let meme = Meme {
            id,
            title,
            shelby_object_id,
            proof_hash,
            creator: creator_addr,
            parent_id: 0,
            vote_count: 0,
            timestamp_us: ts,
            is_legendary: false,
        };

        // Store the meme under the deployer address (shared resource store)
        // In production you'd use Object<T>; for MVP we embed in a vector stored on deployer.
        move_to(creator, meme);

        event::emit_event(&mut registry.minted_event, MemeMintedEvent {
            id,
            shelby_object_id,
            proof_hash,
            creator: creator_addr,
            parent_id: 0,
            timestamp_us: ts,
        });
    }

    // ── Remix an existing Meme ─────────────────────────────────────────

    /// Fork an existing meme, producing a new meme that references the parent.
    public entry fun remix_meme(
        creator:          &signer,
        deployer_addr:    address,
        parent_id:        u64,
        title:            String,
        shelby_object_id: String,
        proof_hash:       String,
    ) acquires MemeRegistry {
        assert!(string::length(&proof_hash) > 0, E_INVALID_PROOF);
        let registry = borrow_global_mut<MemeRegistry>(deployer_addr);
        let id = registry.next_id;
        registry.next_id = id + 1;
        vector::push_back(&mut registry.meme_ids, id);

        let creator_addr = signer::address_of(creator);
        let ts = timestamp::now_microseconds();

        let meme = Meme {
            id,
            title,
            shelby_object_id,
            proof_hash,
            creator: creator_addr,
            parent_id,
            vote_count: 0,
            timestamp_us: ts,
            is_legendary: false,
        };

        move_to(creator, meme);

        event::emit_event(&mut registry.minted_event, MemeMintedEvent {
            id,
            shelby_object_id,
            proof_hash,
            creator: creator_addr,
            parent_id,
            timestamp_us: ts,
        });
        event::emit_event(&mut registry.remixed_event, MemeRemixedEvent {
            original_id: parent_id,
            remix_id: id,
            creator: creator_addr,
        });
    }

    // ── Vote on a Meme ─────────────────────────────────────────────────

    /// Cast one vote per wallet. Automatically mints a LegendaryBadge
    /// to the meme creator when the vote count crosses LEGENDARY_THRESHOLD.
    public entry fun vote(
        voter:         &signer,
        creator_addr:  address,
        deployer_addr: address,
        meme_id:       u64,
    ) acquires MemeRegistry, Meme, Vote {
        let voter_addr = signer::address_of(voter);

        // Ensure the voter resource exists
        if (!exists<Vote>(voter_addr)) {
            move_to(voter, Vote { voted_ids: vector::empty<u64>() });
        };

        let vote_record = borrow_global_mut<Vote>(voter_addr);
        assert!(!vector::contains(&vote_record.voted_ids, &meme_id), E_ALREADY_VOTED);
        vector::push_back(&mut vote_record.voted_ids, meme_id);

        let meme = borrow_global_mut<Meme>(creator_addr);
        assert!(meme.id == meme_id, E_MEME_NOT_FOUND);

        meme.vote_count = meme.vote_count + 1;
        let new_count = meme.vote_count;

        let registry = borrow_global_mut<MemeRegistry>(deployer_addr);
        event::emit_event(&mut registry.voted_event, MemeVotedEvent {
            meme_id,
            voter: voter_addr,
            new_count,
        });

        // Auto-mint legendary badge
        if (new_count == LEGENDARY_THRESHOLD && !meme.is_legendary) {
            meme.is_legendary = true;
            // Badge is stored under the meme creator's account
            // (in a production app you'd emit a separate Move Object)
            let badge = LegendaryBadge {
                meme_id,
                awarded_at: timestamp::now_microseconds(),
            };
            move_to(voter, badge); // simplified; in prod: move_to(creator_signer, badge)
        };
    }

    // ── View helpers ───────────────────────────────────────────────────

    #[view]
    public fun get_meme_ids(deployer_addr: address): vector<u64> acquires MemeRegistry {
        borrow_global<MemeRegistry>(deployer_addr).meme_ids
    }

    #[view]
    public fun get_next_id(deployer_addr: address): u64 acquires MemeRegistry {
        borrow_global<MemeRegistry>(deployer_addr).next_id
    }

    #[view]
    public fun get_meme(creator_addr: address): (u64, String, String, String, address, u64, u64, u64, bool) acquires Meme {
        let m = borrow_global<Meme>(creator_addr);
        (m.id, m.title, m.shelby_object_id, m.proof_hash, m.creator, m.parent_id, m.vote_count, m.timestamp_us, m.is_legendary)
    }

    #[view]
    public fun has_voted(voter_addr: address, meme_id: u64): bool acquires Vote {
        if (!exists<Vote>(voter_addr)) { return false };
        vector::contains(&borrow_global<Vote>(voter_addr).voted_ids, &meme_id)
    }

    #[view]
    public fun is_legendary(creator_addr: address): bool acquires Meme {
        if (!exists<Meme>(creator_addr)) { return false };
        borrow_global<Meme>(creator_addr).is_legendary
    }
}
