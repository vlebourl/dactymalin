import { expect, it, vi } from 'vitest';
import { courrielUnique } from '../../../tests/helpers/courriel';

it('crée des adresses distinctes même lorsque les comptes naissent dans la même milliseconde', () => {
  const horloge = vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
  try {
    const adresses = Array.from({ length: 1000 }, () => courrielUnique());
    expect(new Set(adresses).size).toBe(adresses.length);
    expect(adresses.every((adresse) => /^[^@]+@exemple\.fr$/.test(adresse))).toBe(true);
  } finally {
    horloge.mockRestore();
  }
});
