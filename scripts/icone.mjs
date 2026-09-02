/* Regénère les icônes de public/ : node scripts/icone.mjs
   Sortie versionnée — à relancer seulement quand le dessin change.
   Six fichiers : quatre tailles pleines (favicon, apple-touch, 192, 512) et
   deux variantes MASQUABLES, seules à partir en écran d'accueil Android. */
import { chromium } from 'playwright';

/* Jetons repris de src/styles/tokens.css — l'icône ne doit jamais dériver
   d'une palette parallèle. */
const FOND = '#f7f3e9', LISERE = '#ded4c1', LISERE_FORT = '#c6b9a1';
const TEAL = '#0b5a55', TEAL_PALE = '#dbe9e6';
const ORANGE = '#7e3a0d', ORANGE_PALE = '#f4e3d1';
const CARTE = '#fdfaf3';

/* ATTENTION : géométrie RECOPIÉE de src/ui/MainSchematique.tsx. Un script Node
   ne peut pas importer un composant TSX sans traîner tout un build, et l'icône
   est un PNG figé de toute façon. Retoucher la main à l'écran SANS repasser
   ici fait diverger les deux. */
const TRAIT = 3.6, RACINE = 96;
const doigts = [
  { x: 21, repos: 48, l: 12.5 },
  { x: 35, repos: 32, l: 13 },
  { x: 49, repos: 26, l: 13 },
  { x: 63, repos: 34, l: 13 },
];
const couche = (c, t) => `
  <g fill="${c}" stroke="${c}" stroke-width="${t}" stroke-linejoin="round" stroke-linecap="round">
    ${doigts.map(d => `<line x1="${d.x}" y1="${RACINE}" x2="${d.x}" y2="${d.repos}" stroke-width="${d.l + t}"/>`).join('')}
    <line x1="69" y1="99" x2="87" y2="83" stroke-width="${15 + t}"/>
    <path d="M14.75 72 L13.6 100 Q16 122 42 125 Q70 122 70 96 L70 72 Z"/>
  </g>`;
const main = (cote) => {
  const teinte = cote === 'gauche' ? TEAL : ORANGE;
  const pale = cote === 'gauche' ? TEAL_PALE : ORANGE_PALE;
  return `<g>${couche(teinte, TRAIT)}${couche(pale, 0)}
    ${doigts.map((d, i) => `<circle cx="${d.x}" cy="${d.repos + 6}" r="${d.l * 0.2}" fill="${teinte}" opacity="${i === 3 ? 0.5 : 0.28}"/>`).join('')}</g>`;
};

const touche = (x) => `<rect x="${x}" y="174" width="54" height="54" rx="12" fill="${LISERE}" stroke="${LISERE_FORT}" stroke-width="2.5"/>`;

const dessin = `

  <!-- anneau ouvert : moitié gauche teal, moitié droite orange -->
  <g fill="none" stroke-width="9" stroke-linecap="round">
    <path d="M 106 322 A 165 165 0 0 1 256 82" stroke="${TEAL}"/>
    <path d="M 256 82 A 165 165 0 0 1 406 322" stroke="${ORANGE}"/>
    <path d="M 173.5 393 A 165 165 0 0 0 256 415" stroke="${TEAL}"/>
    <path d="M 256 415 A 165 165 0 0 0 338.5 393" stroke="${ORANGE}"/>
  </g>

  <!-- rangée de touches, celle du milieu allumée -->
  ${[86, 156, 296, 366].map(touche).join('')}
  <rect x="226" y="168" width="66" height="66" rx="14" fill="${CARTE}"/>
  <g fill="none" stroke-width="4">
    <path d="M259 168 H240 a14 14 0 0 0 -14 14 V220 a14 14 0 0 0 14 14 H259" stroke="${TEAL}"/>
    <path d="M259 168 H278 a14 14 0 0 1 14 14 V220 a14 14 0 0 1 -14 14 H259" stroke="${ORANGE}"/>
  </g>
  <rect x="243" y="198" width="16" height="6" fill="${TEAL}"/>
  <rect x="259" y="198" width="16" height="6" fill="${ORANGE}"/>

  <!-- éclat : la touche répond -->
  <g stroke-width="7" stroke-linecap="round">
    <path d="M259 148 v-22" stroke="${TEAL}"/>
    <path d="M228 156 l-14 -17" stroke="${TEAL}"/>
    <path d="M290 156 l14 -17" stroke="${ORANGE}"/>
  </g>

  <!-- barre d'espace : les deux pouces -->
  <rect x="150" y="252" width="212" height="40" rx="16" fill="${CARTE}" stroke="${LISERE_FORT}" stroke-width="2.5"/>

  <!-- les deux mains, inclinées vers le clavier -->
  <g transform="translate(32 240) rotate(-14 75 97) scale(1.5)">${main('gauche')}</g>
  <g transform="translate(480 240) scale(-1 1) rotate(-14 75 97) scale(1.5)">${main('droite')}</g>`;

/*
 * Le lanceur Android DÉCOUPE une forme — cercle, carré arrondi, écusson — dans
 * l'icône masquable : tout ce qui déborde du cercle central couvrant 80 % de la
 * largeur est rogné. Le dessin plein touche presque les bords ; on le réduit
 * donc autour du centre pour le faire tenir dans ce cercle, sur le même fond
 * plein. Ce n'est PAS une marge décorative : sans elle, les mains sortent de
 * l'écusson sur l'écran d'accueil de l'enfant.
 *
 * 0,72 vient de la géométrie : la demi-diagonale du dessin vaut environ 275 px
 * pour un rayon sûr de 205 (0,4 × 512), soit 0,744 au plus juste — et on garde
 * un peu de marge sous ce plafond. `installable.spec.ts` MESURE ce résultat sur
 * les PNG produits : si le dessin s'élargit un jour, c'est ce test qui le dira.
 */
const SUR_MESURE_MASQUABLE = 0.72;

const svg = (masquable = false) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${FOND}"/>
  ${
    masquable
      ? `<g transform="translate(256 256) scale(${SUR_MESURE_MASQUABLE}) translate(-256 -256)">${dessin}</g>`
      : dessin
  }
</svg>`;

const b = await chromium.launch();
/* Chaque taille sort du MÊME SVG, rendue à sa dimension : un PNG redimensionné
   après coup baverait sur les traits fins de l'anneau. */
const tailles = [
  [512, 'public/icon-512.png', false],
  /* 192 ET 512 : Chrome exige les deux pour proposer l'installation (#110). */
  [192, 'public/icon-192.png', false],
  [512, 'public/icon-maskable-512.png', true],
  [192, 'public/icon-maskable-192.png', true],
  [180, 'public/apple-touch-icon.png', false],
  [32, 'public/favicon-32.png', false],
];
for (const [taille, chemin, masquable] of tailles) {
  const p = await b.newPage({ viewport: { width: taille, height: taille }, deviceScaleFactor: 1 });
  await p.setContent(`<body style="margin:0">${svg(masquable).replace('width="512" height="512"', `width="${taille}" height="${taille}"`)}</body>`);
  await p.locator('svg').screenshot({ path: chemin });
  await p.close();
  console.log(chemin, taille, masquable ? '(masquable)' : '');
}
await b.close();
