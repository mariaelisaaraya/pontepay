# PeerlyPay — Pitch Deck (script para presentar)

> **Formato:** ~10 slides. Cada slide trae **título**, **bullets en pantalla** y una **nota del orador** (lo que se dice, no se proyecta).
> **Idioma:** español rioplatense. **Duración objetivo:** 4-5 min de pitch + demo de 1-2 min.
> **Hackathon:** PULSO Argentina (NearX + Stellar Development Foundation). Deadline 30-jun-2026, pitch presencial en Buenos Aires el 6-jul-2026.
> **Estado del producto:** testnet vivo, contrato Soroban desplegado, 20/20 tests Rust pasando. Lo que es mock está marcado honestamente en el README (la rúbrica premia documentar los mocks).

---

## Slide 1 — El problema: cobrás en dólar, vivís en peso

**En pantalla:**
- En Argentina, las **stablecoins fueron más de la mitad de todas las compras de cripto en pesos** entre jul-2024 y jun-2025 (Chainalysis, *2025 Latin America Crypto Report*).
- Argentina es **#2 de Latinoamérica por volumen** cripto.
- Drivers estructurales: **inflación persistente, volatilidad cambiaria y controles de capital (cepo)**.
- No es una moda de bull market: es **demanda estructural** de refugio en dólar digital.

**Nota del orador:**
"Arranco con un dato que no es opinión: según el informe LATAM 2025 de Chainalysis, en Argentina las stablecoins explican más de la mitad de las compras de cripto medidas en pesos. Somos el segundo mercado de la región. Y esto no es entusiasmo de mercado alcista: es una respuesta estructural a la inflación, a la volatilidad del peso y al cepo. La gente no especula, se cubre. Con la disinflación de la era Milei la tasa de crecimiento se moderó, pero la demanda de fondo sigue intacta: el problema que resolvemos no se va a ir."

---

## Slide 2 — Quién sufre: el freelancer dolarizado

**En pantalla:**
- **Freelancers, nómades digitales y remote workers** argentinos cobran en **USDC** y gastan en **pesos**.
- Cada mes: convertir cripto a ARS para pagar alquiler, super, servicios.
- Hoy: o usan exchanges **custodiales** (entregás las llaves) o P2P informal **sin escrow** (confianza ciega, riesgo de fraude).
- Falta: una rampa **no-custodial**, transparente y atada a la transferencia bancaria local.

**Nota del orador:**
"¿Quién es la persona concreta? El freelancer que factura a una empresa de afuera y cobra en USDC, el nómade digital, el dev remoto. Todos los meses tienen el mismo ritual: pasar dólar digital a pesos para vivir. Hoy las opciones son malas: o un exchange custodial donde entregás tus llaves, o un P2P informal por grupo de Telegram donde mandás plata y rezás. No hay escrow, no hay garantía. Nosotros le hablamos a esa persona."

---

## Slide 3 — La solución: PeerlyPay

**En pantalla:**
- **Marketplace P2P no-custodial** USDC (Stellar) ↔ peso argentino (ARS).
- El creador publica una orden (vender cripto por pesos / comprar cripto con pesos); el taker la toma.
- El **USDC queda en escrow en un contrato Soroban**; una parte prueba el pago fiat off-chain y el contrato libera al destinatario correcto.
- **Disputas resueltas on-chain** por un `dispute_resolver`. Vos siempre tenés el control de tus fondos.

**Nota del orador:**
"PeerlyPay es un marketplace P2P, mobile-first y no-custodial, para cambiar USDC en Stellar por pesos y viceversa. El flujo es simple: alguien publica una orden, otro la toma, el USDC se bloquea en un contrato Soroban en escrow. Cuando se prueba el pago en pesos por fuera de la cadena, el contrato libera la cripto a quien corresponde. Si hay conflicto, se resuelve on-chain mediante un resolutor de disputas. La clave: en ningún momento un tercero custodia tus fondos. El contrato es el árbitro, no una empresa."

---

## Slide 4 — Por qué Stellar: profundidad de integración

**En pantalla:**
- **Contrato Soroban desplegado en testnet:** `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ` — 20/20 tests Rust pasando.
- **Oráculo Reflector on-chain (SEP-40):** nuestro contrato hace una **cross-contract call** a Reflector y devuelve la tasa ARS/USD viva. `reference_rate(ARS) ≈ 1461`. Reemplazó un `MOCK_RATE` hardcodeado.
- **Crossmint smart wallets** (email-signer, testnet): escrituras reales al contrato con polling on-chain cada 5s.
- **SEP-24 anchor discovery:** leemos en vivo las capacidades del anchor testnet de la SDF (USDC deposit/withdraw, SEP-10 auth).

**Nota del orador:**
"Acá está la profundidad técnica, que es uno de los cuatro criterios del jurado. Stellar no es un slide decorativo: es el motor. Tenemos un contrato Soroban desplegado y testeado, 20 de 20 tests pasando. La feature estrella: la tasa de cambio no la pone un admin a dedo. Nuestro propio contrato llama on-chain, en una cross-contract call, al oráculo Reflector SEP-40, y devuelve la tasa ARS/USD real, hoy alrededor de 1461. Antes teníamos un mock hardcodeado de 1485; lo matamos. Las firmas las maneja Crossmint con smart wallets, y descubrimos en vivo las capacidades del anchor SEP-24 de la Stellar Development Foundation. Cuatro building blocks reales, todos cargando peso."

---

## Slide 5 — El diferenciador argentino: Transferencias 3.0

**En pantalla:**
- La pantalla de pago genera un **QR interoperable EMVCo MPM** (CRC16/CCITT) = una solicitud de **Transferencias 3.0 del BCRA** por el monto en pesos.
- Ese QR es **el gatillo off-chain** que libera el escrow on-chain. **No conocemos otro proyecto que puentee T3.0 con Stellar.**
- **Transparencia de tasa oficial BCRA:** mostramos la cotización oficial USD/ARS del Banco Central junto a la de mercado (la brecha, a la vista).
- Competidores (Lemon, Belo, Buenbit, Ripio) son **mayormente custodiales**. Anclap probó que ARS-on-Stellar es real; nosotros sumamos **no-custodial + T3.0**.

**Nota del orador:**
"Acá nos despegamos. La pata en pesos se hace con Transferencias 3.0, el estándar de pagos interoperables del Banco Central. En la pantalla de pago renderizamos un QR EMVCo real, con su CRC, que representa una solicitud T3.0 por el monto exacto. Ese pago en el mundo bancario es lo que dispara la liberación del escrow en la cadena. Hasta donde sabemos, nadie más está puenteando Transferencias 3.0 con Stellar. Y sumamos transparencia: mostramos la tasa oficial del BCRA al lado de la de mercado, así se ve la brecha. Los incumbentes —Lemon, Belo, Buenbit, Ripio— son mayormente custodiales. Anclap ya demostró que el peso vive en Stellar; nosotros agregamos lo que falta: no-custodial y nativo de Argentina."

---

## Slide 6 — Demo en vivo

**En pantalla:**
- **/api/rates** → tasa viva *a través de nuestro contrato* (`source: "contract"`, contract=1461, reflector≈1461.92, BCRA oficial=1461).
- **Flujo real de trade:** confirm → payment (QR T3.0) → waiting (polling on-chain) → success, con escrituras Crossmint reales al contrato.
- **/anchor:** capacidades SEP-24 del anchor de la SDF, leídas en vivo.
- Marketplace y detalle de orden enrutan al **flujo real** (sin simulación auto-avanzada).

**Nota del orador:**
"Lo que vamos a mostrar en vivo: primero, el endpoint de tasas, que lee la cotización pasando por nuestro propio contrato —fíjense que la fuente dice 'contract'— con el fallback a Reflector directo, a BCRA y a constante. Después, el flujo completo de una operación: confirmar, pagar con el QR de Transferencias 3.0, esperar mientras hacemos polling on-chain cada 5 segundos, y éxito; todo con escrituras reales al contrato vía Crossmint. Y la página de anchor leyendo las capacidades SEP-24 de la SDF. No hay simulación de cartón: el marketplace entra al flujo real y lee datos reales de la cadena."

> **Plan B (si falla la red en vivo):** tener grabado el video de demo de 1-2 min y una captura de `/api/rates` con `source:"contract"`.

---

## Slide 7 — Mercado e impacto en el ecosistema Stellar

**En pantalla:**
- Mercado: **demanda estructural** de USD digital en Argentina (#2 LATAM; stablecoins >50% de compras en ARS — Chainalysis 2025).
- Aporte al ecosistema: trae a Stellar un **caso de uso fiat-local concreto** (P2P no-custodial + rampa T3.0).
- Usa y **valida building blocks core de Stellar**: oráculo Reflector (SEP-40), anchors SEP-24, smart wallets.
- **Originalidad:** primer puente conocido Transferencias 3.0 ↔ Stellar.

**Nota del orador:**
"Por qué le importa a Stellar, que es el segundo criterio del jurado, impacto en el ecosistema. El mercado es real y estructural: segundo de la región, stablecoins explicando más de la mitad de las compras en pesos. PeerlyPay le aporta a Stellar un caso de uso fiat-local muy concreto: una rampa P2P no-custodial atada a la infraestructura de pagos argentina. Y ejercitamos building blocks del núcleo de Stellar —Reflector, anchors SEP-24, smart wallets— de forma genuina. La originalidad está en el puente T3.0, que no vimos en ningún otro lado."

---

## Slide 8 — Tracción y estado: honestos sobre lo que falta

**En pantalla:**
- **Vivo en testnet:** contrato desplegado y configurado con oráculo (`set_oracle`), 20/20 tests Rust (incl. 2 tests de oráculo).
- **Real hoy:** escrow Soroban, lectura de tasa on-chain vía Reflector, escrituras Crossmint, QR T3.0, discovery SEP-24, integración tasa oficial BCRA.
- **Mock/scaffold (declarado en el README):** SEP-24 deposit/withdraw firmado (discovery sí, firma es el próximo paso); trustline check es stub; sin backend (estado en localStorage/Zustand); disputa cross-chain Base/Slice es solo-docs (la disputa real es single-chain vía `dispute_resolver`).
- **Roadmap a mainnet:** redeploy desde admin propio fundeado → `make p2p-seed-orders` → completar firma SEP-24 → backend con reputación real.

**Nota del orador:**
"Estado real, sin maquillaje, porque la rúbrica premia la honestidad. Está vivo en testnet, el contrato está desplegado y con el oráculo configurado, 20 de 20 tests pasan. Es real: el escrow, la lectura de tasa on-chain, las escrituras Crossmint, el QR T3.0, el discovery del anchor y la tasa oficial del BCRA. Lo que es mock lo decimos en el README: el depósito SEP-24 firmado está scaffoldeado, el discovery anda pero la firma es el próximo paso; el chequeo de trustline es un stub; no hay backend todavía, el estado vive en el cliente; y la disputa cross-chain con Base es solo aspiracional en docs, la disputa real es single-chain por el contrato. El camino a mainnet es claro: redeployar desde un admin propio fundeado, sembrar órdenes, cerrar la firma SEP-24 y montar el backend con reputación real."

---

## Slide 9 — Equipo

**En pantalla:**
- **Alexis · Steven · Stefano · Barb** — equipo de 4.
- Construido en 10 días para PULSO Argentina (NearX + Stellar Development Foundation).
- Stack: Next.js 16 / React 19 / TypeScript / Tailwind v4 / Zustand · Soroban (Rust, soroban-sdk 23.1.1) · Crossmint.
- Repo público open-source con README claro y mocks documentados.

**Nota del orador:**
"Somos cuatro: Alexis, Steven, Stefano y Barb. Lo construimos en los diez días de PULSO. El stack es moderno de punta a punta: Next.js 16 y React 19 en el front, un contrato Soroban en Rust en la cadena, y Crossmint para las wallets. Todo open-source, repo público, README claro, y los mocks documentados para que el jurado vea exactamente qué es real y qué falta."

---

## Slide 10 — Cierre y ask

**En pantalla:**
- **PeerlyPay = la rampa USDC↔ARS no-custodial que Argentina necesita, nativa de Stellar.**
- Profundidad real: oráculo on-chain, escrow Soroban, T3.0, anchor SEP-24.
- **Ask:** pasar a finalistas → completar SEP-24 firmado y desplegar en mainnet → ir al Stellar Summit São Paulo.
- Repo + demo + 5 entrevistas de descubrimiento → todo en `docs/hackathon/`.

**Nota del orador:**
"Cierro. PeerlyPay es la rampa no-custodial entre dólar digital y peso que Argentina necesita, y la construimos nativa de Stellar, con profundidad técnica real: oráculo on-chain, escrow Soroban, Transferencias 3.0 y discovery de anchor. Lo que pedimos: queremos llegar a la final, cerrar la firma SEP-24 y desplegar en mainnet, y representar este caso de uso en el Stellar Summit de São Paulo. Todo está en el repo: código, demo y nuestras entrevistas de descubrimiento. Gracias."

---

## Notas para presentar IRL (6 julio, Buenos Aires)

- **Demo grabada como respaldo.** Tener el video de 1-2 min y una captura de `/api/rates` mostrando `source:"contract"` por si el wifi de la sede falla. Nunca dependas solo del internet del lugar.
- **Redeployar antes del pitch.** El contrato de testnet listado usa una **admin key descartable y no tiene órdenes sembradas**. Redeployá desde una identidad admin propia y fundeada, corré `make p2p-seed-orders` y seteá `NEXT_PUBLIC_P2P_CONTRACT_ID`, así la demo muestra órdenes reales.
- **Recordá el build env:** la máquina Windows del equipo no tiene linker C; compilá/testeá/desplegá vía WSL Ubuntu (`wsl bash "/mnt/c/.../contracts/<script>.sh"`). No corras los scripts desde Git Bash (rompe los paths `/mnt`).
- **Abrí con el dato de Chainalysis** (>50% de compras en ARS son stablecoins): es el gancho más fuerte para un jurado argentino. Que lo escuchen en los primeros 15 segundos.
- **Una persona habla, otra maneja la demo.** Asigná roles: un orador, un piloto de pantalla. Practicá el handoff.
- **Defendé los mocks, no los escondas.** Si preguntan por SEP-24 firmado o por la disputa cross-chain, respondé con el roadmap. La rúbrica premia honestidad; un mock declarado suma más que una promesa vacía.
- **Tené a mano el contract ID** (`CC2CA5...`) y el dato 20/20 tests: son pruebas concretas de "deployment de calidad", uno de los cuatro criterios.
- **Cronometrá.** 4-5 min de pitch + 1-2 de demo. Cortá la nota del orador si te pasás; los bullets en pantalla son el ancla.
- **Cerrá con el ask del Summit São Paulo.** Conecta tu pedido con el premio: es concreto y memorable.

---

## Mapa de claims → criterios del jurado

Los 4 criterios de PULSO: **(1)** Profundidad de integración y complejidad técnica; **(2)** Impacto en el ecosistema Stellar; **(3)** Customer discovery y validación; **(4)** Calidad del deployment testnet/mainnet.

| Claim principal | Slide | Criterio del jurado |
|---|---|---|
| Oráculo Reflector SEP-40 leído on-chain vía cross-contract call de nuestro contrato (`reference_rate`≈1461) | 4, 6 | (1) Profundidad técnica |
| Escrow no-custodial en contrato Soroban + escrituras Crossmint reales con polling on-chain | 3, 4, 6 | (1) Profundidad técnica |
| Puente Transferencias 3.0 (QR EMVCo BCRA) ↔ Stellar, sin precedente conocido | 5 | (2) Impacto/originalidad en ecosistema |
| Caso de uso fiat-local concreto que ejercita building blocks core (Reflector, SEP-24, smart wallets) | 7 | (2) Impacto en ecosistema |
| Mercado estructural: stablecoins >50% de compras en ARS, #2 LATAM (Chainalysis 2025) | 1, 7 | (3) Customer discovery / validación |
| 5 entrevistas de descubrimiento + transparencia de tasa oficial BCRA (gap mercado vs oficial) | 5, 10 | (3) Customer discovery / validación |
| Contrato desplegado en testnet (`CC2CA5...`), oráculo configurado, 20/20 tests Rust | 4, 8 | (4) Calidad del deployment |
| Roadmap a mainnet: redeploy admin propio → seed orders → SEP-24 firmado → backend | 8 | (4) Calidad del deployment |
| Mocks declarados honestamente en el README (SEP-24 firmado, trustline stub, sin backend, disputa cross-chain solo-docs) | 8 | (4) Calidad + (3) honestidad de validación |
