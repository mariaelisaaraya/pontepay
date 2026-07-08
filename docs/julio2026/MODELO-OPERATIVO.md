# PontePay — Modelo Operativo

> **Para:** Eli, Leo y Barb · Julio 2026
> **Guía usada:** los decks de ank ("Modelo Operativo ank card [Mambu]" e "Integration Overview") — el mismo tipo de documento, llevado a PontePay.
> **Versión presentable:** `Modelo-Operativo-PontePay.pptx` (esta carpeta).

---

## La pregunta: ¿somos una tarjeta de crédito o un modelo de pagos P2P?

**Respuesta corta: somos un modelo de pagos P2P (un exchange peer-to-peer con escrow). NO somos una tarjeta.** Y la comparación con ank lo deja clarísimo:

ank era un **emisor/adquirente de tarjetas**: su negocio vivía dentro del sistema de tarjetas (Mastercard/Visa), con toda su maquinaria — BIN, marca, adquirente, clearing por lotes, presentaciones, contracargos, interchange, un core bancario (Mambu) llevando las cuentas, y liquidaciones que tardan de 48 horas a 18 días.

PontePay reemplaza esa maquinaria entera por **un contrato + una transferencia bancaria instantánea**:

| Pieza del modelo tarjeta (ank) | Equivalente en PontePay |
|---|---|
| Comercio y comprador | **Vendedor y comprador P2P** (personas) |
| Emisor + Adquirente (bancos/fintechs en el medio) | **Nadie** — los reemplaza el contrato escrow |
| Marca (Mastercard/Visa) — las reglas y la red | **Red Stellar** — las reglas son el código del contrato |
| Core bancario (Mambu) — el libro de cuentas | **La blockchain** — el libro es público y verificable |
| Procesador (Fiserv) | **RPC/Horizon de Stellar** (infraestructura de acceso) |
| Interchange + MDR (comisiones del sistema) | **Fee de plataforma escalonado** (2,5% → 0,8%), cobrado por el contrato |
| Clearing por lotes + presentaciones (48hs a 18 días) | **Liquidación atómica on-chain (~5 segundos)** |
| Contracargos y disputas (proceso Mastercard) | **Disputas on-chain** (dispute resolver) + **timeouts automáticos** |
| Pata en pesos: la tarjeta misma | Pata en pesos: **Transferencias 3.0 del BCRA** (QR/alias) |
| Riesgo central: ank custodia y asume riesgo crediticio | **Riesgo central eliminado:** nadie custodia; no hay crédito |

**La frase para recordar:** ank necesitaba ser banco-sin-ser-banco (emisor, adquirente, core, clearing). PontePay no necesita ser nada de eso: **el contrato es el emisor, el adquirente y el core al mismo tiempo** — y liquida en 5 segundos en vez de 18 días.

**¿Y una tarjeta PontePay, nunca?** Puede existir — como **capa de gasto futura** (fase post-mainnet): "gastá tu USDC con tarjeta". En Stellar ya hay proveedores financiados por SCF que emiten tarjetas sobre wallets (Kulipa, Arculus, Wirex). Sería una integración, no un cambio de modelo: seguiríamos siendo P2P con una salida más. Está en el roadmap como opcional — no define quiénes somos.

---

## Actores del modelo PontePay

| Actor | Rol | Riesgo que asume |
|---|---|---|
| **Vendedor** (ej. freelancer) | Publica orden, entrega USDC al escrow, confirma cuando recibe pesos | Su USDC está protegido por el contrato; espera el pago fiat |
| **Comprador** (ej. ahorrista) | Toma la orden, paga pesos por T3.0, prueba el pago | Paga fiat antes de recibir cripto — lo protege el escrow + disputa |
| **Contrato escrow (Soroban)** | Custodia temporal, libera/devuelve, cobra fee, resuelve por reglas | Ninguno — es código auditado (28/28 tests) |
| **Oráculo Reflector** | Provee la tasa de referencia ARS/USD on-chain | — |
| **Dispute resolver** | Arbitra disputas (hoy admin; multisig antes de mainnet) | Operacional |
| **Plataforma (nosotros)** | UX, indexer, notificaciones, mercado | **NO custodia fondos** — nuestro backend es espejo, no caja fuerte |
| **Anchor (futuro: Anclap)** | Rampa pesos↔Stellar regulada para depósito/retiro | Regulatorio (de ellos) |

---

## Flujo operativo de un trade (el "modelo de autorización" de PontePay)

Numerado como los diagramas de ank:

1. **Vendedor publica la orden** → el contrato **bloquea su USDC** (equivale a la "autorización": los fondos están garantizados desde el segundo cero).
2. **Comprador toma la orden** (total o parcial — hay fills parciales).
3. **La app muestra la pata fiat**: QR de Transferencias 3.0 o alias/CVU para copiar, por el monto exacto en pesos (tasa de referencia: oráculo).
4. **Comprador paga por su banco** y marca "ya envié el pago" → queda registrado on-chain (`submit_fiat_payment`, con hash).
5. **Vendedor ve el aviso y confirma la recepción** en su home banking → `confirm_fiat_payment`.
6. **El contrato libera**: USDC al comprador, **fee a la plataforma, todo en la misma transacción** (~5 segundos). Equivale al "clearing + liquidación" de ank, que tardaba de 48hs a 18 días.
7. **Caminos de excepción:** si el vendedor no confirma → **timeout automático** resuelve; si hay conflicto → **disputa on-chain** ante el dispute resolver. (El equivalente a los contracargos, sin Mastercard en el medio.)

**Dos flujos en paralelo, como en los diagramas de ank:**
- **Flujo on-chain** (el "flujo financiero"): lock → registro de pago → liberación + fee. Todo con hash verificable.
- **Flujo fiat** (el "flujo de archivos"): QR/alias T3.0 → transferencia bancaria → confirmación humana. El punto de encuentro es el paso 4-5.

---

## Modelo de ingresos (el "interchange" de PontePay)

Como ank cobraba interchange por transacción, PontePay cobra un fee por trade — pero **el fee está en el código del contrato** (`get_fee_tiers`), no en un tarifario negociado:

| Tamaño del trade | Fee | Equivalente mensual (usuario típico) |
|---|---|---|
| Hasta 10 USDC | 2,5% | — |
| 10–50 USDC | 1,5% | — |
| 50–200 USDC | 1,0% | Freelancer que convierte 500/mes ≈ USD 5 |
| 200+ USDC | 0,8% | Power user 1.500/mes ≈ USD 12 |

Futuro (roadmap): parte del fee vuelve como cashback al Earn (**PontePay Frecuente**) — retención pagada con margen propio, techo mensual, estilo Venmo Stash.

---

## Detalle de implementación (los "considerandos" del deck de ank)

- **Seguridad de fondos:** no existe pozo común; el único USDC "en la app" es el de escrows activos, cada uno con dueño y timeout. Backend espejo: si arde, la plata ni se entera.
- **Tasa:** referencia del oráculo Reflector vía cross-contract call; fallback Reflector directo → BCRA. La brecha oficial/mercado se muestra.
- **Identidad/keys:** hoy Privy (email → wallet embebida). Roadmap: passkeys (clave en el teléfono del usuario).
- **Cumplimiento (mainnet):** el anchor regulado (Anclap) concentra el KYC de la pata fiat; PontePay no toca pesos — los pesos van de banco a banco entre usuarios.
- **Límites operativos:** duración de órdenes (7 días), timeout de pago fiat (30 min), pausable por admin ante emergencia (sin bloquear salida de fondos).

---

## Integración (el "Integration Overview" de PontePay)

```
CANALES:        App móvil/web (Next.js) — es la misma app, mobile-first
IDENTIDAD:      Privy (hoy) → Passkeys (roadmap)
ON-CHAIN:       Contrato P2P V2 (Soroban) · Oráculo Reflector · DeFindex (Earn)
                └── acceso vía RPC Soroban + Horizon
FIAT:           Transferencias 3.0 (QR EMVCo / alias) — banco a banco entre usuarios
                └── futuro: Anclap (SEP-24) para depósito/retiro directo
BACKEND ESPEJO: Indexer de eventos → historial, reputación, rachas, notificaciones, métricas
                └── regla de oro: cero fondos, cero claves que muevan plata
```
