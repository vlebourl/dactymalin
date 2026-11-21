import { describe, expect, it } from 'vitest';
import { lireEnv } from '../env';

describe('ANTHROPIC_API_KEY', () => {
  const lire = (v?: string) =>
    lireEnv({ NODE_ENV: 'test', ...(v === undefined ? {} : { ANTHROPIC_API_KEY: v }) } as NodeJS.ProcessEnv);

  it('compte une chaîne vide comme absente', () => {
    expect(lire('').ANTHROPIC_API_KEY).toBeUndefined();
    expect(lire().ANTHROPIC_API_KEY).toBeUndefined();
  });

  it('conserve une clé posée', () => {
    expect(lire('sk-x').ANTHROPIC_API_KEY).toBe('sk-x');
  });
});
