use soroban_sdk::{Address, Env, Vec};

use crate::core::validators::admin::{ensure_pauser, validate_initialize_inputs};
use crate::error::ContractError;
use crate::storage::types::{Config, DataKey, FeeTier};

/// Hard ceiling for any platform fee tier: 10% (1_000 bps). Protects users
/// from a fat-fingered or malicious admin schedule.
const MAX_TIER_FEE_BPS: u32 = 1_000;

pub struct AdminManager;

impl AdminManager {
    pub fn initialize(
        e: &Env,
        admin: Address,
        dispute_resolver: Address,
        pauser: Address,
        token: Address,
        platform_address: Address,
        platform_fee_bps: u32,
        max_duration_secs: u64,
        filler_payment_timeout_secs: u64,
    ) -> Result<Config, ContractError> {
        if e.storage().instance().has(&DataKey::Config) {
            return Err(ContractError::AlreadyInitialized);
        }

        validate_initialize_inputs(max_duration_secs, filler_payment_timeout_secs, platform_fee_bps)?;

        let config = Config {
            admin,
            dispute_resolver,
            pauser,
            token,
            platform_address,
            platform_fee_bps,
            max_duration_secs,
            filler_payment_timeout_secs,
            paused: false,
        };

        e.storage().instance().set(&DataKey::Config, &config);
        e.storage().instance().set(&DataKey::OrderCount, &0u64);
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_LEDGERS);

        Ok(config)
    }

    pub fn pause(e: &Env, caller: Address) -> Result<(), ContractError> {
        caller.require_auth();
        let mut config = Self::get_config(e)?;

        ensure_pauser(&config, &caller)?;
        if config.paused {
            return Err(ContractError::AlreadyPaused);
        }

        config.paused = true;
        e.storage().instance().set(&DataKey::Config, &config);
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_LEDGERS);

        Ok(())
    }

    pub fn unpause(e: &Env, caller: Address) -> Result<(), ContractError> {
        caller.require_auth();
        let mut config = Self::get_config(e)?;

        ensure_pauser(&config, &caller)?;
        if !config.paused {
            return Err(ContractError::AlreadyUnpaused);
        }

        config.paused = false;
        e.storage().instance().set(&DataKey::Config, &config);
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_LEDGERS);

        Ok(())
    }

    pub fn get_config(e: &Env) -> Result<Config, ContractError> {
        e.storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(ContractError::ConfigNotInitialized)
    }

    pub fn set_oracle(e: &Env, caller: Address, oracle: Address) -> Result<(), ContractError> {
        caller.require_auth();
        let config = Self::get_config(e)?;

        if caller != config.admin {
            return Err(ContractError::Unauthorized);
        }

        e.storage().instance().set(&DataKey::Oracle, &oracle);
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_LEDGERS);

        Ok(())
    }

    pub fn get_oracle(e: &Env) -> Result<Address, ContractError> {
        e.storage()
            .instance()
            .get(&DataKey::Oracle)
            .ok_or(ContractError::OracleNotSet)
    }

    /// Replace the tiered fee schedule. Admin-only. Tiers must be sorted by
    /// strictly ascending `min_amount`, start at 0, and every fee is capped at
    /// MAX_TIER_FEE_BPS. An empty vector clears the schedule (falls back to
    /// the flat `Config.platform_fee_bps`).
    pub fn set_fee_tiers(
        e: &Env,
        caller: Address,
        tiers: Vec<FeeTier>,
    ) -> Result<(), ContractError> {
        caller.require_auth();
        let config = Self::get_config(e)?;

        if caller != config.admin {
            return Err(ContractError::Unauthorized);
        }

        let mut prev_min: Option<i128> = None;
        for tier in tiers.iter() {
            if tier.fee_bps > MAX_TIER_FEE_BPS {
                return Err(ContractError::InvalidFeeTiers);
            }
            match prev_min {
                None => {
                    // First tier must cover all amounts from zero.
                    if tier.min_amount != 0 {
                        return Err(ContractError::InvalidFeeTiers);
                    }
                }
                Some(prev) => {
                    if tier.min_amount <= prev {
                        return Err(ContractError::InvalidFeeTiers);
                    }
                }
            }
            prev_min = Some(tier.min_amount);
        }

        if tiers.is_empty() {
            e.storage().instance().remove(&DataKey::FeeTiers);
        } else {
            e.storage().instance().set(&DataKey::FeeTiers, &tiers);
        }
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_LEDGERS);

        Ok(())
    }

    pub fn get_fee_tiers(e: &Env) -> Vec<FeeTier> {
        e.storage()
            .instance()
            .get(&DataKey::FeeTiers)
            .unwrap_or_else(|| Vec::new(e))
    }

    /// Fee (in bps) that applies to a fill of `amount`: the highest tier whose
    /// `min_amount` <= amount, or the flat config fee when no schedule is set.
    pub fn effective_fee_bps(e: &Env, config: &Config, amount: i128) -> u32 {
        let tiers = Self::get_fee_tiers(e);
        let mut selected: Option<u32> = None;
        for tier in tiers.iter() {
            if amount >= tier.min_amount {
                selected = Some(tier.fee_bps);
            } else {
                break; // tiers are sorted ascending
            }
        }
        selected.unwrap_or(config.platform_fee_bps)
    }

    pub fn get_order_count(e: &Env) -> Result<u64, ContractError> {
        if !e.storage().instance().has(&DataKey::Config) {
            return Err(ContractError::ConfigNotInitialized);
        }

        Ok(e.storage()
            .instance()
            .get(&DataKey::OrderCount)
            .unwrap_or(0u64))
    }
}

// ~5 days threshold → extend to ~30 days (at 5 s/ledger).
const INSTANCE_TTL_THRESHOLD: u32 = 86_400;
const INSTANCE_TTL_LEDGERS: u32 = 518_400;
