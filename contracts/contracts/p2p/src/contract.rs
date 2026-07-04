use soroban_sdk::{contract, contractimpl, panic_with_error, Address, Env, Vec};
use stellar_contract_utils::upgradeable::UpgradeableInternal;
use stellar_macros::Upgradeable;

use crate::core::{AdminManager, DisputeManager, OracleManager, OrderManager};
use crate::error::ContractError;
use crate::events::handler::{
    DisputeResolved, FeeTiersSet, FiatPaymentConfirmed, FiatPaymentDisputed, FiatPaymentSubmitted,
    FiatTransferTimeout, Initialized, OracleSet, OrderCancelled, OrderCreated, OrderTaken,
    PausedEvt, UnpausedEvt,
};
use crate::storage::types::{Config, FeeTier, FiatCurrency, Order, PaymentMethod};

#[derive(Upgradeable)]
#[contract]
pub struct P2PContract;

// Only the configured admin may replace the contract WASM. The operator is the
// invoker of `upgrade(new_wasm_hash, operator)`; OpenZeppelin's derive handles
// the actual `update_current_contract_wasm` call and SEP-49 version metadata.
impl UpgradeableInternal for P2PContract {
    fn _require_auth(e: &Env, operator: &Address) {
        operator.require_auth();
        let config = match AdminManager::get_config(e) {
            Ok(config) => config,
            Err(err) => panic_with_error!(e, err),
        };
        if *operator != config.admin {
            panic_with_error!(e, ContractError::Unauthorized);
        }
    }
}

#[contractimpl]
impl P2PContract {
    pub fn __constructor() {}

    pub fn initialize(
        e: Env,
        admin: Address,
        dispute_resolver: Address,
        pauser: Address,
        token: Address,
        platform_address: Address,
        platform_fee_bps: u32,
        max_duration_secs: u64,
        filler_payment_timeout_secs: u64,
    ) -> Result<(), ContractError> {
        admin.require_auth();
        let config = AdminManager::initialize(
            &e,
            admin,
            dispute_resolver,
            pauser,
            token,
            platform_address,
            platform_fee_bps,
            max_duration_secs,
            filler_payment_timeout_secs,
        )?;

        Initialized {
            admin: config.admin,
            dispute_resolver: config.dispute_resolver,
            pauser: config.pauser,
            token: config.token,
        }
        .publish(&e);

        Ok(())
    }

    pub fn pause(e: Env, caller: Address) -> Result<(), ContractError> {
        AdminManager::pause(&e, caller.clone())?;
        PausedEvt { by: caller }.publish(&e);
        Ok(())
    }

    pub fn unpause(e: Env, caller: Address) -> Result<(), ContractError> {
        AdminManager::unpause(&e, caller.clone())?;
        UnpausedEvt { by: caller }.publish(&e);
        Ok(())
    }

    /// Admin-only: set the tiered platform-fee schedule (empty = flat fee).
    pub fn set_fee_tiers(
        e: Env,
        caller: Address,
        tiers: Vec<FeeTier>,
    ) -> Result<(), ContractError> {
        AdminManager::set_fee_tiers(&e, caller.clone(), tiers.clone())?;
        FeeTiersSet {
            by: caller,
            tier_count: tiers.len(),
        }
        .publish(&e);
        Ok(())
    }

    pub fn get_fee_tiers(e: Env) -> Vec<FeeTier> {
        AdminManager::get_fee_tiers(&e)
    }

    /// Fee in bps that a fill of `amount` would pay right now.
    pub fn quote_fee_bps(e: Env, amount: i128) -> Result<u32, ContractError> {
        let config = AdminManager::get_config(&e)?;
        Ok(AdminManager::effective_fee_bps(&e, &config, amount))
    }

    pub fn create_order(
        e: Env,
        caller: Address,
        fiat_currency: FiatCurrency,
        payment_method: PaymentMethod,
        from_crypto: bool,
        amount: i128,
        exchange_rate: i128,
        duration_secs: u64,
    ) -> Result<u64, ContractError> {
        let order = OrderManager::create_order(
            &e,
            caller,
            fiat_currency,
            payment_method,
            from_crypto,
            amount,
            exchange_rate,
            duration_secs,
        )?;

        OrderCreated {
            order_id: order.order_id,
            creator: order.creator,
            amount: order.amount,
            from_crypto: order.from_crypto,
        }
        .publish(&e);

        Ok(order.order_id)
    }

    pub fn create_order_cli(
        e: Env,
        caller: Address,
        fiat_currency_code: u32,
        payment_method_code: u32,
        from_crypto: bool,
        amount: i128,
        exchange_rate: i128,
        duration_secs: u64,
    ) -> Result<u64, ContractError> {
        let fiat_currency = FiatCurrency::from_code(fiat_currency_code);
        let payment_method = PaymentMethod::from_code(payment_method_code);

        let order = OrderManager::create_order(
            &e,
            caller,
            fiat_currency,
            payment_method,
            from_crypto,
            amount,
            exchange_rate,
            duration_secs,
        )?;

        OrderCreated {
            order_id: order.order_id,
            creator: order.creator,
            amount: order.amount,
            from_crypto: order.from_crypto,
        }
        .publish(&e);

        Ok(order.order_id)
    }

    pub fn cancel_order(e: Env, caller: Address, order_id: u64) -> Result<(), ContractError> {
        let order = OrderManager::cancel_order(&e, caller.clone(), order_id)?;
        OrderCancelled {
            order_id,
            cancelled_by: caller,
        }
        .publish(&e);

        let _ = order;
        Ok(())
    }

    pub fn take_order(e: Env, caller: Address, order_id: u64) -> Result<(), ContractError> {
        let _order = OrderManager::take_order(&e, caller.clone(), order_id)?;
        OrderTaken {
            order_id,
            filler: caller,
        }
        .publish(&e);
        Ok(())
    }

    pub fn take_order_with_amount(
        e: Env,
        caller: Address,
        order_id: u64,
        fill_amount: i128,
    ) -> Result<(), ContractError> {
        let _order =
            OrderManager::take_order_with_amount(&e, caller.clone(), order_id, fill_amount)?;
        OrderTaken {
            order_id,
            filler: caller,
        }
        .publish(&e);
        Ok(())
    }

    pub fn submit_fiat_payment(
        e: Env,
        caller: Address,
        order_id: u64,
    ) -> Result<(), ContractError> {
        let _order = OrderManager::submit_fiat_payment(&e, caller.clone(), order_id)?;
        FiatPaymentSubmitted {
            order_id,
            submitted_by: caller,
        }
        .publish(&e);
        Ok(())
    }

    pub fn execute_fiat_transfer_timeout(
        e: Env,
        caller: Address,
        order_id: u64,
    ) -> Result<(), ContractError> {
        let (order, refund_amount) =
            OrderManager::execute_fiat_transfer_timeout(&e, caller.clone(), order_id)?;
        let (refunded_to, normalized_refund_amount) = if order.from_crypto {
            (None, 0)
        } else {
            (Some(caller.clone()), refund_amount)
        };

        FiatTransferTimeout {
            order_id,
            executed_by: caller,
            refunded_to,
            refund_amount: normalized_refund_amount,
        }
        .publish(&e);
        Ok(())
    }

    pub fn confirm_fiat_payment(
        e: Env,
        caller: Address,
        order_id: u64,
    ) -> Result<(), ContractError> {
        let _order = OrderManager::confirm_fiat_payment(&e, caller.clone(), order_id)?;
        FiatPaymentConfirmed {
            order_id,
            confirmed_by: caller,
        }
        .publish(&e);
        Ok(())
    }

    pub fn dispute_fiat_payment(
        e: Env,
        caller: Address,
        order_id: u64,
    ) -> Result<(), ContractError> {
        let _order = DisputeManager::dispute_fiat_payment(&e, caller.clone(), order_id)?;
        FiatPaymentDisputed {
            order_id,
            disputed_by: caller,
        }
        .publish(&e);
        Ok(())
    }

    pub fn resolve_dispute(
        e: Env,
        caller: Address,
        order_id: u64,
        fiat_transfer_confirmed: bool,
    ) -> Result<(), ContractError> {
        let _order =
            DisputeManager::resolve_dispute(&e, caller.clone(), order_id, fiat_transfer_confirmed)?;
        DisputeResolved {
            order_id,
            resolved_by: caller,
            fiat_transfer_confirmed,
        }
        .publish(&e);
        Ok(())
    }

    pub fn set_oracle(e: Env, caller: Address, oracle: Address) -> Result<(), ContractError> {
        AdminManager::set_oracle(&e, caller.clone(), oracle.clone())?;
        OracleSet {
            oracle,
            set_by: caller,
        }
        .publish(&e);
        Ok(())
    }

    pub fn get_oracle(e: Env) -> Result<Address, ContractError> {
        AdminManager::get_oracle(&e)
    }

    /// Live reference rate (units of `currency` per 1 USD) from the Reflector
    /// oracle. `currency_code` follows `FiatCurrency::from_code` (2 = ARS).
    pub fn reference_rate(e: Env, currency_code: u32) -> Result<i128, ContractError> {
        OracleManager::reference_rate(&e, currency_code)
    }

    pub fn get_order(e: Env, order_id: u64) -> Result<Order, ContractError> {
        OrderManager::get_order(&e, order_id)
    }

    pub fn get_order_count(e: Env) -> Result<u64, ContractError> {
        AdminManager::get_order_count(&e)
    }

    pub fn get_config(e: Env) -> Result<Config, ContractError> {
        AdminManager::get_config(&e)
    }
}
