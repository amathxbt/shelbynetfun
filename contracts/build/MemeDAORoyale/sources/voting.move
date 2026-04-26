// Voting module - standalone vote tracking helper
module memedao::voting {
    use std::signer;
    use std::vector;

    struct VoteStore has key {
        records: vector<VoteEntry>,
    }

    struct VoteEntry has store, drop, copy {
        voter:   address,
        meme_id: u64,
    }

    public entry fun init_store(account: &signer) {
        let addr = signer::address_of(account);
        if (!exists<VoteStore>(addr)) {
            move_to(account, VoteStore { records: vector::empty() });
        };
    }

    public entry fun record_vote(account: &signer, meme_id: u64) acquires VoteStore {
        let voter = signer::address_of(account);
        assert!(exists<VoteStore>(voter), 1);
        let store = borrow_global_mut<VoteStore>(voter);
        let entry = VoteEntry { voter, meme_id };
        vector::push_back(&mut store.records, entry);
    }

    #[view]
    public fun voted(voter: address, meme_id: u64): bool acquires VoteStore {
        if (!exists<VoteStore>(voter)) return false;
        let store = borrow_global<VoteStore>(voter);
        let i = 0u64;
        let len = vector::length(&store.records);
        while (i < len) {
            let e = vector::borrow(&store.records, i);
            if (e.voter == voter && e.meme_id == meme_id) return true;
            i = i + 1;
        };
        false
    }
}
