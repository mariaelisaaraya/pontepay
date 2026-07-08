# PontePay v2 — Hoja de ruta

> **Para:** Eli, Leo y Barb — para discutir y repartir.
> **Qué es esto:** el plan de mejora post-hackathon, basado en tres investigaciones: qué financió el Stellar Community Fund (SCF) en las últimas 24 rondas, cómo funciona el programa de recompensas de Venmo, y qué pasó con la competencia.
> **Fecha:** 7 de julio de 2026.

---

## La noticia principal

Cruzamos las rondas 20 a 43 del SCF (el fondo de Stellar que financia proyectos, con premios de USD 50.000 a 150.000) y encontramos esto:

**Ningún proyecto financiado hasta hoy combina las 4 cosas que PontePay ya tiene:**

1. Un **mercado P2P** (personas comprando y vendiendo entre sí)
2. Un **contrato escrow propio** (la plata queda bloqueada en el contrato, no en una empresa)
3. El **corredor peso argentino** (Transferencias 3.0, tasa BCRA)
4. **Rendimiento integrado** (el USDC quieto genera interés vía DeFindex)

Los proyectos parecidos tienen 1 o 2 de esas piezas. Nosotros tenemos las 4 funcionando. **Ese es el titular de nuestra aplicación al SCF.**

---

## Los 3 pilares de la v2

### Pilar 1 — Seguridad estructural: "no te pueden robar lo que no guardamos"

**Qué pasó:** en mayo de 2026 hackearon a Bexo, una wallet argentina (justo la que ganó SCF #43 con rampa de pesos). Les robaron bitcoin de las cuentas de usuarios, y la propia empresa les dijo a sus clientes que sacaran la plata. Fuentes: [CriptoNoticias](https://www.criptonoticias.com/seguridad-bitcoin/roban-bitcoin-bexo-wallet/), [iProUP](https://www.iproup.com/economia-digital/68299-robaron-bitcoin-a-una-wallet-argentina).

**Por qué nos importa:** hay usuarios argentinos buscando una alternativa confiable AHORA. Y nuestra diferencia no es marketing, es de diseño:

- En una wallet custodial, la empresa guarda la plata de todos → existe una "caja fuerte" gigante que atacar.
- En PontePay **no hay caja fuerte**: tu plata está en tu wallet. El único momento en que hay fondos "en la app" es durante un trade, bloqueados en el contrato, con devolución automática si la otra parte desaparece. Ni nosotros podemos tocarlos.

**Regla de comunicación:** nunca nombrar a Bexo ni hacer FUD (miedo) con nombre propio. La frase correcta: *"los incidentes recientes en wallets argentinas muestran por qué el diseño no-custodial importa"*.

**Nuestra tarea pendiente:** hoy las claves de nuestros usuarios las maneja Privy (una empresa externa, seria, pero externa al fin). El paso siguiente es **passkeys**: que la clave viva en el teléfono del usuario y firme con la huella digital. Stellar ya publicó código de referencia para esto (lo financió en la ronda 41). Después del caso Bexo, esto dejó de ser "estaría bueno" y pasó a ser el argumento central.

### Pilar 2 — Retención: "PontePay Frecuente" (el truco de Venmo)

**Qué hace Venmo:** su programa "Stash" no regala plata por tener saldo — regala plata por **adoptar hábitos**. Das 1% de cashback base, 2% si activás la recarga automática, 5% si cobrás tu sueldo ahí. Es decir: premia que Venmo se vuelva tu cuenta principal. Y las recompensas se pagan **adentro del balance de Venmo**, así la plata nunca sale del circuito. Con un techo mensual para que no les cueste una fortuna.

**Nuestra versión — "PontePay Frecuente":**

| Hábito del usuario | Recompensa |
|---|---|
| Base: hacés un trade | Comisión normal (2,5% → 0,8% según tamaño, ya funciona) |
| Operaste 2 meses seguidos | Te devolvemos el 20% de la comisión |
| Mantenés 100+ USDC en Earn | Un escalón más de devolución |

- La devolución se paga **en USDC directo al vault de Earn** → la recompensa genera interés → la plata se queda en PontePay (el círculo de Venmo).
- Se financia con la comisión que el contrato ya cobra — con techo mensual, así el costo está controlado.
- El lenguaje: nada de "APY" ni jerga financiera. Decimos: *"recompensas por hacer de PontePay tu rampa de todos los meses"*.

**Por qué encaja:** en las rondas recientes del SCF (35 a 43), la combinación "wallet + ahorro/rendimiento" es LA que gana. Y hay un dato de la propia Stellar: la wallet Beans **multiplicó su volumen 2,5 veces** después de integrar DeFindex — lo mismo que nosotros ya integramos.

### Pilar 3 — Camino al SCF Build Award

El SCF no es un pitch de 5 minutos: es una evaluación técnica con tiempo, donde nuestras fortalezas (todo verificable on-chain, README honesto, contrato testeado) pesan como corresponde.

- **Titular:** el combo de 4 piezas que nadie más tiene (arriba).
- **Precedente que nos favorece:** Trustless Work (escrow Soroban) fue financiado 2 veces → nuestra categoría está validada.
- **Dato clave:** el 76% de los premios de la ronda 43 entró por **referidos**. Conocemos gente del ecosistema: el equipo de DeFindex (financiado en la ronda 32) es candidato natural a referirnos, porque los integramos.
- **Requisito implícito:** llegar con algo de tracción (usuarios de prueba, volumen en testnet, y idealmente mainnet).

---

## El plan por fases

### Fase 1 — Ordenar la casa (2-3 semanas)
- [ ] Terminar el refactor pendiente (`refactor/casa-en-orden`: reorganizar `src/lib` por dominios)
- [ ] Eliminar el proyecto duplicado de Vercel (hoy hay dos deployando el mismo repo — ya nos causó un bug)
- [ ] Unificar los 3 contratos viejos: dejar solo el V2 y cancelar/documentar los otros
- [ ] MVP de **PontePay Frecuente**: registro de rachas + devolución al Earn (puede arrancar en el servidor; al contrato después)
- [ ] Contactar a **Anclap** (el ancla de pesos argentinos en Stellar) para la rampa ARS real de mainnet

### Fase 2 — Seguridad y mainnet (1-2 meses)
- [ ] **Passkeys**: firma con huella, clave en el teléfono (hay implementación de referencia de SDF)
- [ ] Deploy a **mainnet**: dispute resolver como multisig (hoy es una cuenta admin), auditoría informal del contrato
- [ ] USDC real de Circle en mainnet + Anclap para depositar/retirar pesos de verdad

### Fase 3 — Aplicar al SCF
- [ ] Redactar la aplicación con el titular de las 4 piezas
- [ ] Conseguir referido (DeFindex / comunidad Stellar Argentina)
- [ ] Juntar evidencia de tracción: trades reales, usuarios de prueba, el video demo
- [ ] Presupuesto y milestones (el SCF financia contra entregables)

---

## Mapa competitivo (resumen)

| Proyecto | Qué tiene | Qué le falta (vs nosotros) |
|---|---|---|
| **Bexo** (SCF #43, Argentina) | Rampa ARS, QR, super-app | Fue hackeada en mayo; custodial en la práctica |
| **Reyts** (SCF #35) | P2P de monedas sub-atendidas | Sin corredor ARS, sin yield |
| **Ibis** (SCF #42, Venezuela) | Neobank para remote workers | Sin P2P, sin escrow propio |
| **Meru** (multi-ronda, USD 770M volumen) | Tracción enorme, freelancers LATAM | Custodial, sin P2P |
| **Anclap** (incumbente ARS) | El ancla de pesos establecida | Es infraestructura, no app — **candidato a socio, no rival** |

---

## Fuentes

- Recaps de rondas SCF 20-43: [medium.com/stellar-community](https://medium.com/stellar-community) (Gemma Dobbs y Emir Ayral) · [communityfund.stellar.org/projects](https://communityfund.stellar.org/projects)
- Reporte de impacto SCF 2025 (dato de Beans×DeFindex 2,5x)
- Venmo Stash: [venmo.com/stash-rewards](https://venmo.com/stash-rewards) · [anuncio oficial](https://newsroom.paypal-corp.com/2025-11-10-Venmo-Introduces-Venmo-Stash-to-Reinvent-Rewards) · [TechCrunch](https://techcrunch.com/2025/11/10/venmo-launches-cash-back-rewards-program-for-debit-cards/)
- Hackeo de Bexo: [CriptoNoticias](https://www.criptonoticias.com/seguridad-bitcoin/roban-bitcoin-bexo-wallet/) · [iProUP](https://www.iproup.com/economia-digital/68299-robaron-bitcoin-a-una-wallet-argentina)
