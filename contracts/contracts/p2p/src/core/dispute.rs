use soroban_sdk::token::Client as TokenClient;
use soroban_sdk::{Address, Env};

const ORDER_TTL_THRESHOLD: u32 = 86_400;
const ORDER_TTL_LEDGERS: u32 = 518_400;

use crate::core::admin::AdminManager;
use crate::core::order::OrderManager;
use crate::core::validators::admin::ensure_dispute_resolver;
use crate::core::validators::dispute::{ensure_disputable, ensure_disputed};
use crate::core::validators::order::{ensure_active_fill_amount, ensure_creator, ensure_filler};
use crate::error::ContractError;
use crate::storage::types::{DataKey, Order, OrderStatus};

pub struct DisputeManager;

impl DisputeManager {
    pub fn dispute_fiat_payment(
        e: &Env,
        caller: Address,
        order_id: u64,
    ) -> Result<Order, ContractError> {
        // Exempt from pause (audit P2P-01): a party must be able to flag a dispute while paused,
        // otherwise the order can never reach the (pause-exempt) resolve_dispute exit.
        caller.require_auth();

        let mut order = OrderManager::get_order(e, order_id)?;
        ensure_disputable(&order)?;

        if order.from_crypto {
            ensure_filler(&order, &caller)?;
        } else {
            ensure_creator(&order, &caller)?;
        }

        order.status = OrderStatus::Disputed;
        let key = DataKey::Order(order.order_id);
        e.storage().persistent().set(&key, &order);
        e.storage()
            .persistent()
            .extend_ttl(&key, ORDER_TTL_THRESHOLD, ORDER_TTL_LEDGERS);

        Ok(order)
    }

    pub fn resolve_dispute(
        e: &Env,
        caller: Address,
        order_id: u64,
        fiat_transfer_confirmed: bool,
    ) -> Result<Order, ContractError> {
        // Exempt from pause (audit P2P-01): the dispute_resolver's fund-recovery path is the
        // emergency backstop and must remain callable even while the contract is paused.
        caller.require_auth();
        let config = AdminManager::get_config(e)?;
        ensure_dispute_resolver(&config, &caller)?;

        let mut order = OrderManager::get_order(e, order_id)?;
        ensure_disputed(&order)?;
        let active_fill_amount = ensure_active_fill_amount(&order)?;

        let token_client = TokenClient::new(e, &config.token);
        // Platform fee applies only when the trade completes successfully
        // (confirmed branch) — refunds are always fee-free. v2 consistency fix:
        // previously a dispute-confirmed release skipped the fee entirely.
        let mut payout = active_fill_amount;
        let recipient = if fiat_transfer_confirmed {
            order.filled_amount = order
                .filled_amount
                .checked_add(active_fill_amount)
                .ok_or(ContractError::Overflow)?;
            order.remaining_amount = order
                .remaining_amount
                .checked_sub(active_fill_amount)
                .ok_or(ContractError::Underflow)?;

            order.status = if order.remaining_amount == 0 {
                OrderStatus::Completed
            } else {
                OrderStatus::AwaitingFiller
            };

            let fee_bps = AdminManager::effective_fee_bps(e, &config, active_fill_amount);
            let fee_amount = active_fill_amount
                .checked_mul(fee_bps as i128)
                .ok_or(ContractError::Overflow)?
                .checked_div(10_000)
                .ok_or(ContractError::DivisionError)?;
            if fee_amount > 0 {
                token_client.transfer(
                    &e.current_contract_address(),
                    &config.platform_address,
                    &fee_amount,
                );
            }
            payout = active_fill_amount
                .checked_sub(fee_amount)
                .ok_or(ContractError::Underflow)?;

            if order.from_crypto {
                order.filler.clone().ok_or(ContractError::MissingFiller)?
            } else {
                order.creator.clone()
            }
        } else {
            order.status = OrderStatus::AwaitingFiller;
            if order.from_crypto {
                order.creator.clone()
            } else {
                order.filler.clone().ok_or(ContractError::MissingFiller)?
            }
        };

        token_client.transfer(&e.current_contract_address(), &recipient, &payout);
        order.filler = None;
        order.active_fill_amount = None;
        order.fiat_transfer_deadline = None;
        let key = DataKey::Order(order.order_id);
        e.storage().persistent().set(&key, &order);
        e.storage()
            .persistent()
            .extend_ttl(&key, ORDER_TTL_THRESHOLD, ORDER_TTL_LEDGERS);

        Ok(order)
    }
}
