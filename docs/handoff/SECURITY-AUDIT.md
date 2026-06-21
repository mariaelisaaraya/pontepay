# PeerlyPay — Security Audit (Soroban p2p contract)

> **AI-assisted audit**, guided by the OpenZeppelin `develop-secure-contracts` skill (library-first) + a Soroban security checklist, with **adversarial verification** of every finding against the source. This is **not** a substitute for a professional manual audit before mainnet. Generated 2026-06-21.

## 1. Scope & methodology

- **In scope:** `contracts/contracts/p2p/src/**` (the live escrow/marketplace contract, deployed testnet `CC2CA5…76TJ`). The orphaned `contracts/contracts/escrow/**` (Trustless-Work) was reviewed where it shares risk.
- **Method:** 7 parallel reviewers by dimension (access control, arithmetic/overflow, reentrancy/CEI, state-machine, economic/oracle, lifecycle/DoS, OZ library-first) → each finding **adversarially re-verified** against the code (file:line) → severities re-calibrated. 14 findings survived verification.
- **Overall posture:** The contract is **fundamentally sound on the basics** — `require_auth()` is present on every privileged path and targets the correct address, i128 token math uses `checked_*`, validators gate inputs, and events are emitted. **No theft / fund-misrouting / reentrancy bug was found.** The real risks are **availability / fund-freeze** (one **High**) and **operational / access-control rigidity** (two **Medium**), plus robustness and dead-code cleanups. Most are well-addressed by adopting OpenZeppelin Stellar components.

## 2. Findings by severity

| ID | Severity | Title | Location |
|----|----------|-------|----------|
| P2P-01 | ✅ **FIXED** (was 🔴 High) | Pause froze ALL refund/release/resolve paths — now exits are exempt | order.rs · dispute.rs |
| P2P-02 | 🟠 Medium | `initialize()` is front-runnable + grants roles without consent | contract.rs:19-48 · admin.rs:10-39 |
| P2P-03 | 🟠 Medium | Privileged roles immutable — no rotation/transfer (lost key locks disputed funds) | types.rs:60-70 · contract.rs |
| P2P-04 | 🟡 Low | `execute_fiat_transfer_timeout` callable by only one party (stuck stake/griefing) | order.rs:152-189 |
| P2P-05 | 🟡 Low | Escrow `resolve_dispute` raw i128 mul (overflow panic) + stranded dust | escrow/dispute.rs:70-75 |
| P2P-06 | 🟡 Low | `reference_rate` inversion truncates → returns **0 for EUR/GBP**, lossy for ARS | oracle.rs:74-81 |
| P2P-07 | 🟡 Low | Unchecked `u64` additions for deadlines (panic vs clean error) | order.rs:34,121-122 |
| P2P-08 | 🟡 Low | Order `deadline` only enforced on `take_order`; AwaitingConfirmation unbounded | validators/order.rs:51-57 |
| P2P-09 | 🟡 Low | `OrderStatus::Refunded` declared but never assigned (refunds look like re-opens) | types.rs:56 · order.rs:176 · dispute.rs:78 |
| P2P-10 | 🟡 Low | Hand-rolled role checks (inline admin vs helper) — no shared access-control | validators/admin.rs:17-31 · admin.rs:82-84 |
| P2P-11 | ⚪ Info | Hand-rolled pause flag instead of OZ Pausable | admin.rs:41-69 |
| P2P-12 | ⚪ Info | `OrderStatus::Created` set then overwritten before first store (dead state) | order.rs:48→59 |
| P2P-13 | ⚪ Info | `resolve_dispute` split doesn't reuse the audited `safe_mul_div` fee helper | escrow/calculator.rs · dispute.rs:70 |
| P2P-14 | ✅ Info | Partial-fill accounting is correct & overflow-safe (positive control) | order.rs:219-236 · dispute.rs:57-71 |

---

### 🔴 P2P-01 — Pause freezes every fund-recovery path, including dispute resolution
**Description.** Every state-advancing function calls `ensure_not_paused`, including the ones that *return* money: `cancel_order`, `execute_fiat_transfer_timeout`, `confirm_fiat_payment`, and **`resolve_dispute`** (dispute.rs:50, after the resolver role check). While paused, an order that already escrowed crypto cannot be cancelled, timed out, confirmed, disputed, or resolved. The only exit is `unpause`, gated solely by the **pauser** key.
**Impact.** A compromised/malicious pauser — or an honest pause during an incident — strands **all in-flight escrowed funds** indefinitely, and disables the emergency `dispute_resolver` backstop. A safety control becomes a single-key total-freeze/griefing vector. (Reversible via unpause → below Critical; disables the resolver → above Medium.)
**Recommendation.** Exempt user-protective exits (`cancel_order`, `execute_fiat_transfer_timeout`, `resolve_dispute`) from the pause guard so pause blocks only NEW exposure (`create`/`take`). With OZ `contract-utils::Pausable`, apply `when_not_paused` selectively to exposure-increasing entrypoints only.
**✅ Status: FIXED.** `ensure_not_paused` now guards **only** `create_order(_cli)` and `take_order(_with_amount)`. All exit/progress paths — `cancel_order`, `submit_fiat_payment`, `execute_fiat_transfer_timeout`, `confirm_fiat_payment`, `dispute_fiat_payment`, `resolve_dispute` — are exempt, so in-flight escrow can always be refunded/released/resolved while paused. Regression test `test_pause_allows_fund_exits_blocks_new_exposure` added (21/21 pass). **Redeploy required to apply on-chain** (the live testnet `CC2CA5…` still runs the pre-fix code).

### 🟠 P2P-02 — `initialize()` front-running + grants roles without consent
**Description.** `__constructor` is empty (pins nothing at deploy). `initialize()` is permissionless except for the `AlreadyInitialized` check and only calls `admin.require_auth()` (trivially satisfied — caller passes their own address). `dispute_resolver` and `pauser` are written with no `require_auth()` and no distinctness/validity guard.
**Impact.** On a deployed-but-uninitialized contract, a front-runner can `initialize` first as admin/dispute_resolver/pauser and seize control of escrow fund-routing + the pause switch before the legitimate operator. (Mitigated by bundling deploy+init in one tx → Medium, not High.)
**Recommendation.** Move init into `__constructor` (Soroban runs it exactly once, atomically, at deploy) so roles bind to the deployer. Require `require_auth()` from each granted role. Use OZ `access` (Ownable for admin, AccessControl to grant DISPUTE_RESOLVER/PAUSER) + `contract-utils` constructor init.

### 🟠 P2P-03 — Privileged roles are immutable (no rotation/transfer)
**Description.** `admin`/`dispute_resolver`/`pauser` are fixed `Config` fields with **no** `transfer_admin`/`set_dispute_resolver`/`set_pauser` and no two-step handoff (only `set_oracle` is mutable). No WASM-upgrade path exists either.
**Impact.** A lost/compromised `dispute_resolver` key **permanently locks** the escrowed crypto of any order in `Disputed` (the only fund-exit from Disputed is `resolve_dispute`). A compromised pauser can grief indefinitely with no replacement. Funds-at-risk, contingent on key loss → Medium.
**Recommendation.** Add admin-gated rotation. Adopt OZ `access::ownable` (two-step `transfer_ownership`/`accept_ownership`) for admin and `access::access_control` (`grant_role`/`revoke_role`) for dispute_resolver/pauser instead of fixed Config fields.

### 🟡 P2P-04 — `execute_fiat_transfer_timeout` callable by only one party
After `fiat_transfer_deadline`, only `creator` (from_crypto) or `filler` (fiat) can trigger the deterministic refund/reset. If that party goes offline, a fiat-order filler's stake is unrecoverable and the order slot is frozen (no admin/dispute escape from `AwaitingPayment`). **Fix:** make it permissionless (keep `ensure_fiat_timeout_expired`, drop `ensure_creator`/`ensure_filler`) — the transition only refunds the staking party.

### 🟡 P2P-05 — Escrow `resolve_dispute` raw i128 math
`let fee_share = (amount * (total_fees as i128)) / total;` uses raw operators while the rest of the file uses `SafeMath`/`BasicMath`. With `overflow-checks=true` a large multiply **panics** (aborts resolution) instead of a clean error; truncation also strands up to N−1 stroops of dust permanently (`resolved=true` is terminal). Value-at-risk is tiny and the overflow is not economically reachable → Low, but it breaks the codebase's own checked-math discipline. **Fix:** `SafeMath::safe_mul_div` + `BasicMath::safe_sub`; assign the rounding remainder to the last recipient.

### 🟡 P2P-06 — `reference_rate` inversion truncates (returns 0 for EUR/GBP)
`10^decimals / price` returns a bare integer with no fractional scaling. For assets worth >1 USD (EUR, GBP — both in `currency_symbol`) the division **floors to 0**; for ARS it drops the fraction (1461.6→1461). It's a read-only view (no funds depend on it today, and `create_order` does NOT validate against it), so Low — but it makes any future on-chain rate-band check impossible as-is. **Fix:** return at a documented fixed scale, e.g. `10^(2*decimals) / price` via checked ops; special-case 0; then wire a tolerance-band check into `validate_create_order`.

### 🟡 P2P-07 — Unchecked `u64` deadline additions
`now + duration_secs` (order.rs:34) and `now + filler_payment_timeout_secs` (order.rs:121-122) use raw `+` while i128 amounts use `checked_*`. With `overflow-checks=true` these panic (no silent already-expired wraparound) but abort instead of returning a clean error. **Fix:** `now.checked_add(..).ok_or(ContractError::Overflow)?`; optionally upper-bound the config timeouts at init.

### 🟡 P2P-08 — Lifecycle expiry only enforced on `take_order`
`ensure_not_expired` is called only in `take_order_with_amount`. `submit`/`confirm`/`dispute`/`resolve` ignore `order.deadline`; `AwaitingConfirmation` has **no** time bound at all (only `AwaitingPayment` is bounded, by the separate `fiat_transfer_deadline`). The order `deadline` is misleading once a fill is taken. **Fix:** rename it to reflect it only gates new fills, or enforce a derived confirmation deadline on post-take transitions.

### 🟡 P2P-09 — `OrderStatus::Refunded` is dead
Declared (types.rs:56) but **never assigned**: timeout and not-confirmed-dispute refunds both set `AwaitingFiller`; cancel sets `Cancelled`. A refund is indistinguishable from a re-open, and no refund event is emitted — weakens auditability of fund movement. **Fix:** assign `Refunded` on the actual refund paths (+ emit an event), or remove the variant.

### 🟡 P2P-10 — Hand-rolled, inconsistent role checks
`ensure_pauser`/`ensure_dispute_resolver` are helpers, but `set_oracle` inlines `if caller != config.admin`. No shared abstraction, no role events. Correct today, fragile for new privileged actions. **Fix:** OZ `access::access_control` (`ensure_role`) + `ownable` for admin-only actions.

### ⚪ P2P-11 — Hand-rolled pause flag → use OZ Pausable
Functionally correct (auth + idempotency guards), but the `paused` bool + per-entrypoint `ensure_not_paused` must be remembered on every new function. **Fix:** OZ `contract-utils::Pausable` (`when_not_paused` guards + events) — and combine with the P2P-01 selective-guard fix.

### ⚪ P2P-12 — `OrderStatus::Created` is a dead persisted state
Set at order.rs:48 then overwritten to `AwaitingFiller` at :59 before the only `store_order`. Never persisted/observable; the escrow transfer keys on `from_crypto`, not on `Created`. **Fix:** initialize the struct with `AwaitingFiller` (or drop the variant).

### ⚪ P2P-13 — Fee split divergence (escrow)
`calculate_standard_fees` correctly uses `safe_mul_div` (fees round down, receiver absorbs the residual — safe). But `resolve_dispute` re-derives the per-recipient split with raw operators (see P2P-05). **Fix:** route the split through the same audited helper.

### ✅ P2P-14 — Partial-fill accounting is correct (positive control)
Both settlement paths use `checked_add`/`checked_sub` and derive terminal status from `remaining_amount == 0`; `validate_fill_amount` bounds fills to `(0, remaining]`. Invariant `filled + remaining == amount` holds by construction. **Suggestion:** add a property test asserting the invariant.

## 3. OpenZeppelin library-first recommendations

| Hand-rolled today | Replace with | Benefit |
|---|---|---|
| `paused` bool + `ensure_not_paused` per entrypoint | OZ `contract-utils::Pausable` (`when_not_paused`) | Vetted guard/events; can't forget a guard; pairs with P2P-01 selective application |
| `admin` field + inline equality (`set_oracle`) | OZ `access::ownable` (two-step transfer) | Consent + rotation + recovery for the owner role (fixes P2P-03) |
| `dispute_resolver`/`pauser` fields + `ensure_*` helpers | OZ `access::access_control` (`grant_role`/`revoke_role`/`ensure_role`) | Centralized auth, role events, rotation (fixes P2P-02/03/10) |
| Init via permissionless `initialize()` | `__constructor` + OZ init pattern | Eliminates front-running (fixes P2P-02) |
| Raw proportional split in escrow `resolve_dispute` | `SafeMath::safe_mul_div` (already in-repo) / OZ mul-div | Consistent checked math, no panic/dust (fixes P2P-05/13) |

Add to `Cargo.toml`: the OpenZeppelin Stellar contracts (`github.com/OpenZeppelin/stellar-contracts`, packages `access`, `contract-utils`). See `docs/hackathon/MAINNET_DEPLOY.md` for the WSL build flow.

## 4. What's already done well
- `require_auth()` on **every** privileged/state-changing entrypoint, targeting the correct address.
- i128 token math uses `checked_add`/`checked_sub` with `Overflow`/`Underflow` errors; `overflow-checks=true` + `panic=abort` in the release profile.
- Clean separation: thin entrypoints → managers → validators; explicit `ContractError` variants; events on state changes.
- **On-chain oracle integration** (Reflector SEP-40 cross-contract read) — the headline feature; sound guards (`checked_pow`/`checked_div`, `price<=0` rejected).
- Partial-fill accounting is provably consistent (P2P-14).

## 5. Prioritized remediation checklist
1. ~~**[High] P2P-01**~~ — ✅ **DONE** (pause now guards only create/take; all exits exempt; regression test added). **Redeploy to apply on-chain.**
2. **[Medium] P2P-02** — move init into `__constructor`; `require_auth` from each granted role.
3. **[Medium] P2P-03** — add role rotation (OZ Ownable/AccessControl).
4. **[Low] P2P-04** — make the fiat timeout permissionless.
5. **[Low] P2P-05/06/07** — checked math in escrow split; fixed-scale `reference_rate`; `checked_add` deadlines.
6. **[Low] P2P-08/09** — bound the post-take lifecycle; use/remove `Refunded`.
7. **[Info] P2P-10/11/12/13** — adopt OZ access-control + Pausable; drop dead `Created`; unify fee split.
8. Add the P2P-14 invariant property test.

---
_Audit produced by an OpenZeppelin-skill-guided multi-agent review with adversarial per-finding verification. Re-run a professional manual audit + `cargo test` (via WSL) before any mainnet deployment._
