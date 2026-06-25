# PontePay — Modelo de Revenue

> Actualizado: 2026-06-25. Basado en análisis competitivo de Foxbit, Meru, Belo, Lemon, Buenbit.

---

## Principio de diseño

El fee **nunca se muestra como comisión**. Se embebe en el tipo de cambio, exactamente como lo hace un banco o cualquier exchange de primera línea (Foxbit, Belo, Meru). El usuario compara "el precio del dólar hoy", no "cuánto me cobran". Esto no es engaño — es el estándar de la industria, y en PontePay el spread es **auditable on-chain** (a diferencia de la competencia).

---

## Fuentes de ingreso

### 0. Oferta de lanzamiento — 0% spread (activo en mainnet launch)

Al encender el mainnet, se activa `NEXT_PUBLIC_LAUNCH_OFFER=true` en Vercel. El usuario opera al mid-rate exacto del oracle Reflector — **0% spread, precio de mercado puro**.

- Costo marginal por tx ≈ $0.000012 (Stellar fee) → operar a 0% spread no genera pérdidas reales
- La oferta se controla con variables de entorno, sin cambiar código
- Opcionalmente se agrega `NEXT_PUBLIC_LAUNCH_OFFER_EXPIRES` cuando se decide la fecha de fin
- Una vez desactivada, los tiers decrecientes entran automáticamente

**Referencia competitiva:** Foxbit usó "taxa zero em saques" en 2021 para adquirir masa crítica en 90 días. Ellos sí tienen costos variables — nosotros no.

---

### 1. Spread decreciente por monto — post-lanzamiento (activo cuando expira la oferta)

El oracle Reflector devuelve el mid-rate en tiempo real. El spread es decreciente según el monto — a más volumen, mejor precio:

| Monto (USDC) | Spread | Ejemplo compra (mid = 1.485) | Ejemplo venta |
|-------------|--------|------------------------------|---------------|
| < $10       | **2.5%** | 1.525 ARS | 1.445 ARS |
| $10 – $50   | **1.5%** | 1.510 ARS | 1.460 ARS |
| $50 – $200  | **1.0%** | 1.500 ARS | 1.470 ARS |
| $200+       | **0.8%** | 1.500 ARS | 1.470 ARS |

El redondeo a múltiplos de 5 ARS hace que el número se vea como cotización de mercado real.  
El mid-rate **nunca se muestra directamente** al usuario — solo el buyRate o sellRate según la operación.

Implementación: `src/lib/pricing.ts` → `FEE_TIERS`, `getPlatformRatesForAmount(midRate, amountUsdc)`.

### 2. Fee on-chain — 0.5% (activo, en contrato Soroban)

Ejecutado automáticamente en `confirm_fiat_payment`. Invisible en la UX, declarado en el README y auditable en el contrato desplegado en testnet.

### Fee total efectivo por trade: ~1.3%

Benchmark competitivo:
- Foxbit Swap: 0.5–2% no declarado (waiver contractual en ToS 4.2.3)
- Binance P2P: ~1–2% spread implícito + fee de trading
- Lemon/Belo: spread no publicado
- Cuevas: ~2% promedio (dato de customer discovery)

**El 1.3% de PontePay es competitivo y más transparente que todas las alternativas.**

---

### 3. PontePay Earn — yield en USDC idle (Q3 2026)

USDC en órdenes no tomadas o en balance del usuario genera yield vía **Blend Protocol** en Stellar.

Modelo: Blend paga X% APY → mostramos (X - margen)% al usuario → retenemos el margen.  
Ejemplo: Blend a 8% → mostramos 6% → PontePay retiene 2% sobre el capital.

Stack disponible: `@defindex/sdk` ya instalado en el proyecto. Contratos Blend activos en Stellar testnet.

### 4. PontePay Pay — conversión para comerciantes (Q4 2026)

Fee del 0.5% por conversión USDC→ARS para comerciantes que aceptan cripto y necesitan pesos.

Producto separado con landing propia. Target: Segmento C del customer discovery (locales, profesionales, servicios que reciben USDC de clientes).

Benchmark: Foxbit Pay cobra 0.5% por el mismo servicio en Brasil (BRL). Aerodex (aerolíneas) lo usa para cobrar tickets en stablecoins.

### 5. Plan Maker Premium — volumen (Q1 2027)

Makers que superan N operaciones mensuales acceden a spread reducido (0.5% en vez de 0.8%) a cambio de publicar órdenes con spreads más ajustados. Retiene la liquidez que hace funcionar el P2P.

### 6. DCA Automático — ahorro recurrente en USDC (Q1 2027)

Compra automática periódica de USDC a partir de ARS (quincenal o mensual). Target: Segmento D (ahorristas anti-inflación).

Benchmark: Foxbit tiene "compra recorrente" como feature de retención. No es P2P — es compra directa al spread de plataforma.

---

## Tabla de revenue por etapa

| Etapa | Fuente | Estado |
|-------|--------|--------|
| Hackathon / testnet | Spread 0.8% + fee on-chain 0.5% | **Activo** |
| Q3 2026 — mainnet | + PontePay Earn (yield vía Blend) | En roadmap |
| Q4 2026 | + PontePay Pay (comerciantes) | En roadmap |
| Q1 2027 | + Maker Premium + DCA automático | Backlog |

---

## Sostenibilidad económica del 0.8%

### Estructura de costos fijos (MVP / testnet)

| Componente | Costo mensual |
|-----------|--------------|
| Vercel Pro (producción, SLA, dominios) | $20 USD |
| Dominio (.com.ar o .io) | $1 USD |
| Stellar network fees (~0.00001 XLM/op) | $0.00 (despreciable) |
| Privy (hasta 100 MAU activos) | $0 (free tier) |
| **Total fijo MVP** | **$21 USD/mes** |

> Privy sube a $249/mes en plan Business (>100 MAU). A ese punto el volumen ya debería cubrirlo.

### Revenue por operación

| Operación | Cálculo | Revenue |
|-----------|---------|---------|
| $100 USDC tradeado | spread 0.8% + fee on-chain 0.5% | **$1.30 USD** |
| $50 USDC | ídem | $0.65 USD |
| $200 USDC | ídem | $2.60 USD |

### Punto de equilibrio (break-even)

$$\text{ops necesarias} = \frac{\$21}{\$1.30} \approx \textbf{17 operaciones de \$100/mes}$$

Equivale a **menos de 1 operación por día** — umbral alcanzable desde el primer mes de lanzamiento.

### Proyección a escala

| Usuarios activos | Volumen mensual estimado | Revenue bruto | Costos | **Utilidad** |
|-----------------|------------------------|---------------|--------|-------------|
| 50 (MVP) | $5,000 | $65 | $21 | **$44** |
| 200 | $20,000 | $260 | $270 | **-$10** _(Privy upgrade)_ |
| 500 | $50,000 | $650 | $280 | **$370** |
| 2,000 | $200,000 | $2,600 | $400 | **$2,200** |

> El gap negativo a 200 usuarios se resuelve subiendo el volumen promedio por usuario o aplicando el plan Maker Premium antes.

### ¿Por qué 0.8% y no más ni menos?

- **Mínimo viable**: a 0.5% el break-even sube a 28 ops/mes — aún alcanzable pero sin margen de error
- **Competitivo**: por encima de 1.2% perdemos usuarios vs. Meru (1%) y Lemon (~1.2%)
- **El sweet spot es 0.8%** — cheaper than everyone visible, enough margin to sustain ops

---

## Monto mínimo y medidas anti-abuso

### Sin monto mínimo — modelo de fee por tramo

PontePay acepta **cualquier monto, cualquier moneda**. En vez de bloquear operaciones pequeñas, aplicamos un fee diferenciado automáticamente:

| Tramo | Spread aplicado | Fee on-chain | Fee efectivo total | Caso de uso |
|-------|----------------|-------------|-------------------|-------------|
| **Quick Pay** — < 10 USDC | **2.50%** | 0% | **2.5%** | Pagos rápidos, microtransacciones |
| **Standard** — ≥ 10 USDC | **0.80%** | 0.5% | **~1.3%** | Ahorro, remesas, P2P |

**¿Por qué 2.5% en Quick Pay?**
- A $5 USDC → fee = $0.125 — cubre overhead de procesar la tx y genera margen
- A $1 USDC → fee = $0.025 — viable, simplemente más cara en términos relativos
- El fee sigue embebido en el tipo de cambio — el usuario ve el precio, no la comisión

**Diferenciador vs. competidores:**
- Meru: bloquea montos < $5 USD → **nosotros no**
- Binance P2P: mínimo $10-20 USDC por orden → **nosotros aceptamos todo**
- Lemon: mínimo $1 USD pero requiere KYC completo → **nosotros email-only**
- **PontePay: sin mínimo — el mercado decide el tamaño de la operación**

Implementado en `src/lib/pricing.ts` → `getPlatformRatesForAmount(midRate, amountUsdc)`.

### Reglas anti-abuso (a implementar antes de mainnet)

#### 1. Rate lock — 10 minutos
El precio se congela cuando el taker acepta una orden. Si no paga en 10 min, la orden vuelve al pool. Esto evita que alguien bloquee una orden mientras espera que el tipo de cambio le favorezca.

_Binance P2P: 15 min. Meru: 5 min para transfers. Adoptamos 10 min — suficiente para Transferencias 3.0._

#### 2. Límite de cancelaciones — 3 por día
Más de 3 cancelaciones en 24 hs activa un cooldown de 24 hs. Impide ghosting de makers (aceptar y no pagar).

_Binance P2P: 3 cancelaciones/mes antes de restricción permanente. Somos más permisivos en MVP._

#### 3. Órdenes abiertas simultáneas
- Cuenta nueva (< 5 trades completados): máximo 1 orden activa
- Cuenta establecida: máximo 3 órdenes activas

Evita que un actor monopolice el orderbook sin liquidez real.

#### 4. Límite diario sin verificación — $500 USDC
Alineado con los límites informales de UIF Argentina para operaciones sin KYC extendido. Por encima requiere verificación de identidad (roadmap Q3 2026).

_Lemon sin KYC: ~$300/mes. Meru sin KYC: $500/día. Adoptamos $500/día._

#### 5. Expiración de orden — 30 minutos para fondear el escrow
Después de crear una orden como maker, tiene 30 min para depositar USDC en el escrow. Si no lo hace, la orden se cancela automáticamente.

#### 6. Completion rate mínimo para makers — 70%
Después de 10 operaciones completadas, el maker necesita ≥70% de completion rate para seguir publicando órdenes. Debajo de eso, solo puede tomar órdenes (no publicar).

_Binance P2P: 80% de completion rate requerido._

#### 7. IP rate limit — 5 órdenes por hora por IP
Capa de defensa básica contra bots y scripts de spam. Implementable en middleware de Next.js.

### Resumen de parámetros (implementar en `src/lib/trade-limits.ts`)

```typescript
export const TRADE_LIMITS = {
  MIN_USDC:             10,     // mínimo por operación en USDC
  RATE_LOCK_MINUTES:    10,     // minutos que el precio queda bloqueado
  MAX_CANCELS_PER_DAY:  3,      // cancelaciones antes de cooldown
  COOLDOWN_HOURS:       24,     // horas de cooldown tras superar límite
  MAX_OPEN_ORDERS_NEW:  1,      // órdenes abiertas para cuenta < 5 trades
  MAX_OPEN_ORDERS_EST:  3,      // órdenes abiertas para cuenta establecida
  DAILY_LIMIT_USDC:     500,    // límite diario sin KYC extendido
  ESCROW_FUND_MINUTES:  30,     // tiempo para fondear el escrow como maker
  MIN_COMPLETION_RATE:  0.70,   // para makers con 10+ trades
  IP_ORDERS_PER_HOUR:   5,      // rate limit por IP
} as const;
```

---

## Lo que NO hacemos (diferenciadores de modelo)

- No usamos omnibus / cuenta custodia — el USDC vive en el contrato Soroban, no en nosotros
- No tenemos "taxa de guarda segura" oculta por inactividad (como Foxbit ToS 12.6.3)
- No aplicamos fees de crypto "sin aviso previo" (como Foxbit — usuarios pagaron 13x el costo real de blockchain)
- No tenemos waiver contractual para esconder el spread (como Foxbit ToS 4.2.3)
- El spread del 0.8% está implementado en código abierto y auditable on-chain
