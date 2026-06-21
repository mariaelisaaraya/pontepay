# PeerlyPay — Customer Discovery (Guía + Plantilla)

> **Idioma:** este documento está en español a propósito. La audiencia objetivo y las entrevistas son argentinas, y el criterio #3 de PULSO ("Customer discovery & validation") se valida mejor con material en el idioma de las personas entrevistadas.
>
> **Cómo usar este archivo:** primero leé la sección de método (por qué importa, segmentos, screening, guion, do/don't). Después, completá las 5 fichas de entrevista. Al final, llená la "Síntesis" y copiá los bloques marcados con `→ PITCH` / `→ README` directo a la entrega.

---

## 0. Estado de este documento

- [ ] Entrevista 1 completada
- [ ] Entrevista 2 completada
- [ ] Entrevista 3 completada
- [ ] Entrevista 4 completada
- [ ] Entrevista 5 completada
- [ ] Síntesis completada
- [ ] Quotes seleccionadas para el pitch
- [ ] Bloque de evidencia copiado al README

**Meta mínima para PULSO:** ≥5 entrevistas reales (el material de intro del hackathon habla de 5; el mínimo duro es 3, pero apuntamos a 5 para sumar en el criterio #3).

---

## 1. Por qué esto importa para PULSO

PULSO Argentina (NearX + Stellar Development Foundation) puntúa cuatro criterios. Customer discovery & validation es uno de ellos, y es el más fácil de perder por no documentarlo: el código y el deploy ya los tenemos (contrato p2p en testnet, oráculo Reflector on-chain, lectura de tasa en vivo), pero la validación con usuarios reales no se puede "buildear" la noche anterior.

La rúbrica de fondo (proxy SCF) premia que **Stellar mejore una feature central, no que sea decorativo**, y premia **originalidad + valor para el ecosistema**. Eso se argumenta mucho mejor cuando podemos decir, con citas textuales: *"hablamos con N personas que hoy hacen esto con Binance P2P / cuevas / Lemon, sufren X dolor concreto, y reaccionaron así ante nuestra solución no-custodial con escrow on-chain y Transferencias 3.0."*

Lo que buscamos demostrar con las entrevistas:

1. **El dolor existe y es recurrente** (no hipotético): la rampa fiat↔cripto en Argentina es lenta, cara, con KYC fricciónoso y/o riesgo de contraparte.
2. **Hay un segmento claro que ya gasta plata/tiempo** resolviéndolo hoy (señal de disposición a pagar real, no declarada).
3. **Nuestros diferenciadores resuenan**: no-custodial + escrow on-chain (confianza sin intermediario que tenga la plata), tasa de mercado transparente (oráculo + BCRA), y el puente único a Transferencias 3.0.

> **Importante para el equipo:** una entrevista que **invalida** una hipótesis vale tanto como una que valida. Documentar "esperábamos X y escuchamos Y, así que ajustamos" es exactamente lo que demuestra discovery serio. No fuercen las respuestas.

---

## 2. Hipótesis a testear (anótenlas antes de entrevistar)

Marcamos cada una como `VALIDADA` / `INVALIDADA` / `SIN DATOS` en la Síntesis.

| # | Hipótesis | Cómo se valida en la entrevista |
|---|-----------|---------------------------------|
| H1 | La gente que cobra en USDC necesita pasar a ARS de forma **recurrente** (no una vez al año). | Frecuencia real del último trimestre. |
| H2 | El método actual (Binance P2P / cuevas / exchange local) tiene un dolor concreto: **spread, tiempo, KYC o desconfianza de contraparte**. | Historia del último cambio que hicieron. |
| H3 | Les importa **quién custodia los fondos** durante el trade (riesgo de exchange/contraparte). | Reacción ante "non-custodial + escrow". |
| H4 | Les importa la **tasa** y hoy no saben si están pagando de más. | Reacción ante tasa de mercado on-chain + tasa oficial BCRA. |
| H5 | **Transferencias 3.0 / QR interoperable** baja la fricción del cobro en ARS de forma percibida. | Reacción ante "cobrás por QR a cualquier banco/billetera". |
| H6 | Existe **disposición a pagar** (un spread/fee aceptable) por resolver esto bien. | Qué pagan hoy y qué les parecería razonable. |

---

## 3. Segmentos objetivo

Buscamos personas que **hoy** muevan cripto↔ARS, no entusiastas teóricos. Priorizar:

| Segmento | Quién es | Por qué nos sirve |
|----------|----------|-------------------|
| **A. Freelancers / devs cobrando en USDC** | Programadores, diseñadores, PMs que facturan al exterior y cobran en stablecoin. | Núcleo del producto: rampa USDC→ARS recurrente. Máxima señal. |
| **B. Nómades digitales** | Extranjeros o argentinos itinerantes que viven temporadas en Argentina y gastan en ARS. | Sensibles a tasa, KYC y velocidad; comparan vs. su país. |
| **C. Comerciantes que aceptan cripto** | Locales, servicios, profesionales que reciben USDC y necesitan ARS para operar. | Validan la pata de "cobrar y bajar a fiat"; testean QR/T3.0. |
| **D. Ahorristas en dólar digital** | Gente que ahorra en USDC por inflación y a veces necesita liquidar a ARS. | Validan demanda estructural (driver: inflación/control de cambios). |

**Mix sugerido para las 5 entrevistas:** al menos 2 del segmento A (es el ICP), 1 de B o C, 1 de D, y 1 libre del que más fácil consigan. No sacrifiquen calidad por cuota: mejor 5 del segmento A bien hechas que 5 forzadas.

**Dónde encontrarlos:** comunidades dev argentinas (Discord/Telegram de Stellar LATAM, comunidades de freelancers), grupos de nómades en Buenos Aires, conocidos que facturan al exterior, locales que ya tienen cartelito de "aceptamos cripto", grupos de Binance P2P Argentina.

---

## 4. Checklist de screening (antes de agendar)

Solo entrevistamos a gente que califica. Confirmá al menos **3 de 4** antes de invertir 20–30 min:

- [ ] **¿Movió cripto↔ARS en los últimos 3 meses?** (comportamiento real, no intención)
- [ ] **¿Lo hace de forma recurrente o lo ve repitiéndose?** (≥1 vez por trimestre)
- [ ] **¿Maneja USDC/stablecoins o está abierto a hacerlo?** (no exclusivamente otra cripto)
- [ ] **¿Reside o opera en Argentina (gasta en ARS)?**

**Descalifican (anotar igual, pero no cuentan como las 5):** personas que solo "leyeron sobre cripto", inversores buy-and-hold que nunca liquidan, o gente que no toca ARS.

**Datos a registrar en el agendamiento:** nombre/alias, segmento (A/B/C/D), canal de contacto, fecha y hora, y si dieron consentimiento para citarlos (aunque sea anonimizados).

---

## 5. Guion de entrevista (12–15 preguntas)

> **Duración:** 20–30 min. **Formato:** charla, no encuesta. Dejá silencios. Repreguntá ("¿y eso por qué?", "contame la última vez"). El objetivo es escuchar **historias del pasado**, no opiniones sobre el futuro.

### Bloque 0 — Apertura (no es pregunta, es encuadre)
> "Gracias por el tiempo. No te vengo a vender nada todavía: estoy entendiendo cómo la gente que mueve cripto a pesos lo resuelve hoy. No hay respuestas correctas, contame lo que realmente hacés."

### Bloque 1 — Contexto y comportamiento actual
1. **¿De qué trabajás y cómo cobrás hoy?** (entender de dónde sale el USDC/cripto)
2. **La última vez que necesitaste pasar de cripto a pesos (o al revés), ¿qué hiciste, paso a paso?** *(pregunta ancla — dejala correr)*
3. **¿Con qué frecuencia lo hacés?** (semanal / mensual / esporádico — pedí número del último trimestre)
4. **¿Qué herramienta usaste? ¿Binance P2P, Lemon, Belo, Buenbit, Ripio, una cueva, transferencia con un conocido?** *(no sugieras una sola; dejá que liste)*

### Bloque 2 — Dolores (lo más importante)
5. **De ese proceso, ¿qué fue lo más molesto o lo que te hizo perder más tiempo?**
6. **¿Cuánto tardó realmente desde que decidiste cambiar hasta que tuviste los pesos disponibles?**
7. **¿Cómo supiste si la tasa era buena? ¿La comparaste con algo?** (señal sobre transparencia de tasa)
8. **¿Alguna vez te pasó algo de riesgo: que dudaras de la contraparte, que se demorara un pago, que te bloquearan una cuenta, un KYC eterno?** *(historia concreta)*
9. **¿Qué te genera más desconfianza: la persona del otro lado, o la plataforma que tiene tu plata en el medio?**

### Bloque 3 — Costo y disposición a pagar
10. **¿Tenés idea de cuánto te costó esa operación en spread o comisión?** (si no sabe, ya es un hallazgo)
11. **Si algo te resolviera esto más rápido y seguro, ¿qué te parecería razonable que cobre?** *(no es promesa de venta, es calibración)*

### Bloque 4 — Reacción a la solución (recién acá mostramos PeerlyPay)
> Mostrá el flujo real o el demo si lo tenés a mano. Presentá un diferenciador por vez y callate a escuchar.

12. **Non-custodial + escrow on-chain:** "La plata queda bloqueada en un contrato en Stellar, ni nosotros ni la otra persona la pueden mover hasta que se confirme el pago en pesos. ¿Eso te cambia algo respecto a lo que usás hoy?"
13. **Tasa transparente:** "La tasa la lee un oráculo on-chain (Reflector) a través de nuestro propio contrato, y al lado te mostramos la tasa oficial del BCRA para que veas la brecha. ¿Te importa ver esto?"
14. **Transferencias 3.0 / QR:** "El cobro en pesos se hace con un QR interoperable de Transferencias 3.0, te transfieren desde cualquier banco o billetera al instante. ¿Cómo lo ves contra como cobrás hoy?"
15. **Cierre / siguiente paso:** "Si esto existiera hoy, ¿lo usarías para tu próxima operación? ¿Qué tendría que pasar para que lo elijas en vez de lo que usás?" *(y) ¿Conocés a alguien más a quien le sirva que pueda entrevistar?*

> **Tip:** si te quedás sin tiempo, las imprescindibles son 2, 5, 8, 9, 10 y 15. Esas seis sostienen casi toda la evidencia.

---

## 6. The Mom Test — Do / Don't

Basado en *The Mom Test* (Rob Fitzgerald). La regla: **preguntá por su vida y su comportamiento pasado, nunca por opiniones sobre tu idea.** La gente miente para no ofenderte; los hechos no mienten.

| ✅ Hacer | ❌ Evitar |
|----------|-----------|
| "Contame la última vez que pasaste cripto a pesos." | "¿Usarías una app para pasar cripto a pesos?" (hipotético) |
| "¿Cuánto te costó / cuánto tardó esa vez?" | "¿Te parece caro/lento lo que usás?" (lo guía la respuesta) |
| "¿Qué hiciste cuando te falló?" | "¿No sería genial si fuera instantáneo?" (pregunta-vendedora) |
| Preguntar por dinero/tiempo ya gastado. | Preguntar por dinero/tiempo que *gastaría* en el futuro. |
| Dejar silencio incómodo y que sigan hablando. | Llenar el silencio explicando tu producto. |
| Anotar quotes textuales, sin interpretarlas. | Anotar tu interpretación ("le encantó la idea"). |
| Pedir el siguiente paso concreto (otro contacto, probar el demo). | Cerrar con "¿qué te pareció?" (cumplido vacío = cero señal). |
| Mostrar el producto **al final**, una feature por vez. | Pitchear al principio y contaminar todas las respuestas. |

**Señales de demanda reales (cuentan):** ya gastan plata/tiempo en el problema, ya intentaron resolverlo de varias formas, nos presentan a otro, piden probar el demo, comparten cuánto pierden en spread.
**Cumplidos vacíos (no cuentan):** "buenísimo", "lo usaría seguro", "tenés que hablar con inversores", "me encanta la idea".

---

## 7. Fichas de entrevista (completar 5)

> Copiá una ficha por persona. Mantené las quotes **textuales**. Marcá la "Señal de demanda" en escala: 🔴 Baja (cumplido vacío) / 🟡 Media (interés pero sin compromiso) / 🟢 Alta (comportamiento real + siguiente paso concreto).

### Entrevista 1

| Campo | Detalle |
|-------|---------|
| **Perfil / segmento (A/B/C/D)** | |
| **Cómo cobra hoy / contexto** | |
| **Fecha** | |
| **Canal** (Meet / Telegram / presencial…) | |
| **Método actual** (Binance P2P / Lemon / cueva…) | |
| **Frecuencia de operación** | |
| **Hallazgos clave** (3–5 bullets) | |
| **Dolor principal** | |
| **¿Sabe cuánto paga de spread/fee?** | |
| **Quotes textuales** | |
| **Reacción a non-custodial + escrow** | |
| **Reacción a tasa oráculo + BCRA** | |
| **Reacción a Transferencias 3.0 / QR** | |
| **Disposición a pagar (declarada / inferida)** | |
| **Señal de demanda** (🔴/🟡/🟢) | |
| **Siguiente paso acordado** | |

### Entrevista 2

| Campo | Detalle |
|-------|---------|
| **Perfil / segmento (A/B/C/D)** | |
| **Cómo cobra hoy / contexto** | |
| **Fecha** | |
| **Canal** | |
| **Método actual** | |
| **Frecuencia de operación** | |
| **Hallazgos clave** | |
| **Dolor principal** | |
| **¿Sabe cuánto paga de spread/fee?** | |
| **Quotes textuales** | |
| **Reacción a non-custodial + escrow** | |
| **Reacción a tasa oráculo + BCRA** | |
| **Reacción a Transferencias 3.0 / QR** | |
| **Disposición a pagar (declarada / inferida)** | |
| **Señal de demanda** (🔴/🟡/🟢) | |
| **Siguiente paso acordado** | |

### Entrevista 3

| Campo | Detalle |
|-------|---------|
| **Perfil / segmento (A/B/C/D)** | |
| **Cómo cobra hoy / contexto** | |
| **Fecha** | |
| **Canal** | |
| **Método actual** | |
| **Frecuencia de operación** | |
| **Hallazgos clave** | |
| **Dolor principal** | |
| **¿Sabe cuánto paga de spread/fee?** | |
| **Quotes textuales** | |
| **Reacción a non-custodial + escrow** | |
| **Reacción a tasa oráculo + BCRA** | |
| **Reacción a Transferencias 3.0 / QR** | |
| **Disposición a pagar (declarada / inferida)** | |
| **Señal de demanda** (🔴/🟡/🟢) | |
| **Siguiente paso acordado** | |

### Entrevista 4

| Campo | Detalle |
|-------|---------|
| **Perfil / segmento (A/B/C/D)** | |
| **Cómo cobra hoy / contexto** | |
| **Fecha** | |
| **Canal** | |
| **Método actual** | |
| **Frecuencia de operación** | |
| **Hallazgos clave** | |
| **Dolor principal** | |
| **¿Sabe cuánto paga de spread/fee?** | |
| **Quotes textuales** | |
| **Reacción a non-custodial + escrow** | |
| **Reacción a tasa oráculo + BCRA** | |
| **Reacción a Transferencias 3.0 / QR** | |
| **Disposición a pagar (declarada / inferida)** | |
| **Señal de demanda** (🔴/🟡/🟢) | |
| **Siguiente paso acordado** | |

### Entrevista 5

| Campo | Detalle |
|-------|---------|
| **Perfil / segmento (A/B/C/D)** | |
| **Cómo cobra hoy / contexto** | |
| **Fecha** | |
| **Canal** | |
| **Método actual** | |
| **Frecuencia de operación** | |
| **Hallazgos clave** | |
| **Dolor principal** | |
| **¿Sabe cuánto paga de spread/fee?** | |
| **Quotes textuales** | |
| **Reacción a non-custodial + escrow** | |
| **Reacción a tasa oráculo + BCRA** | |
| **Reacción a Transferencias 3.0 / QR** | |
| **Disposición a pagar (declarada / inferida)** | |
| **Señal de demanda** (🔴/🟡/🟢) | |
| **Siguiente paso acordado** | |

---

## 8. Síntesis (completar después de las 5 entrevistas)

### 8.1 Resumen cuantitativo

| Métrica | Valor |
|---------|-------|
| Entrevistas realizadas | _ / 5 |
| Segmentos cubiertos | A: _ · B: _ · C: _ · D: _ |
| Operan cripto↔ARS de forma recurrente | _ / 5 |
| Método más mencionado hoy | |
| Dolor más mencionado | |
| Señal de demanda Alta (🟢) | _ / 5 |
| Mencionaron desconfianza en la plataforma/custodia | _ / 5 |
| Reaccionaron positivo a non-custodial + escrow | _ / 5 |
| Reaccionaron positivo a Transferencias 3.0 / QR | _ / 5 |

### 8.2 Patrones encontrados
- **Patrón 1:** …
- **Patrón 2:** …
- **Patrón 3:** …
- **Sorpresas / cosas que no esperábamos:** …

### 8.3 Hipótesis: validado / invalidado

| # | Hipótesis | Resultado | Evidencia (qué lo sostiene) |
|---|-----------|-----------|-----------------------------|
| H1 | Necesidad recurrente de cripto→ARS | VALIDADA / INVALIDADA / SIN DATOS | |
| H2 | Dolor concreto (spread/tiempo/KYC/confianza) | | |
| H3 | Les importa la custodia de fondos | | |
| H4 | Les importa la tasa y hoy no la controlan | | |
| H5 | T3.0/QR baja fricción percibida | | |
| H6 | Existe disposición a pagar | | |

### 8.4 Próximos pasos (qué hacemos con lo aprendido)
- **Construir / priorizar:** …
- **Despriorizar / dejar como mock por ahora:** … *(p. ej., si nadie pidió disputas cross-chain, confirma mantener el path single-chain del `dispute_resolver` y dejar Base/Slice como aspiracional)*
- **Re-entrevistar / segmento a explorar más:** …

### 8.5 Cómo citar esto en el PITCH y el README

> Llená los `__` con tus números reales antes de la entrega. No inventes: si una celda quedó en "SIN DATOS", decilo.

**→ PITCH (slide de validación, en español):**
> "Entrevistamos a __ personas que hoy mueven cripto a pesos en Argentina — freelancers que cobran en USDC, nómades y ahorristas. __ de __ lo hacen de forma recurrente y usan hoy [Binance P2P / cuevas / Lemon]. El dolor #1 que escuchamos fue **[dolor]**. Cuando les mostramos el escrow no-custodial en Stellar y el cobro por Transferencias 3.0, __ de __ dijeron que lo usarían en su próxima operación. Cita textual: *'[quote más fuerte]'*."

**→ README (sección "Customer Discovery", en inglés):**
> "We ran __ customer-discovery interviews with crypto-earning Argentines (freelancers paid in USDC, digital nomads, digital-dollar savers). __/__ trade crypto↔ARS recurrently today via Binance P2P / OTC desks / local exchanges. The most-cited pain was **[pain]**. After showing the non-custodial Soroban escrow + on-chain Reflector rate + Transferencias 3.0 QR, __/__ said they'd use it for their next trade. Full notes and the interview script are in [`docs/hackathon/CUSTOMER_DISCOVERY.md`](./CUSTOMER_DISCOVERY.md). Hypotheses that were **invalidated**: [list] — and how that changed the roadmap: [change]."

---

## 9. Logística y mapeo a la rúbrica

- **Quién entrevista:** repartir entre Alexis, Steven, Stefano y Barb — idealmente 1–2 entrevistas por persona, un mismo entrevistador no monopoliza para no sesgar.
- **Grabación/consentimiento:** pedí permiso para tomar notas y para citar (aunque sea anonimizado: "un freelancer dev, seg. A"). Sin consentimiento, igual usás la quote anonimizada.
- **Plazo:** la submission de PULSO cierra el **30 de junio**. Agendá y completá las 5 fichas con margen para escribir la Síntesis antes de esa fecha.
- **Dónde vive la evidencia:** este archivo (`docs/hackathon/CUSTOMER_DISCOVERY.md`) + el resumen citado en el README. Linkealos desde el pitch deck.

| Criterio PULSO | Qué de este doc lo cubre |
|----------------|--------------------------|
| #3 Customer discovery & validation | Las 5 fichas + Síntesis + hipótesis validado/invalidado. **Núcleo.** |
| #2 Impact on the Stellar ecosystem | Patrones que muestran demanda estructural por una rampa P2P en Stellar (segmentos A–D). |
| #1 Integration depth | Las reacciones a "tasa por oráculo on-chain" y "escrow Soroban" justifican que la integración Stellar es load-bearing, no decorativa. |

---

*Plantilla v1 — PeerlyPay · PULSO Argentina 2026. Completar in situ; no inventar números. Una entrevista que invalida una hipótesis es un buen resultado: documentala.*
