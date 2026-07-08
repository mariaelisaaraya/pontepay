# PontePay — Guía de entrevistas de descubrimiento

> **Para:** quien haga las entrevistas (Eli / Leo / Barb) · Julio 2026
> **Objetivo:** validar el problema y el modelo con 10 personas reales en 3 semanas. Las notas sirven además como evidencia de customer discovery para el SCF.

---

## Reglas de oro (antes de empezar)

1. **No vendas. Escuchá.** La entrevista es sobre SU vida, no sobre PontePay. La app aparece recién en los últimos 10 minutos, si aparece.
2. **Pasado, no futuro.** "¿Qué hiciste el mes pasado?" vale oro; "¿usarías...?" no vale nada (todos dicen que sí).
3. **Preguntá por plata con delicadeza pero preguntá.** Montos y frecuencia son EL dato.
4. **Grabá con permiso** (o tomá notas textuales). Frase: "¿Te molesta si grabo para no perder detalle? Es solo para el equipo."
5. **30-40 minutos máximo.** Presencial o videollamada.

---

## A quién entrevistar (10 personas)

- **6 freelancers exportadores**: cobran del exterior en USDC/USDT/Payoneer/Deel. Ideal variedad: dev, diseño, traducción, contable.
- **4 ahorristas cripto**: compraron stablecoins como refugio en el último año.
- Dónde reclutar: conocidos directos (máx. 3), grupos de Telegram/WhatsApp de freelancers, X cripto, comunidad Stellar Argentina.
- Qué ofrecemos: nada de plata (prohibido para SCF y sesga). Un resumen de resultados y gratitud.

---

## El guion (freelancer exportador)

### Apertura (2 min)
> "Estamos investigando cómo la gente que cobra del exterior maneja su plata. No hay respuestas correctas — nos interesa tu experiencia real."

### Bloque 1 — Su circuito actual (10 min)
1. ¿Cómo cobrás tu trabajo? Contame el recorrido completo del último pago que recibiste, desde que el cliente pagó hasta que la plata llegó a algo que pudiste gastar.
2. ¿En qué moneda te queda? ¿Dónde queda guardada?
3. El mes pasado: ¿cuánto convertiste a pesos, más o menos? ¿En cuántas veces?
4. ¿Con qué lo hiciste? (exchange, P2P, arbolito, amigo) ¿Por qué ESE método?

### Bloque 2 — El dolor (10 min)
5. ¿Qué es lo que más te molesta de ese proceso? (dejar silencio — que llene)
6. ¿Alguna vez te pasó algo malo convirtiendo plata? ¿O conocés a alguien? (estafas, cuentas congeladas, spreads)
7. ¿Escuchaste de los hackeos a wallets/exchanges? ¿Te cambió algo en cómo manejás tu plata?
8. Del 1 al 10, ¿cuánto confiás en que tu exchange/wallet actual "no se quede con tu plata"? ¿Por qué ese número?

### Bloque 3 — La plata quieta (5 min)
9. Entre que cobrás y gastás, ¿la plata queda quieta en algún lado? ¿Cuánto tiempo, más o menos?
10. ¿Hacés algo para que rinda? (plazo fijo, FCI, staking, nada)

### Bloque 4 — Reacción al concepto (10 min — recién acá mostramos)
> Mostrar la app en el teléfono. Dejar que toque. NO explicar de más.
11. (Mirando el Mercado) ¿Qué entendés que es esto? (validar comprensión sin ayuda)
12. "La plata queda bloqueada en un contrato hasta que ambos confirman — ni nosotros podemos tocarla." ¿Eso te importa? ¿Cuánto?
13. (Mostrar fee escalonado) ¿Qué te parece este costo contra lo que pagás hoy?
14. ¿Qué te frenaría para usarlo mañana? (la respuesta más importante de toda la entrevista)

### Cierre (2 min)
15. ¿Conocés a alguien más que cobre del exterior y le gustaría charlar con nosotros? (bola de nieve)

---

## Guion abreviado (ahorrista cripto)

Mismos bloques con estos cambios: Bloque 1 pregunta por la última COMPRA de USDC (dónde, a qué tasa, cómo supo si era buena); Bloque 2 igual; Bloque 3 igual; Bloque 4 mostrar la línea del oráculo en el Mercado y preguntar: "¿esto te cambia cómo decidís si una oferta es buena?"

---

## Registro (una ficha por entrevista)

```
Fecha: · Perfil: freelancer/ahorrista · Edad: · Ciudad:
Cobra/compra: (moneda, canal, monto/mes, frecuencia)
Dolor principal (textual):
Incidente de seguridad propio/cercano: sí/no — detalle:
Confianza en su canal actual (1-10) y por qué:
Plata quieta: (dónde, cuánto tiempo, rinde o no)
Comprensión del Mercado sin ayuda: sí/parcial/no
Reacción a "no-custodial": le importa mucho/algo/nada
Reacción al fee: 
Freno principal para usarlo mañana (textual):
Referidos: 
```

## Qué buscamos validar (hipótesis explícitas)

| # | Hipótesis | Se valida si... |
|---|---|---|
| H1 | El freelancer convierte a pesos todos los meses | ≥5 de 6 lo hacen mensualmente |
| H2 | Desconfía del canal actual | Confianza promedio ≤ 6/10 |
| H3 | "No-custodial" importa (post-Bexo) | ≥6 de 10 lo valoran sin que se lo expliquemos dos veces |
| H4 | El fee escalonado es aceptable | ≥7 de 10 lo comparan favorablemente con su canal |
| H5 | El Mercado se entiende solo | ≥7 de 10 explican qué es sin ayuda |

Si H3 falla → el pilar de seguridad pasa a segundo plano en el marketing (no en el producto).
Si H5 falla → hay trabajo de UX antes que de features.
