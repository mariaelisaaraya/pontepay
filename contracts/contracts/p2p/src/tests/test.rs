#![cfg(test)]

extern crate std;

use crate::contract::P2PContract;
use crate::contract::P2PContractClient;
use crate::storage::types::{FeeTier, FiatCurrency, OrderStatus, PaymentMethod};

use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{token, Address, Env};
use token::Client as TokenClient;
use token::StellarAssetClient as TokenAdminClient;

fn create_token<'a>(e: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let sac = e.register_stellar_asset_contract_v2(admin.clone());
    (
        TokenClient::new(e, &sac.address()),
        TokenAdminClient::new(e, &sac.address()),
    )
}

fn set_timestamp(e: &Env, timestamp: u64) {
    e.ledger().with_mut(|ledger| {
        ledger.timestamp = timestamp;
    });
}

struct Setup<'a> {
    env: Env,
    client: P2PContractClient<'a>,
    admin: Address,
    pauser: Address,
    dispute_resolver: Address,
    creator: Address,
    filler: Address,
    platform: Address,
    token: TokenClient<'a>,
}

// Platform fee used in all tests: 50 bps = 0.5%
const TEST_FEE_BPS: u32 = 50;

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let pauser = Address::generate(&env);
    let dispute_resolver = Address::generate(&env);
    let creator = Address::generate(&env);
    let filler = Address::generate(&env);
    let platform = Address::generate(&env);

    let (token, token_admin) = create_token(&env, &admin);

    token_admin.mint(&creator, &1_000_000_000);
    token_admin.mint(&filler, &1_000_000_000);

    let client = P2PContractClient::new(&env, &env.register(P2PContract {}, ()));
    client.initialize(
        &admin,
        &dispute_resolver,
        &pauser,
        &token.address,
        &platform,
        &TEST_FEE_BPS,
        &2_592_000,
        &1_800,
    );

    Setup {
        env,
        client,
        admin,
        pauser,
        dispute_resolver,
        creator,
        filler,
        platform,
        token,
    }
}

// Helper: expected fee for a given fill amount at TEST_FEE_BPS.
fn expected_fee(amount: i128) -> i128 {
    amount * TEST_FEE_BPS as i128 / 10_000
}

#[test]
fn test_create_order_from_crypto_holds_funds() {
    let s = setup();

    set_timestamp(&s.env, 100);
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &100,
        &1200,
        &600,
    );

    let order = s.client.get_order(&order_id);
    assert_eq!(order.status, OrderStatus::AwaitingFiller);
    assert_eq!(order.creator, s.creator);
    assert_eq!(order.amount, 100);
    assert_eq!(order.remaining_amount, 100);
    assert_eq!(order.filled_amount, 0);
    assert_eq!(order.active_fill_amount, None);

    let contract_balance = s.token.balance(&s.client.address);
    assert_eq!(contract_balance, 100);
}

#[test]
fn test_cancel_order_refunds_creator_for_from_crypto() {
    let s = setup();

    let creator_balance_before = s.token.balance(&s.creator);
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &500,
        &1200,
        &600,
    );

    s.client.cancel_order(&s.creator, &order_id);
    let order = s.client.get_order(&order_id);
    assert_eq!(order.status, OrderStatus::Cancelled);

    let creator_balance_after = s.token.balance(&s.creator);
    assert_eq!(creator_balance_after, creator_balance_before);
    assert_eq!(s.token.balance(&s.client.address), 0);
}

#[test]
fn test_take_order_from_fiat_requires_filler_deposit() {
    let s = setup();

    let filler_balance_before = s.token.balance(&s.filler);
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Eur,
        &PaymentMethod::MobileWallet,
        &false,
        &700,
        &1250,
        &600,
    );

    s.client.take_order(&s.filler, &order_id);
    let order = s.client.get_order(&order_id);

    assert_eq!(order.status, OrderStatus::AwaitingPayment);
    assert_eq!(order.filler, Some(s.filler.clone()));
    assert_eq!(order.active_fill_amount, Some(700));

    let filler_balance_after = s.token.balance(&s.filler);
    assert_eq!(filler_balance_before - filler_balance_after, 700);
    assert_eq!(s.token.balance(&s.client.address), 700);
}

#[test]
fn test_submit_confirm_from_crypto_releases_to_filler() {
    let s = setup();

    let filler_before = s.token.balance(&s.filler);
    let fill_amount: i128 = 400;
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &fill_amount,
        &1000,
        &600,
    );

    s.client.take_order(&s.filler, &order_id);
    s.client.submit_fiat_payment(&s.filler, &order_id);
    s.client.confirm_fiat_payment(&s.creator, &order_id);

    let fee = expected_fee(fill_amount);
    let order = s.client.get_order(&order_id);
    assert_eq!(order.status, OrderStatus::Completed);
    assert_eq!(order.remaining_amount, 0);
    assert_eq!(order.filled_amount, fill_amount);
    assert_eq!(s.token.balance(&s.filler), filler_before + fill_amount - fee);
    assert_eq!(s.token.balance(&s.platform), fee);
    assert_eq!(s.token.balance(&s.client.address), 0);
}

#[test]
fn test_submit_confirm_from_fiat_releases_to_creator() {
    let s = setup();

    let creator_before = s.token.balance(&s.creator);
    let fill_amount: i128 = 450;
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &false,
        &fill_amount,
        &1000,
        &600,
    );

    s.client.take_order(&s.filler, &order_id);
    s.client.submit_fiat_payment(&s.creator, &order_id);
    s.client.confirm_fiat_payment(&s.filler, &order_id);

    let fee = expected_fee(fill_amount);
    let order = s.client.get_order(&order_id);
    assert_eq!(order.status, OrderStatus::Completed);
    assert_eq!(order.remaining_amount, 0);
    assert_eq!(order.filled_amount, fill_amount);
    assert_eq!(s.token.balance(&s.creator), creator_before + fill_amount - fee);
    assert_eq!(s.token.balance(&s.platform), fee);
    assert_eq!(s.token.balance(&s.client.address), 0);
}

#[test]
fn test_timeout_resets_order_to_awaiting_filler() {
    let s = setup();
    let filler_balance_before = s.token.balance(&s.filler);

    set_timestamp(&s.env, 1000);
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &false,
        &300,
        &1000,
        &5_000,
    );

    s.client.take_order(&s.filler, &order_id);
    assert_eq!(s.token.balance(&s.filler), filler_balance_before - 300);
    assert_eq!(s.token.balance(&s.client.address), 300);

    set_timestamp(&s.env, 3000);
    s.client.execute_fiat_transfer_timeout(&s.filler, &order_id);

    let order = s.client.get_order(&order_id);
    assert_eq!(order.status, OrderStatus::AwaitingFiller);
    assert_eq!(order.filler, None);
    assert_eq!(order.active_fill_amount, None);
    assert_eq!(order.fiat_transfer_deadline, None);
    assert_eq!(s.token.balance(&s.filler), filler_balance_before);
    assert_eq!(s.token.balance(&s.client.address), 0);
}

#[test]
fn test_dispute_and_resolve_confirmed_completes() {
    let s = setup();

    let filler_before = s.token.balance(&s.filler);
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &250,
        &1000,
        &600,
    );

    s.client.take_order(&s.filler, &order_id);
    s.client.submit_fiat_payment(&s.filler, &order_id);
    s.client.dispute_fiat_payment(&s.filler, &order_id);
    s.client
        .resolve_dispute(&s.dispute_resolver, &order_id, &true);

    let order = s.client.get_order(&order_id);
    assert_eq!(order.status, OrderStatus::Completed);
    assert_eq!(order.filled_amount, 250);
    assert_eq!(order.remaining_amount, 0);
    // v2: a dispute resolved as "fiat was paid" completes the trade and pays
    // the platform fee, same as the normal confirm path.
    let fee = expected_fee(250);
    assert_eq!(s.token.balance(&s.filler), filler_before + 250 - fee);
    assert_eq!(s.token.balance(&s.platform), fee);
}

#[test]
fn test_dispute_and_resolve_not_confirmed_refunds_depositor() {
    let s = setup();

    let creator_before = s.token.balance(&s.creator);
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &350,
        &1000,
        &600,
    );

    s.client.take_order(&s.filler, &order_id);
    s.client.submit_fiat_payment(&s.filler, &order_id);
    s.client.dispute_fiat_payment(&s.filler, &order_id);
    s.client
        .resolve_dispute(&s.dispute_resolver, &order_id, &false);

    let order = s.client.get_order(&order_id);
    assert_eq!(order.status, OrderStatus::AwaitingFiller);
    assert_eq!(order.remaining_amount, 350);
    assert_eq!(order.filled_amount, 0);
    assert_eq!(s.token.balance(&s.creator), creator_before);
}

#[test]
fn test_partial_fill_reduces_remaining_and_reopens_order() {
    let s = setup();

    let creator_before = s.token.balance(&s.creator);
    let fill_amount: i128 = 200;
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &false,
        &1_000,
        &1000,
        &600,
    );

    s.client.take_order_with_amount(&s.filler, &order_id, &fill_amount);
    s.client.submit_fiat_payment(&s.creator, &order_id);
    s.client.confirm_fiat_payment(&s.filler, &order_id);

    let fee = expected_fee(fill_amount);
    let order = s.client.get_order(&order_id);
    assert_eq!(order.status, OrderStatus::AwaitingFiller);
    assert_eq!(order.remaining_amount, 800);
    assert_eq!(order.filled_amount, fill_amount);
    assert_eq!(order.filler, None);
    assert_eq!(order.active_fill_amount, None);
    assert_eq!(s.token.balance(&s.creator), creator_before + fill_amount - fee);
    assert_eq!(s.token.balance(&s.platform), fee);
}

#[test]
fn test_pause_blocks_mutations() {
    let s = setup();

    s.client.pause(&s.pauser);

    let res = s.client.try_create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &100,
        &1000,
        &600,
    );
    assert!(res.is_err());

    s.client.unpause(&s.pauser);
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &100,
        &1000,
        &600,
    );

    assert_eq!(order_id, 0);
}

// Regression for audit P2P-01: pause must block NEW exposure (create/take) but never
// trap in-flight escrow — the exit/progress paths stay callable while paused.
#[test]
fn test_pause_allows_fund_exits_blocks_new_exposure() {
    let s = setup();
    set_timestamp(&s.env, 100);

    // Escrow funds in flight BEFORE pausing.
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Ars,
        &PaymentMethod::BankTransfer,
        &true,
        &100,
        &1460,
        &600,
    );
    s.client.take_order(&s.filler, &order_id);

    s.client.pause(&s.pauser);

    // New exposure stays blocked while paused.
    let blocked = s.client.try_create_order(
        &s.creator,
        &FiatCurrency::Ars,
        &PaymentMethod::BankTransfer,
        &true,
        &50,
        &1460,
        &600,
    );
    assert!(blocked.is_err());

    // Fund-progress / release paths MUST still work while paused.
    s.client.submit_fiat_payment(&s.filler, &order_id);
    s.client.confirm_fiat_payment(&s.creator, &order_id);

    assert_eq!(s.client.get_order(&order_id).status, OrderStatus::Completed);
}

#[test]
fn test_only_dispute_resolver_can_resolve() {
    let s = setup();

    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &300,
        &1000,
        &600,
    );
    s.client.take_order(&s.filler, &order_id);
    s.client.submit_fiat_payment(&s.filler, &order_id);
    s.client.dispute_fiat_payment(&s.filler, &order_id);

    let res = s.client.try_resolve_dispute(&s.creator, &order_id, &true);
    assert!(res.is_err());
}

#[test]
fn test_initialize_rejects_duplicate_and_invalid_timeouts() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let pauser = Address::generate(&env);
    let dispute_resolver = Address::generate(&env);
    let (token, _) = create_token(&env, &admin);

    let platform = Address::generate(&env);
    let client = P2PContractClient::new(&env, &env.register(P2PContract {}, ()));

    client.initialize(
        &admin,
        &dispute_resolver,
        &pauser,
        &token.address,
        &platform,
        &50u32,
        &100,
        &10,
    );

    let duplicate = client.try_initialize(
        &admin,
        &dispute_resolver,
        &pauser,
        &token.address,
        &platform,
        &50u32,
        &100,
        &10,
    );
    assert!(duplicate.is_err());

    let second = P2PContractClient::new(&env, &env.register(P2PContract {}, ()));
    let invalid_timeout = second.try_initialize(
        &admin, &dispute_resolver, &pauser, &token.address, &platform, &50u32, &100, &0,
    );
    assert!(invalid_timeout.is_err());
}

#[test]
fn test_pause_auth_and_repeat_guards() {
    let s = setup();
    let random = Address::generate(&s.env);

    let unauthorized_pause = s.client.try_pause(&random);
    assert!(unauthorized_pause.is_err());

    s.client.pause(&s.pauser);

    let second_pause = s.client.try_pause(&s.pauser);
    assert!(second_pause.is_err());

    s.client.unpause(&s.pauser);

    let second_unpause = s.client.try_unpause(&s.pauser);
    assert!(second_unpause.is_err());
}

#[test]
fn test_create_order_validation_failures() {
    let s = setup();

    let invalid_amount = s.client.try_create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &0,
        &1000,
        &600,
    );
    assert!(invalid_amount.is_err());

    let invalid_exchange_rate = s.client.try_create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &100,
        &0,
        &600,
    );
    assert!(invalid_exchange_rate.is_err());

    let invalid_duration = s.client.try_create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &100,
        &1000,
        &2_592_001,
    );
    assert!(invalid_duration.is_err());
}

#[test]
fn test_cancel_order_negative_paths() {
    let s = setup();

    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &100,
        &1000,
        &600,
    );

    let unauthorized_cancel = s.client.try_cancel_order(&s.filler, &order_id);
    assert!(unauthorized_cancel.is_err());

    let nonexistent_cancel = s.client.try_cancel_order(&s.creator, &9999);
    assert!(nonexistent_cancel.is_err());

    s.client.take_order(&s.filler, &order_id);
    let cancel_after_take = s.client.try_cancel_order(&s.creator, &order_id);
    assert!(cancel_after_take.is_err());
}

#[test]
fn test_take_order_negative_paths() {
    let s = setup();

    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &100,
        &1000,
        &600,
    );

    let self_take = s.client.try_take_order(&s.creator, &order_id);
    assert!(self_take.is_err());

    set_timestamp(&s.env, 100);
    let expiring_order = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &100,
        &1000,
        &10,
    );
    set_timestamp(&s.env, 111);
    let expired_take = s.client.try_take_order(&s.filler, &expiring_order);
    assert!(expired_take.is_err());

    let nonexistent_take = s.client.try_take_order(&s.filler, &12345);
    assert!(nonexistent_take.is_err());
}

#[test]
fn test_submit_confirm_dispute_negative_actor_and_status_paths() {
    let s = setup();

    let from_crypto_order = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &200,
        &1000,
        &600,
    );
    s.client.take_order(&s.filler, &from_crypto_order);

    let wrong_submitter = s
        .client
        .try_submit_fiat_payment(&s.creator, &from_crypto_order);
    assert!(wrong_submitter.is_err());

    s.client.submit_fiat_payment(&s.filler, &from_crypto_order);

    let wrong_confirmer = s
        .client
        .try_confirm_fiat_payment(&s.filler, &from_crypto_order);
    assert!(wrong_confirmer.is_err());

    let wrong_disputer = s
        .client
        .try_dispute_fiat_payment(&s.creator, &from_crypto_order);
    assert!(wrong_disputer.is_err());

    let non_disputed_resolution =
        s.client
            .try_resolve_dispute(&s.dispute_resolver, &from_crypto_order, &true);
    assert!(non_disputed_resolution.is_err());
}

#[test]
fn test_timeout_negative_paths() {
    let s = setup();

    set_timestamp(&s.env, 500);
    let from_crypto_order = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &300,
        &1000,
        &600,
    );
    s.client.take_order(&s.filler, &from_crypto_order);

    set_timestamp(&s.env, 1000);
    let before_expiry = s
        .client
        .try_execute_fiat_transfer_timeout(&s.creator, &from_crypto_order);
    assert!(before_expiry.is_err());

    set_timestamp(&s.env, 2400);
    let wrong_actor_after_expiry = s
        .client
        .try_execute_fiat_transfer_timeout(&s.filler, &from_crypto_order);
    assert!(wrong_actor_after_expiry.is_err());

    s.client
        .execute_fiat_transfer_timeout(&s.creator, &from_crypto_order);

    let wrong_status = s
        .client
        .try_execute_fiat_transfer_timeout(&s.creator, &from_crypto_order);
    assert!(wrong_status.is_err());
}

// ─── Oracle integration (Reflector SEP-40) ────────────────────────────────────

mod mock_oracle {
    use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol};

    #[contracttype]
    #[derive(Clone)]
    pub enum Asset {
        Stellar(Address),
        Other(Symbol),
    }

    #[contracttype]
    #[derive(Clone)]
    pub struct PriceData {
        pub price: i128,
        pub timestamp: u64,
    }

    #[contract]
    pub struct MockOracle;

    #[contractimpl]
    impl MockOracle {
        // 1 ARS = 0.00068403207577 USD scaled by 1e14 (matches the live testnet feed).
        pub fn lastprice(_e: Env, _asset: Asset) -> Option<PriceData> {
            Some(PriceData {
                price: 68_403_207_577,
                timestamp: 0,
            })
        }

        pub fn decimals(_e: Env) -> u32 {
            14
        }
    }
}

#[test]
fn test_reference_rate_reads_oracle() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let dispute_resolver = Address::generate(&env);
    let pauser = Address::generate(&env);
    let (token, _token_admin) = create_token(&env, &admin);

    let platform = Address::generate(&env);
    let oracle_id = env.register(mock_oracle::MockOracle {}, ());

    let client = P2PContractClient::new(&env, &env.register(P2PContract {}, ()));
    client.initialize(
        &admin,
        &dispute_resolver,
        &pauser,
        &token.address,
        &platform,
        &50u32,
        &2_592_000,
        &1_800,
    );

    client.set_oracle(&admin, &oracle_id);
    assert_eq!(client.get_oracle(), oracle_id);

    // ARS = currency code 2. The contract reads the USD-quoted price and inverts it
    // on-chain: 1e14 / 68_403_207_577 = 1461 ARS per USD.
    let rate = client.reference_rate(&2u32);
    assert_eq!(rate, 1461);

    // A currency the oracle does not list is rejected before any oracle call.
    let unsupported = client.try_reference_rate(&3u32);
    assert!(unsupported.is_err());
}

#[test]
fn test_reference_rate_requires_oracle_configured() {
    let s = setup();
    // No oracle set -> reference_rate must fail rather than panic.
    let result = s.client.try_reference_rate(&2u32);
    assert!(result.is_err());
}


// ───────────────────── v2: tiered fees + upgrade authorization ─────────────────────

fn pontepay_tiers(e: &Env) -> soroban_sdk::Vec<FeeTier> {
    soroban_sdk::vec![
        e,
        FeeTier { min_amount: 0, fee_bps: 250 },
        FeeTier { min_amount: 100_000_000, fee_bps: 150 },
        FeeTier { min_amount: 500_000_000, fee_bps: 100 },
        FeeTier { min_amount: 2_000_000_000, fee_bps: 80 },
    ]
}

#[test]
fn test_set_fee_tiers_and_quote_boundaries() {
    let s = setup();

    // Without a schedule the flat config fee applies.
    assert_eq!(s.client.quote_fee_bps(&1), TEST_FEE_BPS);

    s.client.set_fee_tiers(&s.admin, &pontepay_tiers(&s.env));

    assert_eq!(s.client.get_fee_tiers().len(), 4);
    assert_eq!(s.client.quote_fee_bps(&1), 250);
    assert_eq!(s.client.quote_fee_bps(&99_999_999), 250);
    assert_eq!(s.client.quote_fee_bps(&100_000_000), 150);
    assert_eq!(s.client.quote_fee_bps(&499_999_999), 150);
    assert_eq!(s.client.quote_fee_bps(&500_000_000), 100);
    assert_eq!(s.client.quote_fee_bps(&1_999_999_999), 100);
    assert_eq!(s.client.quote_fee_bps(&2_000_000_000), 80);
    assert_eq!(s.client.quote_fee_bps(&1_000_000_000_000), 80);

    // Clearing the schedule falls back to the flat fee.
    s.client.set_fee_tiers(&s.admin, &soroban_sdk::vec![&s.env]);
    assert_eq!(s.client.quote_fee_bps(&1), TEST_FEE_BPS);
}

#[test]
fn test_set_fee_tiers_rejects_non_admin() {
    let s = setup();
    let result = s.client.try_set_fee_tiers(&s.creator, &pontepay_tiers(&s.env));
    assert!(result.is_err());
}

#[test]
fn test_set_fee_tiers_rejects_invalid_schedules() {
    let s = setup();

    // First tier must start at 0.
    let bad_start = soroban_sdk::vec![
        &s.env,
        FeeTier { min_amount: 10, fee_bps: 100 },
    ];
    assert!(s.client.try_set_fee_tiers(&s.admin, &bad_start).is_err());

    // min_amount must ascend strictly.
    let not_ascending = soroban_sdk::vec![
        &s.env,
        FeeTier { min_amount: 0, fee_bps: 250 },
        FeeTier { min_amount: 0, fee_bps: 150 },
    ];
    assert!(s.client.try_set_fee_tiers(&s.admin, &not_ascending).is_err());

    // Fee above the 10% ceiling is rejected.
    let too_expensive = soroban_sdk::vec![
        &s.env,
        FeeTier { min_amount: 0, fee_bps: 1_001 },
    ];
    assert!(s.client.try_set_fee_tiers(&s.admin, &too_expensive).is_err());
}

#[test]
fn test_confirm_charges_tiered_fee() {
    let s = setup();
    s.client.set_fee_tiers(&s.admin, &pontepay_tiers(&s.env));

    let filler_before = s.token.balance(&s.filler);
    let fill_amount: i128 = 400; // < first boundary → 250 bps
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &fill_amount,
        &1000,
        &600,
    );

    s.client.take_order(&s.filler, &order_id);
    s.client.submit_fiat_payment(&s.filler, &order_id);
    s.client.confirm_fiat_payment(&s.creator, &order_id);

    let fee = fill_amount * 250 / 10_000; // 10
    assert_eq!(s.token.balance(&s.platform), fee);
    assert_eq!(s.token.balance(&s.filler), filler_before + fill_amount - fee);
    assert_eq!(s.token.balance(&s.client.address), 0);
}

#[test]
fn test_resolve_dispute_confirmed_charges_fee() {
    let s = setup();

    let filler_before = s.token.balance(&s.filler);
    let fill_amount: i128 = 400;
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &fill_amount,
        &1000,
        &600,
    );

    s.client.take_order(&s.filler, &order_id);
    s.client.submit_fiat_payment(&s.filler, &order_id);
    s.client.dispute_fiat_payment(&s.filler, &order_id);
    s.client.resolve_dispute(&s.dispute_resolver, &order_id, &true);

    // Fee-consistency fix: a dispute resolved as "fiat was paid" is a
    // completed trade and pays the same platform fee as the normal path.
    let fee = expected_fee(fill_amount);
    assert_eq!(s.token.balance(&s.platform), fee);
    assert_eq!(s.token.balance(&s.filler), filler_before + fill_amount - fee);
    assert_eq!(s.token.balance(&s.client.address), 0);
}

#[test]
fn test_resolve_dispute_rejected_refunds_without_fee() {
    let s = setup();

    let creator_before = s.token.balance(&s.creator);
    let fill_amount: i128 = 400;
    let order_id = s.client.create_order(
        &s.creator,
        &FiatCurrency::Usd,
        &PaymentMethod::BankTransfer,
        &true,
        &fill_amount,
        &1000,
        &600,
    );

    s.client.take_order(&s.filler, &order_id);
    s.client.submit_fiat_payment(&s.filler, &order_id);
    s.client.dispute_fiat_payment(&s.filler, &order_id);
    s.client.resolve_dispute(&s.dispute_resolver, &order_id, &false);

    // Refund path: escrow returns to the creator in full, no fee taken.
    assert_eq!(s.token.balance(&s.platform), 0);
    assert_eq!(s.token.balance(&s.creator), creator_before);
    let order = s.client.get_order(&order_id);
    assert_eq!(order.status, OrderStatus::AwaitingFiller);
}

#[test]
fn test_initialize_rejects_fee_above_ceiling() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let (token, _) = create_token(&env, &admin);
    let client = P2PContractClient::new(&env, &env.register(P2PContract {}, ()));

    let result = client.try_initialize(
        &admin,
        &admin,
        &admin,
        &token.address,
        &admin,
        &1_001, // > 10% ceiling
        &2_592_000,
        &1_800,
    );
    assert!(result.is_err());
}
