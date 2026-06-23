# PeerlyPay — Estado actual para UX/UI

> **Actualizado:** 23 de junio de 2026 · **Repo:** `mariaelisaaraya/pontepay`  
> **Para:** Barbi (UX/UI) · **Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui

---

## Cómo arrancar (2 minutos)

```bash
npm install
npm run dev   # abre http://localhost:3000
```

Para recorrer el flujo sin wallet real, usá el **modo demo**:

```
http://localhost:3000/marketplace
→ click en cualquier orden → agrega ?demo=1 a la URL de confirm
```

---

## Qué funciona on-chain hoy

| Función | Estado | Cómo se prueba |
|---------|--------|---------------|
| Marketplace carga órdenes reales | ✅ On-chain | Abrir `/marketplace` — lee el contrato Soroban en testnet |
| Tasa de cambio en vivo (oráculo) | ✅ On-chain | El número de ARS/USD viene del oráculo Reflector vía nuestro contrato |
| Confirmar trade (`takeOrder`) | ✅ Cableado | Llama a `take_order_with_amount` en el contrato |
| Envié el pago (`submitFiatPayment`) | ✅ Cableado | Llama a `submit_fiat_payment` en el contrato |
| Confirmar recepción (`confirmFiatPayment`) | ✅ Cableado | Llama a `confirm_fiat_payment` en el contrato |
| Crear orden (`createOrder`) | ✅ Cableado | Llama a `create_order_cli` en el contrato |
| Firma de transacciones (Privy wallet) | ✅ Implementado | `signEscrowXdr()` usa Privy v2 `signTransaction` |
| Flujo demo completo sin wallet | ✅ Funciona | Agregar `?demo=1` a `/trade/confirm` |

---

## Qué es mock / placeholder (zona de trabajo UX/UI)

| Pantalla | Qué está hardcodeado | Archivo |
|----------|---------------------|---------|
| `/trade/payment` | Datos bancarios del maker (`makerName = 'JuanC_AR'`, CBU, alias), score de reputación | `src/app/trade/payment/page.tsx` |
| `/trade/payment` | Nombre y dirección del maker (`0x1234...5678`) | mismo archivo |
| `/profile` | Trust score derivado del hash de wallet, "12 completed trades" | `src/app/profile/page.tsx` |
| `/marketplace` → OrderCard | `reputation_score`, `completionRate` siempre en 100% | `src/components/OrderCard.tsx` |
| `/trade/enable-usdc` | Loading de 2s simulado, `checkUSDCTrustline()` devuelve siempre `true` | `src/app/trade/enable-usdc/page.tsx` |
| `/orders/dashboard` | Historial de órdenes es localStorage, no chain | `src/app/orders/dashboard/page.tsx` |

---

## Pantallas — estado completo

| Ruta | Nombre | Estado visual | Datos reales | Notas |
|------|--------|--------------|-------------|-------|
| `/` | Home / landing | ✅ Ok | — | Solo marketing |
| `/marketplace` | Marketplace | ✅ Ok | ✅ Chain | Carga órdenes reales; si está vacío muestra DEMO_ORDERS |
| `/trade/confirm` | Confirmar trade | ✅ Ok | ✅ Tasa on-chain | Tiene banner "Demo mode" si `?demo=1` |
| `/trade/enable-usdc` | Activar USDC | 🟡 Pulir | ❌ Mock (2s fake) | UX de estados loading/éxito/error pendiente |
| `/trade/payment` | Pago QR | 🟡 Pulir | ❌ Datos bancarios hardcoded | QR Transferencias 3.0 sí es real |
| `/trade/waiting` | Esperando confirmación | ✅ Ok | — | Polling pendiente (hoy timer fake) |
| `/trade/success` | Éxito | ✅ Ok | — | Falta link al explorer de la TX |
| `/anchor` | SEP-24 Anchor | 🟡 Pulir | ✅ Descubrimiento live | Falta identidad visual (chips, badge "Connected") |
| `/orders/create` | Crear orden | 🟡 Pulir | — | Form existe, submit no llama al chain sin wallet |
| `/orders/dashboard` | Mis órdenes | 🟡 Pulir | ❌ localStorage | Estado vacío necesita diseño |
| `/profile` | Perfil | 🟡 Pulir | ❌ Datos hardcoded | Trust score, historial |
| `/corridor` | Corredor ARS→BRL | 🟡 Pulir | — | Funcionalidad futura, puede ser "coming soon" |
| `/wallet/bridge` | Bridge USDC | 🟡 Pulir | — | CCTP multi-chain, puede ser "coming soon" |
| `/admin/risk` | Monitor AML | 🟡 Pulir | — | Interno, no es flow de usuario |

---

## Flujo principal del jurado (el más importante)

```
/marketplace
  └─→ click "Trade" en una orden
        └─→ /trade/confirm?orderId=X&demo=1
              └─→ click "Confirm Trade"
                    └─→ /trade/payment  (QR Transferencias 3.0)
                          └─→ click "Ya envié el pago"
                                └─→ /trade/waiting
                                      └─→ /trade/success ✅
```

Todo este flujo funciona con `?demo=1`. Sin demo, requiere wallet Privy autenticada.

---

## Diferenciadores visuales para mostrar al jurado

| Diferenciador | Dónde | Estado |
|--------------|-------|--------|
| Tasa oráculo vs tasa BCRA oficial (la "brecha") | `/trade/confirm` fila "Rate · oracle" | 🟡 Mostrar las dos tasas lado a lado |
| QR EMVCo / Transferencias 3.0 | `/trade/payment` | ✅ Generado en tiempo real |
| "Verificar en Stellar Explorer" al final | `/trade/success` | 🟡 Agregar link con el hash de la TX |
| Badge "Testnet" coherente en todas las pantallas | Global | 🟡 Revisar que diga Testnet en todas partes |

Hook disponible: `useLiveRate()` en `src/lib/useLiveRate.ts` — devuelve `{ usdArs, reflector, bcraOfficial, source }`.

---

## Lo que NO tocar (integración on-chain — riesgo alto)

| Archivo | Por qué no tocar |
|---------|-----------------|
| `src/lib/trade-actions.ts` | Llama al contrato Soroban — cambios aquí rompen el trade real |
| `src/lib/soroban-submit.ts` | Ciclo simulate → sign → submit — lógica crítica |
| `src/lib/privy-wallet.ts` | Firma de transacciones — no modificar sin entender Privy v2 |
| `src/lib/p2p.ts` | Cliente de lectura del contrato |
| `src/lib/contract-config.ts` | Apunta al contrato desplegado en testnet |
| `src/contracts/p2p/src/index.ts` | Bindings generados del contrato — no editar a mano |
| `src/lib/rates*.ts` | Cadena de fallback de tasas (contrato → Reflector → BCRA → constante) |

---

## Tareas priorizadas para UX/UI

### Alta prioridad (impacta la demo del jurado)

1. **De-mockear datos del maker en `/trade/payment`**
   - Mostrar el `createdBy` real de la orden (disponible en el store/chain) o un placeholder honesto ("Vendedor verificado").
   - Quitar `makerAddress = '0x1234...5678'` — es una dirección EVM, no tiene sentido en Stellar.

2. **Brecha de tasas en `/trade/confirm`**
   - Usar `useLiveRate()` para mostrar tasa del oráculo Y tasa BCRA oficial lado a lado.
   - Ejemplo: "Oráculo: 1.461 · BCRA oficial: 1.461 · Mercado blue: 1.480"

3. **Link al explorer en `/trade/success`**
   - Cuando el trade termina, mostrar el hash de la TX con link a `https://stellar.expert/explorer/testnet/tx/<hash>`.

### Media prioridad

4. **UX real de trustline en `/trade/enable-usdc`**
   - Estados: cargando → activada → error.
   - La lógica la cablea Eli; vos dejá los estados visuales listos.

5. **Empty states**
   - `/orders/dashboard` sin historial: diseño de estado vacío elegante.
   - `/marketplace` sin órdenes reales: aclarar "Mostrando órdenes demo".

6. **Badge "Testnet" global**
   - Revisar que todas las pantallas lo muestren con consistencia.
   - Los links de explorer que apunten a `stellar.expert/explorer/testnet` (no mainnet).

### Baja prioridad

7. **`/anchor` — identidad visual**
   - Chips de deposit/withdraw, badge "Connected" al anchor `testanchor.stellar.org`.

8. **Páginas futuras → "Próximamente"**
   - `/corridor` y `/wallet/bridge` pueden tener un diseño "coming soon" limpio en lugar de UI incompleta.

---

## Archivos clave de UI

| Componente | Ruta |
|-----------|------|
| Tokens de diseño / colores | `src/app/globals.css` (oklch) |
| Componentes shadcn | `src/components/ui/**` |
| OrderCard | `src/components/OrderCard.tsx` |
| WalletButton | `src/components/WalletButton.tsx` |
| AnchorCard | `src/components/AnchorCard.tsx` |
| Store global (Zustand) | `src/lib/store.ts` |
| Hook tasa en vivo | `src/lib/useLiveRate.ts` |

---

## Dudas técnicas

| Pregunta | Respuesta |
|----------|-----------|
| ¿Cómo obtengo los datos reales de una orden? | Del store: `useOrderStore()` o del hook de la página que ya los carga |
| ¿Cómo sé si es demo o real? | `searchParams.get('demo') === '1'` en la URL |
| ¿Dónde está el hash de la TX? | Pendiente: `sorobanSubmit()` lo retorna, hay que pasarlo al success screen |
| ¿Qué wallet usan los usuarios? | Privy embedded wallet (email login, sin extensión de browser) |
| ¿Hay backend? | No. Todo es contrato Soroban + localStorage para el historial |
