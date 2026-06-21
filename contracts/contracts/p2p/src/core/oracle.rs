use soroban_sdk::{contractclient, contracttype, Address, Env, Symbol};

use crate::core::admin::AdminManager;
use crate::error::ContractError;

// Minimal mirror of Reflector's SEP-40 oracle interface.
//
// The struct/enum shapes (field names, variant names and order) MUST match the
// Reflector contract exactly so the cross-contract response deserializes. The
// Reflector fiat oracle is a price feed quoted against USD (`base()` == USD),
// e.g. on testnet `CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W`,
// which exposes ARS among its assets.

#[contracttype]
#[derive(Clone)]
pub enum ReflectorAsset {
    Stellar(Address),
    Other(Symbol),
}

#[contracttype]
#[derive(Clone)]
pub struct ReflectorPriceData {
    pub price: i128,
    pub timestamp: u64,
}

// The trait is only a spec for `#[contractclient]` to generate `ReflectorClient`;
// it is never called directly, hence the allow.
#[allow(dead_code)]
#[contractclient(name = "ReflectorClient")]
pub trait ReflectorOracle {
    fn lastprice(env: Env, asset: ReflectorAsset) -> Option<ReflectorPriceData>;
    fn decimals(env: Env) -> u32;
}

pub struct OracleManager;

impl OracleManager {
    /// Map a `FiatCurrency` code to the ticker symbol used by Reflector's fiat
    /// oracle. Only currencies actually present in the oracle's asset set are
    /// supported; everything else is rejected explicitly.
    fn currency_symbol(e: &Env, currency_code: u32) -> Result<Symbol, ContractError> {
        let ticker = match currency_code {
            1 => "EUR",
            2 => "ARS",
            5 => "GBP",
            _ => return Err(ContractError::UnsupportedCurrency),
        };

        Ok(Symbol::new(e, ticker))
    }

    /// Live reference exchange rate (units of `currency` per 1 USD) read from the
    /// configured Reflector oracle. Replaces hardcoded/off-chain rates with an
    /// on-chain price feed.
    ///
    /// The oracle quotes each asset in USD (`price` = USD value of 1 unit of the
    /// asset, scaled by `decimals`). To express the rate the UI uses ("how many
    /// ARS per USD") we invert: `10^decimals / price`.
    pub fn reference_rate(e: &Env, currency_code: u32) -> Result<i128, ContractError> {
        let oracle_addr = AdminManager::get_oracle(e)?;
        let oracle = ReflectorClient::new(e, &oracle_addr);

        let asset = ReflectorAsset::Other(Self::currency_symbol(e, currency_code)?);
        let price_data = oracle
            .lastprice(&asset)
            .ok_or(ContractError::OracleUnavailable)?;

        if price_data.price <= 0 {
            return Err(ContractError::OracleUnavailable);
        }

        let scale = 10i128
            .checked_pow(oracle.decimals())
            .ok_or(ContractError::Overflow)?;

        scale
            .checked_div(price_data.price)
            .ok_or(ContractError::DivisionError)
    }
}
