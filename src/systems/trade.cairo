use starknet::ContractAddress;
use starknet::secp256_trait::Signature;
use rollyourown::models::location::{LocationEnum};
use rollyourown::models::drug::{DrugEnum};

#[starknet::interface]
trait ITrade<TContractState> {
    fn buy(
        self: @TContractState,
        game_id: u32,
        location_id: LocationEnum,
        drug_id: DrugEnum,
        quantity: usize,
        cash: felt252,
        total_quantity: felt252,
        cost: u128,
        seismic_contract_address: ContractAddress,
        commitment: felt252, 
        signature: Signature
    );

    fn sell(
        self: @TContractState,
        game_id: u32,
        location_id: LocationEnum,
        drug_id: DrugEnum,
        quantity: usize,
        cash: felt252,
        total_quantity: felt252,
        cost: u128,
        seismic_contract_address: ContractAddress,
        commitment: felt252, 
        signature: Signature
    );
}


#[dojo::contract]
mod trade {
    use seismic::seismic::seismic::ISeismicDispatcherTrait;
use starknet::ContractAddress;
    use starknet::get_caller_address;
    use seismic::seismic::seismic::ISeismicDispatcher;
    use seismic::eip712::get_pool_params_commitment;
    use rollyourown::models::drug::{Drug, DrugEnum};
    use rollyourown::models::player::{Player, PlayerTrait};
    use rollyourown::models::location::{Location, LocationEnum};
    use rollyourown::models::game::{Game, GameTrait};
    use rollyourown::models::market::{Market, MarketTrait};
    use rollyourown::models::blinded_market::{BlindedMarket};

    use starknet::secp256_trait::Signature;

    use super::ITrade;

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Bought: Bought,
        Sold: Sold
    }

    #[derive(Drop, starknet::Event)]
    struct Bought {
        #[key]
        game_id: u32,
        #[key]
        player_id: ContractAddress,
        drug_id: DrugEnum,
        quantity: felt252,
        cash: felt252
    }

    #[derive(Drop, starknet::Event)]
    struct Sold {
        #[key]
        game_id: u32,
        #[key]
        player_id: ContractAddress,
        drug_id: DrugEnum,
        quantity: felt252,
        cash: felt252
    }


    #[external(v0)]
    impl GameImpl of ITrade<ContractState> {
        // 1. Verify the caller owns the player.
        // 2. Get current price for location for quantity.
        // 3. Ensure user can afford it.
        // 4. Perform the trade.
        // 5. Update the location's inventory.
        // 6. Update the player's inventory.
        fn buy(
            self: @ContractState,
            game_id: u32,
            location_id: LocationEnum,
            drug_id: DrugEnum,
            quantity: usize,
            cash: felt252,
            total_quantity: felt252,
            cost: u128,
            seismic_contract_address: ContractAddress,
            commitment: felt252, 
            signature: Signature
        )  {
            let seismic_contract = ISeismicDispatcher { contract_address: seismic_contract_address };
            
            seismic_contract.verify_signature(commitment, cash, total_quantity, signature);
            
            let world = self.world();
            let player_id = get_caller_address();

            let game = get!(world, game_id, (Game));
            assert(game.tick(), 'cannot progress');

            let mut player = get!(world, (game_id, player_id).into(), Player);
            assert(player.location_id == location_id, 'player is not at location');
            assert(player.can_continue(), 'player cannot trade');
            assert(player.drug_count + quantity <= player.get_transport(world), 'no bag space');

            let mut market = get!(world, (game_id, location_id, drug_id).into(), BlindedMarket);
            let mut drug = get!(world, (game_id, player_id, drug_id).into(), Drug);

            // update market
            market.cash = cash;
            market.quantity = total_quantity;

            // update player
            player.cash -= cost;
            player.drug_count += quantity;

            // update drug
            drug.quantity += quantity;

            set!(world, (market, player, drug));
            emit!(world, Bought { game_id, player_id, drug_id, quantity:total_quantity, cash });
        }


        fn sell(
            self: @ContractState,
            game_id: u32,
            location_id: LocationEnum,
            drug_id: DrugEnum,
            quantity: usize,
            cash: felt252,
            total_quantity: felt252,
            cost: u128,
            seismic_contract_address: ContractAddress,
            commitment: felt252, 
            signature: Signature
        ) {

            let seismic_contract = ISeismicDispatcher { contract_address: seismic_contract_address };

            seismic_contract.verify_signature(commitment, cash, total_quantity, signature);

            let world = self.world();
            let player_id = get_caller_address();

            let game = get!(world, game_id, Game);
            assert(game.tick(), 'cannot progress');

            let mut player = get!(world, (game_id, player_id).into(), Player);
            assert(player.location_id == location_id, 'player is not at location');

            let mut drug = get!(world, (game_id, player_id, drug_id).into(), Drug);
            assert(drug.quantity >= quantity, 'not enough drugs to sell');

            let mut market = get!(world, (game_id, location_id, drug_id).into(), BlindedMarket);

            // update market
            market.cash = cash;
            market.quantity = total_quantity;

            // update player
            player.cash += cost;
            player.drug_count -= quantity;

            // update drug
            drug.quantity -= quantity;

            set!(world, (market, player, drug));
            emit!(world, Sold { game_id, player_id, drug_id, quantity:total_quantity, cash });
        }
    }
}

