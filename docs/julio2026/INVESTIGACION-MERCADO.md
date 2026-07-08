# PontePay — Investigación de mercado: ¿quién usaría esto?

> **Para:** Eli, Leo y Barb · Julio 2026
> **Pregunta que responde:** quién es nuestro usuario, cuántos son, dónde están, y cómo les hablamos.

---

## El dato que ordena todo

Según el relevamiento de fin de 2025 sobre freelancers argentinos que exportan servicios ([Infobae](https://www.infobae.com/economia/2025/12/04/freelancers-cuanto-ganan-y-como-cobran-los-argentinos-que-venden-servicios-a-empresas-del-exterior/), [RoadShow](https://www.roadshow.com.ar/freelancers-argentinos-ingresos-por-encima-de-us-2500-y-un-ecosistema-cada-vez-mas-cripto/)):

- **El 30% ya cobra en USDC** y otro 22% en USDT — más de la mitad cobra en stablecoins.
- Ingreso promedio: **USD 2.500/mes** (vs 1.475 el año anterior).
- La opción de liquidar en pesos por el canal oficial logró apenas **2% de adhesión** — nadie quiere el canal oficial.
- Argentina es el **3er exportador de servicios del conocimiento de LATAM**.

**La lectura:** no tenemos que convencer a nadie de cobrar en USDC — ya lo hacen. El problema que nos queda es el que PontePay resuelve: **el último kilómetro, de USDC a pesos para vivir**. Hoy eso se hace en exchanges custodiales o Telegram sin garantías.

A esto se suma el dato macro que ya usábamos: las stablecoins son **más del 50% de las compras cripto en pesos** (Chainalysis 2025) y Argentina es #2 de LATAM en volumen.

---

## Los 3 segmentos, en orden de prioridad

### 1. El freelancer exportador (nuestro usuario principal) 🎯
- **Quién es:** dev, diseñador/a, traductor/a, contador/a, marketer que factura a clientes de afuera. 25-45 años, CABA/GBA/Córdoba/Rosario/Mendoza. Cobra USD 1.500-4.000/mes en USDC/USDT vía Deel, Payoneer, wallets.
- **Su dolor exacto:** todos los meses convierte una parte a pesos (alquiler, expensas, super). Hoy: exchange custodial (desconfianza post-hackeos, spreads opacos) o P2P informal (riesgo de estafa).
- **Cuánto nos deja:** convierte ~USD 500-1.500/mes → con fee 0,8-1,5% ≈ **USD 5-20/mes por usuario**. 1.000 usuarios activos ≈ USD 8-15k/mes de ingresos.
- **Qué lo convence:** seguridad estructural ("tu plata nunca está en una empresa"), tasa transparente contra oráculo, y que el USDC quieto rinda (Earn).

### 2. El ahorrista cripto que "rota" (secundario)
- **Quién es:** compró USDC como refugio (el comprador del dato de Chainalysis). Cada tanto necesita pesos, o quiere comprar más USDC barato.
- **Su dolor:** la brecha entre lo que le pagan y la tasa real. Nuestro Mercado con la referencia del oráculo a la vista le habla directo.
- **Rol en el marketplace:** es la **contraparte natural** del freelancer — uno vende USDC, el otro compra. Sin este segmento no hay libro de órdenes.

### 3. El comerciante/PyME dolarizado (futuro, NO ahora)
- Quiere cobrar en pesos y ahorrar en dólares. Es el segmento de Passpay y del modelo tarjeta — **no competimos ahí todavía**. Queda para cuando exista la capa de gasto (ver MODELO-OPERATIVO.md).

---

## Recepción del cliente: dónde están y cómo llegamos

| Canal | Qué hacemos | Costo |
|---|---|---|
| **Comunidades freelancer** (Workana, foros de monotributistas tech, grupos de Deel/Payoneer en Telegram/WhatsApp) | Presencia genuina: responder la pregunta "¿cómo pasan USDC a pesos?" que aparece TODAS las semanas | Tiempo |
| **Twitter/X cripto argentina** | Hilo del hack de Bexo (sin nombrar) → "por qué el diseño no-custodial importa" + demo del hash verificable | Tiempo |
| **Comunidad Stellar Argentina / meetups BA** | Ya nos conocen del hackathon; es también la red de referidos para el SCF | Tiempo |
| **Universidades/bootcamps** (devs que empiezan a exportar) | Charla "cómo cobrar del exterior" — contenido educativo, no venta | Tiempo |
| **Referidos dentro del producto** | Cuando exista PontePay Frecuente: "invitá a otro freelancer, ambos suman racha" | Producto |

**Ojo con el presupuesto SCF:** marketing/adquisición está **prohibido** como costo del Build Award. Todo lo de arriba es orgánico/producto — está bien así, y además valida de verdad.

---

## Cómo les hablamos (mensajes por segmento)

**Al freelancer** (lenguaje simple, cero jerga):
> *"Cobrás en dólar digital y vivís en pesos. PontePay es el puente: vendés tu USDC a otra persona, la plata queda protegida en un contrato hasta que ambos confirman, y recibís pesos por Transferencias 3.0. Sin empresa en el medio, sin caja fuerte que hackear."*

**Al ahorrista cripto** (puede tolerar algo de jerga):
> *"Comprá USDC al precio real. La tasa de referencia sale de un oráculo on-chain — nadie la infla. Cada operación te deja un hash verificable en stellar.expert."*

**Lo que NUNCA decimos:** "wallet", "seed phrase", "trustline", "APY", "smart contract" (decimos: "contrato que protege la plata"). Ya lo hacemos en la app — mantenerlo en el marketing.

**El disparador de confianza post-Bexo** (genérico, con fuente, sin nombrar):
> *"Después de los incidentes de seguridad en wallets argentinas, la pregunta correcta no es '¿qué tan segura es la empresa?' sino '¿por qué la empresa tiene mi plata?'"*

---

## Cómo validamos (el paso siguiente)

La guía completa de entrevistas está en [GUIA-ENTREVISTAS.md](./GUIA-ENTREVISTAS.md). Resumen del plan:
- **10 entrevistas** en 3 semanas: 6 freelancers exportadores + 4 ahorristas cripto.
- Reclutamiento: nuestras propias redes + comunidades de arriba (sin pagar).
- Objetivo: validar (a) frecuencia y monto de conversión mensual, (b) qué usan hoy y qué odian, (c) si "no-custodial" les importa espontáneamente o hay que educarlo, (d) reacción al fee escalonado.
- Todo documentado con consentimiento → sirve directo como evidencia de customer discovery para el SCF.
