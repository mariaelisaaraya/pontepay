# Ideas para el equipo · Expansión LATAM + Interoperabilidad

Revisión hecha el **2026-06-21**. Este doc es para discutir en equipo qué sumarle a PeerlyPay para que sea competitivo en **Stellar Pulso** y destaque en interoperabilidad.

---

## Contexto: qué valora el jurado de Stellar Pulso

El hackathon tiene **interoperabilidad** como eje central. El ecosistema Stellar ahora mismo está empujando tres cosas en simultáneo:

1. **PIX internacional** — Brasil tiene 150M usuarios de PIX y $346B en transacciones anuales. PIX ya cruzó a Argentina y está en expansión a 10+ países. Los jueces de un hackathon LATAM van a querer ver esto.
2. **Composabilidad DeFi** — Stellar premia a los proyectos que integran protocolos existentes (como Blend) para hacer yield sobre activos ociosos, en lugar de construir todo desde cero.
3. **Protocol 27 Zipper** (mainnet 8 julio 2026) — Delegación de autenticación como feature de primera clase. Abre la puerta a social recovery, multisig modular, y delegated signing. Es el próximo upgrade de Stellar y los jueces lo van a notar.

---

## Ideas concretas para agregar (priorizadas por impacto/esfuerzo)

### 🔴 1. PIX como método de pago para Brasil

**Qué es:** Agregar BRL como par de intercambio junto a ARS. En la pantalla de payment, en vez de mostrar CBU/alias argentino, mostrar una **clave PIX** del maker (CPF, teléfono, email o aleatoria).

**Por qué suma:**
- Brasil es el mercado más grande de LATAM y el más relevante para el hackathon
- PIX ya cruzó a Argentina — la narrativa de interoperabilidad regional está servida
- Demuestra que PeerlyPay no es solo un producto argentino sino una plataforma LATAM

**Cómo encaja con lo que ya tenemos:** La clave PIX se guarda como campo del maker en la orden (igual que el CBU). El QR EMVCo que ya usamos para Transferencias 3.0 sirve directamente — PIX usa el mismo estándar EMVCo. Solo cambia el payload del QR. El flujo de pantallas no cambia.

**Dónde tocar:** `src/app/trade/payment/page.tsx` (datos de pago), `src/app/orders/post-offer/MarketMakerForm.tsx` (formulario del maker).

---

### 🔴 2. Yield en Blend mientras el USDC está en escrow

**Qué es:** Cuando un maker lockea USDC en el escrow del contrato P2P, en lugar de que quede inactivo, se deposita automáticamente en un **pool de Blend** y empieza a generar yield. Al confirmar el trade, se retira el USDC + intereses y se libera al filler.

**Por qué suma:**
- Transforma el tiempo de espera del trade (pueden ser horas) en algo productivo para el usuario
- Es composabilidad real con el ecosistema Stellar — exactamente lo que busca el criterio #1 del jurado
- Genera un incentivo concreto para ser maker: no solo gano el spread, también gano yield mientras espero

**Cómo técnicamente:** El contrato Soroban P2P haría un cross-contract call al contrato de Blend al momento de `take_order` (cuando se lockea el USDC), y otro al `confirm_fiat_payment` para retirar. El yield generado se puede: (a) quedar en la plataforma como fee, o (b) repartir entre maker y filler como incentivo.

**Qué hay que agregar al contrato:** Un campo `blend_pool_address` en el Config + dos cross-contract calls. No toca el flujo de UI.

---

### 🟠 3. Protocol 27 Zipper — delegated signing para disputas

**Qué es:** Protocol 27 introduce autenticación delegada — una cuenta puede autorizar a otra a firmar en su nombre, acotado a un contrato y función específica. Esto resuelve directamente el bug crítico #5 del `APP-AUDIT.md`: `resolveDispute()` hoy necesita la clave de plataforma (`PLATFORM_SECRET`) pero está mal implementado con el wallet del usuario.

**Por qué suma:**
- Soluciona un bug real de arquitectura de forma elegante, sin exponer claves privadas en ningún servidor
- Demuestra uso de la feature más reciente de Stellar (testnet activa desde 18 junio 2026)
- La narrativa es clara para el jurado: "en vez de un workaround, usamos lo que Stellar construyó para esto"

**Cómo:** Con Zipper, la cuenta de la plataforma delega la autorización de `resolve_dispute` al usuario en un contexto acotado. No hace falta un server action ni exponer `PLATFORM_SECRET`.

**Estado:** Podemos probarlo en testnet ahora mismo, mainnet el 8 de julio.

---

### 🟠 4. Multi-chain USDC via Circle CCTP

**Qué es:** Permitir que usuarios que tienen USDC en Ethereum, Base, o Solana puedan traerlo a Stellar y usarlo en PeerlyPay sin salir de la app. Circle CCTP hace el bridge 1:1 en 23 chains.

**Por qué suma:**
- El criterio de interoperabilidad del hackathon está pidiendo exactamente esto
- Un filler que viene de EVM puede tomar una orden ARS o BRL sin necesitar Stellar previamente
- Amplía el pool de liquidity providers — cualquiera con USDC en cualquier chain puede operar

**Cómo:** Un botón "Bridge USDC from another chain" en la pantalla de wallet que abre el flujo de CCTP. El USDC llega a la wallet Stellar y ya puede usarse en el contrato P2P normalmente. El contrato no necesita cambios.

**Esfuerzo:** Medio-alto. Circle tiene SDK con documentación clara.

---

### 🟡 5. SEP-31 para el corredor Argentina–Brasil

**Qué es:** SEP-31 es el protocolo de Stellar para pagos cross-border entre instituciones. Permite que un anchor argentino y un anchor brasileño liquiden en USDC via Stellar en segundos, con cumplimiento KYC en ambas puntas.

**Por qué suma:** El corredor ARS–BRL es uno de los más activos de LATAM y también uno de los más ineficientes — no existe un rail directo rápido entre los dos países. Con SEP-31, un freelancer argentino puede recibir pesos brasileños de un cliente en Brasil en minutos, con Stellar como infraestructura invisible.

**Cuándo:** Para la demo del hackathon alcanza mostrar el flujo en testnet con `testanchor.stellar.org`. La implementación real necesita anchors regulados en ambos países, así que es una visión de mediano plazo.

---

## Resumen ejecutivo para la reunión

| Idea | Impacto demo | Esfuerzo | Alineación con criterios |
|------|-------------|----------|--------------------------|
| 🔴 PIX para Brasil | ★★★★★ | Medio | Interoperabilidad + LATAM |
| 🔴 Blend yield en escrow | ★★★★★ | Medio | Composabilidad + DeFi |
| 🟠 Zipper delegated signing | ★★★★☆ | Bajo-Medio | Últimas features Stellar |
| 🟠 CCTP multi-chain USDC | ★★★★☆ | Alto | Interoperabilidad cross-chain |
| 🟡 SEP-31 ARS–BRL corridor | ★★★☆☆ | Alto | Narrativa fuerte, largo plazo |

**Recomendación:** arrancar por PIX + Blend. PIX porque usa infraestructura que ya tenemos (QR EMVCo, pantalla de payment) y expande el mercado al país más grande de la región. Blend porque transforma el escrow existente en algo que genera valor mientras espera, y es composabilidad pura con el ecosistema Stellar — que es exactamente lo que el jurado quiere ver.
