# PeerlyPay — Tareas del Equipo · PULSO Argentina 2026

> **Deadline: 30 Jun 23:59**  ·  Hoy: 22 Jun  ·  **8 días restantes**
>
> **Leo** = Product Manager · **Eli** = Tech Lead (integraciones + env) · **Barbi** = Frontend

---

## Estado del repo (22 Jun) — qué hay hecho para que Eli y Barbi partan de esto

### ✅ Stack técnico completo (Leo + sesiones de AI)
| Área | Estado |
|------|--------|
| Contrato Soroban `p2p` | ✅ Deployado testnet · 20/20 tests · 5 órdenes seeded |
| Oracle Reflector (ARS) | ✅ Cross-contract call live ~1461 |
| Lifecycle escrow completo | ✅ create/take/submit/confirm/dispute/resolve |
| Privy embedded wallets | ✅ Wired — falta API key en env |
| Transferencias 3.0 QR | ✅ EMVCo MPM con CRC16 |
| SEP-24 anchor discovery | ✅ `/anchor` + `/api/anchor/info` vivo |
| SEP-31 corredor ARS→BRL | ✅ `/corridor` con simulación + proxy `/api/sep31` |
| CCTP bridge multi-chain | ✅ `/wallet/bridge` |
| PIX Brasil | ✅ Campo maker + QR display |
| AML Risk Monitor | ✅ `/admin/risk` con gen-fraud-graph patterns |
| Security fixes | ✅ H-1 timeout, oracle band ±20%, pause guard |

**Lo que falta:** env vars configuradas, Vercel deploy, frontend pulido, integraciones conectadas end-to-end.

---

## 🟣 ELI — Integraciones & Env

> Eli conecta lo que ya está construido pero no tiene las keys reales puestas.

### ELI-1 · Configurar `.env.local` para desarrollo `URGENTE`
**Deadline: 23 Jun**

Crear el archivo `.env.local` en la raíz del proyecto (está en `.gitignore`, nunca va al repo):

```bash
# .env.local
NEXT_PUBLIC_P2P_CONTRACT_ID=CB5PXAQJMYTGAZ55ZHLEQJU2UHNYQUOMSIGBHYUUKWYXS3QPMPIJCEDT
NEXT_PUBLIC_CROSSMINT_API_KEY=ck_...    # pedir a Leo la key del equipo
DISPUTE_RESOLVER_SECRET=S...            # clave privada del dispute resolver
                                         # obtener con: stellar keys show peerly-deployer --show-secret
```

Verificar que el servidor levanta sin errores:
```bash
npm run dev
# Abrir http://localhost:3000
# Login con email → wallet Stellar debe crearse
# Marketplace debe cargar con órdenes reales
```

---

### ELI-2 · Verificar que las 4 acciones on-chain funcionan
**Deadline: 25 Jun**

Estas 4 llamadas al contrato deben completarse sin error en testnet:

| Acción | Función contrato | Dónde se dispara en el front |
|--------|-----------------|------------------------------|
| Crear orden | `create_order_cli` | `/orders/post-offer` |
| Tomar orden | `take_order_with_amount` | `/trade/confirm` |
| Enviar pago fiat | `submit_fiat_payment` | `/trade/payment` |
| Confirmar pago | `confirm_fiat_payment` | `/trade/success` (maker) |

Si alguna falla → revisar `src/lib/trade-actions.ts` y `src/lib/privy-wallet.ts`. El error más probable es que Crossmint no tenga la API key.

---

### ELI-3 · Deploy en Vercel + env vars
**Deadline: 26 Jun**

Guía completa en `docs/hackathon/DEPLOY_FRONTEND.md`.

Variables a configurar en el dashboard de Vercel (Settings → Environment Variables):
```
NEXT_PUBLIC_P2P_CONTRACT_ID      = CB5PXAQJMYTGAZ55ZHLEQJU2UHNYQUOMSIGBHYUUKWYXS3QPMPIJCEDT
NEXT_PUBLIC_CROSSMINT_API_KEY    = ck_...
DISPUTE_RESOLVER_SECRET          = S...   ← NUNCA en git, solo en Vercel
```

Una vez deployado:
- Pasar la URL a Leo (para DoraHacks y el video)
- Verificar `https://<url>/api/rates` → `{ source: "contract", usdArs: ~1461 }`

---

### ELI-4 · Conectar SEP-24 signing (si hay tiempo)
**Deadline: 28 Jun**

El `/anchor` page tiene discovery live pero el deposit signing (SEP-10 challenge) está scaffolded. Si Eli tiene tiempo:
- `src/lib/sep24.ts` → implementar `signSep10Challenge(wallet, challenge)` usando el wallet de Privy
- Conectarlo al botón "Deposit" del `AnchorCard`

No es bloqueante para la submission — el discovery ya muestra intención real.

---

### ELI-5 · Redeploy contrato desde admin del equipo (si hace falta)
**Deadline: 27 Jun**

Solo necesario si el jurado pide ver el contrato deployado desde el wallet oficial del equipo. El contrato actual funciona pero usa una clave de Leo.

```bash
# WSL Ubuntu
cd contracts
make p2p-build
make p2p-deploy NETWORK=testnet SOURCE=admin
make p2p-init   NETWORK=testnet SOURCE=admin \
  ADMIN=<wallet-equipo> DISPUTE_RESOLVER=<key> \
  TOKEN_CONTRACT_ID=CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU
make p2p-config NETWORK=testnet SOURCE=admin \
  ORACLE_ID=CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W
make p2p-seed-orders NETWORK=testnet SOURCE=admin
```

Si lo hace → avisarle a Leo el nuevo Contract ID para actualizar `contract-config.ts`.

---

## 🔵 BARBI — Frontend

> Barbi rehace / pule las pantallas para que el jurado vea algo sólido.

### BARBI-1 · Setup del entorno local
**Deadline: 23 Jun**

```bash
git clone https://github.com/PeerlyPay/peerlypay
cd peerlypay
npm install
# Pedirle a Eli el .env.local cuando esté listo
npm run dev
```

Revisar estas rutas que son las que el jurado va a ver:
- `/` → home
- `/marketplace` → órdenes
- `/trade/confirm` → flujo de compra
- `/trade/payment` → QR Transferencias 3.0
- `/corridor` → ARS→BRL
- `/admin/risk` → AML monitor
- `/profile` → perfil con links a bridge + corridor

---

### BARBI-2 · Identificar qué pantallas necesitan trabajo
**Deadline: 23 Jun**

Hacer un recorrido y levantar los issues en el repo (o en un doc compartido) indicando:
- Qué está roto visualmente
- Qué está incompleto
- Qué no tiene datos reales aún

Priorizad por lo que el jurado ve en los primeros 90 segundos del demo.

---

### BARBI-3 · Implementar los fixes del frontend
**Deadline: 27 Jun**

Con los issues de BARBI-2, iterar. Algunas cosas probables que pueden necesitar trabajo:

**Pantallas críticas (el jurado las ve):**
- `Marketplace` — order cards con AML badge, filtros funcionando
- `Trade confirm` → `payment` → `success` — flujo visual limpio, no broken
- `Corridor` (`/corridor`) — formulario ARS→BRL, route card con tasas
- `Admin Risk` (`/admin/risk`) — tabla de órdenes con flags AML

**Pantallas secundarias:**
- `/profile` — links a Bridge, Corridor, AML Monitor
- `/anchor` — anchor card con datos del testanchor
- `/wallet/bridge` — CCTP bridge UI

Para abrir un PR: branch desde `main`, push, PR a `main`.

---

### BARBI-4 · 5 entrevistas de customer discovery
**Deadline: 26 Jun**

Pegar resultados en `docs/hackathon/CUSTOMER_DISCOVERY.md`.

**Formato:**
```
- Entrevistado: [nombre o iniciales], [rol], [país]
- Fecha: DD/MM/2026
- Cita directa del dolor: "..."
- Qué cambió en el producto por esta entrevista:
```

**Preguntas:**
1. ¿Cómo convertís USDC a pesos hoy? ¿Cuánto tardás?
2. ¿Usaste Binance P2P o similar? ¿Qué odiás?
3. ¿Confiarías en escrow automático on-chain?
4. ¿Cuánto pagás de fee?
5. ¿El tipo de cambio te parece justo?

**Perfiles a buscar:** freelancers / remotos en Argentina que cobran en crypto.

---

## 🟢 LEO — Product Manager

### LEO-1 · DoraHacks project page
**Deadline: 28 Jun** (esperar URL de Vercel de Eli)

- Nombre: PeerlyPay
- Descripción: *"Non-custodial P2P USDC↔ARS ramp on Stellar Soroban. Live Reflector oracle, Transferencias 3.0 QR, SEP-31 ARS→BRL corridor, AML risk scoring."*
- Links: repo + Vercel URL + video
- Pegar URL en `SUBMISSION_CHECKLIST.md` → Sección D

### LEO-2 · Demo video 90s
**Deadline: 28 Jun** (después de Vercel de Eli)

Script en `docs/hackathon/DEMO_SCRIPT.md`. Grabar con Loom.

### LEO-3 · Pitch deck
**Deadline: 29 Jun**

Fuente: `docs/hackathon/PITCH.md` → exportar a Slides/Canva con screenshots actualizados.

### LEO-4 · Checklist final
**Deadline: 30 Jun AM**

Recorrer `SUBMISSION_CHECKLIST.md` completo. Submit DoraHacks antes de 23:59.

---

## 📋 Calendario

| Día | Leo (PM) | Eli (Tech) | Barbi (Frontend) |
|-----|----------|------------|-----------------|
| **22** | Compartir este doc | Leer estado del repo | Clonar repo |
| **23** | Passar Crossmint key a Eli | `.env.local` + `npm run dev` | Setup + relevamiento BARBI-2 |
| **24** | — | Verificar 4 acciones on-chain | Empezar fixes |
| **25** | — | Vercel deploy | Fixes + entrevistas |
| **26** | — | Test E2E en Vercel | Entrevistas done |
| **27** | — | SEP-24 signing (si hay tiempo) | Frontend done |
| **28** | DoraHacks + video | Buffer | Pitch deck |
| **29** | Pitch deck | Mainnet (opcional) | Review |
| **30** | ✅ Submit 23:59 | ✅ | ✅ |

---

## 🚨 Bloqueantes críticos

| Bloqueante | Quién desbloquea | Cuándo |
|-----------|-----------------|--------|
| Crossmint API key → Eli no puede hacer ELI-1 | **Leo** pasa la key | **Hoy** |
| Vercel URL → Leo no puede hacer DoraHacks ni video | **Eli** hace ELI-3 | 26 Jun |
| Frontend roto → video queda mal | **Barbi** hace BARBI-3 | 27 Jun |
| Entrevistas vacías → criterio B3 sin evidencia | **Barbi** hace BARBI-4 | 26 Jun |
