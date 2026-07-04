# Handoff → Eli · Backend + Smart Contracts

Hola Eli 👋 — tu lote de tareas de **backend + Soroban smart contracts** para PontePay (PULSO). Priorizado por impacto en la demo real y los criterios del jurado (#1 profundidad de integración, #4 calidad de deploy).

- **App en vivo:** https://pontepay.vercel.app · **Repo:** `mariaelisaaraya/pontepay` (`main`)
- **Fuente de verdad:** [`docs/hackathon/CONTEXT.md`](../hackathon/CONTEXT.md) · **Deploy de contrato:** [`docs/hackathon/MAINNET_DEPLOY.md`](../hackathon/MAINNET_DEPLOY.md)
- **Contrato p2p (testnet):** `CCCIAD3CI5I6MRQ6TDGKN7G3EMIH5OZS2EVAVJXO2U4NASPQL7Z7VS5R` · **Oráculo Reflector (testnet):** `CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W`

## ⚠️ Build env (importante)
La máquina Windows **no tiene linker C** → `cargo`/`stellar` fallan nativos. **Buildeá/deployá por WSL** (Ubuntu, ya tiene rust 1.96 + cc/gcc + stellar CLI). Desde PowerShell:
```powershell
wsl bash -lc "source ~/.cargo/env && cd '/mnt/c/Users/usuario/peerly pay/peerlypay/contracts' && cargo test -p p2p"
```
Tests: **21/21 pasan** (incluye 2 del oráculo + el de regresión de pausa). Código del contrato en `contracts/contracts/p2p/src/`.

## Cómo está hoy
- ✅ **Contrato redesplegado (2026-06-25):** admin propio, oracle Reflector cableado (`reference_rate(2)=ARS` devuelve 1477), 4 órdenes reales seedeadas on-chain (2 sell + 2 buy ARS ~1475). `contract-config.ts` y Vercel apuntan al contrato nuevo.
- ✅ **Build limpio:** `npm run build` pasa sin errores. Privy App ID configurado en Vercel.
- 🟡 **Pendiente (tu zona):** Tarea 2 (fondear wallets USDC para trade end-to-end), Tarea 3 (validar exchange_rate on-chain vs oracle), Tarea 4 (SEP-24 interactivo), Tarea 6 (regenerar bindings TS).

---

## Tareas

### ✅ 0. Auditoría build + Privy
- ✅ B-1 — Build roto por `@afipsdk/afip.js` + Crossmint colgado → fixed (`serverExternalPackages`, `usePrivy`, `tsconfig` excluye `pitch/`)
- ✅ B-2 — `NEXT_PUBLIC_PRIVY_APP_ID` seteado en Vercel, redeploy OK
- ✅ A-1 — `src/app/api/rates/route.ts` con try/catch, devuelve 503 si oracle cae
- ✅ A-2 — Comisión dinámica por tier visible en `confirm/page.tsx` (usa `pricing.ts`, muestra 0% si launch offer activo)
- ✅ M-1 — `.env` nunca fue commiteado al historial git
- ✅ M-2 — `src/app/error.tsx` creado (fallback React)
- ✅ M-3 — `trustless/types.ts` estaba limpio, nada que commitear

### ✅ 1. Redeploy + seed de órdenes
- ✅ Contrato `CCCIAD3...VS5R` redesplegado con admin propio, oracle Reflector, fee 80 bps
- ✅ 4 órdenes reales on-chain seedeadas (2 sell 10+7 USDC / 2 buy 10+15 USDC ~1475 ARS)
- ✅ `contract-config.ts` y `NEXT_PUBLIC_P2P_CONTRACT_ID` en Vercel actualizados

### 🔴 2. Fondear wallets de testnet con USDC (para cerrar un trade real)
La wallet del usuario (Privy) arranca con 0 USDC. Para cerrar un trade end-to-end en la demo hace falta USDC de testnet + trustline. El faucet de la app manda 10 USDC al primer login — verificá que funcione con el contrato nuevo y documentá el flujo para la demo.

### 🟠 3. Tier 3 del oráculo — validar exchange_rate on-chain
En `contracts/contracts/p2p/src/core/validators/order.rs` (`validate_create_order`) hoy solo chequea `> 0`. Agregar validación contra `reference_rate()` dentro de una banda (±15%). Ya tenés el módulo en `core/oracle.rs`. Sumar un test en `tests/test.rs`. **Después de este cambio: redeploy + regenerar bindings (Tarea 6).**

### 🟠 4. Completar SEP-24 interactivo (deposit/withdraw firmado)
`src/lib/sep24.ts` tiene el discovery real (TOML + `/info`) y el scaffold `Sep24DepositRequest`. Falta la firma SEP-10 (challenge firmado con la wallet Privy) → `transactions/deposit/interactive`. Anchor de prueba: `testanchor.stellar.org` (USDC).

### 🟡 5. Gaps del contrato (revisar + tests)
- `OrderStatus::Refunded` declarado pero nunca asignado
- `Created` se sobreescribe antes del primer store (nunca persiste)
- Sin escape por timeout para creador inactivo en órdenes `from_crypto`
- Reconciliación fiat off-chain no forzada (documentar que es by design)

### 🟡 6. Regenerar bindings TS
Necesario después de cualquier cambio al contrato (Tarea 3 o 5):
```bash
stellar contract bindings typescript --network testnet --contract-id CCCIAD3CI5I6MRQ6TDGKN7G3EMIH5OZS2EVAVJXO2U4NASPQL7Z7VS5R --output-dir /tmp/p2p-bindings --overwrite
# copiar src/index.ts generado a src/contracts/p2p/src/index.ts
```

### 🟢 7. `/api/match-order` está muerto
`src/app/api/match-order/route.ts` no se usa — el cliente matchea in-process con `findBestMatch`. Decidir: cablear server-side o borrar.

### 🟢 8. Contrato escrow Trustless-Work (huérfano)
`contracts/contracts/escrow` real y testeado pero no cableado. `resolve_dispute` usa i128 crudo (riesgo overflow). Si no se usa en la demo, documentar como referencia.

---

## Definition of done
- ✅ Marketplace con órdenes reales seedeadas
- 🔲 Una operación real cerrada end-to-end en testnet (depende Tarea 2)
- 🔲 `reference_rate` validando la tasa on-chain con test (Tarea 3)
- 🔲 Bindings y `contract-config.ts` apuntando al contrato final (Tarea 6)
- ✅ `cargo test -p p2p` verde

Cualquier duda de estado real/mock → `docs/hackathon/CONTEXT.md`. A romperla. 🚀
