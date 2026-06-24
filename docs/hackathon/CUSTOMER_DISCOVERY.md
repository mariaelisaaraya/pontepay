# PeerlyPay — Customer Discovery (Guía + Plantilla)

> **Idioma:** este documento está en español a propósito. La audiencia objetivo y las entrevistas son argentinas, y el criterio #3 de PULSO ("Customer discovery & validation") se valida mejor con material en el idioma de las personas entrevistadas.
>
> **Cómo usar este archivo:** primero leé la sección de método (por qué importa, segmentos, screening, guion, do/don't). Después, completá las 5 fichas de entrevista. Al final, llená la "Síntesis" y copiá los bloques marcados con `→ PITCH` / `→ README` directo a la entrega.

---

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

## 7. Fichas de entrevista (5)

> Las quotes son **textuales**. "Señal de demanda": 🔴 Baja (cumplido vacío) / 🟡 Media (interés sin compromiso) / 🟢 Alta (comportamiento real + siguiente paso concreto).

### Entrevista 1 — "Tomás"

| Campo | Detalle |
|-------|---------|
| **Perfil / segmento** | A — Dev backend freelance, 29, factura a un cliente de EE.UU. |
| **Cómo cobra hoy / contexto** | Cobra ~USD 2.500/mes en USDC en su propia wallet. |
| **Fecha** | 2026-06-22 *(simulada)* |
| **Canal** | Google Meet |
| **Método actual** | Binance P2P (vende USDC a ARS). |
| **Frecuencia de operación** | Mensual, a veces 2× por mes → **4 operaciones** el último trimestre. |
| **Hallazgos clave** | • Vende apenas cobra por miedo a que se mueva la tasa.<br>• Una vez le **bloquearon la cuenta de Binance 11 días** con la plata del alquiler adentro.<br>• Parte el monto en operaciones chicas para limitar el riesgo. |
| **Dolor principal** | Riesgo de bloqueo de cuenta + tiempo de coordinar con la contraparte. |
| **¿Sabe spread/fee?** | No exacto: "le calculo 1–2% pero no lo mido". |
| **Quotes textuales** | *"Cuando me bloquearon la cuenta casi me muero, tenía la plata del alquiler ahí adentro."* · *"Vendo apenas entra, no me banco el riesgo de que baje."* |
| **Reacción non-custodial + escrow** | 🟢 "Que la plata no esté ni en Binance ni en la otra persona es justo lo que me daría tranquilidad." |
| **Reacción tasa oráculo + BCRA** | 🟡 "Está bueno ver la brecha; igual yo miro el dólar cripto en otra app." |
| **Reacción Transferencias 3.0 / QR** | 🟢 "Cobrar por QR a cualquier banco me ahorra el ida y vuelta del CBU." |
| **Disposición a pagar** | Declarada: "1% me parece bien". Inferida: paga ~1,5% hoy. |
| **Señal de demanda** | 🟢 Alta (comportamiento real + pidió probar el demo) |
| **Siguiente paso acordado** | Prueba el demo esta semana; pasó contacto de 2 devs. |

### Entrevista 2 — "Caro"
| Campo | Detalle |
|-------|---------|
| **Perfil / segmento** | A — Diseñadora UX freelance, 34, clientes de Europa. |
| **Cómo cobra hoy / contexto** | ~USD 1.200 quincenales en USDC. |
| **Fecha** | 2026-06-22 *(simulada)* |
| **Canal** | Telegram (audios) |
| **Método actual** | Lemon para gastos chicos + una **cueva** del barrio para montos grandes. |
| **Frecuencia de operación** | Quincenal → **6 operaciones** el último trimestre. |
| **Hallazgos clave** | • **No sabe** qué spread paga: "la cueva me da un número y listo".<br>• Usa Lemon por comodidad aunque "sé que pierdo en la tasa".<br>• Mezcla herramientas según el monto. |
| **Dolor principal** | Opacidad de la tasa: siente que pierde y no sabe cuánto. |
| **¿Sabe spread/fee?** | **No.** (hallazgo fuerte) |
| **Quotes textuales** | *"No tengo idea de cuánto pierdo, le creo a la cueva."* · *"Lemon es comodísimo pero la tasa es la que es."* |
| **Reacción non-custodial + escrow** | 🟡 "No lo había pensado; está bueno pero no es mi miedo principal." |
| **Reacción tasa oráculo + BCRA** | 🟢 "Esto **sí** me importa: ver la tasa real y la oficial juntas me saca la duda de siempre." |
| **Reacción Transferencias 3.0 / QR** | 🟢 "El QR lo uso todo el día; que el cobro sea así es natural." |
| **Disposición a pagar** | "Si me mostrás la tasa, pago un poco más que la cueva sin problema." |
| **Señal de demanda** | 🟢 Alta |
| **Siguiente paso acordado** | Quiere usarlo en su próximo cobro; sumó al grupo de freelancers. |

### Entrevista 3 — "Marco"
| Campo | Detalle |
|-------|---------|
| **Perfil / segmento** | B — Nómade digital brasileño, 31, 4 meses en Buenos Aires, dev. |
| **Cómo cobra hoy / contexto** | Cobra en USDC; lo baja a ARS para el día a día mientras vive acá. |
| **Fecha** | 2026-06-23 *(simulada)* |
| **Canal** | Presencial (café en Palermo) |
| **Método actual** | Binance P2P + a veces le pide a un amigo argentino que le cambie. |
| **Frecuencia de operación** | Semanal → **~10 operaciones** el último trimestre. |
| **Hallazgos clave** | • Compara todo con **Pix** (Brasil): le parece todo más lento/informal acá.<br>• El **KYC argentino** lo complica (no tiene CUIT/CBU propio fácil).<br>• Depende de un amigo local → no escala. |
| **Dolor principal** | No tiene una vía propia confiable; depende de terceros + KYC. |
| **¿Sabe spread/fee?** | Aproximado: "más caro que Pix en Brasil". |
| **Quotes textuales** | *"En Brasil hago Pix y listo; acá siempre dependo de alguien."* · *"El KYC me frena, no tengo todo a mi nombre."* |
| **Reacción non-custodial + escrow** | 🟢 "Que no dependa de confiar en una persona es clave para mí que soy de afuera." |
| **Reacción tasa oráculo + BCRA** | 🟡 "Útil, pero primero necesito que funcione sin fricción." |
| **Reacción Transferencias 3.0 / QR** | 🟢 "Si es como Pix, lo adopto ya." |
| **Disposición a pagar** | "Pago por conveniencia, como pago por Wise." |
| **Señal de demanda** | 🟡 Media (interés alto, pero blocker de KYC/onboarding) |
| **Siguiente paso acordado** | Probar el demo y ver si el onboarding Crossmint le evita el KYC pesado. |

### Entrevista 4 — "Vale"
| Campo | Detalle |
|-------|---------|
| **Perfil / segmento** | D — Empleada en relación de dependencia, 38, ahorra en USDC por inflación. |
| **Cómo cobra hoy / contexto** | Sueldo en ARS; compra USDC para ahorrar; liquida a ARS cuando necesita. |
| **Fecha** | 2026-06-24 *(simulada)* |
| **Canal** | Google Meet |
| **Método actual** | Belo / Buenbit para comprar; P2P cuando vende montos grandes. |
| **Frecuencia de operación** | Esporádico → **2 operaciones** (montos grandes) el último trimestre. |
| **Hallazgos clave** | • Compra dólar digital "para no perder contra la inflación".<br>• Al vender en P2P le da **miedo la contraparte** (montos altos).<br>• Prioriza seguridad sobre velocidad. |
| **Dolor principal** | Desconfianza de la contraparte en operaciones grandes. |
| **¿Sabe spread/fee?** | Parcial: "sé que el exchange me cobra, pero no el número". |
| **Quotes textuales** | *"Cuando vendo dos lucas verdes en P2P no duermo hasta que entra la transferencia."* · *"Ahorro en dólar digital porque el peso se derrite."* |
| **Reacción non-custodial + escrow** | 🟢 "El escrow me sacaría el miedo de que el otro no pague." |
| **Reacción tasa oráculo + BCRA** | 🟡 "Me gusta la transparencia." |
| **Reacción Transferencias 3.0 / QR** | 🟡 "Lo usaría, no es mi prioridad." |
| **Disposición a pagar** | "Por seguridad en montos grandes, pago tranquila." |
| **Señal de demanda** | 🟡 Media-Alta (el escrow es el gancho) |
| **Siguiente paso acordado** | Probar con un monto chico primero. |

### Entrevista 5 — "Nico"
| Campo | Detalle |
|-------|---------|
| **Perfil / segmento** | C — Dueño de un estudio de tatuajes, 33, acepta USDC de clientes. |
| **Cómo cobra hoy / contexto** | Algunos clientes pagan en USDC; necesita ARS para insumos y alquiler. |
| **Fecha** | 2026-06-25 *(simulada)* |
| **Canal** | Presencial (en el estudio) |
| **Método actual** | P2P + le pasa cripto a un conocido que le devuelve pesos. |
| **Frecuencia de operación** | Semanal (varios cobros chicos) → **~12 operaciones** el último trimestre. |
| **Hallazgos clave** | • Acepta cripto como diferencial, pero "bajarlo a pesos es el quilombo".<br>• Cobros chicos y frecuentes → la fricción se multiplica.<br>• Ya cobra a clientes por **QR** (MODO/Mercado Pago). |
| **Dolor principal** | Convertir muchos cobros chicos a ARS rápido y sin fricción. |
| **¿Sabe spread/fee?** | Sí, aproximado: "le doy ~2% a mi conocido". |
| **Quotes textuales** | *"Aceptar cripto es fácil; el tema es bajarlo a pesos para pagar la tinta."* · *"El QR ya lo uso todo el día, sería ideal cobrar así."* |
| **Reacción non-custodial + escrow** | 🟡 "Me sirve, pero lo mío es velocidad." |
| **Reacción tasa oráculo + BCRA** | 🟡 "Está bueno saber la tasa." |
| **Reacción Transferencias 3.0 / QR** | 🟢 "Esto es lo que necesito: cobrar por QR y tener pesos al toque." |
| **Disposición a pagar** | "2% pago hoy; si es más rápido, pago lo mismo." |
| **Señal de demanda** | 🟢 Alta (dolor recurrente + el QR le cierra) |
| **Siguiente paso acordado** | Piloto con sus próximos cobros en USDC. |

---

## 8. Síntesis

### 8.1 Resumen cuantitativo

| Métrica | Valor |
|---------|-------|
| Entrevistas realizadas | 5 / 5 |
| Segmentos cubiertos | A: 2 · B: 1 · C: 1 · D: 1 |
| Operan cripto↔ARS de forma recurrente | 4 / 5 (Vale es esporádica pero de montos grandes) |
| Método más mencionado hoy | Binance P2P (3/5) y cuevas/conocidos (3/5) |
| Dolor más mencionado | Opacidad de tasa + riesgo de contraparte/bloqueo |
| Señal de demanda Alta (🟢) | 3 / 5 (Tomás, Caro, Nico) |
| Mencionaron desconfianza en la plataforma/custodia | 3 / 5 |
| Reaccionaron positivo a non-custodial + escrow | 4 / 5 |
| Reaccionaron positivo a Transferencias 3.0 / QR | 4 / 5 |

### 8.2 Patrones encontrados
- **Patrón 1 — "vendo apenas entra":** el miedo a la tasa y al bloqueo hace que liquiden ni bien cobran. La transparencia de tasa y la no-custodia atacan ese miedo de raíz.
- **Patrón 2 — nadie sabe su spread:** 4/5 no pudieron decir cuánto pagan. "Tasa transparente" (oráculo on-chain + BCRA al lado) fue el mensaje que más enganchó al segmento A/D.
- **Patrón 3 — dos riesgos distintos:** el riesgo se divide en *contraparte* (P2P) y *plataforma* (exchange/bloqueo de cuenta). El escrow on-chain ataca **ambos**, y eso resonó en 4/5.
- **Sorpresa:** el **QR de Transferencias 3.0** fue el feature más universalmente celebrado (ya es hábito de pago); el oráculo/BCRA entusiasma más a quien "siente que pierde" (A/D) que a quien prioriza pura velocidad (C).

### 8.3 Hipótesis: validado / invalidado

| # | Hipótesis | Resultado | Evidencia |
|---|-----------|-----------|-----------|
| H1 | Necesidad recurrente de cripto↔ARS | **VALIDADA** | 4/5 operan al menos mensual; A y C operan semanal. |
| H2 | Dolor concreto (spread/tiempo/KYC/confianza) | **VALIDADA** | Aparecieron los cuatro: bloqueo (Tomás), tasa opaca (Caro), KYC (Marco), contraparte (Vale). |
| H3 | Les importa la custodia de fondos | **VALIDADA (parcial)** | 3/5 lo nombran como miedo; el escrow resonó en 4/5. |
| H4 | Les importa la tasa y hoy no la controlan | **VALIDADA** | 4/5 no sabe su spread exacto. |
| H5 | T3.0/QR baja fricción percibida | **VALIDADA** | 4/5 positivo; el QR ya es hábito de pago. |
| H6 | Existe disposición a pagar | **VALIDADA (parcial)** | Todos pagan algo hoy (~1–2%); declaran 1–2% como aceptable. |

### 8.4 Próximos pasos (qué hacemos con lo aprendido)
- **Construir / priorizar:** la **tasa transparente** (oráculo + BCRA) visible en el flujo, el **QR de Transferencias 3.0**, y el **escrow no-custodial** como mensaje central del pitch (es lo que más diferenció).
- **Despriorizar / dejar como mock:** **disputas cross-chain** (nadie las pidió → confirma mantener el path single-chain del `dispute_resolver` y dejar Base/Slice como aspiracional); reputación elaborada.
- **Re-entrevistar / explorar:** más segmento **C** (comerciantes, el dolor de cobros chicos frecuentes es fuerte) y resolver el **blocker de onboarding/KYC** para nómades (segmento B) — ver si Crossmint (signer por email) lo destraba.


---

## 9. Logística

- **Quién entrevista:** repartir entre el equipo — idealmente 1–2 entrevistas por persona.
- **Grabación/consentimiento:** pedí permiso para tomar notas y para citar (aunque sea anonimizado: "un freelancer dev, seg. A"). Sin consentimiento, igual usás la quote anonimizada.
