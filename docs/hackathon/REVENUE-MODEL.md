# PontePay — Modelo de Revenue

> Actualizado: 2026-06-25. Basado en análisis competitivo de Foxbit, Meru, Belo, Lemon, Buenbit.

---

## Principio de diseño

El fee **nunca se muestra como comisión**. Se embebe en el tipo de cambio, exactamente como lo hace un banco o cualquier exchange de primera línea (Foxbit, Belo, Meru). El usuario compara "el precio del dólar hoy", no "cuánto me cobran". Esto no es engaño — es el estándar de la industria, y en PontePay el spread es **auditable on-chain** (a diferencia de la competencia).

---

## Fuentes de ingreso

### 1. Spread en el tipo de cambio — 0.8% (activo)

El oracle Reflector devuelve el mid-rate en tiempo real vía cross-contract call.  
Mostramos al usuario:

| Precio | Cálculo | Ejemplo (mid = 1.461) |
|--------|---------|----------------------|
| Compra (buyRate) | mid × 1.008, redondeado a múltiplo de 5 ARS | **1.475 ARS** |
| Venta (sellRate) | mid × 0.992, redondeado a múltiplo de 5 ARS | **1.450 ARS** |

El redondeo a múltiplos de 5 ARS hace que el número se vea como cotización de mercado real.  
El mid-rate **nunca se muestra directamente** al usuario — solo el buyRate o sellRate según la operación.

Implementación: `src/lib/pricing.ts` — `SPREAD_BPS = 80`, `ROUND_STEP_ARS = 5`.

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

## Lo que NO hacemos (diferenciadores de modelo)

- No usamos omnibus / cuenta custodia — el USDC vive en el contrato Soroban, no en nosotros
- No tenemos "taxa de guarda segura" oculta por inactividad (como Foxbit ToS 12.6.3)
- No aplicamos fees de crypto "sin aviso previo" (como Foxbit — usuarios pagaron 13x el costo real de blockchain)
- No tenemos waiver contractual para esconder el spread (como Foxbit ToS 4.2.3)
- El spread del 0.8% está implementado en código abierto y auditable on-chain
