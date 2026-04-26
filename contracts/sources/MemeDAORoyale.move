// MemeDAO Royale - Fully On-Chain AI Meme Provenance Arena
// Deployed on Aptos devnet. Handles minting, voting, and remixing of memes.
module memedao::meme_dao_royale {
    use std::signer;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::event;

    // ───────────────────────────────────── Errors
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_VOTED: u64   = 2;
    const E_MEME_NOT_FOUND: u64  = 3;
    const E_ALREADY_INIT: u64    = 4;

    // ───────────────────────────────────── Constants
    const LEGENDARY_THRESHOLD: u64 = 10;

    // ───────────────────────────────────── Structs

    struct Meme has store, drop, copy {
        id:          u64,
        creator:     address,
        title:       vector<u8>,
        image_url:   vector<u8>,
        proof_hash:  vector<u8>,
        vote_count:  u64,
        parent_id:   u64,
        is_legendary: bool,
        timestamp_us: u64,
    }

    struct VoteRecord has store, drop, copy {
        voter:   address,
        meme_id: u64,
    }

    struct Registry has key {
        memes:      vector<Meme>,
        votes:      vector<VoteRecord>,
        next_id:    u64,
        mint_events: event::EventHandle<MintEvent>,
        vote_events: event::EventHandle<VoteEvent>,
    }

    struct MintEvent has drop, store {
        meme_id:  u64,
        creator:  address,
        title:    vector<u8>,
    }

    struct VoteEvent has drop, store {
        meme_id: u64,
        voter:   address,
    }

    // ───────────────────────────────────── Init

    public entry fun initialize(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<Registry>(addr), E_ALREADY_INIT);
        move_to(account, Registry {
            memes: vector::empty(),
            votes: vector::empty(),
            next_id: 1,
            mint_events: account::new_event_handle<MintEvent>(account),
            vote_events: account::new_event_handle<VoteEvent>(account),
        });
    }

    // ───────────────────────────────────── Mint

    public entry fun mint_meme(
        caller:     &signer,
        registry:   address,
        title:      vector<u8>,
        image_url:  vector<u8>,
        proof_hash: vector<u8>,
    ) acquires Registry {
        assert!(exists<Registry>(registry), E_NOT_INITIALIZED);
        let reg = borrow_global_mut<Registry>(registry);
        let id  = reg.next_id;
        reg.next_id = reg.next_id + 1;
        let creator = signer::address_of(caller);
        let meme = Meme {
            id,
            creator,
            title: copy title,
            image_url,
            proof_hash,
            vote_count:  0,
            parent_id:   0,
            is_legendary: false,
            timestamp_us: 0,
        };
        vector::push_back(&mut reg.memes, meme);
        event::emit_event(&mut reg.mint_events, MintEvent { meme_id: id, creator, title });
    }

    // ───────────────────────────────────── Vote

    public entry fun vote(
        caller:   &signer,
        registry: address,
        meme_id:  u64,
    ) acquires Registry {
        assert!(exists<Registry>(registry), E_NOT_INITIALIZED);
        let voter = signer::address_of(caller);
        let reg   = borrow_global_mut<Registry>(registry);

        // Check no duplicate vote
        let i = 0u64;
        let len = vector::length(&reg.votes);
        while (i < len) {
            let vr = vector::borrow(&reg.votes, i);
            assert!(!(vr.voter == voter && vr.meme_id == meme_id), E_ALREADY_VOTED);
            i = i + 1;
        };

        // Find meme and increment
        let j = 0u64;
        let mlen = vector::length(&reg.memes);
        while (j < mlen) {
            let m = vector::borrow_mut(&mut reg.memes, j);
            if (m.id == meme_id) {
                m.vote_count = m.vote_count + 1;
                if (m.vote_count >= LEGENDARY_THRESHOLD) {
                    m.is_legendary = true;
                };
                break
            };
            j = j + 1;
        };
        assert!(j < mlen, E_MEME_NOT_FOUND);

        vector::push_back(&mut reg.votes, VoteRecord { voter, meme_id });
        event::emit_event(&mut reg.vote_events, VoteEvent { meme_id, voter });
    }

    // ───────────────────────────────────── Remix

    public entry fun remix_meme(
        caller:     &signer,
        registry:   address,
        parent_id:  u64,
        title:      vector<u8>,
        image_url:  vector<u8>,
        proof_hash: vector<u8>,
    ) acquires Registry {
        assert!(exists<Registry>(registry), E_NOT_INITIALIZED);
        let reg = borrow_global_mut<Registry>(registry);
        let id  = reg.next_id;
        reg.next_id = reg.next_id + 1;
        let creator = signer::address_of(caller);
        let meme = Meme {
            id,
            creator,
            title: copy title,
            image_url,
            proof_hash,
            vote_count:  0,
            parent_id,
            is_legendary: false,
            timestamp_us: 0,
        };
        vector::push_back(&mut reg.memes, meme);
        event::emit_event(&mut reg.mint_events, MintEvent { meme_id: id, creator, title });
    }

    // ───────────────────────────────────── Views

    #[view]
    public fun get_meme_count(registry: address): u64 acquires Registry {
        assert!(exists<Registry>(registry), E_NOT_INITIALIZED);
        vector::length(&borrow_global<Registry>(registry).memes)
    }

    // Returns (id, creator, title, image_url, proof_hash, vote_count, parent_id, is_legendary)
    #[view]
    public fun get_meme_by_index(
        registry: address,
        index: u64,
    ): (u64, address, vector<u8>, vector<u8>, vector<u8>, u64, u64, bool) acquires Registry {
        assert!(exists<Registry>(registry), E_NOT_INITIALIZED);
        let reg = borrow_global<Registry>(registry);
        let m = vector::borrow(&reg.memes, index);
        (m.id, m.creator, m.title, m.image_url, m.proof_hash, m.vote_count, m.parent_id, m.is_legendary)
    }

    #[view]
    public fun has_voted(registry: address, voter: address, meme_id: u64): bool acquires Registry {
        assert!(exists<Registry>(registry), E_NOT_INITIALIZED);
        let reg = borrow_global<Registry>(registry);
        let i = 0u64;
        let len = vector::length(&reg.votes);
        while (i < len) {
            let vr = vector::borrow(&reg.votes, i);
            if (vr.voter == voter && vr.meme_id == meme_id) return true;
            i = i + 1;
        };
        false
    }
}
