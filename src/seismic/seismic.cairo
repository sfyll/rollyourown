use starknet::secp256_trait::Signature;

#[starknet::interface]
trait ISeismic<TContractState> {
    fn verify_signature(self: @TContractState, commitment: felt252, cash: felt252, quantity: felt252, signature: Signature);
}

#[starknet::contract]
mod Seismic {
    use core::option::OptionTrait;
    use core::traits::TryInto;
    use starknet::secp256_trait::Signature; 
    use rollyourown::seismic::eip712_simple_struct::get_pool_params_commitment;
    use starknet::ContractAddress;
    use core::ecdsa::check_ecdsa_signature;
    use core::assert;

    #[storage]
    struct Storage {
        seismic_public_key: felt252,
        seismic_contract_address: ContractAddress,
    }
    //
    // commenting the body until we can deploy the contract
    //
    #[constructor]
    fn constructor(ref self: ContractState) {
        // self.seismic_public_key.write(public_key);
        // self.seismic_contract_address.write(address_seismic_starknet.try_into().unwrap());
    }

    //
    // Public view function that verify Seismic Signature. 
    //
    #[abi(embed_v0)]
    impl Seismic of super::ISeismic<ContractState> {        
        fn verify_signature(self: @ContractState, commitment: felt252, cash: felt252, quantity: felt252, signature: Signature) {
            let public_key : felt252 =  0x788d5c7eacd34e7778fec1eaadb30c285107d104dabcc63b8ed7d80bbdfa1b1;
            let address_seismic_starknet: felt252 = 0x6fb6f2999636e8adbc0f70692dbb6d60175a9ca0ad57ba2204daa1aaec6840c;      
            let seismic_contract: ContractAddress = address_seismic_starknet.try_into().unwrap();     
            assert(get_pool_params_commitment(cash, quantity, seismic_contract) == commitment, 200);
            assert(check_ecdsa_signature(commitment, public_key, signature.r.try_into().unwrap(), signature.s.try_into().unwrap()) == true, 201);
        }
        }
    }
