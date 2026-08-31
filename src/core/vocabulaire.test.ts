import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * La garde qui empêche le vocabulaire mort de revenir.
 *
 * « Leçon » désignait trois choses selon l'écran, et « palier » comme « bloc »
 * — du vocabulaire d'implémentation — étaient lus par l'enfant. La v2 tranche :
 * une **étape** est un jeu de touches, une **leçon** est ce qu'on fait en une
 * fois, un **exercice** est un mot à taper.
 *
 * Ce fichier ne teste pas un comportement : il tient une décision. Sans lui,
 * rien n'empêche un futur écran de réintroduire « palier 3 » sans que personne
 * ne s'en aperçoive avant un enfant.
 */

/* `import.meta.url` percent-encode les accents du chemin — et ce dépôt vit
   dans un dossier qui en porte un. Vitest s'exécute depuis la racine. */
const RACINE = process.cwd();

function fichiers(dossier: string, suffixes: string[]): string[] {
  const out: string[] = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) out.push(...fichiers(chemin, suffixes));
    else if (suffixes.some((s) => nom.endsWith(s)) && !nom.includes('.test.')) out.push(chemin);
  }
  return out;
}

/**
 * Ce qu'un enfant peut LIRE. On retire les commentaires, qui disent l'histoire
 * du code, et les attributs de données : `data-bloc` désigne un pan physique du
 * clavier — c'est le sens juste de ce mot, celui que le cahier autorise à
 * garder dans le code.
 */
function texteVisible(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/data-[a-z-]+/g, '');
}

describe('le vocabulaire que lit un enfant', () => {
  const vues = fichiers(join(RACINE, 'src/views'), ['.tsx']).concat(
    fichiers(join(RACINE, 'src/ui'), ['.tsx']),
  );

  it('trouve bien les vues à surveiller', () => {
    expect(vues.length).toBeGreaterThan(5);
  });

  /* `bloc` reste AUTORISÉ dans le code au sens « pan physique du clavier » —
     c'est son sens juste, et le renommage mécanique était interdit pour cette
     raison. Ce qu'on interdit, c'est de l'écrire à l'enfant. */
  it("n'écrit jamais « palier » ni « bloc » à l'écran", () => {
    for (const f of vues) {
      const texte = texteVisible(readFileSync(f, 'utf8'));
      /* Ce qui ATTEINT un enfant, c'est le mot suivi d'un numéro — « Palier 3 »,
         « Bloc 2 de cette leçon » — ou capitalisé en début de phrase. Un
         identifiant comme `blocPulse` ou `data-bloc` n'est jamais lu. */
      const fautes = texte.match(/\b[Pp]alier\s+(?:\d|\$\{)|\bPalier\b(?![a-zA-ZÀ-ÿ])/g) ?? [];
      const blocs = texte.match(/\b[Bb]locs?\s+(?:\d|\$\{|finis|de cette)|\bBlocs?\b(?![a-zA-ZÀ-ÿ])/g) ?? [];
      expect(fautes, `${f} montre « palier » : ${fautes.join(' | ')}`).toEqual([]);
      expect(blocs, `${f} montre « bloc » : ${blocs.join(' | ')}`).toEqual([]);
    }
  });

  /* Un `aria-label` est du texte LU à l'enfant par la synthèse vocale : il
     tombe sous la même règle que ce qui s'affiche, et la regex ci-dessus le
     manquait (« Tes étoiles de ce bloc »). */
  it("n'annonce jamais « bloc » dans un aria-label", () => {
    for (const f of vues) {
      const texte = texteVisible(readFileSync(f, 'utf8'));
      const etiquettes = texte.match(/aria-label="[^"]*"/g) ?? [];
      const fautives = etiquettes.filter((e) => /blocs?\b/i.test(e));
      expect(fautives, `${f} annonce « bloc » : ${fautives.join(' | ')}`).toEqual([]);
    }
  });

  /* La contraction de #48 a supprimé la table v1 et la liste écrite à la main.
     Les réimporter ramènerait deux sources de vérité concurrentes. */
  it("n'importe plus les modules de la v1", () => {
    for (const f of fichiers(join(RACINE, 'src'), ['.ts', '.tsx'])) {
      const source = readFileSync(f, 'utf8');
      expect(source, `${f} importe encore paliers`).not.toMatch(/from ['"][^'"]*\/paliers['"]/);
      expect(source, `${f} importe encore corpus`).not.toMatch(/from ['"][^'"]*\/corpus['"]/);
    }
  });
});
