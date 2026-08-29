import { describe, expect, it } from 'vitest';
import { fusionner } from './fusion';
import { DEFAUTS, estIntact, valider, type Sauvegarde } from './storage';

/**
 * #12 — l'ancienne liste unique (`motsPerso`) quitte la sauvegarde. Aucun code
 * de migration : le produit est en bêta, et convertir l'existant coûterait un
 * aller-retour d'écriture, de test et de suppression pour sauver une liste
 * qu'on retape en une minute.
 *
 * Mais une sauvegarde ÉCRITE AVANT ce retrait traîne encore sur l'appareil de
 * la famille, et sur le serveur. Elle doit se relire sans une erreur — le
 * champ est simplement ignoré, pas un motif de rejet.
 */
const LEGACY = { ...DEFAUTS, palier: 3, motsPerso: ['licorne', 'dinosaure'] };

describe('une sauvegarde d’avant le retrait', () => {
  it('reste intacte aux yeux du serveur comme du client', () => {
    expect(estIntact(LEGACY)).toBe(true);
  });

  /* Même un champ devenu n'importe quoi : il ne sert plus à rien, donc il ne
     peut plus rien casser. Le rejeter enverrait au backup une progression
     parfaitement saine. */
  it('reste intacte même si l’ancien champ est devenu absurde', () => {
    expect(estIntact({ ...DEFAUTS, motsPerso: 42 })).toBe(true);
    expect(estIntact({ ...DEFAUTS, motsPerso: [1, 2, 3] })).toBe(true);
  });

  it('se relit sans le champ, et sans rien perdre d’autre', () => {
    const relue = valider(LEGACY);
    expect(relue.palier).toBe(3);
    expect(Object.keys(relue)).not.toContain('motsPerso');
  });

  it('ne ressuscite pas le champ à la fusion de deux appareils', () => {
    const fusionnee = fusionner(
      { etat: valider({ ...LEGACY, palier: 2 }), majLe: 1000 },
      { etat: valider({ ...LEGACY, palier: 5 }), majLe: 2000 },
    );
    expect(fusionnee.palier).toBe(5);
    expect(Object.keys(fusionnee)).not.toContain('motsPerso');
  });

  /* La forme réellement écrite sur disque ne le porte plus non plus : la
     sauvegarde d'aujourd'hui ne doit pas réintroduire ce qu'on retire. */
  it('n’est plus écrite avec ce champ', () => {
    const neuve: Sauvegarde = valider(DEFAUTS);
    expect(Object.keys(neuve)).not.toContain('motsPerso');
  });
});
