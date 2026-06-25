# PontePay — Plan Go-To-Market

> Actualizado: 2026-06-25. Basado en customer discovery (5 entrevistas) + análisis competitivo Foxbit/Lemon/Belo/Buenbit/Meru.

---

## Mensaje de lanzamiento

> **"Cambiá USDC a pesos sin bancos, sin custodios, y sin comisiones en Transferencias 3.0."**

El gancho emocional no es la arquitectura técnica — es que el riel fiat es gratis y nadie puede bloquear tu plata. "Sin costo en Transferencias 3.0" replica el mismo movimiento que Foxbit usó con "taxa zero em saques" para adquirir usuarios masivamente en Brasil (2021).

---

## Público objetivo

### ICP Primario — Freelancer USDC Argentino (Segmento A)

- **Quién:** Dev, diseñador, PM que cobra al exterior en USDC, gasta en ARS
- **Comportamiento:** 4–12 operaciones/trimestre, montos medios-altos
- **Método actual:** Binance P2P, Lemon, cuevas
- **Dolor #1:** Cuenta bloqueada con plata del alquiler adentro (Tomás, entrevista 1)
- **Dolor #2:** No sabe cuánto paga de spread — "le calculo 1-2% pero no lo mido" (4/5 entrevistados)
- **Gancho:** Tasa visible (oracle mid-rate en pantalla) + escrow on-chain que nadie puede bloquear

### Segmento de Crecimiento — Comerciante que acepta cripto (Segmento C)

- **Quién:** Local, profesional, servicio que recibe USDC de clientes
- **Frecuencia:** Alta (semanal), montos chicos — la fricción se multiplica
- **Gancho:** "Cobrá en USDC, recibí pesos al instante" — QR como Mercado Pago
- **Producto:** PontePay Pay (Q4 2026)
- **Primer cliente target:** Nico (tatuador, 12 ops/trimestre, ya cobra con QR)

### Segmento de Retención — Ahorrista USDC (Segmento D)

- **Quién:** Empleado que dolariza ahorros, liquida esporádicamente pero en montos grandes
- **Dolor:** "No duermo hasta que entra la transferencia" — desconfianza de la contraparte en montos altos (Vale, entrevista 4)
- **Gancho:** Escrow on-chain elimina ese riesgo — el contrato libera, no una persona
- **Producto futuro:** DCA automático quincenal

---

## Canales de adquisición

### Canal 1 — Comunidades dev argentinas (primer mes)

- Discord/Telegram de Stellar LATAM
- Grupos de freelancers que facturan al exterior
- Comunidades Binance P2P Argentina (usuarios frustrados con bloqueos)

**Táctica:** Thread de Twitter/X que cuente la historia de Tomás — "me bloquearon la cuenta de Binance 11 días con la plata del alquiler". Sin mencionar el producto en los primeros 5 tweets. Resolver el dolor, luego la solución.

### Canal 2 — Comerciantes con cartelito de cripto (mes 2–3)

- Locales en Buenos Aires que ya aceptan USDC
- Entry point: "probá con un cobro chico esta semana"
- Referral: cada comerciante conoce a otros comerciantes

### Canal 3 — Content orgánico (mes 1 en adelante)

Foxbit usa un blog extenso como canal de adquisición y educación de mercado. PontePay hace lo mismo:

- *"Cuánto te cobra realmente tu exchange (y cómo calcularlo)"*
- *"El spread oculto que Lemon, Belo y Binance no te dicen"*
- *"Cómo leer la tasa BCRA vs. la tasa cripto y entender la brecha"*
- *"Por qué Binance bloqueó mi cuenta y qué hacer"*

Captura directamente el Segmento A (Caro, la diseñadora que dijo "no tengo idea de cuánto pierdo, le creo a la cueva").

### Canal 4 — Hackathon PULSO como plataforma de credibilidad

El pitch del 6 de julio ante el jurado Stellar es el primer hito de PR. Quedar finalistas genera:
- Cobertura en comunidad Stellar LATAM
- Credibilidad con early adopters técnicos
- Intro a la red de anchors Stellar (SEP-24)

---

## Estrategia de precios para el lanzamiento

No competir en bps durante los primeros 6 meses. Competir en **confianza y transparencia**.

El 1.3% efectivo (spread 0.8% + fee on-chain 0.5%) se justifica con:
1. Oracle mid-rate visible en pantalla
2. Tasa BCRA al lado (evidencia de la brecha de mercado)
3. Escrow on-chain auditable (sin bloqueos posibles, sin comisiones ocultas)

Una vez que hay volumen y datos, se introducen tiers (Maker Premium, DCA, Earn).

---

## Métricas de éxito — primeros 90 días post-hackathon

| Métrica | Target |
|---------|--------|
| Volumen procesado (USDC↔ARS) | $50.000 USDC |
| Trades ejecutados | 100 |
| Makers activos (publicando órdenes) | 20 |
| NPS de usuarios primarios | >50 |
| Tiempo promedio de resolución de trade | <15 min |
| Disputes abiertas | <5% del total |

---

## Diferenciadores de comunicación

| Lo que la competencia dice | Lo que PontePay dice |
|---|---|
| "Mejor tasa del mercado" (sin datos) | "Tasa del oracle Reflector, actualizada en tiempo real" |
| Comisión expresada en % (buried) | Spread expresado en ARS (visible al lado del mid-rate BCRA) |
| "Plataforma segura" | "El contrato Soroban es el árbitro — no nosotros" |
| No hay información de resolución de disputas | Dispute resolver on-chain con timelock configurable |
| Retiros pueden demorarse 48h (ToS) | Transferencias 3.0 — confirmación en minutos |

---

## Roadmap de producto por segmento

| Producto | Segmento | Cuándo |
|---------|----------|--------|
| P2P USDC↔ARS + T3.0 | A (Freelancers) | **Activo — hackathon** |
| PontePay Earn (yield en USDC vía Blend) | A y D | Q3 2026 |
| PontePay Pay (comerciantes) | C | Q4 2026 |
| Maker Premium (spread reducido por volumen) | Makers | Q1 2027 |
| DCA automático quincenal | D (Ahorristas) | Q1 2027 |
| Corridor ARS-BRL | Expandido | 2027+ (bloqueo por Res. BCB 561) |

---

## El ask para el pitch del 6 de julio

Queremos llegar a finalistas para:
1. Cerrar la firma SEP-24 y desplegar en mainnet con admin propio
2. Lanzar PontePay Earn (yield en USDC idle vía Blend — el código ya existe)
3. Representar este caso de uso en el Stellar Summit São Paulo

**De dólar digital a pesos. En minutos. Sin entregarle las llaves a nadie.**
