import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

// ─── Design system ────────────────────────────────────────────────────────

const C = {
  bg: '#07070e',
  surface: '#0d0d1f',
  card: 'rgba(255,255,255,0.038)',
  cardHover: 'rgba(255,255,255,0.06)',
  border: 'rgba(167,139,250,0.14)',
  borderStrong: 'rgba(167,139,250,0.35)',
  primary: '#7c3aed',
  primarySoft: 'rgba(124,58,237,0.12)',
  accent: '#a78bfa',
  accentSoft: 'rgba(167,139,250,0.18)',
  white: '#f1f5f9',
  muted: '#64748b',
  dim: '#334155',
  green: '#34d399',
  greenSoft: 'rgba(52,211,153,0.12)',
  blue: '#60a5fa',
  blueSoft: 'rgba(96,165,250,0.12)',
  red: '#f87171',
  yellow: '#fbbf24',
};

const ff = '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const ffMono = '"Cascadia Code", "Fira Code", "Consolas", monospace';

const t = (size: number, weight = 400, color = C.white): React.CSSProperties => ({
  fontSize: size, fontWeight: weight, color,
  fontFamily: ff, lineHeight: 1.25,
});

// ─── Animation helpers ────────────────────────────────────────────────────

const up = (f: number, d = 0, dur = 22): React.CSSProperties => ({
  opacity: interpolate(f, [d, d + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  transform: `translateY(${interpolate(f, [d, d + dur], [26, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`,
});

const fade = (f: number, d = 0, dur = 22): React.CSSProperties => ({
  opacity: interpolate(f, [d, d + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
});

// ─── Shared components ────────────────────────────────────────────────────

const Bg: React.FC = () => (
  <AbsoluteFill style={{
    background: `radial-gradient(ellipse 70% 80% at 15% 50%, #110730 0%, ${C.bg} 65%)`,
  }}>
    <AbsoluteFill style={{
      backgroundImage: [
        'linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px)',
        'linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)',
      ].join(','),
      backgroundSize: '80px 80px',
    }} />
  </AbsoluteFill>
);

const Tag: React.FC<{children: string; f: number; d?: number}> = ({children, f, d = 0}) => (
  <div style={{
    ...fade(f, d),
    ...t(15, 700, C.accent),
    letterSpacing: 4,
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
  }}>
    <div style={{width: 36, height: 2, borderRadius: 2, background: C.primary}} />
    {children}
  </div>
);

const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    padding: '28px 30px',
    ...style,
  }}>
    {children}
  </div>
);

// ─── Slides ───────────────────────────────────────────────────────────────

const Cover: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 160px'}}>
    <Bg />
    <div style={{position: 'relative'}}>

      <div style={{...fade(f, 0), ...t(15, 700, C.accent), letterSpacing: 5, textTransform: 'uppercase', marginBottom: 44}}>
        Stellar PULSO Hackathon · Argentina · 2026
      </div>

      <div style={{...up(f, 8)}}>
        <div style={{
          fontSize: 128, fontWeight: 900, lineHeight: 0.92,
          fontFamily: ff, letterSpacing: -3,
          background: 'linear-gradient(140deg, #ddd6fe 0%, #7c3aed 55%, #4c1d95 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 44,
        }}>
          PontePay
        </div>
      </div>

      <div style={{...up(f, 22)}}>
        <div style={{...t(40, 300, '#e2e8f0'), lineHeight: 1.45, maxWidth: 900, marginBottom: 60}}>
          De dólar digital a pesos.<br />
          <span style={{color: C.accent, fontWeight: 500}}>En minutos. Sin entregar las llaves a nadie.</span>
        </div>
      </div>

      <div style={{...up(f, 38), display: 'flex', gap: 14, flexWrap: 'wrap'}}>
        {['Stellar · Soroban', 'USDC Nativo', 'Transferencias 3.0', 'Non-Custodial'].map((tag) => (
          <div key={tag} style={{
            padding: '11px 22px', borderRadius: 100,
            background: C.primarySoft,
            border: `1px solid ${C.borderStrong}`,
            ...t(15, 600, C.accent),
          }}>
            {tag}
          </div>
        ))}
      </div>

    </div>
  </AbsoluteFill>
);

const Problem: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 160px'}}>
    <Bg />
    <div style={{position: 'relative'}}>
      <Tag f={f} d={0}>El Problema</Tag>

      <div style={{...up(f, 10), display: 'flex', gap: 40, marginBottom: 44}}>
        {[
          {val: '#2', label: 'en LATAM en cripto'},
          {val: '+50%', label: 'de compras en USDC'},
          {val: '4/5', label: 'no saben su spread real'},
        ].map(({val, label}) => (
          <div key={val} style={{flex: 1, textAlign: 'center'}}>
            <div style={{...t(72, 900, C.accent), marginBottom: 4}}>{val}</div>
            <div style={{...t(18, 400, C.muted)}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        {[
          {icon: '🔒', text: 'Los exchanges custodiales bloquean cuentas sin aviso — con tu plata del alquiler adentro', d: 28},
          {icon: '🎲', text: 'El P2P informal en Telegram no tiene garantías — nadie responde si la contraparte no paga', d: 40},
          {icon: '🙈', text: 'Foxbit, Lemon y Belo tienen spreads ocultos con waivers contractuales para no tener que explicarlos', d: 52},
        ].map(({icon, text, d}) => (
          <div key={text} style={{
            ...up(f, d),
            display: 'flex', alignItems: 'center', gap: 24,
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: '18px 26px',
          }}>
            <span style={{fontSize: 30, flexShrink: 0}}>{icon}</span>
            <span style={{...t(21, 400, '#cbd5e1'), lineHeight: 1.4}}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  </AbsoluteFill>
);

const Solution: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 160px'}}>
    <Bg />
    <div style={{position: 'relative'}}>
      <Tag f={f} d={0}>La Solución</Tag>
      <div style={{...up(f, 10), ...t(64, 800), marginBottom: 48}}>
        Un riel <span style={{color: C.accent}}>no-custodial</span> entre el dólar digital y el peso
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
        {[
          {icon: '⛓️', title: 'Escrow Soroban', desc: 'El contrato es el árbitro. Nadie puede bloquear tu USDC — ni nosotros. Reglas en código, auditables on-chain.', d: 25},
          {icon: '📡', title: 'Oracle Reflector', desc: 'Cross-contract call desde el escrow. Mid-rate en tiempo real + spread 0.8% visible + tasa BCRA al lado.', d: 38},
          {icon: '📱', title: 'Transferencias 3.0', desc: 'El mismo QR que usás para pagar el super. Cualquier banco o billetera digital. El riel fiat es gratis.', d: 51},
          {icon: '🔐', title: 'Privy Embedded Wallet', desc: 'Wallet Stellar con tu email. Sin extensión de navegador. Sin frase semilla que perder. 30 segundos de onboarding.', d: 64},
        ].map(({icon, title, desc, d}) => (
          <div key={title} style={{
            ...up(f, d),
            background: C.card,
            border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${C.primary}`,
            borderRadius: '0 20px 20px 0',
            padding: '26px 28px',
          }}>
            <div style={{fontSize: 34, marginBottom: 10}}>{icon}</div>
            <div style={{...t(22, 700, C.accent), marginBottom: 8}}>{title}</div>
            <div style={{...t(17, 400, '#94a3b8'), lineHeight: 1.6}}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  </AbsoluteFill>
);

const HowItWorks: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 160px'}}>
    <Bg />
    <div style={{position: 'relative'}}>
      <Tag f={f} d={0}>Cómo Funciona</Tag>
      <div style={{...up(f, 10), ...t(64, 800), marginBottom: 64}}>
        Tres pasos. <span style={{color: C.accent}}>Sin custodios. Sin bloqueos.</span>
      </div>

      <div style={{display: 'flex', alignItems: 'stretch', gap: 0}}>
        {[
          {
            n: '1', icon: '👀', title: 'Ves la tasa',
            desc: 'Oracle Reflector en tiempo real. Mid-rate + spread 0.8% visible. Tasa BCRA al lado para comparar. Sin sorpresas.',
            d: 24,
          },
          {
            n: '2', icon: '🔒', title: 'USDC en escrow',
            desc: 'El vendedor deposita en el contrato Soroban. El USDC queda bloqueado — nadie lo toca hasta que se confirme el pago fiat.',
            d: 40,
          },
          {
            n: '3', icon: '📲', title: 'QR y listo',
            desc: 'Escanear el QR T3.0 desde cualquier banco. El contrato detecta el pago y libera el USDC automáticamente.',
            d: 56,
          },
        ].map(({n, icon, title, desc, d}, i) => (
          <React.Fragment key={n}>
            <div style={{
              ...up(f, d),
              flex: 1,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 20, padding: '36px 30px',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: C.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...t(20, 800),
              }}>
                {n}
              </div>
              <div style={{fontSize: 42, lineHeight: 1}}>{icon}</div>
              <div style={{...t(26, 700, C.accent)}}>{title}</div>
              <div style={{...t(18, 400, '#94a3b8'), lineHeight: 1.65}}>{desc}</div>
            </div>
            {i < 2 && (
              <div style={{
                ...fade(f, 55),
                display: 'flex', alignItems: 'center', padding: '0 18px',
                color: C.accent, fontSize: 30, flexShrink: 0,
              }}>
                →
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  </AbsoluteFill>
);

const Stellar: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 160px'}}>
    <Bg />
    <div style={{position: 'relative', display: 'flex', gap: 72, alignItems: 'center'}}>

      <div style={{flex: 1}}>
        <Tag f={f} d={0}>Integración Stellar</Tag>
        <div style={{...up(f, 10), ...t(52, 800), lineHeight: 1.15, marginBottom: 40}}>
          Construido <span style={{color: C.accent}}>dentro</span> de Stellar,<br />no encima
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
          {[
            {label: 'Oracle cross-contract', desc: 'El escrow llama al oracle Reflector on-chain — precio real sin backend externo', d: 25},
            {label: 'USDC nativo Circle', desc: 'Sin bridging, sin wrapped tokens. El USDC nativo de Stellar (Circle)', d: 38},
            {label: 'Dispute resolver on-chain', desc: 'Timelock configurable. Sin confirmación en N horas → USDC devuelto automáticamente', d: 51},
            {label: 'Próximo: SEP-24', desc: 'Firma con anchor argentino → depósito/retiro fiat nativo sin custodiar fondos propios', d: 64},
          ].map(({label, desc, d}) => (
            <div key={label} style={{...up(f, d), display: 'flex', gap: 16, alignItems: 'flex-start'}}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: C.accent, flexShrink: 0, marginTop: 7,
              }} />
              <div>
                <span style={{...t(19, 700, C.accent)}}>{label}: </span>
                <span style={{...t(19, 400, '#94a3b8')}}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{...up(f, 18), width: 400, flexShrink: 0}}>
        <div style={{
          background: '#0d1117',
          border: `1px solid ${C.border}`,
          borderRadius: 20, padding: '28px 30px',
          marginBottom: 14,
        }}>
          <div style={{...t(12, 700, '#58a6ff'), letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16}}>
            Soroban · Rust
          </div>
          <div style={{...t(15, 400, '#7ee787'), lineHeight: 1.9, fontFamily: ffMono}}>
            <span style={{color: '#6e7681'}}>// Oracle cross-contract</span><br />
            <span style={{color: '#ff7b72'}}>let</span> <span style={{color: '#79c0ff'}}>rate</span> = OracleClient::new<br />
            &nbsp;&nbsp;(e, &amp;oracle_id)<br />
            &nbsp;&nbsp;.<span style={{color: '#d2a8ff'}}>lastprice</span>(&amp;asset)<br />
            &nbsp;&nbsp;.<span style={{color: '#d2a8ff'}}>unwrap</span>();<br />
            <br />
            <span style={{color: '#6e7681'}}>// Liberar con condición</span><br />
            <span style={{color: '#ff7b72'}}>if</span> payment_confirmed &#123;<br />
            &nbsp;&nbsp;token.<span style={{color: '#d2a8ff'}}>transfer</span>(<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&amp;escrow, &amp;buyer, &amp;amt<br />
            &nbsp;&nbsp;);<br />
            &#125;
          </div>
        </div>
        <div style={{
          ...fade(f, 50),
          background: C.greenSoft,
          border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: 12, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{width: 10, height: 10, borderRadius: '50%', background: C.green, flexShrink: 0}} />
          <span style={{...t(16, 600, C.green)}}>Testnet activo · 3 órdenes en demo</span>
        </div>
      </div>

    </div>
  </AbsoluteFill>
);

const Revenue: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 160px'}}>
    <Bg />
    <div style={{position: 'relative'}}>
      <Tag f={f} d={0}>Modelo de Revenue</Tag>
      <div style={{display: 'flex', gap: 60, alignItems: 'flex-start'}}>

        <div style={{flex: 1}}>
          {/* launch offer banner */}
          <div style={{
            ...up(f, 8),
            marginBottom: 16,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: 14, padding: '14px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{...t(16, 700, C.green)}}>🎉 Oferta de lanzamiento</div>
              <div style={{...t(13, 400, C.muted)}}>0% spread hasta el mainnet — activada por env var</div>
            </div>
            <div style={{...t(28, 900, C.green)}}>GRATIS</div>
          </div>

          {/* tiered fees */}
          <div style={{...up(f, 18), ...t(14, 600, C.muted), marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase'}}>Fee post-lanzamiento — decreasing</div>
          <div style={{...up(f, 22), border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden'}}>
            {[
              {rango: '< $10',    fee: '2.5%', color: C.yellow},
              {rango: '$10–$50',  fee: '1.5%', color: '#fb923c'},
              {rango: '$50–$200', fee: '1.0%', color: C.accent},
              {rango: '$200+',    fee: '0.8%', color: C.green},
            ].map(({rango, fee, color}, i) => (
              <div key={rango} style={{
                ...up(f, 26 + i * 8),
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 22px',
                borderBottom: i < 3 ? `1px solid ${C.border}` : 'none',
                background: C.card,
              }}>
                <div style={{...t(17, 500, C.muted)}}>{rango} USDC</div>
                <div style={{...t(26, 800, color)}}>{fee}</div>
              </div>
            ))}
          </div>

          <div style={{...up(f, 58), marginTop: 12, ...t(13, 400, C.muted)}}>
            Auditable en <span style={{color: C.white}}>src/lib/pricing.ts</span> · costo marginal por tx ≈ $0.000012
          </div>
        </div>

        <div style={{flex: 1}}>
          <div style={{...up(f, 28), ...t(26, 600, C.muted), marginBottom: 20}}>Roadmap de revenue</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
            {[
              {badge: 'Q3 2026', title: 'PontePay Earn', desc: 'Yield en USDC idle vía Blend Protocol. @defindex/sdk ya instalado.', d: 35},
              {badge: 'Q4 2026', title: 'PontePay Pay', desc: '0.5% por conversión USDC→ARS para comerciantes. Producto B2B.', d: 48},
              {badge: 'Q1 2027', title: 'Maker Premium + DCA', desc: 'Spread reducido por volumen. Compra automática quincenal en USDC.', d: 61},
            ].map(({badge, title, desc, d}) => (
              <div key={title} style={{
                ...up(f, d),
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: '18px 22px',
                display: 'flex', gap: 16,
              }}>
                <div style={{
                  padding: '4px 12px', borderRadius: 8,
                  background: C.accentSoft, border: `1px solid ${C.borderStrong}`,
                  ...t(13, 700, C.accent),
                  flexShrink: 0, alignSelf: 'flex-start', marginTop: 2,
                }}>
                  {badge}
                </div>
                <div>
                  <div style={{...t(19, 700)}}>{title}</div>
                  <div style={{...t(15, 400, C.muted), marginTop: 4}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  </AbsoluteFill>
);

const Market: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 160px'}}>
    <Bg />
    <div style={{position: 'relative'}}>
      <Tag f={f} d={0}>El Mercado</Tag>
      <div style={{display: 'flex', gap: 24, marginBottom: 44}}>
        {[
          {label: 'TAM', val: '$5.7B', desc: 'Volumen cripto anual en Argentina (Chainalysis 2025)', d: 10},
          {label: 'SAM', val: '800K', desc: 'Freelancers y remotos que cobran al exterior en USDC', d: 22},
          {label: 'SOM', val: '$1.2M', desc: 'Objetivo de volumen en los primeros 12 meses', d: 34},
        ].map(({label, val, desc, d}) => (
          <div key={label} style={{
            ...up(f, d),
            flex: 1,
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '30px 26px',
            textAlign: 'center',
          }}>
            <div style={{...t(13, 700, C.muted), letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6}}>{label}</div>
            <div style={{...t(60, 900, C.accent), marginBottom: 6}}>{val}</div>
            <div style={{...t(16, 400, C.muted), lineHeight: 1.5}}>{desc}</div>
          </div>
        ))}
      </div>

      <div style={{...up(f, 44), ...t(22, 600, C.muted), marginBottom: 16}}>3 segmentos validados con entrevistas propias</div>
      <div style={{display: 'flex', gap: 18}}>
        {[
          {tag: 'Seg A', color: C.primary, title: 'Freelancer USDC', pain: 'Cuenta bloqueada · 4–12 ops/trimestre · dolor: spread oculto'},
          {tag: 'Seg C', color: C.blue, title: 'Comerciante', pain: 'Cobros frecuentes · QR es la clave · dolor: fricción en cada cobro'},
          {tag: 'Seg D', color: C.green, title: 'Ahorrista', pain: 'Montos altos · dolor: desconfianza de la contraparte'},
        ].map(({tag, color, title, pain}, i) => (
          <div key={tag} style={{
            ...up(f, 54 + i * 12),
            flex: 1,
            borderLeft: `3px solid ${color}`,
            background: C.card, borderRadius: '0 14px 14px 0',
            padding: '18px 22px',
          }}>
            <div style={{...t(12, 700, color), letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6}}>{tag}</div>
            <div style={{...t(20, 700)}}>{title}</div>
            <div style={{...t(15, 400, C.muted), marginTop: 4, lineHeight: 1.5}}>{pain}</div>
          </div>
        ))}
      </div>
    </div>
  </AbsoluteFill>
);

const Competition: React.FC<{f: number}> = ({f}) => {
  const rows = [
    {name: 'PontePay', custodia: '✗ No-custodial', spread: '✓ 0.8% on-chain', t30: '✓ Nativo', dispute: '✓ On-chain', hl: true},
    {name: 'Lemon / Belo', custodia: '✓ Custodial', spread: '✗ Oculto', t30: '✗ No', dispute: '✗ Manual', hl: false},
    {name: 'Buenbit / Ripio', custodia: '✓ Custodial', spread: '✗ Oculto', t30: '✗ No', dispute: '✗ Manual', hl: false},
    {name: 'Binance P2P', custodia: '± Temporal', spread: '✗ Implícito', t30: '✗ No', dispute: '± Centralizado', hl: false},
    {name: 'Cuevas (informal)', custodia: '✗ N/A', spread: '✗ ~2% verbal', t30: '✓ Sí', dispute: '✗ Ninguno', hl: false},
  ];

  const colStyle = (val: string): React.CSSProperties => ({
    ...t(17, val.startsWith('✓') ? 600 : 400,
      val.startsWith('✓') ? C.green : val.startsWith('✗') ? C.red : C.yellow),
  });

  return (
    <AbsoluteFill style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 160px'}}>
      <Bg />
      <div style={{position: 'relative'}}>
        <Tag f={f} d={0}>Competencia</Tag>
        <div style={{...up(f, 10), ...t(52, 800), marginBottom: 36}}>
          Únicos <span style={{color: C.accent}}>no-custodiales</span> con spread auditable + T3.0
        </div>

        <div style={{...up(f, 20), border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', marginBottom: 28}}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 1.1fr 0.9fr 1fr',
            background: C.primarySoft, padding: '14px 24px',
          }}>
            {['', 'Custodia', 'Spread', 'T3.0 QR', 'Dispute'].map((h) => (
              <div key={h} style={{...t(13, 700, C.accent), letterSpacing: 2, textTransform: 'uppercase'}}>{h}</div>
            ))}
          </div>
          {rows.map(({name, custodia, spread, t30, dispute, hl}, i) => (
            <div key={name} style={{
              ...up(f, 28 + i * 12),
              display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 1.1fr 0.9fr 1fr',
              padding: '16px 24px',
              borderTop: `1px solid ${C.border}`,
              background: hl ? 'rgba(124,58,237,0.08)' : 'transparent',
            }}>
              <div style={{...t(18, hl ? 700 : 500, hl ? C.accent : C.white)}}>{name}</div>
              <div style={colStyle(custodia)}>{custodia}</div>
              <div style={colStyle(spread)}>{spread}</div>
              <div style={colStyle(t30)}>{t30}</div>
              <div style={colStyle(dispute)}>{dispute}</div>
            </div>
          ))}
        </div>

        {/* insight callout */}
        <div style={{...up(f, 90), display: 'flex', gap: 16, alignItems: 'stretch'}}>

          {/* competitor pain */}
          <div style={{
            flex: 1, background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14,
            padding: '16px 22px',
          }}>
            <div style={{...t(12, 700, C.red), letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8}}>Competencia — fee plana</div>
            <div style={{...t(15, 400, C.muted), lineHeight: 1.5}}>
              Stripe: 2.9% <span style={{color:C.white,fontWeight:700}}>+ $0.30</span> fijo.
              En $1 = <span style={{color:C.red,fontWeight:700}}>32.9%</span>.{' '}
              Meru bloquea {'<'} $5. Binance P2P bloquea {'<'} $10.{' '}
              <span style={{color:C.white,fontStyle:'italic'}}>El usuario no lo nota hasta que hace las cuentas.</span>
            </div>
          </div>

          {/* PontePay fee tiers */}
          <div style={{
            flex: 1.4, background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.4)', borderRadius: 14,
            padding: '16px 22px',
          }}>
            <div style={{...t(12, 700, C.accent), letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10}}>PontePay — fee decreciente, sin mínimo</div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px 0'}}>
              {[
                {rango: '< $10',    fee: '2.5%', color: C.yellow},
                {rango: '$10–$50',  fee: '1.5%', color: '#fb923c'},
                {rango: '$50–$200', fee: '1.0%', color: C.accent},
                {rango: '$200+',    fee: '0.8%', color: C.green},
              ].map(({rango, fee, color}) => (
                <div key={rango} style={{textAlign: 'center', padding: '6px 4px'}}>
                  <div style={{...t(18, 700, color)}}>{fee}</div>
                  <div style={{...t(11, 500, C.muted)}}>{rango}</div>
                </div>
              ))}
            </div>
            <div style={{...t(12, 400, C.muted), marginTop: 8}}>
              A más monto, menos fee. <span style={{color:C.white}}>Sin sorpresas, sin letra chica.</span>
            </div>
          </div>

        </div>
      </div>
    </AbsoluteFill>
  );
};

const Team: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 160px'}}>
    <Bg />
    <div style={{position: 'relative'}}>
      <Tag f={f} d={0}>El Equipo</Tag>

      <div style={{display: 'flex', gap: 22, marginBottom: 56}}>
        {[
          {emoji: '🎯', name: 'Leo', role: 'Product Manager', skills: 'GTM · Customer discovery · Estrategia · Revenue', d: 10},
          {emoji: '👩‍💻', name: 'Eli', role: 'Tech Lead', skills: 'Soroban · Next.js · Oracle Reflector · Privy', d: 24},
          {emoji: '🎨', name: 'Barbi', role: 'Front-end & UX/UI', skills: 'Diseño · React · Deploy · QA · Smoke tests', d: 38},
        ].map(({emoji, name, role, skills, d}) => (
          <div key={name} style={{
            ...up(f, d),
            flex: 1,
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '30px 26px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10,
          }}>
            <div style={{fontSize: 52}}>{emoji}</div>
            <div style={{...t(30, 800, C.accent)}}>{name}</div>
            <div style={{...t(18, 600)}}>{role}</div>
            <div style={{...t(15, 400, C.muted), lineHeight: 1.6}}>{skills}</div>
          </div>
        ))}
      </div>

      <div style={{...up(f, 50)}}>
        <div style={{...t(26, 700, C.muted), marginBottom: 16}}>El Ask</div>
        <div style={{display: 'flex', gap: 14}}>
          {[
            {icon: '🏆', label: 'Finalistas PULSO'},
            {icon: '📋', label: 'Firma SEP-24 con anchor argentino'},
            {icon: '🌎', label: 'Stellar Summit São Paulo'},
          ].map(({icon, label}) => (
            <div key={label} style={{
              flex: 1,
              background: C.primarySoft,
              border: `1px solid ${C.borderStrong}`,
              borderRadius: 14, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{fontSize: 26}}>{icon}</span>
              <span style={{...t(18, 600)}}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{...up(f, 65), textAlign: 'center', marginTop: 40}}>
        <div style={{...t(30, 300, '#475569')}}>
          <span style={{
            background: 'linear-gradient(135deg, #c4b5fd, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 900,
            fontSize: 32,
          }}>PontePay</span>
          {'  ·  '}De dólar digital a pesos. En minutos. Sin entregar las llaves a nadie.
        </div>
      </div>
    </div>
  </AbsoluteFill>
);

// ─── Deck manager ─────────────────────────────────────────────────────────

export const FRAMES_PER_SLIDE = 180;

const SLIDES = [Cover, Problem, Solution, HowItWorks, Stellar, Revenue, Market, Competition, Team];

export const Deck: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = Math.min(Math.floor(frame / FRAMES_PER_SLIDE), SLIDES.length - 1);
  const slideFrame = frame % FRAMES_PER_SLIDE;
  const Slide = SLIDES[idx];

  const opacity = interpolate(slideFrame, [0, 16], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: C.bg, opacity}}>
      <Slide f={slideFrame} />
    </AbsoluteFill>
  );
};
