import * as Crypto from 'expo-crypto';

/**
 * Deprecated: слабая схема (XOR + SHA-256). Метаданные — MMKV AES-256 + ключ в Keychain.
 */
const CRYPTO_KDF_PEPPER = 'otp-pin-pepper';
const ENCRYPTION_PREFIX = 'enc-v1';
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const getRandomBytes = (size: number): Uint8Array => {
  const bytes = new Uint8Array(size);
  Crypto.getRandomValues(bytes);
  return bytes;
};

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const fromHex = (value: string): Uint8Array => {
  const normalized = value.trim();
  if (normalized.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }

  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    const byte = Number.parseInt(normalized.slice(index, index + 2), 16);
    if (Number.isNaN(byte)) {
      throw new Error('Invalid hex string');
    }
    bytes[index / 2] = byte;
  }
  return bytes;
};

const encodeBase64Bytes = (bytes: Uint8Array): string => {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = index + 1 < bytes.length ? bytes[index + 1] : undefined;
    const c = index + 2 < bytes.length ? bytes[index + 2] : undefined;
    const triplet = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);

    output += BASE64_CHARS[(triplet >> 18) & 63];
    output += BASE64_CHARS[(triplet >> 12) & 63];
    output += b === undefined ? '=' : BASE64_CHARS[(triplet >> 6) & 63];
    output += c === undefined ? '=' : BASE64_CHARS[triplet & 63];
  }
  return output;
};

const decodeBase64Bytes = (value: string): Uint8Array => {
  const normalized = value.replace(/\s+/g, '');
  if (!normalized || normalized.length % 4 !== 0) {
    throw new Error('Invalid base64 payload');
  }

  const output: number[] = [];

  for (let index = 0; index < normalized.length; index += 4) {
    const c1 = normalized[index] ?? '';
    const c2 = normalized[index + 1] ?? '';
    const c3 = normalized[index + 2] ?? '';
    const c4 = normalized[index + 3] ?? '';

    const b1 = BASE64_CHARS.indexOf(c1);
    const b2 = BASE64_CHARS.indexOf(c2);
    const b3 = c3 === '=' ? -1 : BASE64_CHARS.indexOf(c3);
    const b4 = c4 === '=' ? -1 : BASE64_CHARS.indexOf(c4);

    if (b1 < 0 || b2 < 0 || (c3 !== '=' && b3 < 0) || (c4 !== '=' && b4 < 0)) {
      throw new Error('Invalid base64 payload');
    }

    const triplet = (b1 << 18) | (b2 << 12) | ((b3 < 0 ? 0 : b3) << 6) | (b4 < 0 ? 0 : b4);
    output.push((triplet >> 16) & 255);
    if (c3 !== '=') {
      output.push((triplet >> 8) & 255);
    }
    if (c4 !== '=') {
      output.push(triplet & 255);
    }
  }

  return new Uint8Array(output);
};

const xorWithKeystream = async (
  payload: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
): Promise<Uint8Array> => {
  const result = new Uint8Array(payload.length);
  const nonceBase64 = encodeBase64Bytes(nonce);
  let processed = 0;
  let counter = 0;

  while (processed < payload.length) {
    const streamHex = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${toHex(key)}:${nonceBase64}:${counter}`,
    );
    const streamBytes = fromHex(streamHex);
    const chunkLength = Math.min(streamBytes.length, payload.length - processed);

    for (let index = 0; index < chunkLength; index += 1) {
      result[processed + index] = payload[processed + index] ^ streamBytes[index];
    }

    processed += chunkLength;
    counter += 1;
  }

  return result;
};

class CryptoService {
  private async digestSha256(value: string): Promise<string> {
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
  }

  private async deriveKeyMaterial(keyMaterial: string): Promise<Uint8Array> {
    const digest = await this.digestSha256(`${keyMaterial}:${CRYPTO_KDF_PEPPER}`);
    return fromHex(digest);
  }

  async encryptString(value: string, keyMaterial: string): Promise<string> {
    const payloadBytes = textEncoder.encode(value);
    const key = await this.deriveKeyMaterial(keyMaterial);
    const nonce = getRandomBytes(16);
    const encryptedBytes = await xorWithKeystream(payloadBytes, key, nonce);
    return `${ENCRYPTION_PREFIX}:${encodeBase64Bytes(nonce)}:${encodeBase64Bytes(encryptedBytes)}`;
  }

  async decryptString(value: string, keyMaterial: string): Promise<string> {
    const [scheme, noncePart, payloadPart] = value.split(':');
    if (scheme !== ENCRYPTION_PREFIX || !noncePart || !payloadPart) {
      throw new Error('Invalid encrypted payload format');
    }

    const nonce = decodeBase64Bytes(noncePart);
    const payloadBytes = decodeBase64Bytes(payloadPart);
    const key = await this.deriveKeyMaterial(keyMaterial);
    const decryptedBytes = await xorWithKeystream(payloadBytes, key, nonce);
    return textDecoder.decode(decryptedBytes);
  }

  encodeForExport(raw: string): string {
    return encodeBase64Bytes(textEncoder.encode(raw));
  }
}

export const cryptoService = new CryptoService();
