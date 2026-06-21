# PeerlyPay P2P Soroban Contract — Security Audit Report

**Contract:** `contracts/contracts/p2p` (PeerlyPay peer-to-peer crypto↔fiat escrow)
**Date:** 2026-06-21
**Auditor:** Lead Auditor (AI-assisted review)
**Commit context:** branch `main` @ `aea5037` (audited around `cb6ac9f`; the pause issue was remediated mid-audit — see Remediation status)

> ⚠️ **Disclaimer — AI-assisted audit.** This report was produced by an AI-assisted review process guided by the OpenZeppelin "develop-secure-contracts" skill, a Soroban security checklist, and adversarial claim-by-claim verification against the source. Every finding below was confirmed (or down/upgraded) against the actual code with `file:line` evidence. **This is not a substitute for a professional, independent, manual smart-contract audit** and should not be treated as a security guarantee or as authorization to deploy to mainnet without one.

> ✅ **Remediation status (commit `aea5037`).** The pause-freeze issue — flagged **High in the first audit pass** and as **L-6/L-8** here — is **FIXED**. `ensure_not_paused` now guards **only** the two exposure-increasing entrypoints (`create_order`/`create_order_cli` and `take_order`/`take_order_with_amount`). **All six exit/recovery paths** — `cancel_order`, `submit_fiat_payment`, `execute_fiat_transfer_timeout`, `confirm_fiat_payment`, `dispute_fiat_payment`, `resolve_dispute` — are now pause-exempt, so in-flight escrow can always be refunded/released/resolved and the `dispute_resolver` backstop is never frozen. Regression test `test_pause_allows_fund_exits_blocks_new_exposure` added (21/21 pass). This **supersedes the now-stale "still guarded" wording in L-8 and L-6** (those agents read mid-edit). **Redeploy required to apply on-chain** (live testnet `CC2CA5…` still runs pre-fix code). The single remaining **High (H-1)** and the access-control **Mediums** are still open.

---

## 1. Scope & Summary

### What was audited
- **Primary:** the `p2p` Soroban contract — full escrow lifecycle (`core/order.rs`, `core/dispute.rs`), admin/role/pause subsystem (`core/admin.rs`, `core/validators/admin.rs`), Reflector oracle integration (`core/oracle.rs`), storage layout (`storage/types.rs`), entrypoints (`contract.rs`), and events (`events/handler.rs`).
- **Noted escrow surface:** the contract is itself the escrow custodian — it holds pooled crypto for all in-flight orders in a single contract balance via `e.current_contract_address()`. There is no separate escrow contract; the term "escrow" throughout refers to funds custodied by this `p2p` contract.

### Methodology
1. **OpenZeppelin library-first review.** Every hand-rolled security primitive (pause, role/owner checks, reentrancy, TTL/storage management, upgradeability) was compared against the corresponding audited OpenZeppelin Stellar component (`access`, `contract-utils`) to identify "reinvented wheel" risk. `contracts/contracts/p2p/Cargo.toml` depends only on `soroban-sdk` + `soroban-token-sdk` — **no OZ components are currently integrated**, so all primitives are bespoke.
2. **Soroban security checklist.** Auth placement (`require_auth`), checked arithmetic, storage durability/TTL, cross-contract trust, state-machine completeness (every escrow-holding state must have a time-bounded escape), and oracle freshness/precision.
3. **Adversarial verification.** Each candidate finding was challenged to refute or re-rate it against the code. Several findings originally drafted as High were **down-rated to Low** after confirming Soroban's host-level reentrancy prohibition and the SAC's callback-free `transfer`; the severities below reflect the post-verification ratings.

### Overall risk posture
The contract is **functionally sound on the dimensions it actively defends**: `require_auth` is present and correctly targeted on every state-changing entrypoint, arithmetic is checked, `overflow-checks` is on, and the participant-level state machine is mostly coherent. **No directly exploitable, permissionless theft or auth-bypass was found.** The material risk is concentrated in **(a) liveness / stuck-funds gaps** — most importantly the `AwaitingConfirmation` state has *no* time-bounded escape, so an inactive counterparty can lock escrowed crypto indefinitely (the single High finding) — and **(b) operational rigidity / missing recovery levers**: all three privileged roles are permanently immutable, there is no TTL management on instance storage, and the entire access-control + pause layer is hand-rolled where audited OpenZeppelin components exist. The economic layer (oracle) is advisory-only and under-integrated. Net posture: **Medium overall** — safe to test, **not** mainnet-ready until the High liveness gap, the role-immutability/recovery gaps, and storage-TTL management are addressed.

---

## 2. Findings by Severity

| # | Severity | Title | Location |
|---|----------|-------|----------|
| H-1 | **High** | `AwaitingConfirmation` has no timeout — escrowed funds permanently lockable by an inactive confirmer | `core/order.rs:191-240`, `:128-150`; guard gap at `:162` |
| M-1 | **Medium** | No role rotation / ownership transfer — admin, dispute_resolver, pauser permanently immutable after `initialize()` | `core/admin.rs` (whole `AdminManager`); `contract.rs:19-280` |
| M-2 | **Medium** | `exchange_rate` stored but never enforced against oracle `reference_rate` | `core/order.rs:30,44`; `core/validators/order.rs:6-25` |
| M-3 | **Medium** | Dispute lever is one-sided — only the fiat sender can dispute; the at-risk confirmer has no escalation | `core/dispute.rs:24-39`; `validators/dispute.rs:4-10` |
| M-4 | **Medium** | Reopened order keeps original deadline — remaining escrow can become un-takeable | `core/order.rs:232-236`, `:176`; `dispute.rs:67-78`; gate `order.rs:110` |
| M-5 | **Medium** | No TTL extension anywhere — instance storage (Config/Orders/Oracle) can be archived, freezing the contract | `core/order.rs:254-258`, `admin.rs`, `dispute.rs` (all `instance()`, zero `extend_ttl`) |
| M-6 | **Medium** | All orders in a single `instance()` footprint — unbounded growth + cheap order spam can evict the whole contract | `core/order.rs:254-258`, `:242-247` |
| M-7 | **Medium** | Hand-rolled immutable admin/owner for `set_oracle` — no transfer/renounce path (use OZ `Ownable`) | `core/admin.rs:78-89`; `storage/types.rs:63`; `admin.rs:10-39` |
| L-1 | **Low** | CEI violation in `confirm_fiat_payment` — token released before state persisted | `core/order.rs:212-237` |
| L-2 | **Low** | CEI violation in `resolve_dispute` — transfer before persist | `core/dispute.rs:56-96` |
| L-3 | **Low** | CEI violation in `cancel_order` — refund before persisting Cancelled | `core/order.rs:68-90` |
| L-4 | **Low** | CEI violation in `execute_fiat_transfer_timeout` — refund before reset/persist | `core/order.rs:152-189` |
| L-5 | **Low** | No reentrancy guard anywhere; all transfers use an unconstrained, admin-supplied token | `core/order.rs`, `dispute.rs`; `Config.token` @ `admin.rs:initialize` |
| L-6 | **Low** | Hand-rolled pause flag + `ensure_not_paused` instead of OZ `Pausable` | `storage/types.rs:69`; `admin.rs:41-69`; `validators/admin.rs:33-39` |
| L-7 | **Low** | Hand-rolled `pauser`/`dispute_resolver` equality checks instead of OZ `AccessControl` | `validators/admin.rs:17-31`; `storage/types.rs:64-65` |
| L-8 | ✅ **FIXED** | Pausing stranded in-flight funds — post-take exits now pause-exempt (commit `aea5037`) | `order.rs`; `dispute.rs` |
| L-9 | **Low** | `reference_rate` inversion truncates to integer — precision loss + zero-floor for EUR/GBP | `core/oracle.rs:74-81` |
| L-10 | **Low** | Oracle reads have no staleness check on `PriceData.timestamp` | `core/oracle.rs:61-81` |
| L-11 | **Low** | Single admin-set oracle is a fully-trusted price source with no sanity bounds | `core/admin.rs:78-96`; `oracle.rs:61-68` |
| L-12 | **Low** | Unchecked `u64` timestamp additions for deadlines can panic (config-induced DoS) | `core/order.rs:34`, `:122` |
| L-13 | **Low** | `OrderStatus::Refunded` declared but never assigned — refund terminal state unreachable | `storage/types.rs:56`; refund flows in `order.rs`, `dispute.rs` |
| I-1 | **Info** | `initialize()` binds dispute_resolver/pauser/token without their consent; no address validation | `contract.rs:19-48`; `admin.rs:10-39` |
| I-2 | **Info** | `OrderStatus::Created` set then overwritten before first persist — never exists on-chain | `core/order.rs:48`, `:59-60` |
| I-3 | **Info** | Fiat leg is entirely off-chain and unenforced; release depends on self-asserted confirmation | `order.rs:128-150`, `:191-240`; `dispute.rs:41-99` |
| I-4 | **Info** | No protocol-fee mechanism — economic sustainability and spam friction unfunded | `core/order.rs` transfer sites; `storage/types.rs:60-70` |
| I-5 | **Info** | No upgradeability despite a no-op constructor and immutable config (use OZ `Upgradeable`) | `contract.rs:17`, `:12-280` |
| I-6 | **Info** | (Verification note) `require_auth` placement and target-address selection are correct across the lifecycle | auth sites in `order.rs`, `dispute.rs`, `admin.rs` |

---

### H-1 — `AwaitingConfirmation` has no timeout: escrowed funds permanently lockable by an inactive confirmer
**Location:** `core/order.rs:191-240` (`confirm_fiat_payment`), `:128-150` (`submit_fiat_payment` → `AwaitingConfirmation` at `:146`); `execute_fiat_transfer_timeout` is gated to `AwaitingPayment` at `:162`.

**Description.** Once `submit_fiat_payment` advances an order to `AwaitingConfirmation`, the contract still escrows the full `active_fill_amount`. The only exits from `AwaitingConfirmation` are `confirm_fiat_payment` (`:201`, requires the *counterparty's* auth) and `dispute_fiat_payment` (`dispute.rs`, also requires the counterparty's auth). The sole timeout function, `execute_fiat_transfer_timeout`, hard-requires `ensure_status(AwaitingPayment)` (`:162`) and therefore **cannot act** on an `AwaitingConfirmation` order. `resolve_dispute` requires status already `Disputed` (`dispute.rs:53`), reachable only via the counterparty-authed `dispute_fiat_payment`. There is **no admin/resolver override and no time-based escape** from this escrow-holding state.

**Impact.** Total, irreversible loss of escrowed crypto for any order whose counterparty goes inactive (offline, lost key, or pure griefing) in `AwaitingConfirmation`. Affects both `from_crypto` (creator's deposit) and `from_fiat` (filler's deposit). This is a single-point fund-lock that any uncooperative counterparty can trigger; in many cases the other party has already irreversibly sent off-chain fiat.

**Recommendation.** Set a confirmation deadline on entry to `AwaitingConfirmation` (e.g. `fiat_transfer_deadline = now + confirmation_timeout_secs` in `submit_fiat_payment`) and add a **permissionless, time-bounded escape**: once the deadline passes, allow `execute_fiat_transfer_timeout` (or a new function) to either auto-finalize in favor of the fiat sender or escalate the order to `Disputed` for the resolver. **Invariant to enforce: no escrow-holding state may exist without a time-bounded exit.** Prefer a maintained state-machine pattern over hand-rolled status gating.

---

### M-1 — No role rotation or ownership-transfer entrypoints
**Location:** `core/admin.rs` (whole `AdminManager`); `contract.rs:19-280` — no `set_admin`/`transfer_admin`/`set_dispute_resolver`/`set_pauser`.

**Description.** `Config.admin`, `Config.dispute_resolver`, and `Config.pauser` are written exactly once in `AdminManager::initialize` (`admin.rs:25-35`) and never reassigned. A repo-wide grep for `set_admin`/`transfer_admin`/`set_dispute_resolver`/`set_pauser`/`transfer_ownership`/`grant_role`/`revoke_role` returns no matches. The only post-init `Config` writes are `pause`/`unpause` (flip the `paused` bool). `set_oracle` exists but rotates only the oracle address. There is also **no upgrade/migrate entrypoint** (`update_current_contract_wasm` is never called), so no alternate recovery path exists.

**Impact.** A lost or compromised **`dispute_resolver`** key means no dispute can ever be resolved → funds for any `Disputed` order are permanently stuck (`resolve_dispute` is the only exit from `Disputed`). A lost **`pauser`** key means the contract can never be paused in an incident. A lost **`admin`** key means the oracle can never be rotated. There is no migration to a multisig or new operator.

**Recommendation.** Add authenticated role-management entrypoints. **Adopt OpenZeppelin Stellar `access`:** `Ownable` (two-step `transfer_ownership`/`accept_ownership` + `renounce_ownership`) for the admin/owner role, and `AccessControl` (`grant_role`/`revoke_role`) for `dispute_resolver` and `pauser`, with built-in events and a designated admin role. **OZ component:** `access` (`Ownable` + `AccessControl`).

---

### M-2 — `exchange_rate` is stored but never enforced against the oracle
**Location:** `core/order.rs:30,44`; `core/validators/order.rs:6-25`.

**Description.** The maker-supplied `exchange_rate` is validated only as `> 0` (`validators/order.rs:16`), stored verbatim on the order (`order.rs:44`), and **never** compared to `OracleManager::reference_rate`. `reference_rate` is invoked from exactly one place — the read-only view entrypoint `contract.rs:265-266` — and from no state-changing function. The Reflector oracle therefore has **zero effect on order economics**; it is advisory/UI-only.

**Impact.** No on-chain protection on the rate at which crypto is exchanged for fiat. A maker can post an arbitrarily off-market rate and the contract will lock crypto and release it on fiat "confirmation." Combined with the off-chain, unverifiable fiat leg (I-3), the rate is the *only* economic term the contract could enforce, and it does not. The presence of a Reflector oracle plus a stored `exchange_rate` strongly implies enforcement was intended but is missing.

**Recommendation.** If on-chain enforcement is a goal: in `validate_create_order`, fetch `reference_rate(currency_code)` and require `exchange_rate` within an admin-configured tolerance band (add `max_rate_deviation_bps` to `Config`). Handle currencies the oracle cannot price (`Usd`/`Cop`/`Other` have no mapping at `oracle.rs:43-49`). If enforcement is intentionally out of scope, **remove the oracle integration or explicitly document `exchange_rate` as informational** so integrators do not assume protection that does not exist.

---

### M-3 — Dispute lever is one-sided; the at-risk confirmer has no escalation
**Location:** `core/dispute.rs:24-39` (`dispute_fiat_payment`), gated by `ensure_disputable` (`validators/dispute.rs:4-10`, requires `AwaitingConfirmation`); actor check `dispute.rs:27-31`.

**Description.** `dispute_fiat_payment` requires `AwaitingConfirmation` and authorizes only the *fiat sender* (`from_crypto` → `ensure_filler`, else `ensure_creator`) — the same party who just called `submit_fiat_payment`. The counterparty who must confirm has **no dispute lever**; their only on-chain options are `confirm` (releases funds) or inaction (which, per H-1, locks funds forever). A dishonest fiat sender can call `submit_fiat_payment` without paying, parking the order in `AwaitingConfirmation`; the honest confirmer correctly refuses to confirm; with no timeout, the escrow is stranded.

**Impact.** Concentrates all liveness on a single counterparty plus the centralized `dispute_resolver`, increasing griefing surface and the chance of stuck funds. (Note: the confirmer is *not* exposed to direct theft — escrowed crypto never moves without their confirmation or a resolver ruling — so this is a liveness/recourse gap, heavily overlapping H-1, not an independent theft bug.)

**Recommendation.** Allow **either party** to open a dispute from `AwaitingConfirmation`, and pair it with the time-bounded escalation from H-1 so disputes cannot be opened and abandoned. Keep `resolve_dispute` as the only fund-moving exit and make it itself time-bounded or monitorable.

---

### M-4 — Reopened order keeps original deadline; remaining escrow can become un-takeable
**Location:** `core/order.rs:232-236` (partial-fill reopen), `:176` (timeout reset), `core/dispute.rs:67-78` (resolve reset); re-entry gate `ensure_not_expired` at `order.rs:110`.

**Description.** On partial-fill confirmation, fiat timeout, and dispute resolution, the order is set back to `AwaitingFiller` but `order.deadline` (set once at `create_order`, `order.rs:34`) is **never refreshed**. `take_order_with_amount` calls `ensure_not_expired` against that original deadline (`order.rs:110`). If the deadline has passed by reopen time, **no filler can ever take the remainder.**

**Impact.** For `from_crypto` orders the creator's remaining crypto stays escrowed in an immediately-dead state; recovery is only via `cancel_order`, which is creator-only and (correctly) not expiry-gated, so funds are recoverable but the order is otherwise stuck and the partial-fill flow is silently broken. Realistic because disputes consume wall-clock time, so `resolve_dispute` landing past the deadline is plausible. For `from_fiat` orders only liveness is affected (no remaining escrow).

**Recommendation.** On every reopen-to-`AwaitingFiller` transition either (a) extend `deadline = now + fresh_duration` (bounded by `config.max_duration_secs`), or (b) if `remaining_amount > 0` and the deadline already passed, auto-refund the creator (`from_crypto`) and move to a terminal status. Add a test that reopens past the original deadline.

---

### M-5 — No TTL extension anywhere; instance storage can be archived, freezing the contract
**Location:** `core/order.rs:254-258` (`store_order`), `admin.rs:35-36,51,66,86`, `dispute.rs:34-36,94-96` — all `e.storage().instance()`, zero `extend_ttl()` calls crate-wide.

**Description.** Config, OrderCount, every `Order(u64)`, and Oracle are all in `instance()` storage, and there is no `extend_ttl`/`bump` anywhere. Soroban instance storage has a finite TTL; reads do not auto-extend it. While instance `.set()` *does* bump TTL at write time (so any write-bearing entrypoint keeps the instance alive), a **prolonged low-activity period** with funds escrowed can let the instance TTL lapse.

**Impact.** If the instance TTL expires, every entrypoint that loads `get_config()`/`get_order()` fails, freezing the **entire** contract (all orders share one footprint). The escrowed tokens themselves live in the token contract's balance and are *not* deleted, and archived entries are restorable at the protocol level via `RestoreFootprint`, so this is a recoverable **DoS/freeze**, not permanent loss — but the contract ships **no on-chain restore helper**, making recovery operationally awkward.

**Recommendation.** Call `e.storage().instance().extend_ttl(threshold, extend_to)` on every state-changing entrypoint, with bounds derived from `max_duration_secs + filler_payment_timeout_secs` so an order's lifetime can never exceed its data's TTL. **Move per-`Order` records into `persistent()` storage with per-key `extend_ttl`** (see M-6). **OZ component:** `contract-utils` (storage/TTL management patterns).

---

### M-6 — All orders in a single `instance()` footprint; cheap spam can evict the whole contract
**Location:** `core/order.rs:254-258` (`store_order`), `:242-247` (`get_order`).

**Description.** Orders are never deleted (cancel/complete only flip status and re-store; `order.rs:77-88`, `:232-237`), `OrderCount` only increments (`:61-63`), and all `Order(u64)` entries accumulate in the **same** `instance()` entry as Config/OrderCount/Oracle under one shared TTL and size budget. `create_order` has no per-caller rate limit and (for `from_crypto=false`) locks no upfront tokens (`order.rs:54-57` transfers only inside `if from_crypto`), so creating orders is cheap.

**Impact.** Griefing/DoS: an attacker can spam `create_order` with `from_crypto=false` to inflate the shared footprint, driving up rent for everyone and approaching Soroban's per-entry size limit — which would brick **all** future writes (orders *and* admin ops like `pause`/`set_oracle`). Each call is paid, so the attack is bounded by cost/volume, hence Medium.

**Recommendation.** Move per-`Order` records into `persistent()` storage keyed individually (each with its own TTL), keeping only Config/OrderCount/Oracle in `instance()`. Prune/archive terminal-state orders, and add a small creation deposit or open-order cap to deter spam. **OZ component:** `contract-utils` (storage layout / TTL helpers).

---

### M-7 — Hand-rolled immutable admin/owner for `set_oracle`; no transfer or renounce path
**Location:** `core/admin.rs:78-89` (`set_oracle`: `if caller != config.admin`); `storage/types.rs:63`; `admin.rs:10-39`.

**Description.** The owner privilege is a `Config.admin` address set once in `initialize` and checked inline. There is no `transfer_ownership`, two-step accept, or `renounce_ownership`; the admin is immutable for the contract's life. (This is the owner-role facet of M-1, called out separately because the OZ remedy is specifically `Ownable`.)

**Impact.** Admin key compromise or loss is unrecoverable: the oracle (which drives `reference_rate`) can never be re-pointed and ownership cannot be rotated — a governance/operational risk for a value-bearing contract. The inline equality check also duplicates the `pauser`/`dispute_resolver` checks and can drift.

**Recommendation.** Adopt **OpenZeppelin Stellar `access::ownable`**: set the owner in the constructor/initialize via the library, gate `set_oracle` (and optionally pause/unpause) with `#[only_owner]`, and expose `transfer_ownership`/`accept_ownership`/`renounce_ownership` for safe two-step key rotation. **OZ component:** `access` (`Ownable`).

---

### L-1 to L-4 — Checks-Effects-Interactions (CEI) violations in all four outbound-transfer paths
**Locations:** `confirm_fiat_payment` (`order.rs:212-237`), `resolve_dispute` (`dispute.rs:56-96`), `cancel_order` (`order.rs:68-90`), `execute_fiat_transfer_timeout` (`order.rs:152-189`).

**Description.** In each of these four functions the `token_client.transfer` (contract → recipient) executes **before** the mutated order is persisted via `store_order`/`instance().set`. During the external transfer the order in host storage still reflects the *pre-transfer* state (e.g. `AwaitingConfirmation` with `active_fill_amount = Some(x)`, full `remaining_amount`). This is a textbook external-call-before-state-write (CEI) violation.

**Impact (verified, downgraded from High → Low).** The EVM-style reentrancy double-spend this pattern usually implies is **not reachable here**, for two independent reasons confirmed against the code: **(1)** Soroban prohibits reentrancy at the host level — a token `transfer` callback that re-invokes a contract already on the active call stack *traps*, so there is no per-frame-stale-storage exploitation; and **(2)** even ignoring that, every re-entrant target opens with `require_auth()` + an identity check that the token contract cannot satisfy for the human counterparty, and the would-be replay targets reject the stale status anyway (`confirm` requires `AwaitingConfirmation`, `cancel` requires `AwaitingFiller`, etc.). The residual risk is a **defense-in-depth / code-hygiene** gap: the code is "one token-contract change away" from a bug if `Config.token` is ever a malicious/upgradeable callback-capable token.

**Recommendation.** Reorder all four to strict CEI: compute the recipient, apply **all** state mutations (`checked_sub`/`checked_add`, clear `active_fill_amount`/`filler`/`fiat_transfer_deadline`, set status), call `store_order`, and perform `token_client.transfer` as the **final** statement. See L-5 for the cross-cutting guard + token-allowlist remedy.

---

### L-5 — No reentrancy guard; all transfers use an unconstrained, admin-supplied token
**Location:** all `token_client.transfer` sites in `core/order.rs`, `dispute.rs`; `Config.token` set in `core/admin.rs:initialize`.

**Description.** The contract hand-rolls escrow over a token whose `Address` is taken verbatim at `initialize()` with no check that it is the native SAC or a vetted asset, and there is **zero** reentrancy protection in the codebase (no `non_reentrant`/`ReentrancyGuard`). All in-flight orders share one pooled balance, and there is no balance accounting (the contract trusts that `remaining_amount`/`active_fill_amount` equal real escrowed funds).

**Impact (downgraded Medium → Low).** Soroban's host-level reentrancy prohibition plus the standard SAC's callback-free `transfer` mean the CEI orderings (L-1…L-4) are **not** a live drain for normal deployments. The genuine residual is the **admin-trust assumption** of an unvalidated, immutable token plus weak ordering — exploitable only if a malicious admin configures a hostile, callback-capable token from the start (which is strictly weaker than the powers such an admin already has).

**Recommendation.** (1) Fix CEI ordering in all four functions (L-1…L-4) so storage is written before any transfer. (2) **Constrain/validate `Config.token` at `initialize`** (allowlist or require the native SAC) so a callback-capable token cannot be configured. (3) Adopt **OpenZeppelin Stellar `contract-utils` ReentrancyGuard** (`non_reentrant`) on every state-changing entrypoint that performs a transfer, as defense-in-depth. (4) Consider explicit per-order balance accounting so an over-release cannot reach other orders' funds. **OZ component:** `contract-utils` (ReentrancyGuard).

---

### L-6 — Hand-rolled pause flag + `ensure_not_paused` instead of OZ `Pausable`
**Location:** `storage/types.rs:69` (`Config.paused`); `core/admin.rs:41-69` (`pause`/`unpause`); `core/validators/admin.rs:33-39` (`ensure_not_paused`).

**Description.** Pause is a manual `bool` on `Config`, toggled by hand-written `pause`/`unpause` (each re-implementing `require_auth` + `ensure_pauser` + already-paused/unpaused checks), with the guard `ensure_not_paused(&config)?` **manually placed** per entrypoint. Verification note: the guard is applied *selectively and deliberately* — after the commit-`aea5037` fix, **only** `create_order`/`create_order_cli` and `take_order`/`take_order_with_amount` are guarded; **all six exit/recovery paths** (`cancel_order`, `submit_fiat_payment`, `execute_fiat_transfer_timeout`, `confirm_fiat_payment`, `dispute_fiat_payment`, `resolve_dispute`) are **intentionally pause-exempt** (each carries an explicit `// Exempt from pause (audit P2P-01)` comment) so refund/release/resolve paths work while paused. The mechanism is correct; this finding is a **library-adoption / maintainability** recommendation only.

**Impact.** Maintainability/footgun, not a present exploit: nothing at compile time forces a new entrypoint to add the guard, and the `paused` bit is coupled into the whole `Config` blob (every toggle rewrites all of Config). The custom `AlreadyPaused`/`AlreadyUnpaused` handling is extra surface.

**Recommendation.** Adopt **OpenZeppelin Stellar `contract-utils` Pausable** (`pause`/`unpause`/`paused` storage helpers + the `#[when_not_paused]`/`#[when_paused]` macro guards + built-in events), drop `Config.paused`, and apply the macro **selectively** to preserve the deliberate pause-exempt asymmetry. **OZ component:** `contract-utils` (Pausable).

---

### L-7 — Hand-rolled `pauser`/`dispute_resolver` equality checks instead of OZ `AccessControl`
**Location:** `core/validators/admin.rs:17-31` (`ensure_pauser`, `ensure_dispute_resolver`); `storage/types.rs:64-65`.

**Description.** Both roles are single hard-coded `Address` fields enforced by bespoke `*caller != config.<role>` comparisons returning `Unauthorized`. There is no role registry, no grant/revoke, no role-change events, and three structurally identical but independently written checks (`ensure_pauser`, `ensure_dispute_resolver`, and the inline `set_oracle` admin check). `validate_initialize_inputs` (`validators/admin.rs:6-15`) does not even verify the role addresses are distinct or non-zero.

**Impact.** Functionally correct (`require_auth` is present on the correct caller), so **not exploitable**. The downsides are operational: no multisig/multi-holder support, no on-chain role-change auditability, copy-paste wrong-field risk, and — most importantly — **no path to rotate a compromised `dispute_resolver`/`pauser` key** (ties into M-1).

**Recommendation.** Model both roles with **OpenZeppelin Stellar `access::access_control`** (role constants, `grant_role`/`revoke_role`, hierarchical role admin, `ensure_role` enforcement). Optionally fold `pauser` into `Ownable` if pause should be owner-scoped. **OZ component:** `access` (`AccessControl`).

---

### L-8 — Pausing while orders are in-flight strands funds — ✅ FIXED (commit `aea5037`)
**Location:** `order.rs` (`execute_fiat_transfer_timeout`, `confirm`, `submit`); `dispute.rs` (dispute & resolve).

**✅ Status: FIXED.** This finding (and the first audit pass's High "P2P-01") is resolved. Pause was scoped to **risk-increasing entrypoints only** (`create_order`/`create_order_cli`, `take_order`/`take_order_with_amount`); all post-take exits (`execute_fiat_transfer_timeout`, `confirm_fiat_payment`, `dispute_fiat_payment`, `resolve_dispute`) and the pre-take `cancel_order` now run while paused, so escrowed funds can always be recovered and the `dispute_resolver` backstop is never frozen. Regression test `test_pause_allows_fund_exits_blocks_new_exposure` added (21/21 pass). **Redeploy required to apply on-chain.**

**Original description (pre-fix, retained for history).** The post-take exits — `execute_fiat_transfer_timeout`, `confirm_fiat_payment`, `dispute_fiat_payment`, and `resolve_dispute` — all called `ensure_not_paused` and reverted while paused, so a pause (malicious, compromised, or an unavailable single-key pauser) froze all post-take escrowed funds and blocked dispute settlement. Forward-looking hardening still applies: use a rotatable/multisig pauser via OZ `AccessControl` and OZ `Pausable`'s selective `when_not_paused`. **OZ component:** `contract-utils` (Pausable) + `access` (AccessControl).

---

### L-9 — `reference_rate` inversion truncates to integer
**Location:** `core/oracle.rs:74-81`.

**Description.** `reference_rate` computes `scale = 10^decimals` then returns `scale.checked_div(price_data.price)` as a bare `i128` with **no output scaling reapplied**. Integer division truncates toward zero: for any fiat worth ≥ 1 USD (`price ≥ scale`) the quotient is **0**. EUR (code 1) and GBP (code 5) — both in `currency_symbol` (`oracle.rs:44-49`) — return `0`. The project's own test feeds ARS and asserts `1461` where the true rate is `1461.92…`, proving silent fractional loss (`test.rs:668-669`).

**Impact.** The on-chain reference rate is **unusable (zero) for two of the three supported currencies** and lossy for the rest. Latent today because `reference_rate` is a read-only view not wired into `create_order` (M-2); becomes a correctness bug the moment enforcement is added.

**Recommendation.** Return a fixed-point value preserving precision, e.g. `(scale * 10^RATE_DECIMALS).checked_div(price)` with a documented `RATE_DECIMALS`, or return the raw price + decimals and let callers do fixed-point math. Add EUR/GBP regression tests asserting non-zero, correctly-scaled results.

---

### L-10 — Oracle reads have no staleness/freshness check
**Location:** `core/oracle.rs:61-81`.

**Description.** `ReflectorPriceData` carries a `timestamp` field (`oracle.rs:25`) but `reference_rate` ignores it, checking only `price > 0` (`:70`). It never compares `price_data.timestamp` to `e.ledger().timestamp()`. A frozen/delisted/paused feed returns the last price indefinitely with no signal; the bundled `MockOracle` even returns `timestamp: 0` and the test accepts it (`test.rs:631,668-669`).

**Impact.** Stale data is silently surfaced to UIs/integrators today; if rate enforcement (M-2) is later built on this, a known-stale feed becomes a mispricing/DoS lever. Latent, hence Low.

**Recommendation.** Reject prices older than a configurable `max_oracle_age_secs` (admin-set `Config` value): `if now.saturating_sub(price_data.timestamp) > max_oracle_age_secs { return Err(OracleStale) }`. Update `MockOracle`/tests to supply realistic timestamps.

---

### L-11 — Single admin-set oracle is a fully-trusted price source
**Location:** `core/admin.rs:78-96` (`set_oracle`/`get_oracle`); `oracle.rs:61-68`.

**Description.** The oracle is a single `Address` set by admin (gated by the hand-rolled `caller != config.admin` check) and read via an (appropriately auth-less) cross-contract `lastprice` call. There is no requirement that it be the canonical Reflector feed, no deviation/sanity bounds, and no fallback beyond `OracleUnavailable`. A mis-set or malicious address (or compromised admin) returns any price.

**Impact.** Blast radius is currently limited to the `reference_rate` view; integrators inherit full trust in the admin-set address. If enforcement (M-2) is added, this becomes a direct price-manipulation lever.

**Recommendation.** Document the trust model (admin is fully trusted for the price source). Move `set_oracle` behind OZ `Ownable`/`AccessControl` (L-7/M-7). When enforcement is added, apply deviation bounds vs. a cached prior value and consider a timelock on oracle changes so users can react to a re-pointed feed.

---

### L-12 — Unchecked `u64` timestamp additions for deadlines can panic
**Location:** `core/order.rs:34` (`create_order`), `:122` (`take_order_with_amount`).

**Description.** Deadlines use raw `u64 + u64`: `let deadline = now + duration_secs;` and `Some(e.ledger().timestamp() + config.filler_payment_timeout_secs)`. With `overflow-checks = true` workspace-wide (`contracts/Cargo.toml:13`) these **panic** rather than wrap (good — no wrap-to-past-deadline). But `validate_initialize_inputs` imposes no **upper** bound on the timeouts, so an admin who sets `filler_payment_timeout_secs`/`max_duration_secs` near `u64::MAX` makes `create_order`/`take_order` panic for all users.

**Impact.** Config-induced DoS gated behind the trusted admin role (a non-privileged attacker can only panic their own tx). Also depends on `overflow-checks` staying enabled — if a future build flips it off, these become silent wrap-to-past-deadline bugs.

**Recommendation.** Use `checked_add` and map `None` to a domain error (`ContractError::Overflow`/`InvalidTimeout`, both already declared) instead of panicking. Add sane upper bounds in `validate_initialize_inputs`. Keep `overflow-checks = true` and add a CI assertion so it cannot be disabled.

---

### L-13 — `OrderStatus::Refunded` declared but never assigned
**Location:** `storage/types.rs:56` (variant); refund flows at `order.rs:79-86` (cancel → `Cancelled`), `:166-188` (timeout → `AwaitingFiller`), `dispute.rs:77-84` (resolve-not-confirmed → `AwaitingFiller`).

**Description.** The `Refunded` variant is never written anywhere (only declared at `types.rs:56` and mentioned in `README.md`). Refunds reuse `Cancelled` or `AwaitingFiller`, so an observer cannot distinguish a refund from a fresh cancel/reopen by status alone. The dead variant signals an unimplemented/forgotten branch.

**Impact.** No fund loss; a state-machine clarity defect. Event-level observability partially mitigates indexers (`FiatTransferTimeout`/`DisputeResolved` carry refund fields), but the `status` field is ambiguous and the cancel path has no dedicated refund signal. The dead variant invites future bugs (e.g. a `match` arm on `Refunded` that never fires).

**Recommendation.** Either remove `Refunded`, or wire it into the actual refund paths and emit a corresponding event; add tests asserting the status after each refund path.

---

### I-1 — `initialize()` binds dispute_resolver/pauser/token without their consent or validation
**Location:** `contract.rs:19-48`; `core/admin.rs:10-39`.

`initialize()` calls only `admin.require_auth()` (`contract.rs:28`). The `dispute_resolver`, `pauser`, and `token` addresses are caller-supplied and stored verbatim with no `require_auth` from those parties and no address-shape validation (`ContractError::InvalidAddress` exists at `error.rs:25` but is never used). `__constructor()` is empty, so privileged-address binding happens in a separately callable function rather than at deploy time. **Impact:** Low/configuration-trust — the deployer already controls the contract; the real risk is a typo (e.g. an unowned `dispute_resolver`) that, combined with M-1's no-rotation, permanently strands disputed funds. **Recommendation:** move binding into `__constructor` (atomic with deploy) and/or add validation; adopting OZ `Ownable`/`AccessControl` with explicit grant calls makes each assignment authenticated, auditable, and reversible.

### I-2 — `OrderStatus::Created` is set then overwritten before first persist
**Location:** `core/order.rs:48` then `:59-60`.

`create_order` builds the order with `status: Created` (`:48`), does the optional deposit, then unconditionally overwrites to `AwaitingFiller` (`:59`) before the only `store_order` (`:60`). `Created` is never persisted and never observed. **Impact:** none (dead enum state); misleads readers/integrators into expecting a `Created` phase. **Recommendation:** remove `Created` and initialize to `AwaitingFiller`, or — if a pre-deposit phase is intended — persist `Created` before the transfer and transition only after a successful deposit.

### I-3 — Fiat leg is entirely off-chain and unenforced
**Location:** `order.rs:128-150`, `:191-240`; `dispute.rs:41-99`.

`submit_fiat_payment` only flips status with no proof of fiat movement; `confirm_fiat_payment` releases escrow purely on the confirming party's assertion; `resolve_dispute` decides on a `dispute_resolver`-supplied boolean with no on-chain evidence. **Impact:** the protocol's core value transfer rests on counterparty/resolver trust — inherent to P2P fiat-crypto exchange. The contract correctly enforces what it *can* (crypto custody, auth, fiat-timeout refund, dispute arbiter), so this is a trust assumption to document, not a code defect. **Recommendation:** document the trust model explicitly; reduce it via the M-2 rate band, an optional slashable counterparty bond, and robust `AccessControl` over the `dispute_resolver` role (the sole arbiter of value movement).

### I-4 — No protocol-fee mechanism
**Location:** `core/order.rs` transfer sites; `storage/types.rs:60-70`.

Every transfer moves the full amount; `Config` has no fee fields and the protocol captures no value. **Impact:** not a vulnerability — no funding for oracle/dispute/maintenance upkeep and no economic friction against spam (ties into M-6). Retrofitting later touches every transfer site. **Recommendation:** if fees are in scope, add `fee_bps`/`fee_recipient` to `Config` with checked arithmetic (`amount * fee_bps / 10_000`, guarding rounding-to-zero dust) deducted at confirm/dispute-release sites; otherwise document the fee-free design.

### I-5 — No upgradeability despite a no-op constructor and immutable config
**Location:** `contract.rs:17` (`pub fn __constructor() {}`), `:12-280`.

No upgrade/migration entrypoint exists (`update_current_contract_wasm` never called) and config is immutable after `initialize`. **Impact:** operational/upgrade-safety gap — a post-deployment bug or required parameter change (e.g. the M-2 rate issue, timeout tuning) has no in-place fix path. Not exploitable; immutability may be intentional. **Recommendation:** integrate **OpenZeppelin Stellar `contract-utils::upgradeable`** (implement `UpgradeableInternal` gated on the OZ owner, library upgrade entrypoint + migration hook), or explicitly document that immutability is intentional. **OZ component:** `contract-utils` (Upgradeable).

### I-6 — Verification note: auth placement is sound
Every state-changing entrypoint calls `caller.require_auth()` and authorizes the **correct** party (creator/filler/dispute_resolver/pauser/admin as appropriate). `take_order` reads the order before delegating, but the read is non-mutating and `require_auth` runs in the mutator (`order.rs:106`) before any state change. **No missing or mis-targeted auth was found on the order flow.** No change required; this dimension is *not* the source of the findings above.

---

## 3. OpenZeppelin Library-First Recommendations

The contract currently depends only on `soroban-sdk` + `soroban-token-sdk` (`contracts/contracts/p2p/Cargo.toml`); every security primitive is hand-rolled. Concrete swaps:

| Hand-rolled today | Replace with (OpenZeppelin Stellar) | Benefit | Findings addressed |
|---|---|---|---|
| `Config.admin` + inline `caller != config.admin` (immutable) | **`access::ownable`** — `#[only_owner]`, two-step `transfer_ownership`/`accept_ownership`, `renounce_ownership` | Audited single-owner model with **safe key rotation** and a real governance/recovery story | M-1, M-7, I-1, L-11 |
| `Config.pauser`/`Config.dispute_resolver` + bespoke `ensure_pauser`/`ensure_dispute_resolver` equality checks | **`access::access_control`** — role constants, `grant_role`/`revoke_role`, hierarchical role admin, `ensure_role` | Rotatable/revocable roles, **on-chain role-change events**, multisig support, one audited guard instead of 3 copy-pasted checks | M-1, L-7, I-1 |
| `Config.paused: bool` + manual `pause`/`unpause` + per-entrypoint `ensure_not_paused` | **`contract-utils::pausable`** — `paused` storage, `pause`/`unpause` with events, `#[when_not_paused]`/`#[when_paused]` macros | Declarative, compile-visible guard (no silently-forgotten guard); audited pause code; preserves the deliberate pause-exempt asymmetry via selective macro application | L-6, L-8 |
| No reentrancy protection; CEI-after-transfer in 4 functions | **`contract-utils` ReentrancyGuard** (`non_reentrant`) + fix CEI ordering | Defense-in-depth so a future callback-capable token cannot turn an over-release into theft | L-1…L-5 |
| All state in `instance()`, no `extend_ttl`, unbounded growth | **`contract-utils`** storage/TTL patterns; move `Order` to `persistent()` with per-key TTL | Prevents whole-contract archival/freeze and single-footprint eviction | M-5, M-6 |
| Empty `__constructor`, no upgrade path | **`contract-utils::upgradeable`** (`UpgradeableInternal` + migration hook, gated on OZ owner) | Audited upgrade authorization + migration, or a documented intentional-immutability decision | I-5 |

Setup reference: the `setup-stellar-contracts` / `develop-secure-contracts` skills cover adding `stellar-access` and `stellar-contract-utils` to `Cargo.toml` and the Soroban import conventions.

---

## 4. What's Already Done Well

- **Auth is correct everywhere (I-6).** `require_auth()` is present on every state-changing entrypoint and targets the right party for each action (creator/filler/resolver/pauser/admin). No auth bypass exists. `take_order`'s read-before-delegate is safe (mutator re-authenticates before any state change).
- **Checked arithmetic.** Order accounting uses `checked_add`/`checked_sub`/`checked_div`/`checked_pow` (e.g. `order.rs:219-226`; `oracle.rs:75-79`), and `overflow-checks = true` is set workspace-wide (`contracts/Cargo.toml:13`), so the dangerous wrap-to-past-deadline class is prevented (L-12).
- **Input validators.** A dedicated `validators/` module centralizes status, identity, expiry, amount, and timeout checks (`ensure_status`, `ensure_creator`/`ensure_not_creator`, `ensure_not_expired`, `validate_fill_amount`, etc.).
- **Deliberate pause design.** Pause guards are applied **only** to risk-increasing entrypoints; refund/release paths (`cancel_order`, timeout, confirm, submit) are intentionally pause-exempt with explicit `audit P2P-01` comments so a pause cannot trap a user's own escrow recovery (the pre-take case).
- **Event emission.** Lifecycle events (`Initialized`, pause/unpause, `FiatTransferTimeout` with `refunded_to`/`refund_amount`, `DisputeResolved`) are published, giving indexers meaningful observability for most flows.
- **On-chain oracle integration.** A Reflector oracle client is wired in with sensible defensive guards (`Some`-or-`OracleUnavailable`, `price > 0`, overflow/div-by-zero protection) — a good foundation, currently advisory-only (see M-2/L-9/L-10 to make it enforceable and precise).
- **Reentrancy posture is salvageable.** The CEI violations are latent rather than live because Soroban blocks reentrancy at the host level and the intended SAC `transfer` invokes no recipient callback — a much safer baseline than the equivalent EVM code.

---

## 5. Prioritized Remediation Checklist

**P0 — Block mainnet until fixed**
1. **H-1:** Add a confirmation deadline on entry to `AwaitingConfirmation` and a permissionless, time-bounded escape (auto-finalize to fiat sender or escalate to `Disputed`). Enforce the invariant: *no escrow-holding state without a time-bounded exit.*
2. **M-1 / M-7:** Add role rotation/recovery — adopt OZ `Ownable` (admin, two-step transfer) + `AccessControl` (`dispute_resolver`, `pauser`, grant/revoke). Removes the permanent-fund-lock-on-key-loss risk.

**P1 — Fix before launch**
3. **M-5 / M-6:** Add `instance().extend_ttl()` on every state-changing entrypoint (bounds ≥ `max_duration_secs + filler_payment_timeout_secs`) and move per-`Order` records to `persistent()` storage with per-key TTL; add a creation deposit or open-order cap.
4. **M-3:** Allow either party to dispute from `AwaitingConfirmation` (pair with H-1's timeout).
5. **M-4:** Refresh `deadline` (or auto-refund + terminalize) on every reopen-to-`AwaitingFiller` transition; add a reopen-past-deadline test.
6. **M-2:** Either enforce `exchange_rate` within an oracle tolerance band (add `max_rate_deviation_bps`, handle unpriceable currencies) **or** remove the oracle and document `exchange_rate` as informational.

**P2 — Hardening / defense-in-depth**
7. **L-1…L-5:** Reorder all four functions to strict CEI (persist before transfer), constrain/allowlist `Config.token` at `initialize`, and add OZ `ReentrancyGuard`.
8. **L-12:** Use `checked_add` for deadline math (map to `Overflow`/`InvalidTimeout`), add upper bounds on timeouts in `validate_initialize_inputs`, and CI-assert `overflow-checks = true`.
9. ~~**L-8:**~~ ✅ **DONE** (commit `aea5037`) — pause scoped to create/take only; all exits run while paused; regression test added. *Redeploy to apply on-chain.*
10. **L-9 / L-10 / L-11:** Return the reference rate in documented fixed-point (fix EUR/GBP zero-floor), add an oracle staleness check (`max_oracle_age_secs` + `OracleStale`), and add oracle deviation bounds + (optionally) a timelock on `set_oracle`.

**P3 — Library-first refactors & clarity (no behavioral risk today)**
11. **L-6 / L-7:** Swap the hand-rolled pause + role checks for OZ `Pausable` + `AccessControl` (preserve the deliberate pause-exempt asymmetry).
12. **I-1 / I-2 / I-5:** Move privileged-address binding into `__constructor` (or validate it), remove the dead `Created` state, and either integrate OZ `Upgradeable` or document intentional immutability.
13. **L-13:** Remove or wire up `OrderStatus::Refunded` (+ event + test).
14. **I-3 / I-4:** Document the off-chain-fiat trust model; decide on a fee mechanism (or document fee-free) using checked arithmetic.

---

*End of report. AI-assisted, OpenZeppelin-skill-guided review — obtain an independent professional manual audit before mainnet deployment.*