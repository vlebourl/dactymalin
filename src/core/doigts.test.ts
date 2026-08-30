import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONSIGNES, coteDe, DOIGTS, imageMain } from './doigts';
import { doigtDe, ensembleTouches, ETAPE_MAX, type IdParcours } from './parcours';
import type { IdDisposition } from './layouts';

/* Les visuels sont livrés avec le dépôt (P4). Un état qui pointe vers un
   fichier absent ne se voit pas en test de rendu : il se voit ici. */
const FICHIERS = new Set(readdirSync(new URL('../../public/doigts', import.meta.url)));

const nomDeFichier = (src: string) => src.slice(src.lastIndexOf('/') + 1);

const PARCOURS: IdParcours[] = ['decouverte', 'dactylo'];
const DISPOSITIONS: IdDisposition[] = ['fr-FR', 'fr-CH'];

describe('les douze états de main', () => {
  it('les dix doigts et les deux mains au repos ont chacun leur image', () => {
    const etats = [
      ...DOIGTS.map((d) => imageMain(coteDe(d), d)),
      imageMain('gauche', undefined),
      imageMain('droite', undefined),
    ];
    expect(new Set(etats).size).toBe(12);
    for (const src of etats) expect(FICHIERS).toContain(nomDeFichier(src));
  });

  it('la main qui ne joue pas reste affichée, sans doigt marqué', () => {
    expect(imageMain('droite', 'index_gauche')).toBe('/doigts/aucun_droite.png');
    expect(imageMain('gauche', 'pouce_droit')).toBe('/doigts/aucun_gauche.png');
    expect(imageMain('gauche', undefined)).toBe('/doigts/aucun_gauche.png');
  });

  it('la main qui joue montre son doigt', () => {
    expect(imageMain('gauche', 'auriculaire_gauche')).toBe('/doigts/auriculaire_gauche.png');
    expect(imageMain('droite', 'annulaire_droit')).toBe('/doigts/annulaire_droite.png');
  });

  it("le libellé reste de niveau main : c'est le dessin qui porte le doigt", () => {
    for (const d of DOIGTS) {
      expect(CONSIGNES[d][0]).toBe(coteDe(d) === 'gauche' ? 'Main gauche' : 'Main droite');
      expect(CONSIGNES[d][1]).toMatch(/^ton /);
    }
  });
});

describe('le doigt servi par le parcours est toujours montrable', () => {
  it('chaque touche des deux parcours, sur les deux dispositions, a son image', () => {
    let vus = 0;
    for (const p of PARCOURS) {
      for (const id of DISPOSITIONS) {
        for (const c of ensembleTouches(p, id, ETAPE_MAX)) {
          const d = doigtDe(p, id, c);
          if (!d) continue; // l'espace : son pouce vient de l'alternance des mains
          expect(FICHIERS).toContain(nomDeFichier(imageMain(coteDe(d), d)));
          expect(CONSIGNES[d]).toBeDefined();
          vus++;
        }
      }
    }
    expect(vus).toBeGreaterThan(0);
  });

  it('Dactylo mobilise huit doigts au moins, Découverte les deux index', () => {
    const doigtsDe = (p: IdParcours) =>
      new Set(
        [...ensembleTouches(p, 'fr-FR', ETAPE_MAX)]
          .map((c) => doigtDe(p, 'fr-FR', c))
          .filter((d): d is NonNullable<typeof d> => !!d),
      );
    expect([...doigtsDe('decouverte')].sort()).toEqual(['index_droit', 'index_gauche']);
    expect(doigtsDe('dactylo').size).toBeGreaterThanOrEqual(8);
  });
});
