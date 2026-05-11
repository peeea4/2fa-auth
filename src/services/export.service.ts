import * as Crypto from 'expo-crypto';

import type { OtpEntry } from '../types';

type ExportPayload = {
  version: 1;
  exportedAt: number;
  entries: Array<OtpEntry & { secret: string }>;
};

type EncryptedBundle = {
  v: 1;
  salt: string;
  rounds: number;
  payload: string;
  checksum: string;
};

const KDF_ROUNDS = 2_048;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex data');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function utf8Encode(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function utf8Decode(value: Uint8Array): string {
  return new TextDecoder().decode(value);
}

async function sha256Hex(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

async function deriveKey(password: string, saltHex: string, rounds: number): Promise<string> {
  let output = `${password}:${saltHex}`;
  for (let i = 0; i < rounds; i += 1) {
    output = await sha256Hex(output);
  }
  return output;
}

async function keystream(length: number, keyHex: string): Promise<Uint8Array> {
  const chunks: number[] = [];
  let block = 0;
  while (chunks.length < length) {
    const hash = await sha256Hex(`${keyHex}:${block}`);
    chunks.push(...Array.from(hexToBytes(hash)));
    block += 1;
  }
  return new Uint8Array(chunks.slice(0, length));
}

async function xorEncrypt(plainText: string, keyHex: string): Promise<string> {
  const plainBytes = utf8Encode(plainText);
  const keyBytes = await keystream(plainBytes.length, keyHex);
  const out = new Uint8Array(plainBytes.length);
  for (let i = 0; i < plainBytes.length; i += 1) {
    out[i] = plainBytes[i] ^ keyBytes[i];
  }
  return bytesToHex(out);
}

async function xorDecrypt(cipherHex: string, keyHex: string): Promise<string> {
  const cipherBytes = hexToBytes(cipherHex);
  const keyBytes = await keystream(cipherBytes.length, keyHex);
  const out = new Uint8Array(cipherBytes.length);
  for (let i = 0; i < cipherBytes.length; i += 1) {
    out[i] = cipherBytes[i] ^ keyBytes[i];
  }
  return utf8Decode(out);
}

class ExportService {
  async exportEncrypted(entries: OtpEntry[], secretsById: Record<string, string | null>, password: string): Promise<string> {
    const normalizedPassword = password.trim();
    if (normalizedPassword.length < 6) {
      throw new Error('Export password is too short');
    }

    const bundleEntries = entries
      .map((entry) => ({ ...entry, secret: secretsById[entry.id] ?? '' }))
      .filter((entry) => Boolean(entry.secret));

    const payload: ExportPayload = {
      version: 1,
      exportedAt: Date.now(),
      entries: bundleEntries,
    };

    const salt = bytesToHex(Crypto.getRandomBytes(16));
    const key = await deriveKey(normalizedPassword, salt, KDF_ROUNDS);
    const rawPayload = JSON.stringify(payload);
    const encryptedPayload = await xorEncrypt(rawPayload, key);
    const checksum = await sha256Hex(`${key}:${encryptedPayload}`);

    const bundle: EncryptedBundle = {
      v: 1,
      rounds: KDF_ROUNDS,
      salt,
      payload: encryptedPayload,
      checksum,
    };

    return JSON.stringify(bundle);
  }

  async importEncrypted(data: string, password: string): Promise<Array<OtpEntry & { secret: string }>> {
    const normalizedPassword = password.trim();
    if (!normalizedPassword) {
      throw new Error('Import password is required');
    }

    let bundle: EncryptedBundle;
    try {
      bundle = JSON.parse(data) as EncryptedBundle;
    } catch {
      throw new Error('Invalid backup format');
    }

    if (bundle?.v !== 1 || !bundle.payload || !bundle.salt || !bundle.rounds) {
      throw new Error('Unsupported backup version');
    }

    const key = await deriveKey(normalizedPassword, bundle.salt, bundle.rounds);
    const checksum = await sha256Hex(`${key}:${bundle.payload}`);
    if (checksum !== bundle.checksum) {
      throw new Error('Backup password is incorrect or data is corrupted');
    }

    const raw = await xorDecrypt(bundle.payload, key);
    const parsed = JSON.parse(raw) as ExportPayload;
    if (!Array.isArray(parsed.entries)) {
      throw new Error('Invalid backup content');
    }

    return parsed.entries;
  }
}

export const exportService = new ExportService();
