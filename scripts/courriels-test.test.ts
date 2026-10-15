import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const racine = fileURLToPath(new URL('../', import.meta.url));

function fichiers(dossier: string): string[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name);
    return entree.isDirectory() ? fichiers(chemin) : [chemin];
  });
}

it('aucun compte de test ne tire son adresse de la seule milliseconde courante', () => {
  // Une collision entre fichiers ne se reproduit pas en sondant seulement le
  // helper : les adresses fautives étaient construites directement aux appels.
  const risques = ['server', 'tests'].flatMap((dossier) =>
    fichiers(join(racine, dossier))
      .filter((fichier) => fichier.endsWith('.ts'))
      .flatMap((fichier) => readFileSync(fichier, 'utf8').split('\n').flatMap((ligne, index) =>
        /\$\{Date\.now\(\)\}@/.test(ligne)
          ? [`${relative(racine, fichier)}:${index + 1}`]
          : [],
      )),
  );
  expect(risques, 'utiliser courrielUnique pour les comptes créés par les tests').toEqual([]);
});
