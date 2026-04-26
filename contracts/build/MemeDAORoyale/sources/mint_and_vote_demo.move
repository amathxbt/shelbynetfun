// Demo script - mint a meme and cast a vote in a single transaction.
script {
    use memedao::meme_dao_royale;

    fun mint_and_vote_demo(
        account: signer,
        registry: address,
        title: vector<u8>,
        image_url: vector<u8>,
        proof_hash: vector<u8>,
        vote_meme_id: u64,
    ) {
        meme_dao_royale::mint_meme(
            &account,
            registry,
            title,
            image_url,
            proof_hash,
        );
        meme_dao_royale::vote(
            &account,
            registry,
            vote_meme_id,
        );
    }
}
