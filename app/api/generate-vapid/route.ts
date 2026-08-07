import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Run on edge for quick response

export async function GET() {
  try {
    // Generate ECDSA key pair on P-256 curve
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['sign', 'verify']
    );

    // Export public key as raw (65 bytes uncompressed EC point format)
    const rawPublicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    // Export private key as JWK (JSON Web Key) to extract the raw 32-byte "d" parameter
    const jwkPrivateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    const publicKeyBase64 = bufferToBase64Url(rawPublicKey);
    const privateKeyBase64 = jwkPrivateKey.d || ''; // "d" is already base64url-encoded 32-byte private key

    return NextResponse.json({
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
      instructions: "Copy these values to your environment config. Local: .env.local, Cloudflare: wrangler.jsonc or wrangler secrets.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
