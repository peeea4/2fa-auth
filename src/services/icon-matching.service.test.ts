import { matchIssuerToIcon, normalizeIssuer } from './icon-matching.service';

describe('icon-matching.service', () => {
  describe('normalizeIssuer', () => {
    it('normalizes casing, separators and common suffixes', () => {
      expect(normalizeIssuer('Google LLC')).toBe('google');
      expect(normalizeIssuer('Google-Authenticator')).toBe('google');
      expect(normalizeIssuer('My Service, Inc.')).toBe('myservice');
    });

    it('removes accented characters', () => {
      expect(normalizeIssuer('GítHüb')).toBe('github');
    });
  });

  describe('matchIssuerToIcon', () => {
    it('matches by exact key', () => {
      expect(matchIssuerToIcon('github')?.key).toBe('github');
    });

    it('matches by alias', () => {
      expect(matchIssuerToIcon('twitter')?.key).toBe('x');
      expect(matchIssuerToIcon('nodejs')?.key).toBe('nodedotjs');
    });

    it('matches by prefix', () => {
      expect(matchIssuerToIcon('googleworkspace')?.key).toBe('google');
    });

    it('matches by reverse prefix', () => {
      expect(matchIssuerToIcon('git')?.key).toBe('github');
    });

    it('is robust to case variants and punctuation', () => {
      expect(matchIssuerToIcon('GitHub, Inc.')?.key).toBe('github');
    });

    it('returns null for unknown issuers', () => {
      expect(matchIssuerToIcon('totally-unknown-service')).toBeNull();
      expect(matchIssuerToIcon('')).toBeNull();
    });
  });
});
