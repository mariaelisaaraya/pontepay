# App Audit · Supply Chain + Integración Frontend-Backend

Revisión hecha el **2026-06-21** sobre la rama `main` de `leocagli/peerlypay`. Herramientas: análisis manual + [`guard`](https://github.com/MauroProto/guard) (supply chain CLI).  
Complementa [`SECURITY-AUDIT.md`](./SECURITY-AUDIT.md) (contratos Soroban) y [`BARBI-frontend-uxui.md`](./BARBI-frontend-uxui.md) (UX/UI). Este doc cubre lo que queda en el medio: **dependencias npm, variables de entorno y los stubs del flujo de trade real**.

---

## Cambios ya aplicados (rama `main`)

| Qué | Por qué |
|-----|---------|
| ✅ `pnpm-lock.yaml` eliminado | Estaba desincronizado con `package.json` (apuntaba a Crossmint SDK, que ya no se usa). Si alguien corría `pnpm install` instalaba ~100 paquetes distintos a los declarados. |
| ✅ `"packageManager": "npm@11.9.0"` en `package.json` | Fija explícitamente npm; Corepack advierte si alguien intenta usar pnpm/yarn por error. |
| ✅ `"engines": { "node": ">=20" }` en `package.json` | Declara la versión mínima de Node requerida. |

**Para arrancar:**
```bash
npm install
npm run dev   # http://localhost:3000
```

---

## Supply chain · Estado

- Todos los paquetes vienen del registro oficial de npm (ningún `git://`, `file:`, ni registro privado).
- Todos los hashes de integridad son `sha512` válidos.
- Solo 3 paquetes con install scripts: `sharp`, `@reown/appkit`, `unrs-resolver` — todos conocidos y legítimos.
- `next@16.1.6` verificado: publicado por Vercel con firma criptográfica SLSA.
- `@privy-io/react-auth` trae consigo EVM + Solana + WalletConnect como transitivas (~100 paquetes). Es esperado para Privy, pero es la mayor superficie de supply chain del proyecto.

---

## 🔴 Variables de entorno faltantes en `.env.example`

Ninguna de estas está documentada. Un dev nuevo que clone el repo arranca roto sin saberlo.

| Variable | Dónde se usa | Qué pasa si falta |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | `src/app/providers.tsx:13` | **App crashea** con `Cannot read properties of undefined (reading 'startsWith')` — Privy no arranca |
| `TRUSTLESS_WORK_API_KEY` | `src/app/api/tw/[...path]/route.ts:14` | El proxy TW devuelve 503 — ningún escrow funciona |
| `TRUSTLESS_WORK_BASE_URL` | `src/app/api/tw/[...path]/route.ts:13` | Ídem (tiene fallback hardcodeado, pero mejor explicitarla) |
| `NEXT_PUBLIC_PLATFORM_ADDRESS` | `src/lib/trade-actions.ts:15` | String vacío → los roles del escrow TW quedan sin resolver |
| `NEXT_PUBLIC_SEP24_ANCHOR_DOMAIN` | `src/lib/sep24.ts:11` | Usa `testanchor.stellar.org` por default; ok para testnet, roto para mainnet |
| `PLATFORM_SECRET` | Comentario en `src/lib/trustless/client.ts:98` | Necesario para firmar disputas server-side (ver hallazgo #5 abajo) |

**Acción:** completar `.env.example` con estas 6 variables (con valores de ejemplo o `# requerida`).

---

## Stubs del flujo de trade real

Estos son los motivos por los que ningún trade real termina, aunque la UI lo permita.

### 🔴 1. `signEscrowXdr()` devuelve el XDR sin firmar
**`src/lib/privy-wallet.ts:39–58`**  
El cuerpo entero es un bloque TODO. La función retorna `unsignedXdr` tal cual, con solo un `console.warn`. Cualquier transacción enviada a la red Stellar es rechazada porque no tiene firma. Afecta: `takeOrder`, `submitFiatPayment`, `confirmFiatPayment`.

### 🔴 2. `takeOrder()` y `createOrder()` tiran error incondicional
**`src/lib/trade-actions.ts:32` y `:84`**  
```ts
throw new Error('takeOrder: not yet wired to TW escrow')
throw new Error('createOrder: not yet wired to TW escrow')
```
Un usuario con wallet conectado que intenta tomar o crear una orden real recibe un error genérico ("Failed to take order") sin ninguna pista de qué falló.

### 🔴 3. `checkUSDCTrustline()` siempre retorna `true`
**`src/app/trade/confirm/page.tsx:15–17`**  
```ts
async function checkUSDCTrustline(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return true;
}
```
Un usuario sin trustline USDC en Stellar pasa directo al `takeOrder` (que ya tira error, ver #2). La pantalla `/trade/enable-usdc` también es un mock de 2 segundos sin transacción real.

### 🔴 4. Registry de escrow (localStorage) nunca se llena
**`src/lib/trade-actions.ts:43` y `:60`**  
`submitFiatPayment` y `confirmFiatPayment` buscan el escrow en localStorage via `findEscrowByOrderId()`. Como `createOrder` y `takeOrder` tiran error (hallazgo #2), el registry siempre está vacío → ambas funciones tiran `"no escrow registry entry for order <id>"`.

### 🔴 5. `resolveDispute()` firma con el wallet del usuario en vez de la clave de plataforma
**`src/lib/trustless/client.ts:97–106`**  
El comentario lo dice explícitamente: *"must be signed by the PLATFORM key (PLATFORM_SECRET env var), NOT the user's browser wallet. This should be a server action."* La implementación actual usa el wallet del usuario vía Privy → la autorización del contrato falla porque el `dispute_resolver` es la dirección de la plataforma.

---

## Datos hardcodeados visibles para el jurado

Estos no rompen el flujo pero son evidentes en la demo:

| Dónde | Qué dice hoy | Impacto |
|-------|-------------|---------|
| `src/app/trade/payment/page.tsx:38–85` | "Juan Pérez", CBU `0000003100010123456789`, alias `JUANPEREZ.GALICIA` | Un usuario real intentaría transferir ARS a este CBU falso |
| `src/app/trade/success/page.tsx:15–17` | `#TXN123456` copiable al portapapeles, `crypto_trader_ar` como contraparte | No se puede buscar en ningún explorer |
| `src/components/QuickTradeInput.tsx:26` | `DEFAULT_RATE = 1200` (tasa real: ~1460, ~22% abajo) | Visible antes de que cargue la tasa real |
| `src/app/api/match-order/route.ts` | Orderbook con tasas 935–1400 ARS | Desincronizado con la tasa live |
| `src/app/orders/dashboard/page.tsx:62` | Montos en stroops crudos (`1500000000` en vez de `150 USDC`) | Los números de las órdenes son ilegibles |
| `src/components/DepositModal.tsx:29` | QR con dirección Stellar hardcodeada como fallback | Si el wallet no cargó, el QR apunta a una dirección ajena |

---

## Otros hallazgos (menor prioridad)

- **`FEE_RATE = 0.005` duplicado en 4 archivos** (`trade/confirm`, `trade/payment`, `trade/success`, `lib/match-order.ts`). Un cambio de fee requiere editar 4 lugares y pueden desincronizarse.
- **USDC issuer hardcodeado a testnet** en `src/lib/wallet-balance.ts:4`. En mainnet todos los balances muestran 0.
- **Órdenes donde sos taker no aparecen en "Mis Órdenes"** (`src/app/orders/page.tsx:191`): el filtro es solo por `createdBy`, no por `filler`.
- **`src/types/user.ts`** define un tipo `User` que nunca se importa (hay otros dos tipos `User` distintos en el proyecto). Código muerto que confunde.
- **Mixing de idioma** en la UI: `WalletButton.tsx` ("Copiar direccion", "Desconectar"), `enable-usdc/page.tsx` ("Cancelar este trade?"). El resto de la app está en inglés.
- **`docs/` y `README.md`** referencian `src/lib/p2p-crossmint.ts` como el path de escritura on-chain — ese archivo no existe. La migración a Privy lo reemplazó con `trade-actions.ts` → `trustless/client.ts` pero los docs no se actualizaron.

---

## Resumen de prioridades

| Prioridad | Qué | Responsable sugerido |
|-----------|-----|----------------------|
| 🔴 P0 | Completar `.env.example` con las 6 variables | Cualquiera |
| 🔴 P0 | Implementar `signEscrowXdr()` con Privy | Eli / quien cablee el wallet |
| 🔴 P0 | Implementar `takeOrder()` y `createOrder()` vía TW escrow | Eli |
| 🔴 P0 | Mover `resolveDispute()` a un server action con `PLATFORM_SECRET` | Eli |
| 🟠 P1 | De-mockear datos de pago y éxito con datos reales de la orden | Barbi |
| 🟠 P1 | Implementar `checkUSDCTrustline()` y flujo enable-usdc real | Eli (lógica) + Barbi (UX) |
| 🟡 P2 | Corregir montos de stroops → USDC legible | Barbi |
| 🟡 P2 | Unificar `FEE_RATE` en un solo lugar | Cualquiera |
| 🟡 P2 | Actualizar docs que referencian `p2p-crossmint.ts` | Cualquiera |
| 🟢 P3 | Arreglar filtro de "Mis Órdenes" para incluir órdenes de taker | Barbi |
| 🟢 P3 | Unificar idioma (español/inglés) en la UI | Barbi |
