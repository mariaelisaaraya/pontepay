import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAVPPFFQSDJ6ALZPPEDKFL3URUBUDEC6DSPH5S3RS5COEWBRXXBF3PMH",
  }
} as const

export type ReflectorAsset = {tag: "Stellar", values: readonly [string]} | {tag: "Other", values: readonly [string]};


export interface ReflectorPriceData {
  price: i128;
  timestamp: u64;
}

export const ContractError = {
  1: {message:"InvalidAmount"},
  2: {message:"InvalidExchangeRate"},
  3: {message:"InvalidDuration"},
  4: {message:"OrderNotFound"},
  5: {message:"InvalidOrderStatus"},
  6: {message:"Unauthorized"},
  7: {message:"OrderExpired"},
  8: {message:"FiatTransferHasNotExpired"},
  9: {message:"AlreadyInitialized"},
  10: {message:"ConfigNotInitialized"},
  11: {message:"Paused"},
  12: {message:"AlreadyPaused"},
  13: {message:"AlreadyUnpaused"},
  14: {message:"MissingFiller"},
  15: {message:"Overflow"},
  16: {message:"Underflow"},
  17: {message:"DivisionError"},
  18: {message:"InvalidTimeout"},
  19: {message:"InvalidAddress"},
  20: {message:"InvalidFillAmount"},
  21: {message:"FillAmountExceedsRemaining"},
  22: {message:"MissingActiveFill"},
  23: {message:"OracleNotSet"},
  24: {message:"OracleUnavailable"},
  25: {message:"UnsupportedCurrency"},
  26: {message:"OraclePriceStale"},
  27: {message:"ExchangeRateOutOfBounds"},
  28: {message:"InvalidFeeTiers"}
}















export interface Order {
  active_fill_amount: Option<i128>;
  amount: i128;
  created_at: u64;
  creator: string;
  deadline: u64;
  exchange_rate: i128;
  fiat_currency: FiatCurrency;
  fiat_transfer_deadline: Option<u64>;
  filled_amount: i128;
  filler: Option<string>;
  from_crypto: boolean;
  order_id: u64;
  payment_method: PaymentMethod;
  remaining_amount: i128;
  status: OrderStatus;
  token: string;
}


export interface Config {
  admin: string;
  dispute_resolver: string;
  filler_payment_timeout_secs: u64;
  max_duration_secs: u64;
  paused: boolean;
  pauser: string;
  platform_address: string;
  platform_fee_bps: u32;
  token: string;
}

export type DataKey = {tag: "Config", values: void} | {tag: "OrderCount", values: void} | {tag: "Order", values: readonly [u64]} | {tag: "Oracle", values: void} | {tag: "FeeTiers", values: void};


/**
 * One step of the tiered platform-fee schedule. `min_amount` is the smallest
 * fill (in token stroops) this tier applies to; the schedule is stored sorted
 * ascending and the highest matching tier wins.
 */
export interface FeeTier {
  fee_bps: u32;
  min_amount: i128;
}

export type OrderStatus = {tag: "Created", values: void} | {tag: "AwaitingFiller", values: void} | {tag: "AwaitingPayment", values: void} | {tag: "AwaitingConfirmation", values: void} | {tag: "Completed", values: void} | {tag: "Disputed", values: void} | {tag: "Refunded", values: void} | {tag: "Cancelled", values: void};

export type FiatCurrency = {tag: "Usd", values: void} | {tag: "Eur", values: void} | {tag: "Ars", values: void} | {tag: "Cop", values: void} | {tag: "Gbp", values: void} | {tag: "Other", values: readonly [u32]};

export type PaymentMethod = {tag: "BankTransfer", values: void} | {tag: "MobileWallet", values: void} | {tag: "Cash", values: void} | {tag: "Other", values: readonly [u32]};

export const UpgradeableError = {
  /**
   * When migration is attempted but not allowed due to upgrade state.
   */
  1100: {message:"MigrationNotAllowed"}
}



export const MerkleDistributorError = {
  /**
   * The merkle root is not set.
   */
  1300: {message:"RootNotSet"},
  /**
   * The provided index was already claimed.
   */
  1301: {message:"IndexAlreadyClaimed"},
  /**
   * The proof is invalid.
   */
  1302: {message:"InvalidProof"}
}

/**
 * Storage keys for the data associated with `MerkleDistributor`
 */
export type MerkleDistributorStorageKey = {tag: "Root", values: void} | {tag: "Claimed", values: readonly [u32]};

export type Rounding = {tag: "Floor", values: void} | {tag: "Ceil", values: void};

export const SorobanFixedPointError = {
  /**
   * The operation failed because the denominator is 0.
   */
  1500: {message:"ZeroDenominator"},
  /**
   * The operation failed because a phantom overflow occurred.
   */
  1501: {message:"PhantomOverflow"},
  /**
   * The operation failed because the result does not fit in Self.
   */
  1502: {message:"ResultOverflow"}
}

export const CryptoError = {
  /**
   * The merkle proof length is out of bounds.
   */
  1400: {message:"MerkleProofOutOfBounds"},
  /**
   * The index of the leaf is out of bounds.
   */
  1401: {message:"MerkleIndexOutOfBounds"},
  /**
   * No data in hasher state.
   */
  1402: {message:"HasherEmptyState"}
}



export const PausableError = {
  /**
   * The operation failed because the contract is paused.
   */
  1000: {message:"EnforcedPause"},
  /**
   * The operation failed because the contract is not paused.
   */
  1001: {message:"ExpectedPause"}
}

/**
 * Storage key for the pausable state
 */
export type PausableStorageKey = {tag: "Paused", values: void};

export interface Client {
  /**
   * Construct and simulate a pause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  pause: ({caller}: {caller: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a unpause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  unpause: ({caller}: {caller: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  upgrade: ({new_wasm_hash, operator}: {new_wasm_hash: Buffer, operator: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_order transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_order: ({order_id}: {order_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Order>>>

  /**
   * Construct and simulate a get_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_config: (options?: MethodOptions) => Promise<AssembledTransaction<Result<Config>>>

  /**
   * Construct and simulate a get_oracle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_oracle: (options?: MethodOptions) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin, dispute_resolver, pauser, token, platform_address, platform_fee_bps, max_duration_secs, filler_payment_timeout_secs}: {admin: string, dispute_resolver: string, pauser: string, token: string, platform_address: string, platform_fee_bps: u32, max_duration_secs: u64, filler_payment_timeout_secs: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_oracle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_oracle: ({caller, oracle}: {caller: string, oracle: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a take_order transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  take_order: ({caller, order_id}: {caller: string, order_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a cancel_order transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  cancel_order: ({caller, order_id}: {caller: string, order_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_order transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_order: ({caller, fiat_currency, payment_method, from_crypto, amount, exchange_rate, duration_secs}: {caller: string, fiat_currency: FiatCurrency, payment_method: PaymentMethod, from_crypto: boolean, amount: i128, exchange_rate: i128, duration_secs: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a get_fee_tiers transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_fee_tiers: (options?: MethodOptions) => Promise<AssembledTransaction<Array<FeeTier>>>

  /**
   * Construct and simulate a quote_fee_bps transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Fee in bps that a fill of `amount` would pay right now.
   */
  quote_fee_bps: ({amount}: {amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u32>>>

  /**
   * Construct and simulate a set_fee_tiers transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-only: set the tiered platform-fee schedule (empty = flat fee).
   */
  set_fee_tiers: ({caller, tiers}: {caller: string, tiers: Array<FeeTier>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a reference_rate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Live reference rate (units of `currency` per 1 USD) from the Reflector
   * oracle. `currency_code` follows `FiatCurrency::from_code` (2 = ARS).
   */
  reference_rate: ({currency_code}: {currency_code: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_order_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_order_count: (options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a resolve_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  resolve_dispute: ({caller, order_id, fiat_transfer_confirmed}: {caller: string, order_id: u64, fiat_transfer_confirmed: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_order_cli transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_order_cli: ({caller, fiat_currency_code, payment_method_code, from_crypto, amount, exchange_rate, duration_secs}: {caller: string, fiat_currency_code: u32, payment_method_code: u32, from_crypto: boolean, amount: i128, exchange_rate: i128, duration_secs: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a submit_fiat_payment transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  submit_fiat_payment: ({caller, order_id}: {caller: string, order_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a confirm_fiat_payment transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  confirm_fiat_payment: ({caller, order_id}: {caller: string, order_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a dispute_fiat_payment transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  dispute_fiat_payment: ({caller, order_id}: {caller: string, order_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a take_order_with_amount transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  take_order_with_amount: ({caller, order_id, fill_amount}: {caller: string, order_id: u64, fill_amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a execute_fiat_transfer_timeout transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  execute_fiat_transfer_timeout: ({caller, order_id}: {caller: string, order_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAADlJlZmxlY3RvckFzc2V0AAAAAAACAAAAAQAAAAAAAAAHU3RlbGxhcgAAAAABAAAAEwAAAAEAAAAAAAAABU90aGVyAAAAAAAAAQAAABE=",
        "AAAAAQAAAAAAAAAAAAAAElJlZmxlY3RvclByaWNlRGF0YQAAAAAAAgAAAAAAAAAFcHJpY2UAAAAAAAALAAAAAAAAAAl0aW1lc3RhbXAAAAAAAAAG",
        "AAAABAAAAAAAAAAAAAAADUNvbnRyYWN0RXJyb3IAAAAAAAAcAAAAAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAAAQAAAAAAAAATSW52YWxpZEV4Y2hhbmdlUmF0ZQAAAAACAAAAAAAAAA9JbnZhbGlkRHVyYXRpb24AAAAAAwAAAAAAAAANT3JkZXJOb3RGb3VuZAAAAAAAAAQAAAAAAAAAEkludmFsaWRPcmRlclN0YXR1cwAAAAAABQAAAAAAAAAMVW5hdXRob3JpemVkAAAABgAAAAAAAAAMT3JkZXJFeHBpcmVkAAAABwAAAAAAAAAZRmlhdFRyYW5zZmVySGFzTm90RXhwaXJlZAAAAAAAAAgAAAAAAAAAEkFscmVhZHlJbml0aWFsaXplZAAAAAAACQAAAAAAAAAUQ29uZmlnTm90SW5pdGlhbGl6ZWQAAAAKAAAAAAAAAAZQYXVzZWQAAAAAAAsAAAAAAAAADUFscmVhZHlQYXVzZWQAAAAAAAAMAAAAAAAAAA9BbHJlYWR5VW5wYXVzZWQAAAAADQAAAAAAAAANTWlzc2luZ0ZpbGxlcgAAAAAAAA4AAAAAAAAACE92ZXJmbG93AAAADwAAAAAAAAAJVW5kZXJmbG93AAAAAAAAEAAAAAAAAAANRGl2aXNpb25FcnJvcgAAAAAAABEAAAAAAAAADkludmFsaWRUaW1lb3V0AAAAAAASAAAAAAAAAA5JbnZhbGlkQWRkcmVzcwAAAAAAEwAAAAAAAAARSW52YWxpZEZpbGxBbW91bnQAAAAAAAAUAAAAAAAAABpGaWxsQW1vdW50RXhjZWVkc1JlbWFpbmluZwAAAAAAFQAAAAAAAAARTWlzc2luZ0FjdGl2ZUZpbGwAAAAAAAAWAAAAAAAAAAxPcmFjbGVOb3RTZXQAAAAXAAAAAAAAABFPcmFjbGVVbmF2YWlsYWJsZQAAAAAAABgAAAAAAAAAE1Vuc3VwcG9ydGVkQ3VycmVuY3kAAAAAGQAAAAAAAAAQT3JhY2xlUHJpY2VTdGFsZQAAABoAAAAAAAAAF0V4Y2hhbmdlUmF0ZU91dE9mQm91bmRzAAAAABsAAAAAAAAAD0ludmFsaWRGZWVUaWVycwAAAAAc",
        "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",
        "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAACQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAABBkaXNwdXRlX3Jlc29sdmVyAAAAEwAAAAAAAAAbZmlsbGVyX3BheW1lbnRfdGltZW91dF9zZWNzAAAAAAYAAAAAAAAAEW1heF9kdXJhdGlvbl9zZWNzAAAAAAAABgAAAAAAAAAGcGF1c2VkAAAAAAABAAAAAAAAAAZwYXVzZXIAAAAAABMAAAAAAAAAEHBsYXRmb3JtX2FkZHJlc3MAAAATAAAAAAAAABBwbGF0Zm9ybV9mZWVfYnBzAAAABAAAAAAAAAAFdG9rZW4AAAAAAAAT",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAAAAAAAAAAAKT3JkZXJDb3VudAAAAAAAAQAAAAAAAAAFT3JkZXIAAAAAAAABAAAABgAAAAAAAAAAAAAABk9yYWNsZQAAAAAAAAAAAKZWZWM8RmVlVGllcj4g4oCUIG9wdGlvbmFsIHRpZXJlZCBmZWUgc2NoZWR1bGUuIFdoZW4gYWJzZW50IG9yIGVtcHR5IHRoZQpmbGF0IGBDb25maWcucGxhdGZvcm1fZmVlX2Jwc2AgYXBwbGllcywgc28gcHJlLWV4aXN0aW5nIGJlaGF2aW9yIGlzCnByZXNlcnZlZCBhY3Jvc3MgdXBncmFkZXMuAAAAAAAIRmVlVGllcnM=",
        "AAAAAQAAAMRPbmUgc3RlcCBvZiB0aGUgdGllcmVkIHBsYXRmb3JtLWZlZSBzY2hlZHVsZS4gYG1pbl9hbW91bnRgIGlzIHRoZSBzbWFsbGVzdApmaWxsIChpbiB0b2tlbiBzdHJvb3BzKSB0aGlzIHRpZXIgYXBwbGllcyB0bzsgdGhlIHNjaGVkdWxlIGlzIHN0b3JlZCBzb3J0ZWQKYXNjZW5kaW5nIGFuZCB0aGUgaGlnaGVzdCBtYXRjaGluZyB0aWVyIHdpbnMuAAAAAAAAAAdGZWVUaWVyAAAAAAIAAAAAAAAAB2ZlZV9icHMAAAAABAAAAAAAAAAKbWluX2Ftb3VudAAAAAAACw==",
        "AAAAAgAAAAAAAAAAAAAAC09yZGVyU3RhdHVzAAAAAAgAAAAAAAAAAAAAAAdDcmVhdGVkAAAAAAAAAAAAAAAADkF3YWl0aW5nRmlsbGVyAAAAAAAAAAAAAAAAAA9Bd2FpdGluZ1BheW1lbnQAAAAAAAAAAAAAAAAUQXdhaXRpbmdDb25maXJtYXRpb24AAAAAAAAAAAAAAAlDb21wbGV0ZWQAAAAAAAAAAAAAAAAAAAhEaXNwdXRlZAAAAAAAAAAAAAAACFJlZnVuZGVkAAAAAAAAAAAAAAAJQ2FuY2VsbGVkAAAA",
        "AAAAAgAAAAAAAAAAAAAADEZpYXRDdXJyZW5jeQAAAAYAAAAAAAAAAAAAAANVc2QAAAAAAAAAAAAAAAADRXVyAAAAAAAAAAAAAAAAA0FycwAAAAAAAAAAAAAAAANDb3AAAAAAAAAAAAAAAAADR2JwAAAAAAEAAAAAAAAABU90aGVyAAAAAAAAAQAAAAQ=",
        "AAAAAgAAAAAAAAAAAAAADVBheW1lbnRNZXRob2QAAAAAAAAEAAAAAAAAAAAAAAAMQmFua1RyYW5zZmVyAAAAAAAAAAAAAAAMTW9iaWxlV2FsbGV0AAAAAAAAAAAAAAAEQ2FzaAAAAAEAAAAAAAAABU90aGVyAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAFcGF1c2UAAAAAAAABAAAAAAAAAAZjYWxsZXIAAAAAABMAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAHdW5wYXVzZQAAAAABAAAAAAAAAAZjYWxsZXIAAAAAABMAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAHdXBncmFkZQAAAAACAAAAAAAAAA1uZXdfd2FzbV9oYXNoAAAAAAAD7gAAACAAAAAAAAAACG9wZXJhdG9yAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAJZ2V0X29yZGVyAAAAAAAAAQAAAAAAAAAIb3JkZXJfaWQAAAAGAAAAAQAAA+kAAAfQAAAABU9yZGVyAAAAAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAKZ2V0X2NvbmZpZwAAAAAAAAAAAAEAAAPpAAAH0AAAAAZDb25maWcAAAAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAKZ2V0X29yYWNsZQAAAAAAAAAAAAEAAAPpAAAAEwAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAACAAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAABBkaXNwdXRlX3Jlc29sdmVyAAAAEwAAAAAAAAAGcGF1c2VyAAAAAAATAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAAEHBsYXRmb3JtX2FkZHJlc3MAAAATAAAAAAAAABBwbGF0Zm9ybV9mZWVfYnBzAAAABAAAAAAAAAARbWF4X2R1cmF0aW9uX3NlY3MAAAAAAAAGAAAAAAAAABtmaWxsZXJfcGF5bWVudF90aW1lb3V0X3NlY3MAAAAABgAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAKc2V0X29yYWNsZQAAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAZvcmFjbGUAAAAAABMAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAKdGFrZV9vcmRlcgAAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAhvcmRlcl9pZAAAAAYAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAMY2FuY2VsX29yZGVyAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAhvcmRlcl9pZAAAAAYAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAMY3JlYXRlX29yZGVyAAAABwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAA1maWF0X2N1cnJlbmN5AAAAAAAH0AAAAAxGaWF0Q3VycmVuY3kAAAAAAAAADnBheW1lbnRfbWV0aG9kAAAAAAfQAAAADVBheW1lbnRNZXRob2QAAAAAAAAAAAAAC2Zyb21fY3J5cHRvAAAAAAEAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAANZXhjaGFuZ2VfcmF0ZQAAAAAAAAsAAAAAAAAADWR1cmF0aW9uX3NlY3MAAAAAAAAGAAAAAQAAA+kAAAAGAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAAAAAAA",
        "AAAAAAAAAAAAAAANZ2V0X2ZlZV90aWVycwAAAAAAAAAAAAABAAAD6gAAB9AAAAAHRmVlVGllcgA=",
        "AAAAAAAAADdGZWUgaW4gYnBzIHRoYXQgYSBmaWxsIG9mIGBhbW91bnRgIHdvdWxkIHBheSByaWdodCBub3cuAAAAAA1xdW90ZV9mZWVfYnBzAAAAAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+kAAAAEAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAERBZG1pbi1vbmx5OiBzZXQgdGhlIHRpZXJlZCBwbGF0Zm9ybS1mZWUgc2NoZWR1bGUgKGVtcHR5ID0gZmxhdCBmZWUpLgAAAA1zZXRfZmVlX3RpZXJzAAAAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAV0aWVycwAAAAAAA+oAAAfQAAAAB0ZlZVRpZXIAAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAItMaXZlIHJlZmVyZW5jZSByYXRlICh1bml0cyBvZiBgY3VycmVuY3lgIHBlciAxIFVTRCkgZnJvbSB0aGUgUmVmbGVjdG9yCm9yYWNsZS4gYGN1cnJlbmN5X2NvZGVgIGZvbGxvd3MgYEZpYXRDdXJyZW5jeTo6ZnJvbV9jb2RlYCAoMiA9IEFSUykuAAAAAA5yZWZlcmVuY2VfcmF0ZQAAAAAAAQAAAAAAAAANY3VycmVuY3lfY29kZQAAAAAAAAQAAAABAAAD6QAAAAsAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAPZ2V0X29yZGVyX2NvdW50AAAAAAAAAAABAAAD6QAAAAYAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAPcmVzb2x2ZV9kaXNwdXRlAAAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAIb3JkZXJfaWQAAAAGAAAAAAAAABdmaWF0X3RyYW5zZmVyX2NvbmZpcm1lZAAAAAABAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAQY3JlYXRlX29yZGVyX2NsaQAAAAcAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAASZmlhdF9jdXJyZW5jeV9jb2RlAAAAAAAEAAAAAAAAABNwYXltZW50X21ldGhvZF9jb2RlAAAAAAQAAAAAAAAAC2Zyb21fY3J5cHRvAAAAAAEAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAANZXhjaGFuZ2VfcmF0ZQAAAAAAAAsAAAAAAAAADWR1cmF0aW9uX3NlY3MAAAAAAAAGAAAAAQAAA+kAAAAGAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAATc3VibWl0X2ZpYXRfcGF5bWVudAAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACG9yZGVyX2lkAAAABgAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAUY29uZmlybV9maWF0X3BheW1lbnQAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACG9yZGVyX2lkAAAABgAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAUZGlzcHV0ZV9maWF0X3BheW1lbnQAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACG9yZGVyX2lkAAAABgAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAWdGFrZV9vcmRlcl93aXRoX2Ftb3VudAAAAAAAAwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAhvcmRlcl9pZAAAAAYAAAAAAAAAC2ZpbGxfYW1vdW50AAAAAAsAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAdZXhlY3V0ZV9maWF0X3RyYW5zZmVyX3RpbWVvdXQAAAAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACG9yZGVyX2lkAAAABgAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAABAAAAAAAAAAAAAAAEFVwZ3JhZGVhYmxlRXJyb3IAAAABAAAAQVdoZW4gbWlncmF0aW9uIGlzIGF0dGVtcHRlZCBidXQgbm90IGFsbG93ZWQgZHVlIHRvIHVwZ3JhZGUgc3RhdGUuAAAAAAAAE01pZ3JhdGlvbk5vdEFsbG93ZWQAAAAETA==",
        "AAAABQAAACpFdmVudCBlbWl0dGVkIHdoZW4gdGhlIG1lcmtsZSByb290IGlzIHNldC4AAAAAAAAAAAAHU2V0Um9vdAAAAAABAAAACHNldF9yb290AAAAAQAAAAAAAAAEcm9vdAAAAA4AAAAAAAAAAg==",
        "AAAABQAAACdFdmVudCBlbWl0dGVkIHdoZW4gYW4gaW5kZXggaXMgY2xhaW1lZC4AAAAAAAAAAApTZXRDbGFpbWVkAAAAAAABAAAAC3NldF9jbGFpbWVkAAAAAAEAAAAAAAAABWluZGV4AAAAAAAAAAAAAAAAAAAC",
        "AAAABAAAAAAAAAAAAAAAFk1lcmtsZURpc3RyaWJ1dG9yRXJyb3IAAAAAAAMAAAAbVGhlIG1lcmtsZSByb290IGlzIG5vdCBzZXQuAAAAAApSb290Tm90U2V0AAAAAAUUAAAAJ1RoZSBwcm92aWRlZCBpbmRleCB3YXMgYWxyZWFkeSBjbGFpbWVkLgAAAAATSW5kZXhBbHJlYWR5Q2xhaW1lZAAAAAUVAAAAFVRoZSBwcm9vZiBpcyBpbnZhbGlkLgAAAAAAAAxJbnZhbGlkUHJvb2YAAAUW",
        "AAAAAgAAAD1TdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCBgTWVya2xlRGlzdHJpYnV0b3JgAAAAAAAAAAAAABtNZXJrbGVEaXN0cmlidXRvclN0b3JhZ2VLZXkAAAAAAgAAAAAAAAAoVGhlIE1lcmtsZSByb290IG9mIHRoZSBkaXN0cmlidXRpb24gdHJlZQAAAARSb290AAAAAQAAACNNYXBzIGFuIGluZGV4IHRvIGl0cyBjbGFpbWVkIHN0YXR1cwAAAAAHQ2xhaW1lZAAAAAABAAAABA==",
        "AAAAAgAAAAAAAAAAAAAACFJvdW5kaW5nAAAAAgAAAAAAAAAAAAAABUZsb29yAAAAAAAAAAAAAAAAAAAEQ2VpbA==",
        "AAAABAAAAAAAAAAAAAAAFlNvcm9iYW5GaXhlZFBvaW50RXJyb3IAAAAAAAMAAAAyVGhlIG9wZXJhdGlvbiBmYWlsZWQgYmVjYXVzZSB0aGUgZGVub21pbmF0b3IgaXMgMC4AAAAAAA9aZXJvRGVub21pbmF0b3IAAAAF3AAAADlUaGUgb3BlcmF0aW9uIGZhaWxlZCBiZWNhdXNlIGEgcGhhbnRvbSBvdmVyZmxvdyBvY2N1cnJlZC4AAAAAAAAPUGhhbnRvbU92ZXJmbG93AAAABd0AAAA9VGhlIG9wZXJhdGlvbiBmYWlsZWQgYmVjYXVzZSB0aGUgcmVzdWx0IGRvZXMgbm90IGZpdCBpbiBTZWxmLgAAAAAAAA5SZXN1bHRPdmVyZmxvdwAAAAAF3g==",
        "AAAABAAAAAAAAAAAAAAAC0NyeXB0b0Vycm9yAAAAAAMAAAApVGhlIG1lcmtsZSBwcm9vZiBsZW5ndGggaXMgb3V0IG9mIGJvdW5kcy4AAAAAAAAWTWVya2xlUHJvb2ZPdXRPZkJvdW5kcwAAAAAFeAAAACdUaGUgaW5kZXggb2YgdGhlIGxlYWYgaXMgb3V0IG9mIGJvdW5kcy4AAAAAFk1lcmtsZUluZGV4T3V0T2ZCb3VuZHMAAAAABXkAAAAYTm8gZGF0YSBpbiBoYXNoZXIgc3RhdGUuAAAAEEhhc2hlckVtcHR5U3RhdGUAAAV6",
        "AAAABQAAACpFdmVudCBlbWl0dGVkIHdoZW4gdGhlIGNvbnRyYWN0IGlzIHBhdXNlZC4AAAAAAAAAAAAGUGF1c2VkAAAAAAABAAAABnBhdXNlZAAAAAAAAAAAAAI=",
        "AAAABQAAACxFdmVudCBlbWl0dGVkIHdoZW4gdGhlIGNvbnRyYWN0IGlzIHVucGF1c2VkLgAAAAAAAAAIVW5wYXVzZWQAAAABAAAACHVucGF1c2VkAAAAAAAAAAI=",
        "AAAABAAAAAAAAAAAAAAADVBhdXNhYmxlRXJyb3IAAAAAAAACAAAANFRoZSBvcGVyYXRpb24gZmFpbGVkIGJlY2F1c2UgdGhlIGNvbnRyYWN0IGlzIHBhdXNlZC4AAAANRW5mb3JjZWRQYXVzZQAAAAAAA+gAAAA4VGhlIG9wZXJhdGlvbiBmYWlsZWQgYmVjYXVzZSB0aGUgY29udHJhY3QgaXMgbm90IHBhdXNlZC4AAAANRXhwZWN0ZWRQYXVzZQAAAAAAA+k=",
        "AAAAAgAAACJTdG9yYWdlIGtleSBmb3IgdGhlIHBhdXNhYmxlIHN0YXRlAAAAAAAAAAAAElBhdXNhYmxlU3RvcmFnZUtleQAAAAAAAQAAAAAAAAAySW5kaWNhdGVzIHdoZXRoZXIgdGhlIGNvbnRyYWN0IGlzIGluIHBhdXNlZCBzdGF0ZS4AAAAAAAZQYXVzZWQAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    pause: this.txFromJSON<Result<void>>,
        unpause: this.txFromJSON<Result<void>>,
        upgrade: this.txFromJSON<null>,
        get_order: this.txFromJSON<Result<Order>>,
        get_config: this.txFromJSON<Result<Config>>,
        get_oracle: this.txFromJSON<Result<string>>,
        initialize: this.txFromJSON<Result<void>>,
        set_oracle: this.txFromJSON<Result<void>>,
        take_order: this.txFromJSON<Result<void>>,
        cancel_order: this.txFromJSON<Result<void>>,
        create_order: this.txFromJSON<Result<u64>>,
        get_fee_tiers: this.txFromJSON<Array<FeeTier>>,
        quote_fee_bps: this.txFromJSON<Result<u32>>,
        set_fee_tiers: this.txFromJSON<Result<void>>,
        reference_rate: this.txFromJSON<Result<i128>>,
        get_order_count: this.txFromJSON<Result<u64>>,
        resolve_dispute: this.txFromJSON<Result<void>>,
        create_order_cli: this.txFromJSON<Result<u64>>,
        submit_fiat_payment: this.txFromJSON<Result<void>>,
        confirm_fiat_payment: this.txFromJSON<Result<void>>,
        dispute_fiat_payment: this.txFromJSON<Result<void>>,
        take_order_with_amount: this.txFromJSON<Result<void>>,
        execute_fiat_transfer_timeout: this.txFromJSON<Result<void>>
  }
}