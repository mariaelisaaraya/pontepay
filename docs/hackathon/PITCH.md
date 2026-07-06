# PontePay — Pitch Deck (script para presentar)

> **Formato:** 7 slides. Cada slide trae **título**, **bullets en pantalla** y una **nota del orador** (lo que se dice, no se proyecta).
> **Idioma:** español rioplatense. **Duración objetivo:** 4-5 min de pitch + demo de 1-2 min.
> **Hackathon:** PULSO Argentina (NearX + Stellar Development Foundation). Pitch presencial en Buenos Aires el 6-jul-2026.
> **Estado del producto:** testnet vivo — contrato V2 con comisiones escalonadas, 28/28 tests Rust, 25+ órdenes on-chain, oráculo Reflector visible en la app, SEP-24 completo, APY DeFindex en vivo.
> **App:** https://pontepay.vercel.app · **Contrato:** `CAVPPFFQ…3PMH` ([stellar.expert](https://stellar.expert/explorer/testnet/contract/CAVPPFFQSDJ6ALZPPEDKFL3URUBUDEC6DSPH5S3RS5COEWBRXXBF3PMH))

---

## Slide 1 — El problema: cobrás en dólar, vivís en peso

**En pantalla:**
- En Argentina, las **stablecoins fueron más de la mitad de todas las compras de cripto en pesos** (Chainalysis, *2025 Latin America Crypto Report*).
- Argentina es **#2 de Latinoamérica por volumen** cripto.
- Hoy convertir USDC a pesos = exchange **custodial** (entregás las llaves) o P2P informal **sin garantías**.
- Falta una rampa **no-custodial**, transparente y atada al sistema de pagos argentino.

**Nota del orador:**
"Arranco con un dato que no es opinión: según Chainalysis, en Argentina las stablecoins explican más de la mitad de las compras de cripto en pesos. Somos el segundo mercado de la región. ¿Quién está atrás de ese número? El freelancer que factura afuera y cobra en USDC, el dev remoto, el nómade. Todos los meses el mismo ritual: pasar dólar digital a pesos para el alquiler y el super. Y las opciones son malas: o un exchange custodial donde entregás tus llaves, o un Telegram donde transferís y rezás. Ese es el problema."

---

## Slide 2 — La solución: PontePay

**En pantalla:**
- **Marketplace P2P no-custodial** USDC (Stellar) ↔ peso argentino.
- El USDC queda **bloqueado en un contrato Soroban (escrow)**; se libera solo cuando ambas partes confirman.
- La pata en pesos viaja por **Transferencias 3.0 del BCRA** (QR interoperable EMVCo).
- Sin seed phrases: **ingresás con tu email** (Privy crea la wallet Stellar). Sin jerga cripto.

**Nota del orador:**
"PontePay es un marketplace P2P mobile-first: alguien publica una orden, otro la toma, y el USDC queda bloqueado en un contrato Soroban. Cuando el pago en pesos se confirma — por Transferencias 3.0, el estándar del Banco Central — el contrato libera la cripto. Si hay conflicto, lo resuelve un dispute resolver on-chain, y si la contraparte desaparece hay timeout automático que devuelve los fondos. En ningún momento una empresa custodia tu plata: el árbitro es el contrato. Y la entrada es un email — la abuela puede usarlo: nunca ve una seed phrase ni la palabra wallet."

---

## Slide 3 — Demo en vivo: todo verificable

**En pantalla:**
- **Mercado:** 25+ órdenes reales on-chain + **tasa de referencia del oráculo Reflector a la vista**.
- **Flujo completo:** confirmar → pagar (QR T3.0 / alias para copiar) → esperando → éxito.
- **Mis órdenes:** cada trade completado se expande y muestra su **hash on-chain → stellar.expert**.
- `GET /api/rates` → `"source": "contract"` · `GET /api/defindex/apy` → APY en vivo.

**Nota del orador:**
"Ahora la demo, y el hilo conductor es: nada de lo que ven es cartón pintado. El Mercado lista órdenes que viven en el contrato, con la tasa de referencia del oráculo arriba — ese número verde no lo ponemos nosotros. Tomamos una orden, pagamos la pata en pesos con el QR de Transferencias 3.0 — o copiando el alias si estás en el celular — y cuando el vendedor confirma, el contrato libera el USDC. El final es mi parte favorita: en Mis órdenes tocás la operación y tenés el botón 'Ver transacción on-chain' que te lleva al hash real en stellar.expert. Cualquiera del jurado puede verificarlo desde su teléfono ahora mismo."

> **Plan B (si falla la red):** video de demo de 1-2 min grabado + captura de `/api/rates` con `source:"contract"` + captura del hash en stellar.expert.

---

## Slide 4 — Por qué Stellar: cinco building blocks cargando peso

**En pantalla:**
- **Escrow Soroban (contrato propio, Rust):** create/take/confirm/dispute/timeout · **28/28 tests** · fills parciales.
- **Oráculo Reflector (SEP-40):** nuestro contrato hace una **cross-contract call** → tasa ARS/USD viva, imposible de manipular.
- **Privy:** email → wallet Stellar embebida que firma transacciones Soroban reales.
- **SEP-10 + SEP-24 completos:** challenge firmado → JWT → depósito interactivo con cualquier anchor.
- **DeFindex:** el USDC ocioso rinde — APY leído del vault en tiempo real.

**Nota del orador:**
"La profundidad técnica, primer criterio del jurado. Cinco piezas, todas reales. Uno: un contrato escrow propio en Rust con veintiocho tests — incluyendo fills parciales, disputas y timeouts. Dos, la feature estrella: la tasa no la pone un admin — nuestro contrato llama on-chain al oráculo Reflector, el mismo que usa todo el ecosistema; es una cross-contract call que pueden auditar. Tres: Privy convierte un email en una wallet Stellar que firma de verdad. Cuatro: SEP-10 y SEP-24 completos, no solo discovery — challenge firmado, JWT, y el popup interactivo del anchor. Cinco: mientras no operás, tu USDC rinde en un vault de DeFindex con APY leído en vivo. Cinco building blocks del ecosistema, cero decoración."

---

## Slide 5 — Modelo de negocio: el contrato cobra solo

**En pantalla:**
- **Comisión de plataforma escalonada, cobrada on-chain** al liberarse cada escrow:

| Tamaño del trade | Comisión |
|---|---|
| Hasta 10 USDC | 2,5% |
| 10 – 50 USDC | 1,5% |
| 50 – 200 USDC | 1,0% |
| Más de 200 USDC | 0,8% |

- Sin facturación, sin cobranza: **el contrato retiene la comisión en USDC** y la envía a la plataforma en la misma transacción.
- Escalonada = **premia el volumen** y es competitiva contra el spread oculto de los custodiales.
- Verificable: `get_fee_tiers` en el contrato. **Transparencia total: el fee está en el código.**

**Nota del orador:**
"¿Cómo ganamos plata? Simple y verificable: una comisión escalonada que el propio contrato cobra al liberar cada escrow. Dos y medio por ciento para operaciones chicas, bajando hasta cero coma ocho para las grandes. No hay facturación ni cobranza — el contrato retiene su parte en USDC en la misma transacción que libera los fondos. Un freelancer que convierte 500 dólares por mes nos deja unos 4 dólares; parece poco, pero escala con cada usuario y sin costo marginal. Y a diferencia de los custodiales, que esconden su margen en el spread, nuestro fee está literalmente en el código del contrato: cualquiera puede leerlo con get_fee_tiers."

---

## Slide 6 — Mercado e impacto en el ecosistema Stellar

**En pantalla:**
- Demanda **estructural** (no de bull market): inflación + cepo → refugio en dólar digital.
- **Originalidad:** primer puente conocido **Transferencias 3.0 ↔ Stellar**.
- Trae a Stellar un caso de uso **fiat-local concreto** y ejercita 5 building blocks core.
- Brecha visible: mostramos la **tasa oficial BCRA** junto a la de mercado.

**Nota del orador:**
"Segundo criterio: por qué le importa a Stellar. El mercado argentino es estructural — la gente no especula, se cubre — y nadie más está puenteando Transferencias 3.0 con Stellar: la infraestructura de pagos del Banco Central conectada al escrow on-chain. Para el ecosistema esto valida en un caso real cinco piezas core: Soroban, Reflector, SEP-24, Privy y DeFindex. Y sumamos transparencia argenta: la cotización oficial del BCRA al lado de la de mercado, con la brecha a la vista."

---

## Slide 7 — Equipo, estado real y ask

**En pantalla:**
- **Leo · Barb · Eli** — 3 personas, 10 días, PULSO Argentina.
- **Real hoy:** escrow V2 con fees escalonadas · oráculo on-chain · SEP-24 completo · DeFindex live · hash verificable por trade · CI verde.
- **Honestos sobre lo que falta:** testnet (mainnet es el siguiente paso) · historial local (backend con reputación en roadmap) · bridge CCTP y corredor a Brasil en modo demo.
- **Ask:** finalistas → mainnet → **Stellar Summit São Paulo**.

**Nota del orador:**
"Somos tres — Leo, Barb y Eli — y esto se construyó en los diez días de PULSO. Lo que vieron es real y lo pueden verificar: el contrato con sus comisiones, el oráculo, el anchor, el yield, cada trade con su hash. Y somos honestos con lo que falta, porque la rúbrica lo premia: estamos en testnet y el paso a mainnet es un redeploy con las claves correctas; el historial vive en el cliente y el backend con reputación real está en el roadmap; el bridge desde otras chains y el corredor a Brasil son demos del flujo, marcados como tales en la app. El pedido: queremos pasar a la final, salir a mainnet, y llevar este caso de uso — el freelancer argentino cobrando en dólar digital y viviendo en pesos — al Stellar Summit de São Paulo. Gracias."

---

## Notas para presentar IRL (6 julio, Buenos Aires)

- **Demo grabada como respaldo.** Video de 1-2 min + captura de `/api/rates` con `source:"contract"` + captura de un hash en stellar.expert, por si el wifi falla.
- **El contrato ya está sembrado** (25+ órdenes vivas en `CAVPPFFQ…3PMH`) y la app de producción apunta a él. No hace falta redeployar nada antes del pitch.
- **Abrí con el dato de Chainalysis** (>50% de compras en ARS son stablecoins): es el gancho más fuerte para un jurado argentino. Primeros 15 segundos.
- **Una persona habla, otra maneja la demo.** Practicá el handoff antes.
- **El momento Reflector:** en el Mercado, señalá la línea verde de "Tasa de referencia · Oráculo Reflector" — es la prueba visual de la cross-contract call.
- **El momento hash:** cerrá la demo tocando un trade completado en Mis órdenes → "Ver transacción on-chain" → stellar.expert. Es la respuesta definitiva a "¿esto es real?".
- **Defendé el modo demo, no lo escondas.** Las órdenes etiquetadas (demo) y los flujos simulados (bridge, Brasil) existen para que el jurado recorra la app sin fondos. Todo lo simulado está marcado con banner.
- **Si preguntan por seguridad:** disputas on-chain vía `dispute_resolver` (multisig antes de mainnet), timeouts automáticos de devolución, pausable por admin, y la key filtrada de un proveedor viejo ya fue eliminada y el CI valida cada push.
- **Cronometrá:** 4-5 min de pitch + 1-2 de demo. Si te pasás, cortá nota del orador — los bullets son el ancla.

---

## Mapa de claims → criterios del jurado

Los 4 criterios de PULSO: **(1)** Profundidad de integración técnica; **(2)** Impacto en el ecosistema Stellar; **(3)** Customer discovery y validación; **(4)** Calidad del deployment.

| Claim principal | Slide | Criterio |
|---|---|---|
| Oráculo Reflector leído on-chain vía cross-contract call, visible en el Mercado | 3, 4 | (1) |
| Escrow Soroban propio: 28/28 tests, fills parciales, disputas, timeouts, fees escalonadas | 4, 5 | (1) |
| Puente Transferencias 3.0 (QR EMVCo BCRA) ↔ Stellar, sin precedente conocido | 2, 6 | (2) |
| Cinco building blocks core ejercitados (Soroban, Reflector, SEP-24, Privy, DeFindex) | 4 | (1) + (2) |
| Mercado estructural: stablecoins >50% de compras en ARS, #2 LATAM (Chainalysis 2025) | 1, 6 | (3) |
| 5 entrevistas de discovery + brecha oficial/mercado a la vista | 6 | (3) |
| Contrato V2 en testnet con 25+ órdenes, oráculo configurado, CI verde, hash verificable por trade | 3, 7 | (4) |
| Modelo de negocio on-chain: fee tiers legibles en el contrato (`get_fee_tiers`) | 5 | (1) + (4) |
| Demos marcados con banner (bridge, corredor Brasil) — honestidad declarada | 7 | (4) + (3) |
