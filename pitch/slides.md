---
theme: default
title: PontePay — PULSO Hackathon 2026
titleTemplate: '%s'
info: |
  PontePay · USDC↔ARS no-custodial en Stellar
  Stellar PULSO Argentina · Junio 2026
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
transition: slide-left
mdc: true
colorSchema: dark
fonts:
  sans: Inter
  mono: Fira Code
---

<div class="flex flex-col items-center justify-center h-full gap-6">

<div class="text-7xl font-black tracking-tight">
  <span style="color:#7C3AED">Ponte</span><span style="color:#A78BFA">Pay</span>
</div>

<div class="text-2xl text-gray-300 font-light text-center max-w-xl">
  De dólar digital a pesos.<br>En minutos. Sin entregar las llaves a nadie.
</div>

<div class="flex gap-3 mt-4">
  <span class="px-3 py-1 rounded-full text-xs font-semibold" style="background:#1e1b4b;color:#a5b4fc">Stellar · Soroban</span>
  <span class="px-3 py-1 rounded-full text-xs font-semibold" style="background:#1e1b4b;color:#a5b4fc">USDC nativo</span>
  <span class="px-3 py-1 rounded-full text-xs font-semibold" style="background:#1e1b4b;color:#a5b4fc">Transferencias 3.0</span>
</div>

<div class="absolute bottom-8 text-sm text-gray-500">
  PULSO Hackathon · Argentina · Junio 2026
</div>

</div>

---
layout: two-cols
---

# El Problema

**Argentina necesita un puente confiable entre el dólar digital y el peso.**

<v-clicks>

- 🇦🇷 **#2 en LATAM** en volumen de compras cripto (Chainalysis 2025)
- 💵 **+50% de compras** en cripto son stablecoins — no especulación, es ahorro estructural
- 🏦 Los exchanges custodiales **bloquean cuentas sin aviso**
- 👻 El P2P informal en Telegram **no tiene garantías**
- 🙈 **4 de 5 usuarios** no saben cuánto pagan de spread

</v-clicks>

::right::

<div class="ml-8 mt-12">

<v-click>

<div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
<div class="text-xs text-gray-400 mb-2">💬 Tomás · Freelancer dev</div>
<div class="text-gray-200 text-sm italic">"Me bloquearon la cuenta de Binance 11 días con la plata del alquiler adentro."</div>
</div>

</v-click>

<v-click>

<div class="bg-gray-800 rounded-xl p-5 border border-gray-700 mt-4">
<div class="text-xs text-gray-400 mb-2">💬 Caro · Diseñadora UX</div>
<div class="text-gray-200 text-sm italic">"No tengo idea de cuánto pierdo. Le creo a la cueva."</div>
</div>

</v-click>

<v-click>

<div class="bg-gray-800 rounded-xl p-5 border border-gray-700 mt-4">
<div class="text-xs text-gray-400 mb-2">💬 Vale · Ahorrista USDC</div>
<div class="text-gray-200 text-sm italic">"No duermo hasta que entra la transferencia."</div>
</div>

</v-click>

</div>

---

# La Solución

<div class="grid grid-cols-2 gap-6 mt-6">

<v-click>

<div class="bg-gray-800 rounded-xl p-6 border border-purple-800">
<div class="text-3xl mb-3">⛓️</div>
<div class="font-bold text-purple-300 mb-2">Escrow Soroban</div>
<div class="text-gray-300 text-sm">El contrato es el árbitro. Nadie puede bloquear tu USDC — ni nosotros. Las reglas están en el código, auditables on-chain.</div>
</div>

</v-click>

<v-click>

<div class="bg-gray-800 rounded-xl p-6 border border-purple-800">
<div class="text-3xl mb-3">📡</div>
<div class="font-bold text-purple-300 mb-2">Oracle Reflector</div>
<div class="text-gray-300 text-sm">Tasa en tiempo real vía cross-contract call. El mid-rate, el spread aplicado, y la tasa BCRA — todos en pantalla. Sin sorpresas.</div>
</div>

</v-click>

<v-click>

<div class="bg-gray-800 rounded-xl p-6 border border-purple-800">
<div class="text-3xl mb-3">📱</div>
<div class="font-bold text-purple-300 mb-2">Transferencias 3.0</div>
<div class="text-gray-300 text-sm">El mismo QR que usás para pagar el super. Cualquier banco o billetera digital. El riel fiat es gratis.</div>
</div>

</v-click>

<v-click>

<div class="bg-gray-800 rounded-xl p-6 border border-purple-800">
<div class="text-3xl mb-3">🔐</div>
<div class="font-bold text-purple-300 mb-2">Privy Embedded Wallet</div>
<div class="text-gray-300 text-sm">Wallet Stellar con tu email. Sin extensión de navegador. Sin frase semilla que perder. Listo en 30 segundos.</div>
</div>

</v-click>

</div>

---
layout: center
---

# Cómo Funciona

<div class="flex items-center gap-4 mt-8 justify-center">

<v-click>

<div class="bg-gray-800 rounded-xl p-5 border border-gray-700 w-52 text-center">
  <div class="text-4xl mb-3">👀</div>
  <div class="font-bold text-purple-300 text-sm mb-2">1. Ves la tasa</div>
  <div class="text-gray-400 text-xs">Oracle Reflector entrega el mid-rate. Spread 0.8% visible. Comparás con BCRA al lado.</div>
</div>

</v-click>

<v-click>
<div class="text-gray-500 text-2xl">→</div>
</v-click>

<v-click>

<div class="bg-gray-800 rounded-xl p-5 border border-gray-700 w-52 text-center">
  <div class="text-4xl mb-3">🔒</div>
  <div class="font-bold text-purple-300 text-sm mb-2">2. USDC en escrow</div>
  <div class="text-gray-400 text-xs">El vendedor deposita USDC en el contrato Soroban. Nadie lo toca hasta que se confirme el pago.</div>
</div>

</v-click>

<v-click>
<div class="text-gray-500 text-2xl">→</div>
</v-click>

<v-click>

<div class="bg-gray-800 rounded-xl p-5 border border-gray-700 w-52 text-center">
  <div class="text-4xl mb-3">📲</div>
  <div class="font-bold text-purple-300 text-sm mb-2">3. Pagás con QR</div>
  <div class="text-gray-400 text-xs">Escanear QR T3.0 desde cualquier banco. El contrato confirma y libera el USDC automáticamente.</div>
</div>

</v-click>

</div>

<v-click>
<div class="mt-8 text-center text-gray-500 text-sm">Sin intermediarios. Sin custodia. Sin bloqueos posibles.</div>
</v-click>

---

# Integración Stellar

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

<v-clicks>

**Oracle cross-contract call**
```rust
// El escrow llama al oracle Reflector on-chain
let rate = oracle_client.lastprice(&asset);
```
Precio en tiempo real sin confiar en un backend externo.

**USDC nativo Stellar**
Emitido por Circle. Sin bridging, sin wrapped tokens, sin riesgo de smart contract externo.

**Dispute resolver on-chain**
Timelock configurable. Si el pago no se confirma en N horas, el USDC vuelve automáticamente al vendedor.

</v-clicks>

</div>

<div>

<v-clicks>

**Testnet activo hoy**
- Contrato desplegado en Stellar testnet
- Escrow USDC funcional
- Oracle Reflector integrado
- P2P con 3 órdenes activas en demo

**Próximo paso: mainnet**
- Firma SEP-24 con anchor argentino
- Depósito/retiro fiat via anchor nativo
- Sin custodiar fondos propios

</v-clicks>

</div>

</div>

---
layout: two-cols
---

# Mercado

<v-clicks>

**TAM**
$5.7B USD en volumen cripto anual en Argentina (Chainalysis 2025)

**SAM**
~800K freelancers y remotos que cobran al exterior en USDC/USDT

**SOM — 12 meses**
$1.2M USD en volumen procesado · 2.000 usuarios activos

</v-clicks>

::right::

<div class="ml-8 mt-2">

<v-click>

### 3 segmentos validados

<div class="space-y-3 mt-3">

<div class="bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500">
<div class="font-semibold text-sm text-purple-300">Segmento A — Freelancer USDC</div>
<div class="text-gray-400 text-xs mt-1">Dev, diseñador, PM que cobra al exterior. 4–12 ops/trimestre. Dolor: cuenta bloqueada.</div>
</div>

<div class="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
<div class="font-semibold text-sm text-blue-300">Segmento C — Comerciante</div>
<div class="text-gray-400 text-xs mt-1">Acepta USDC, necesita ARS para insumos. Alta frecuencia, montos chicos. Dolor: fricción en cada cobro.</div>
</div>

<div class="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
<div class="font-semibold text-sm text-green-300">Segmento D — Ahorrista</div>
<div class="text-gray-400 text-xs mt-1">Dolariza ahorros en USDC, liquida esporádicamente. Dolor: desconfianza de la contraparte en montos altos.</div>
</div>

</div>

</v-click>

</div>

---

# Modelo de Revenue

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

<v-clicks>

**Hoy — 1.3% efectivo por trade**

| Fuente | Valor | Estado |
|--------|-------|--------|
| Spread en tipo de cambio | 0.8% | ✅ Activo |
| Fee on-chain (Soroban) | 0.5% | ✅ Activo |
| **Total efectivo** | **~1.3%** | |

El spread está embebido en el precio mostrado.
Auditable en `src/lib/pricing.ts` — open source.

</v-clicks>

</div>

<div>

<v-clicks>

**Roadmap de revenue**

<div class="space-y-3 mt-2">

<div class="bg-gray-800 rounded-lg p-3 border border-gray-700">
<div class="flex justify-between text-sm">
<span class="text-purple-300 font-semibold">PontePay Earn</span>
<span class="text-gray-500">Q3 2026</span>
</div>
<div class="text-gray-400 text-xs mt-1">Yield en USDC idle vía Blend Protocol. Margen sobre APY. Stack ya instalado.</div>
</div>

<div class="bg-gray-800 rounded-lg p-3 border border-gray-700">
<div class="flex justify-between text-sm">
<span class="text-blue-300 font-semibold">PontePay Pay</span>
<span class="text-gray-500">Q4 2026</span>
</div>
<div class="text-gray-400 text-xs mt-1">0.5% por conversión USDC→ARS para comerciantes. Producto B2B.</div>
</div>

<div class="bg-gray-800 rounded-lg p-3 border border-gray-700">
<div class="flex justify-between text-sm">
<span class="text-green-300 font-semibold">Maker Premium + DCA</span>
<span class="text-gray-500">Q1 2027</span>
</div>
<div class="text-gray-400 text-xs mt-1">Spread reducido por volumen. DCA automático quincenal para ahorristas.</div>
</div>

</div>

</v-clicks>

</div>

</div>

---

# Competencia

<div class="mt-4">

| | PontePay | Lemon / Belo | Binance P2P | Cuevas |
|---|---|---|---|---|
| **Custodia** | ❌ No-custodial | ✅ Custodial | ⚠️ Temporal | ❌ Ninguna |
| **Spread declarado** | ✅ 0.8% on-chain | ❌ Oculto | ❌ Oculto | ❌ ~2% verbal |
| **Transferencias 3.0** | ✅ Nativo | ❌ No | ❌ No | ✅ Sí |
| **Dispute on-chain** | ✅ Soroban | ❌ No | ⚠️ Centralizado | ❌ No |
| **Wallet sin extensión** | ✅ Privy email | ⚠️ App propia | ⚠️ App propia | ❌ No aplica |
| **Cuenta bloqueable** | ❌ No | ✅ Sí | ✅ Sí | N/A |
| **Red blockchain** | Stellar | Multi-chain | Multi-chain | Off-chain |

<v-click>

<div class="mt-4 bg-purple-900 bg-opacity-40 rounded-xl p-4 border border-purple-700 text-sm">
💡 <strong>Posición única:</strong> PontePay es el único P2P no-custodial con spread auditable on-chain y riel fiat gratuito vía Transferencias 3.0 en Argentina.
</div>

</v-click>

</div>

---
layout: two-cols
---

# Customer Discovery

**5 entrevistas · 3 señales verdes · 2 amarillas**

<v-clicks>

🟢 **Tomás** (Dev freelance) — Binance le bloqueó la cuenta 11 días con la plata del alquiler. *"La primera vez que veo un escrow que me explica qué hace."*

🟢 **Caro** (Diseñadora UX) — No sabe su spread real. *"Si me mostrás el precio antes de confirmar, ya es mejor que Lemon."*

🟢 **Nico** (Tatuador) — 12 cobros/mes en USDC. El QR es la clave. *"Si funciona como Mercado Pago pero cripto, lo pongo en el local."*

🟡 **Marco** (Nómade brasileño) — KYC argentino lo bloquea. Señal para cuando resolvamos onboarding internacional.

🟡 **Vale** (Ahorrista) — Miedo contraparte en montos altos. Señal para PontePay Earn como producto de retención.

</v-clicks>

::right::

<div class="ml-8 mt-4">

<v-click>

### Patrón crítico detectado

<div class="bg-gray-800 rounded-xl p-5 border border-yellow-700 mt-3">
<div class="text-yellow-300 font-bold text-lg">4 de 5</div>
<div class="text-gray-300 text-sm mt-1">usuarios no saben cuánto pagan de spread en su exchange actual.</div>
<div class="text-gray-500 text-xs mt-2">Fuente: entrevistas propias · Mayo 2026</div>
</div>

</v-click>

<v-click>

<div class="bg-gray-800 rounded-xl p-5 border border-gray-700 mt-4">
<div class="text-purple-300 font-bold">La transparencia es el producto.</div>
<div class="text-gray-300 text-sm mt-1">Mostrar el oracle mid-rate + el spread aplicado + la tasa BCRA en la misma pantalla es un diferenciador que nadie tiene hoy en Argentina.</div>
</div>

</v-click>

</div>

---
layout: center
---

# El Team

<div class="grid grid-cols-3 gap-8 mt-8 max-w-2xl mx-auto">

<div class="text-center">
<div class="text-5xl mb-3">👨‍💻</div>
<div class="font-bold text-purple-300">Leo</div>
<div class="text-gray-400 text-sm mt-1">Tech Lead</div>
<div class="text-gray-500 text-xs mt-2">Soroban · Next.js · Privy · Oracle</div>
</div>

<div class="text-center">
<div class="text-5xl mb-3">🎯</div>
<div class="font-bold text-purple-300">Eli</div>
<div class="text-gray-400 text-sm mt-1">Product & Validación</div>
<div class="text-gray-500 text-xs mt-2">Customer discovery · UX · GTM</div>
</div>

<div class="text-center">
<div class="text-5xl mb-3">🚀</div>
<div class="font-bold text-purple-300">Barbi</div>
<div class="text-gray-400 text-sm mt-1">Deploy & QA</div>
<div class="text-gray-500 text-xs mt-2">Vercel · Testing · Smoke tests</div>
</div>

</div>

<div class="mt-12 text-center">

<v-click>

### El Ask

<div class="flex gap-4 mt-4 justify-center flex-wrap">
<div class="bg-purple-900 bg-opacity-50 rounded-lg px-4 py-2 text-purple-200 text-sm border border-purple-700">🏆 Finalistas PULSO</div>
<div class="bg-purple-900 bg-opacity-50 rounded-lg px-4 py-2 text-purple-200 text-sm border border-purple-700">📋 Firma SEP-24 con anchor argentino</div>
<div class="bg-purple-900 bg-opacity-50 rounded-lg px-4 py-2 text-purple-200 text-sm border border-purple-700">🌎 Stellar Summit São Paulo</div>
</div>

</v-click>

<v-click>

<div class="mt-8 text-2xl font-light text-gray-300">
  <span style="color:#7C3AED">Ponte</span><span style="color:#A78BFA">Pay</span> · De dólar digital a pesos. En minutos. Sin entregar las llaves a nadie.
</div>

</v-click>

</div>
