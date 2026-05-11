import { REGISTRY_BY_ALIAS, REGISTRY_BY_KEY, SERVICE_REGISTRY, type ServiceIconEntry } from '../constants/service-registry';

const SUFFIXES_TO_STRIP = new Set([
  'llc',
  'inc',
  'incorporated',
  'ltd',
  'limited',
  'corp',
  'corporation',
  'company',
  'co',
  'auth',
  'authenticator',
  '2fa',
  'otp',
]);

type NormalizedServiceEntry = {
  entry: ServiceIconEntry;
  normalizedKey: string;
};

const stripDiacritics = (value: string): string => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

export const normalizeIssuer = (raw: string): string => {
  const words = stripDiacritics(raw)
    .toLowerCase()
    .replaceAll('&', ' and ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  while (words.length > 0 && SUFFIXES_TO_STRIP.has(words.at(-1) ?? '')) {
    words.pop();
  }

  return words.join('');
};

const NORMALIZED_REGISTRY: NormalizedServiceEntry[] = SERVICE_REGISTRY.map((entry) => ({
  entry,
  normalizedKey: normalizeIssuer(entry.key),
}));

const REGISTRY_BY_NORMALIZED_KEY: Record<string, ServiceIconEntry> = Object.fromEntries(
  Object.entries(REGISTRY_BY_KEY).map(([key, entry]) => [normalizeIssuer(key), entry]),
);

const REGISTRY_BY_NORMALIZED_ALIAS: Record<string, ServiceIconEntry> = Object.fromEntries(
  Object.entries(REGISTRY_BY_ALIAS).map(([alias, entry]) => [normalizeIssuer(alias), entry]),
);

export const matchIssuerToIcon = (issuer: string): ServiceIconEntry | null => {
  const normalized = normalizeIssuer(issuer);
  if (!normalized) {
    return null;
  }

  const keyMatch = REGISTRY_BY_NORMALIZED_KEY[normalized];
  if (keyMatch) {
    return keyMatch;
  }

  const aliasMatch = REGISTRY_BY_NORMALIZED_ALIAS[normalized];
  if (aliasMatch) {
    return aliasMatch;
  }

  const prefixMatch = NORMALIZED_REGISTRY.find(({ normalizedKey }) => normalized.startsWith(normalizedKey));
  if (prefixMatch) {
    return prefixMatch.entry;
  }

  const reversePrefixMatch = NORMALIZED_REGISTRY.find(({ normalizedKey }) =>
    normalizedKey.startsWith(normalized),
  );
  if (reversePrefixMatch) {
    return reversePrefixMatch.entry;
  }

  return null;
};
