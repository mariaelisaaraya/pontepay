import { NextRequest, NextResponse } from 'next/server';

// ─── CUIT check-digit algorithm ──────────────────────────────────────────────
// Argentine tax ID validation (same algorithm used by ARCA/AFIP)

const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

const CUIT_TYPE: Record<string, string> = {
  '20': 'Persona física (masculino)',
  '23': 'Persona física (extranjero)',
  '24': 'Persona física (extranjero)',
  '27': 'Persona física (femenino)',
  '30': 'Persona jurídica',
  '33': 'Persona jurídica (extranjera)',
  '34': 'Persona jurídica (extranjera)',
};

function parseCuit(raw: string): string {
  return raw.replace(/[-.\s]/g, '');
}

function checkCuitDigit(clean: string): boolean {
  if (!/^\d{11}$/.test(clean)) return false;
  const sum = CUIT_WEIGHTS.reduce((acc, w, i) => acc + w * parseInt(clean[i]), 0);
  const rem = sum % 11;
  const expected = rem === 0 ? 0 : rem === 1 ? 9 : 11 - rem;
  return expected === parseInt(clean[10]);
}

function formatCuit(clean: string): string {
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean[10]}`;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('cuit') ?? '';
  const clean = parseCuit(raw);

  if (!/^\d{11}$/.test(clean)) {
    return NextResponse.json(
      { valid: false, error: 'El CUIT debe tener 11 dígitos.' },
      { status: 400 },
    );
  }

  if (!checkCuitDigit(clean)) {
    return NextResponse.json(
      { valid: false, error: 'Dígito verificador incorrecto.' },
      { status: 400 },
    );
  }

  const prefix = clean.slice(0, 2);
  const type = CUIT_TYPE[prefix] ?? 'Tipo desconocido';

  // ── Real ARCA lookup (requires env credentials) ───────────────────────────
  // When ARCA_CUIT + ARCA_CERT + ARCA_KEY are configured, query the live
  // ws_sr_constancia_inscripcion (Padrón A10) service via @afipsdk/afip.js.
  // Without credentials, we return a validated-format response for demo.

  const hasCredentials =
    !!process.env.ARCA_CUIT &&
    !!process.env.ARCA_CERT &&
    !!process.env.ARCA_KEY;

  if (hasCredentials) {
    try {
      // Dynamic import so the server doesn't crash if env vars are missing
      const Afip = (await import('@afipsdk/afip.js')).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const afip = new (Afip as any)({
        CUIT: parseInt(process.env.ARCA_CUIT!),
        cert: process.env.ARCA_CERT!,
        key: process.env.ARCA_KEY!,
        production: process.env.ARCA_PRODUCTION === 'true',
      });

      const data = await (afip as any).RegisterScopeThirteen.getTaxpayerDetails(
        parseInt(clean),
      );

      return NextResponse.json({
        valid: true,
        cuit: formatCuit(clean),
        type,
        razonSocial: data?.datosGenerales?.razonSocial ?? 'Sin denominación',
        estado: data?.datosGenerales?.estadoClave ?? 'DESCONOCIDO',
        domicilio: data?.datosGenerales?.domicilioFiscal?.direccion ?? null,
        source: 'arca-live',
      });
    } catch (err) {
      console.error('[ARCA] Live lookup failed, falling back to format-only:', err);
    }
  }

  // ── Demo / format-only response ───────────────────────────────────────────
  return NextResponse.json({
    valid: true,
    cuit: formatCuit(clean),
    type,
    razonSocial: null,
    estado: 'FORMATO_OK',
    source: 'format-validation',
  });
}
