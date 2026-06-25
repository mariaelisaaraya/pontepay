'use client';

import { QRCodeSVG } from 'qrcode.react';

// Builds a minimal EMVCo MPM (Merchant Presented Mode) payload — the standard
// behind Argentina's interoperable Transferencias 3.0 QR. This is a faithful
// representation for payment coordination; a production QR must be issued by a
// licensed PSP against a real CVU / CVU-alias. The on-chain escrow releases once
// the off-chain Transferencias 3.0 credit is confirmed.

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

// CRC16/CCITT-FALSE, as required by the EMVCo QR spec (tag 63).
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface Transferencias30QRProps {
  amountArs: number;
  alias: string;
  recipientName?: string;
  concept?: string;
  size?: number;
}

export default function Transferencias30QR({
  amountArs,
  alias,
  recipientName = 'PontePay',
  concept = 'PontePay',
  size = 176,
}: Transferencias30QRProps) {
  const merchantAccount = tlv('00', 'ar.com.transferencias3') + tlv('01', alias);

  let payload =
    tlv('00', '01') + // payload format indicator
    tlv('01', '12') + // dynamic QR
    tlv('26', merchantAccount) + // interoperable merchant account info
    tlv('52', '0000') + // merchant category code
    tlv('53', '032') + // currency: ARS (ISO 4217 = 032)
    tlv('54', amountArs.toFixed(2)) +
    tlv('58', 'AR') + // country
    tlv('59', recipientName.slice(0, 25)) +
    tlv('60', 'Buenos Aires') +
    tlv('62', tlv('05', concept.slice(0, 25))); // additional data: reference
  payload += '6304'; // CRC tag + length, value appended below
  const fullPayload = payload + crc16(payload);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <QRCodeSVG value={fullPayload} size={size} level="M" marginSize={2} />
      </div>
      <span className="text-[11px] uppercase tracking-wide text-gray-400">
        Transferencias 3.0 · ARS {amountArs.toLocaleString('es-AR')}
      </span>
    </div>
  );
}
