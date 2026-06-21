# Demo assets — raw footage del recorrido en vivo

Grabado automáticamente con Playwright sobre la app en producción
(https://peerlypay-two.vercel.app), en **modo demo** (sin wallet). Úsenlo como
base para el video de 1–2 min: narren encima del `.webm` o armen el video con los
screenshots. Guion: [`../../hackathon/DEMO_SCRIPT.md`](../../hackathon/DEMO_SCRIPT.md).

## Video
- **`peerlypay-demo.webm`** — recorrido completo: home → marketplace → confirm → payment → waiting → success → /anchor. Viewport mobile (400×860), con anotación de clicks.
  > Convertir a mp4 si lo necesitan: `ffmpeg -i peerlypay-demo.webm peerlypay-demo.mp4`

## Screenshots (storyboard)
| # | Archivo | Qué muestra |
|---|---------|-------------|
| 1 | `01-home.png` | Home / dashboard |
| 2 | `02-marketplace.png` | Marketplace con órdenes (demo) |
| 3 | `03-confirm.png` | Confirm — **tasa "1 USD ≈ 1.461 ARS · oracle"** (oráculo on-chain) + banner Demo mode |
| 4 | `04-payment-qr.png` | Payment — **QR de Transferencias 3.0** (BCRA interoperable) |
| 5 | `05-waiting.png` | Waiting (escrow / confirmación) |
| 6 | `06-success.png` | Success — trade completado |
| 7 | `07-anchor.png` | `/anchor` — **SEP-24 "Connected"** (testanchor.stellar.org, USDC) |

## Notas para el video
- El **modo demo** recorre todo sin wallet → ideal para grabar sin fricción.
- Puntos a remarcar narrando: (a) la **tasa viene de un oráculo on-chain** (no hardcodeada), (b) el **QR de Transferencias 3.0** como pata fiat, (c) el **anchor SEP-24** conectado, (d) el contrato Soroban en testnet (`CC2CA5…`).
- Para mostrar el **connect de wallet real** en el video, primero hay que agregarle a la `ck_staging` los scopes `users.create` + `users.read` (ver nota en el chat / CONTEXT). Sin eso, el login falla; el demo no lo necesita.
