import { describe, expect, it } from 'vitest';
import { composerBlocPerso } from './generator';

/* Le bloc composé à partir d'une liste de la maison : les mots tels quels, en
   mode libre — même des lettres pas encore enseignées.
 *
 * Ces règles datent de « Notre leçon », la liste unique d'avant la
 * bibliothèque. Elles lui ont survécu : c'est la composition d'un bloc de
 * LISTE qu'elles décrivent aujourd'hui (#12). Ce que la liste unique était
 * seule à couvrir — sa persistance, sa fusion — est parti avec elle ; le
 * refus de progression est vérifié dans `listes-jouees.test.ts`. */

describe('composerBlocPerso', () => {
  it('sert les mots de la famille tels quels, dédoublonnés', () => {
    const bloc = composerBlocPerso(['dinosaure', 'dinosaure', 'papi'], 'fr-FR', 7);
    expect(bloc.map((i) => i.texte).sort()).toEqual(['dinosaure', 'papi']);
    expect(bloc.every((i) => i.genre === 'mot')).toBe(true);
  });

  it("accepte tout ce que le clavier écrit, refuse le reste", () => {
    const bloc = composerBlocPerso(['kiwi', 'vélo', 'château'], 'fr-FR', 7);
    /* `k` n'est pas au programme mais la touche existe : en mode libre, elle
       suffit. « château » reste refusé — le â demande une touche morte, deux
       frappes pour un seul caractère attendu. */
    expect(bloc.map((i) => i.texte).sort()).toEqual(['kiwi', 'vélo']);
  });

  it('borne le bloc à 12 items', () => {
    const mots = Array.from({ length: 30 }, (_, i) => `mot${i}`.replace(/[0-9]/g, 'a'));
    expect(composerBlocPerso([...new Set(mots)], 'fr-FR', 7).length).toBeLessThanOrEqual(12);
  });
});

/* Régression (2026-08-28) : « le 20 octobre c'est papa » était refusé. Le mode
   libre filtrait sur le CURRICULUM ; l'apostrophe n'y figure pas, alors qu'elle
   est bien sur la touche 4 de l'AZERTY. Le seul critère est désormais « le
   clavier sait l'écrire ». */
describe('mode libre : tout ce que le clavier sait écrire', () => {
  it("accepte une phrase avec apostrophe, chiffres et espaces", () => {
    const items = composerBlocPerso(["le 20 octobre c'est papa"], 'fr-FR', 1);
    expect(items.map((i) => i.texte)).toEqual(["le 20 octobre c'est papa"]);
  });

  it('accepte accents directs et cédille', () => {
    const items = composerBlocPerso(['où est le garçon', 'à côté'], 'fr-FR', 1);
    expect(items.map((i) => i.texte)).toContain('où est le garçon');
  });

  it('refuse les accents à touche morte (â, ê, ë) : deux frappes pour un caractère', () => {
    expect(composerBlocPerso(['la fête'], 'fr-FR', 1)).toHaveLength(0);
  });

  it("refuse ce que la disposition ne peut pas écrire", () => {
    expect(composerBlocPerso(['ЖЖЖ', 'papa'], 'fr-FR', 1).map((i) => i.texte)).toEqual(['papa']);
  });
});
