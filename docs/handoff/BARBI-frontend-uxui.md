# Handoff → Barbi · Frontend / UX-UI

Hola Barbi 👋 — esto es tu lote de tareas de **frontend / UX-UI** para PeerlyPay (hackathon PULSO). Está priorizado: de arriba hacia abajo por impacto en la demo y los criterios del jurado.

- **App en vivo:** https://peerlypay-two.vercel.app
- **Repo:** `leocagli/peerlypay` (rama `main`)
- **Fuente de verdad técnica:** [`docs/hackathon/CONTEXT.md`](../hackathon/CONTEXT.md) · **Guion de video:** [`docs/hackathon/DEMO_SCRIPT.md`](../hackathon/DEMO_SCRIPT.md)
- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand · shadcn/ui · sonner.

## Setup (2 min)
```bash
npm install
npm run dev      # http://localhost:3000  (la key de Crossmint ya está en next.config)
```
> Todo el front vive en `src/`. Tokens de diseño y colores en `src/app/globals.css` (`oklch`). Reusá `src/components/ui/**` (shadcn) antes de crear primitives nuevas. Mobile-first.

## Cómo está hoy (real vs mock)
- ✅ **Real:** flujo `/trade/*` con escritura on-chain (Crossmint testnet), tasa en vivo del oráculo (`/api/rates`), marketplace que lee la cadena, `/anchor` (SEP-24), QR de Transferencias 3.0 en payment.
- 🟡 **Mock/placeholder (tu zona):** datos bancarios, nombres y reputación hardcodeados; trustline simulada; órdenes demo cuando la cadena está vacía. Hay un **modo demo** (`?demo=1`) que recorre las pantallas sin tocar la cadena.

---

## Tareas (priorizadas)

### 1. 🔴 De-mockear los datos placeholder de las pantallas (alto impacto para el jurado)
El jurado penaliza lo que se ve "inventado". Reemplazá por datos reales del store/cadena, o etiquetá claramente como demo.
- **Payment** [`src/app/trade/payment/page.tsx`](../../src/app/trade/payment/page.tsx): `PAYMENT_DETAILS` / datos bancarios hardcodeados, `makerName = 'JuanC_AR'`, `makerAddress = '0x1234...5678'`, `makerScore`, `makerRate`. → Mostrar el maker real de la orden (de `order.displayName`/`createdBy`) o un placeholder honesto ("demo").
- **Profile** [`src/app/profile/page.tsx`](../../src/app/profile/page.tsx): `trustScore` se deriva del hex de la wallet y "12 completed trades" está hardcodeado. → Mostrar datos reales (cuando existan) o un estado vacío claro ("aún sin operaciones").
- **OrderCard** [`src/components/OrderCard.tsx`](../../src/components/OrderCard.tsx): `reputation_score`/`completionRate`. Etiquetá los demo (los ids empiezan con `demo-`).

### 2. 🟠 Pantalla de trustline (enable-USDC) — UX real
[`src/app/trade/enable-usdc/page.tsx`](../../src/app/trade/enable-usdc/page.tsx) hoy es un mock de 2s. Diseñá la UX real de "activar USDC" (estado, loading, éxito/error). La lógica on-chain (`change_trust`) la cablea Eli; vos dejá la pantalla y los estados listos. (El stub `checkUSDCTrustline()` está en [`src/app/trade/confirm/page.tsx`](../../src/app/trade/confirm/page.tsx).)

### 3. 🟠 Pulir el modo demo y los estados vacíos
- El banner "Demo mode" (en confirm) y el botón "Continue (demo)" (en waiting) — dejalos lindos y consistentes.
- **Marketplace vacío:** cuando la cadena no tiene órdenes, se muestran 3 órdenes **demo** (en `src/lib/store.ts`, `DEMO_ORDERS`). Asegurá un empty-state / aclaración elegante.
- Skeletons / loading en marketplace, orders, trade.

### 4. 🟡 Wallet connect (ahora testnet) + consistencia de red
- [`src/components/WalletButton.tsx`](../../src/components/WalletButton.tsx): estados de conexión, balance USDC, copy de dirección. La wallet ahora es **Stellar testnet** (key `ck_staging`).
- Revisá que **todas** las etiquetas digan "Testnet" y los links de explorer apunten a `stellar.expert/explorer/testnet` (había inconsistencias mainnet/testnet).

### 5. 🟡 Tasa en vivo + transparencia BCRA (diferenciador visual)
- En [`src/app/trade/confirm/page.tsx`](../../src/app/trade/confirm/page.tsx) ya está la fila "Rate · oracle". Potenciala: mostrá **tasa de mercado (oráculo) vs tasa oficial BCRA** lado a lado (la `/api/rates` ya devuelve `reflector` y `bcraOfficial`) → muestra la "brecha", que es parte del pitch.
- Hook listo: [`src/lib/useLiveRate.ts`](../../src/lib/useLiveRate.ts) (`useLiveRate()` devuelve `{ usdArs, source, reflector, bcraOfficial }`).

### 6. 🟢 Página /anchor (SEP-24)
[`src/components/AnchorCard.tsx`](../../src/components/AnchorCard.tsx) muestra las capacidades del anchor. Dale identidad visual (chips de deposit/withdraw, badge "Connected").

### 7. 🟢 Video demo (1–2 min)
Sos la indicada para el walkthrough. Seguí [`docs/hackathon/DEMO_SCRIPT.md`](../hackathon/DEMO_SCRIPT.md): connect → marketplace → orden → confirm (tasa oráculo) → payment (QR T3.0) → waiting → success → /anchor → tx en explorer.

---

## ⛔ No tocar (es la integración "load-bearing" que evalúa el jurado)
- El **camino de escritura on-chain**: `src/lib/p2p-crossmint.ts`, `src/lib/p2p.ts`, `src/lib/contract-config.ts`.
- La lógica de tasa: `src/lib/rates*.ts`. (Mostrala distinto, pero no cambies la cadena de fallback.)
- Los bindings generados: `src/contracts/p2p/src/index.ts` (los regenera Eli al redeployar).

## Definition of done
- Nada que se vea "inventado" sin estar etiquetado como demo.
- Demo recorrible 100% en mobile sin errores visuales.
- Etiquetas de red coherentes (Testnet).
- Video de 1–2 min grabado.

Dudas técnicas de qué es real/mock → `docs/hackathon/CONTEXT.md`. Cualquier cosa, me escribís. 🚀
