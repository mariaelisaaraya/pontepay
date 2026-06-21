# Handoff → Eli · Backend + Smart Contracts

Hola Eli 👋 — tu lote de tareas de **backend + Soroban smart contracts** para PeerlyPay (PULSO). Priorizado por impacto en la demo real y los criterios del jurado (#1 profundidad de integración, #4 calidad de deploy).

- **App en vivo:** https://peerlypay-two.vercel.app · **Repo:** `leocagli/peerlypay` (`main`)
- **Fuente de verdad:** [`docs/hackathon/CONTEXT.md`](../hackathon/CONTEXT.md) · **Deploy de contrato:** [`docs/hackathon/MAINNET_DEPLOY.md`](../hackathon/MAINNET_DEPLOY.md)
- **Contrato p2p (testnet):** `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ` · **Oráculo Reflector (testnet):** `CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W`

## ⚠️ Build env (importante)
La máquina Windows **no tiene linker C** → `cargo`/`stellar` fallan nativos. **Buildeá/deployá por WSL** (Ubuntu, ya tiene rust 1.96 + cc/gcc + stellar CLI). Desde PowerShell:
```powershell
wsl bash -lc "source ~/.cargo/env && cd '/mnt/c/Users/usuario/peerly pay/peerlypay/contracts' && cargo test -p p2p"
```
Tests: **21/21 pasan** (incluye 2 del oráculo + el de regresión de pausa). Código del contrato en `contracts/contracts/p2p/src/`.

## Cómo está hoy
- ✅ **Real:** contrato p2p desplegado en testnet con oráculo Reflector cableado (`reference_rate(2)=ARS` por cross-contract call); lecturas/escrituras reales vía Crossmint; `/api/rates` lee la tasa **a través del contrato**.
- 🟡 **Pendiente (tu zona):** el contrato desplegado usa un **admin descartable** y **no tiene órdenes seedeadas** (por eso el marketplace cae a órdenes demo); SEP-24 interactivo está scaffolded; `/api/match-order` está muerto; no hay backend (todo localStorage).

---

## Tareas (priorizadas)

### 0. 🔐 Remediar la auditoría de seguridad → [`SECURITY-AUDIT.md`](./SECURITY-AUDIT.md)
Auditoría asistida (OpenZeppelin + verificación adversarial, 45 agentes), **~25 hallazgos** deduplicados. Estado:
- **✅ YA ARREGLADO (commit `aea5037`):** el pause-freeze (era el High del 1er pase / L-6/L-8) → la pausa ahora guarda **solo** `create`/`take`; todos los exits/recovery corren pausados. **Falta redeploy** para aplicarlo on-chain.
- **🔴 High abierto (H-1):** `AwaitingConfirmation` **no tiene timeout** → un confirmador inactivo bloquea el escrow para siempre. Setear `fiat_transfer_deadline` al entrar a `AwaitingConfirmation` + un escape permisionless/por deadline (auto-finalizar o escalar a `Disputed`). **Invariante:** ningún estado con escrow sin salida por tiempo.
- **🟠 Medium:** sin rotación de roles (OZ `Ownable`/`AccessControl`); `exchange_rate` no validado vs oráculo (Tier 3); sin `extend_ttl` (storage archivable); órdenes en `instance()` único (spam/DoS); reopen mantiene deadline viejo; disputa unilateral.
- **🟡 Low/Info:** CEI ordering en 4 transfers, `reference_rate` trunca (0 para EUR/GBP), sin staleness del oráculo, `Refunded`/`Created` muertos, etc.
- Checklist priorizado (P0→P3) al final del reporte.

### 1. 🔴 Redeploy desde TU admin + seed de órdenes (desbloquea la demo real)
> Nota: ya hay **1 orden real on-chain** (creada con la wallet de prueba `GBOKYW3J…FVKR`, secret en `.env` gitignored) — el smoke test de tx en testnet pasó (`get_order_count` 0→1). Igual conviene seedear más con tu admin.
El marketplace hoy muestra órdenes **demo** porque la cadena está vacía. Para que el flujo real sea demostrable:
1. Generá/fondéa un admin propio (testnet, friendbot) — pasos exactos en [`MAINNET_DEPLOY.md`](../hackathon/MAINNET_DEPLOY.md) §3.
2. `cargo test` → `stellar contract build` → deploy → `initialize` → `set_oracle` (→ `CCSSO…`).
3. **`make p2p-seed-orders NETWORK=testnet`** (en `contracts/`) para poblar el orderbook ARS real.
4. Actualizá el contract id en [`src/lib/contract-config.ts`](../../src/lib/contract-config.ts) (`DEFAULT_P2P_CONTRACT_ID`) y regenerá los bindings (paso 6).
> Resultado: el marketplace muestra órdenes reales tomables, no demo.

### 2. 🔴 Fondear wallets de testnet con USDC (para cerrar un trade real)
Aunque la wallet sea testnet (`ck_staging`), arranca con 0 USDC. Para una operación real end-to-end hace falta USDC de testnet en la wallet que toma la orden (y trustline). Documentá el cómo (faucet/mint del token) para la demo.

### 3. 🟠 Tier 3 del oráculo — validar la tasa on-chain (sube criterio #1)
Hoy `exchange_rate` se guarda pero no se valida. En [`contracts/contracts/p2p/src/core/validators/order.rs`](../../contracts/contracts/p2p/src/core/validators/order.rs) (`validate_create_order`, hoy solo chequea `> 0`), agregá validación contra `reference_rate()` dentro de una banda (±X%). Ya tenés el módulo del oráculo en [`core/oracle.rs`](../../contracts/contracts/p2p/src/core/oracle.rs). Sumá un test en `tests/test.rs`.

### 4. 🟠 Completar SEP-24 interactivo (deposit/withdraw firmado)
[`src/lib/sep24.ts`](../../src/lib/sep24.ts) tiene el discovery real (TOML + `/info`) y el scaffold `Sep24DepositRequest`. Falta la firma SEP-10 (challenge firmado con la wallet Crossmint) → `transactions/deposit/interactive`. Anchor de prueba: `testanchor.stellar.org` (USDC).

### 5. 🟡 Gaps del contrato (revisar/mejorar + tests)
En `contracts/contracts/p2p/src/core/order.rs` / `storage/types.rs`:
- `OrderStatus::Refunded` se declara pero **nunca se asigna** (los refunds reabren a `AwaitingFiller`).
- `Created` se setea y se sobreescribe antes del primer store (nunca persiste).
- **Sin escape por timeout** para creador inactivo en órdenes `from_crypto` (solo `cancel_order` en `AwaitingFiller`).
- Reconciliación fiat off-chain no forzada (es by design, pero documentalo).

### 6. 🟡 Regenerar bindings TS tras cualquier cambio de contrato
```bash
stellar contract bindings typescript --network testnet --contract-id <CID> --output-dir <tmp> --overwrite
# y copiar el src/index.ts generado a src/contracts/p2p/src/index.ts
```
(Procedimiento completo en `MAINNET_DEPLOY.md` §5.)

### 7. 🟢 `/api/match-order` está muerto + (opcional) backend/indexer
- [`src/app/api/match-order/route.ts`](../../src/app/api/match-order/route.ts) no se usa (el cliente matchea in-process con `findBestMatch`). Decidí: cablearlo server-side o borrarlo.
- Historial/perfil/reputación viven en localStorage (sin backend). Si hay tiempo, un indexer liviano de eventos del contrato (`OrderCreated`, `OrderTaken`, etc.) daría datos reales.

### 8. 🟢 Contrato escrow Trustless-Work (huérfano)
`contracts/contracts/escrow` es real y testeado pero **no está cableado**. Su `resolve_dispute` usa i128 crudo (riesgo overflow/dust) — si lo van a usar, arreglalo con `SafeMath`. Si no, dejalo documentado como referencia (está en la lista de integraciones recomendada de Stellar).

---

## Definition of done
- Marketplace con **órdenes reales seedeadas** (no demo) + una operación real cerrada end-to-end en testnet.
- `reference_rate` validando la tasa on-chain (Tier 3) con test.
- Bindings y `contract-config.ts` apuntando al contrato seedeado.
- `cargo test -p p2p` verde tras tus cambios.

Cualquier duda de estado real/mock → `docs/hackathon/CONTEXT.md`. A romperla. 🚀
