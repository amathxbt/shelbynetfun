/// Demo script — mint a meme and cast a vote in a single transaction.
/// Usage (Aptos CLI):
///   aptos move run-script \
///     --compiled-script-path contracts/scripts/mint_and_vote_demo.mv \
///     --args address:<DEPLOYER_ADDR> string:"My Demo Meme" \
///            string:"shelby_objectid123" string:"deadbeef..."
script {
    use memedao::meme_dao_royale;

    fun mint_and_vote_demo(
        caller:           signer,
        deployer_addr:    address,
        title:            vector<u8>,
        shelby_object_id: vector<u8>,
        proof_hash:       vector<u8>,
    ) {
        use std::string;
        meme_dao_royale::mint_meme(
            &caller,
            deployer_addr,
            string::utf8(title),
            string::utf8(shelby_object_id),
            string::utf8(proof_hash),
        );
    }
}
