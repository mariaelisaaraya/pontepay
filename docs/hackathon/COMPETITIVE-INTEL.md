# PontePay — Inteligencia Competitiva

> Actualizado: 2026-06-25. Investigación adversarial verificada con fuentes primarias (ToS, páginas de tarifas, Reclame Aqui, InfoMoney, BCB).

---

## Mapa competitivo

| Competidor | País | Modelo | Custodia | Spread declarado | Red |
|---|---|---|---|---|---|
| **PontePay** | AR | P2P + escrow | No-custodial | 0.8% (on-chain) | Stellar |
| Lemon Cash | AR | Exchange custodial | Sí | No publicado | Ethereum/Polygon |
| Belo | AR | Exchange custodial | Sí | No publicado | Multi-chain |
| Buenbit | AR | Exchange custodial | Sí | No publicado | Multi-chain |
| Meru | MX/LATAM | Exchange + cuenta virtual | Sí | No publicado | Ethereum |
| Bitso | MX/AR | Exchange custodial | Sí | 0.5–1.5% maker/taker | Multi-chain |
| Binance P2P | Global | P2P con garantía | Custodial temporal | 0% (fee 0.1%) | Multi-chain |
| Foxbit | BR | Exchange CLOB + Swap | Sí | No publicado (Swap: waiver ToS 4.2.3) | BRL/Ethereum |
| Cuevas (informal) | AR | OTC | N/A | ~2% promedio | N/A |

---

## Foxbit — Análisis profundo

### Modelo de negocio

Foxbit opera como exchange centralizado (CLOB) en Brasil, en BRL. **No opera en ARS y no está en Stellar.** No es competencia directa — es referencia de modelo de negocio.

**Fuentes de ingreso de Foxbit:**
- Trading fees: 0.25% maker / 0.50% taker (12 tiers VIP, reducción hasta 0%)
- Foxbit Swap: spread no declarado + waiver contractual (ToS 4.2.3 — usuarios renuncian a reclamar)
- Foxbit Pay: 0.5% por conversión cripto→BRL para comerciantes (B2B)
- Foxbit Earn: margen sobre yield de cripto (hasta ~10% APY real)
- Foxbit Prime Desk: FX B2B con stablecoins ("stablecoins invisíveis ao cliente")
- OTC Desk: para montos >R$100k

### Contradicciones documentadas (ToS vs marketing)

| Lo que marketing dice | Lo que los ToS dicen | Cláusula |
|---|---|---|
| Swap spread: no publicado | Waiver contractual — usuarios renuncian a reclamar la diferencia | 4.2.3 |
| Saque Express en 5 min | Pueden deshabilitar retiros 48h sin aviso | 4.5.2 |
| Límites claros: R$5k/R$75k | Foxbit puede cambiarlos "a su exclusivo criterio" sin aviso | 4.5.1 |
| Sin fees de custodia | "Taxa de Guarda Segura" mensual por inactividad (12+ meses) — **no publicada en la página de tarifas** | 12.6.3 |
| Fees de retiro cripto: basados en blockchain | "Pueden sofrer alterações sem aviso prévio" — usuarios pagaron hasta 13x el costo real | ToS general |
| Reversión de Pix de terceros: 5 días hábiles | No aparece en los ToS vinculantes | ToS ausente |

**Hallazgo clave:** La "Taxa de Guarda Segura" (fee mensual por inactividad) no aparece en `foxbit.com.br/taxas/` — la página principal de tarifas. Solo está en los Términos de Uso (cláusula 12.6.3–12.6.4). Los usuarios no saben que existe hasta que les descuentan.

### Reclame Aqui — Patrones de quejas (confirmados, ~87.6% de resolución, 12h promedio)

- "Taxa extorsiva para saque" — fees de retiro cripto muchos múltiplos del costo real de blockchain
- "Taxas não informadas" — comisiones que el usuario no sabía que existían (Feb 2026)
- "Bloqueio de saque" — retiros bloqueados sin explicación
- "Transferência Pix não efetivada" — depósitos de terceros no devueltos en plazo prometido

---

## Marco regulatorio relevante (Argentina y Brasil)

### Argentina

- **BCRA EMVCo MPM / Transferencias 3.0**: El BCRA implementó el estándar QR unificado. Desde 2024 todos los bancos y billeteras deben aceptar el mismo QR. PontePay es el primer proyecto conocido que usa T3.0 como riel fiat en una operación con liquidación en Stellar.

### Brasil

- **Resolução BCB 519/520/521 (nov 2025, vigente feb 2026)**: Marco PSAV. El Art. 28 de la Res. 520 exige **cuentas individualizadas** por cliente — elimina el modelo "omnibus" que usaban los exchanges. Foxbit tiene hasta octubre 2026 para cumplir. Alto costo de implementación (BaaS con 70+ APIs según OKX Brasil).
- **Resolução BCB 561 (abr 2026, vigente oct 2026)**: **Prohíbe stablecoins en liquidaciones cross-border**. Afecta directamente al Foxbit Prime Desk (lanzado en abril 2026) y a cualquier corridor ARS-BRL con stablecoins. **El corridor ARS-BRL de PontePay se mueve a 2027+ hasta que el marco esté claro.**

---

## Lo que aprendemos de Foxbit y aplicamos a PontePay

### Ya integrado

| Insight | Aplicación en PontePay | Estado |
|---|---|---|
| "Taxa zero" como momento de adquisición | Headline: "sin costo en Transferencias 3.0" | **Integrado en GTM** |
| Swap spread invisible pero documentable | Spread 0.8% auditable on-chain — `src/lib/pricing.ts` | **Activo** |
| Blog de educación como canal de adquisición | Series de content "el spread que no te dicen" | **En GTM-PLAN.md** |

### En roadmap

| Insight | Aplicación en PontePay | Cuándo |
|---|---|---|
| Foxbit Earn (yield sobre cripto idle) | PontePay Earn vía Blend Protocol (`@defindex/sdk` ya instalado) | Q3 2026 |
| Foxbit Pay para comerciantes B2B | PontePay Pay — Segmento C, fee 0.5% | Q4 2026 |
| VIP tiers por volumen | Maker Premium — spread reducido para makers frecuentes | Q1 2027 |
| "Compra recorrente" (DCA automático) | DCA automático quincenal en USDC | Q1 2027 |
| UMA (email como dirección universal) | Privy ya provee esto — comunicar como "nombre@pontepay.ar" | Q3 2026 (marketing) |

### Lo que NO copiamos (son nuestros diferenciadores)

- No usamos omnibus / cuenta custodia — el USDC vive en el contrato Soroban
- No tenemos "Taxa de Guarda Segura" oculta por inactividad
- No aplicamos fees "sin aviso previo"
- No tenemos waiver contractual para esconder el spread
- El spread está implementado en código abierto y auditable on-chain
- Nuestro dispute resolver es on-chain con timelock — no una empresa que responde en 12h

---

## El argumento de diferenciación para el pitch

> *"Foxbit tiene 7 cláusulas en sus Términos que contradicen lo que dicen en su página de tarifas. Los usuarios en Reclame Aqui pagaron hasta 13x el costo real de blockchain en fees 'sin aviso previo', tienen una comisión de custodia mensual oculta por inactividad, y sus retiros pueden bloquearse 48 horas. Nosotros usamos un contrato Soroban open source: las reglas están en el código, son auditables on-chain, y ninguna empresa puede cambiarlas sin previo aviso."*

---

## Fuentes primarias verificadas

- [Foxbit Términos de Uso](https://foxbit.com.br/termos-de-uso/) — cláusulas 3.6, 4.4.2, 4.5.1, 4.5.2, 5.3, 12.3, 12.6.3–12.6.4
- [Foxbit Página de tarifas](https://foxbit.com.br/taxas/)
- [InfoMoney — anuncio "taxa zero" (22 sept 2021)](https://www.infomoney.com.br/mercados/corretora-cripto-foxbit-anuncia-taxa-zero-para-saque-em-reais-e-passa-a-oferecer-retirada-instantanea-24-horas/)
- [Reclame Aqui — lista de reclamaciones Foxbit](https://www.reclameaqui.com.br/empresa/foxbit/lista-reclamacoes/)
- Resolução BCB Nº 519/2025 (publicada nov 2025, vigente feb 2026)
- Resolução BCB Nº 520/2025 — Art. 28: cuentas individualizadas
- Resolução BCB Nº 521/2025
- Resolução BCB Nº 561/2026 (abr 2026, vigente oct 2026) — prohibición stablecoins cross-border
