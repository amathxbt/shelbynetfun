/// Voting module — standalone so it can be imported by other modules.
/// The main meme_dao_royale module calls into this for one-vote-per-wallet.
module memedao::voting {
    use std::signer;
    use std::vector;

    const E_ALREADY_VOTED: u64 = 1;

    /// One resource per voter account. Tracks all meme IDs voted on.
    struct VoterRecord has key {
        voted_ids: vector<u64>,
    }

    /// Ensure a VoterRecord exists for the signer; create it if not.
    public fun ensure_record(voter: &signer) {
        if (!exists<VoterRecord>(signer::address_of(voter))) {
            move_to(voter, VoterRecord { voted_ids: vector::empty<u64>() });
        }
    }

    /// Record a vote. Aborts with E_ALREADY_VOTED if the wallet already voted on this ID.
    public fun record_vote(voter: &signer, meme_id: u64) acquires VoterRecord {
        ensure_record(voter);
        let addr = signer::address_of(voter);
        let record = borrow_global_mut<VoterRecord>(addr);
        assert!(!vector::contains(&record.voted_ids, &meme_id), E_ALREADY_VOTED);
        vector::push_back(&mut record.voted_ids, meme_id);
    }

    #[view]
    public fun has_voted(voter_addr: address, meme_id: u64): bool acquires VoterRecord {
        if (!exists<VoterRecord>(voter_addr)) { return false };
        vector::contains(&borrow_global<VoterRecord>(voter_addr).voted_ids, &meme_id)
    }

    #[view]
    public fun vote_count(voter_addr: address): u64 acquires VoterRecord {
        if (!exists<VoterRecord>(voter_addr)) { return 0 };
        vector::length(&borrow_global<VoterRecord>(voter_addr).voted_ids)
    }
}
