import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  barreau as calculerBarreau,
  estPropre,
  etatInitial,
  prochaineLatence,
  surErreur,
  type Barreau,
  type EtatAide,
} from '../core/aide';
import { composerBloc, pouceDeLEspace, type Item } from '../core/generator';
import { mainDe, toucheDirecte, type IdDisposition, type Main } from '../core/layouts';
import { ensembleTouches, nouvellesTouches, PALIER_MAX_DEBUTANT } from '../core/paliers';
import { FingerBar, type Doigt } from '../ui/FingerBar';
import { Keyboard } from '../ui/Keyboard';
import { Stars } from '../ui/Stars';
import { sonItem, sonLettre } from '../ui/son';
import { useKeyInput } from '../hooks/useKeyInput';
import { useApp, useEnvoi, type BilanBloc } from '../state';
import { MainSchematique } from '../ui/MainSchematique';
import v from './vues.module.css';

const DUREE_FAUSSE = 180; // 150-200 ms
const DUREE_CELEBRATION = 700; // 0,5 à 1 s

type EtatLecon = {
  items: Item[];
  i: number;
  curseur: number;
  aide: EtatAide;
  barreau: Barreau;
  latence: number;
  fausse: string | null;
  depuisFausse: number;
  debutCaractere: number;
  celebration: number | null;
  etoiles: number;
  propres: string[];
  aRevoir: string[];
  itemAide: boolean;
  precedent: string | null;
  masque: boolean;
  fini: boolean;
};

type ActionLecon =
  | { type: 'frappe'; caractere: string; code: string; attendu: string; maintenant: number; debutant: boolean }
  | { type: 'tic'; maintenant: number }
  | { type: 'masquer' };

function creerEtat(items: Item[], maintenant: number, latence: number): EtatLecon {
  return {
    items,
    i: 0,
    curseur: 0,
    aide: etatInitial(items[0]?.texte[0] ?? '', latence),
    barreau: latence === 0 ? 1 : 0,
    latence,
    fausse: null,
    depuisFausse: 0,
    debutCaractere: maintenant,
    celebration: null,
    etoiles: 0,
    propres: [],
    aRevoir: [],
    itemAide: false,
    precedent: null,
    masque: false,
    fini: false,
  };
}

function reducer(e: EtatLecon, a: ActionLecon): EtatLecon {
  switch (a.type) {
    case 'masquer':
      return { ...e, masque: true };

    case 'tic': {
      let suivant = e;
      if (suivant.fausse && a.maintenant - suivant.depuisFausse >= DUREE_FAUSSE) {
        suivant = { ...suivant, fausse: null };
      }
      if (suivant.celebration !== null && a.maintenant - suivant.celebration >= DUREE_CELEBRATION) {
        suivant = itemSuivant(suivant, a.maintenant);
      }
      const b = calculerBarreau(suivant.aide, a.maintenant - suivant.debutCaractere);
      if (b !== suivant.barreau) suivant = { ...suivant, barreau: b, aide: { ...suivant.aide, atteint: b } };
      return suivant === e ? e : suivant;
    }

    case 'frappe': {
      if (e.celebration !== null || e.fini) return e;
      const texte = e.items[e.i].texte;

      // ---- frappe fausse : RIEN ne s'écrit, le curseur ne bouge pas (P3)
      if (a.caractere !== a.attendu) {
        const aide = surErreur(e.aide, a.maintenant - e.debutCaractere);
        const barreau = calculerBarreau(aide, a.maintenant - e.debutCaractere);
        return {
          ...e,
          aide,
          barreau,
          itemAide: true,
          fausse: a.code,
          depuisFausse: a.maintenant,
        };
      }

      // ---- frappe correcte
      const propre = estPropre(e.aide);
      const propres =
        propre && a.attendu !== ' ' && !e.propres.includes(a.attendu)
          ? [...e.propres, a.attendu]
          : e.propres;
      const curseur = e.curseur + 1;
      const base = { ...e, propres, fausse: null };

      if (curseur >= texte.length) {
        return {
          ...base,
          curseur,
          etoiles: e.etoiles + 1,
          celebration: a.maintenant,
          aRevoir: e.itemAide && !e.aRevoir.includes(texte) ? [...e.aRevoir, texte] : e.aRevoir,
        };
      }
      const latence = prochaineLatence(e.latence, propre, a.debutant);
      const aide = etatInitial(texte[curseur], latence);
      return {
        ...base,
        curseur,
        latence,
        aide,
        barreau: latence === 0 ? 1 : 0,
        debutCaractere: a.maintenant,
      };
    }
  }
}

function itemSuivant(e: EtatLecon, maintenant: number): EtatLecon {
  const i = e.i + 1;
  const termine = e.items[e.i].texte;
  if (i >= e.items.length) return { ...e, celebration: null, fini: true, precedent: termine };
  return {
    ...e,
    i,
    curseur: 0,
    celebration: null,
    precedent: termine,
    itemAide: false,
    aide: etatInitial(e.items[i].texte[0], e.latence),
    barreau: e.latence === 0 ? 1 : 0,
    debutCaractere: maintenant,
  };
}

export function V4Lecon() {
  const app = useApp();
  const envoi = useEnvoi();
  const id: IdDisposition = app.disposition;
  const debutant = app.palier <= PALIER_MAX_DEBUTANT;

  const items = useMemo(
    () => composerBloc({ id, palier: app.palier, aReinjecter: app.aReinjecter }),
    // un nouveau bloc à chaque entrée dans la vue
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, app.palier, app.bloc],
  );

  // Latence de départ 0 : en débutant elle y reste plafonnée (P6).
  const [e, envoyer] = useReducer(reducer, undefined, () => creerEtat(items, performance.now(), 0));

  const ensemble = useMemo(() => ensembleTouches(id, app.palier), [id, app.palier]);
  const item = e.items[e.i];
  const attendu = item?.texte[e.curseur] ?? '';
  const enCelebration = e.celebration !== null;

  // main de la lettre précédente, pour le pouce de l'espace (P8)
  const mainPrecedente = useMemo(() => {
    for (let k = e.curseur - 1; k >= 0; k--) {
      const c = item?.texte[k];
      if (c && c !== ' ') return mainDe(id, c);
    }
    return undefined;
  }, [e.curseur, item, id]);

  const cible = attendu === ' ' ? 'Space' : toucheDirecte(id, attendu)?.code;
  const mainCible: Main =
    attendu === ' ' ? pouceDeLEspace(mainPrecedente) : (mainDe(id, attendu) ?? 'gauche');
  const doigt: Doigt =
    attendu === ' '
      ? mainCible === 'gauche'
        ? 'pouce_gauche'
        : 'pouce_droit'
      : mainCible === 'gauche'
        ? 'index_gauche'
        : 'index_droit';

  /* --------------------------------------------------- un seul rAF (STACK) */
  const refEnvoyer = useRef(envoyer);
  refEnvoyer.current = envoyer;
  useEffect(() => {
    let brut = 0;
    const boucle = () => {
      refEnvoyer.current({ type: 'tic', maintenant: performance.now() });
      brut = requestAnimationFrame(boucle);
    };
    brut = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(brut);
  }, []);

  /* ------------------------------------------------------------- frappes */
  useKeyInput(
    !e.fini,
    (f) => {
      if (f.avecAutreModificateur) return;
      // P2 : aucun modificateur n'est accepté dans le sas débutant
      if (debutant && f.avecMaj) return;
      if (f.key.length !== 1 && f.code !== 'Space') return;
      const caractere = f.code === 'Space' ? ' ' : f.key;
      envoyer({
        type: 'frappe',
        caractere,
        code: f.code,
        attendu,
        maintenant: performance.now(),
        debutant,
      });
      if (caractere === attendu) {
        if (e.curseur + 1 >= (item?.texte.length ?? 0)) sonItem(app.reglages.sons);
        else sonLettre(app.reglages.sons, Math.min(e.curseur, 7));
      }
    },
    (actif) => envoi({ type: 'verrMaj', actif }),
  );

  /* ------------------------------------------------------- fin de bloc */
  useEffect(() => {
    if (!e.fini) return;
    const bilan: BilanBloc = { etoiles: e.etoiles, propres: e.propres, aRevoir: e.aRevoir };
    envoi({ type: 'blocTermine', bilan });
  }, [e.fini]); // eslint-disable-line react-hooks/exhaustive-deps

  /* -------------------- nom de la lettre prononcé au barreau 3 (fr-FR) */
  const refDit = useRef('');
  useEffect(() => {
    const cle = `${e.i}:${e.curseur}:${e.barreau}`;
    if (e.barreau !== 3 || refDit.current === cle) return;
    refDit.current = cle;
    if (!app.reglages.sons || typeof speechSynthesis === 'undefined') return;
    const voix = speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith('fr'));
    if (!voix) return; // pas de voix française : l'aide reste purement visuelle
    const phrase = new SpeechSynthesisUtterance(attendu === ' ' ? 'espace' : attendu);
    phrase.voice = voix;
    phrase.lang = 'fr-FR';
    phrase.rate = 0.85;
    speechSynthesis.speak(phrase);
  }, [e.barreau, e.i, e.curseur, attendu, app.reglages.sons]);

  const toucheLibelle = (c: string) => (c === ' ' ? 'espace' : c.toUpperCase());
  const touchesLecon = nouvellesTouches(id, app.palier);
  const clavierMasque = e.masque && !e.fini;

  return (
    <div className={v.ecran}>
      <header className={v.entete}>
        <button className={v.retour} onClick={() => envoi({ type: 'vue', vue: 'V1' })} aria-label="Revenir à l'accueil">
          ←
        </button>
        <div>
          <p className={v.bandeauTouches}>
            Les touches de cette leçon :<strong>{touchesLecon.map(toucheLibelle).join(' ')}</strong>
          </p>
          <div className={v.avancement} role="img" aria-label="Avancement du bloc">
            {e.items.map((it, k) => (
              <span
                key={it.texte}
                className={[
                  v.pastilleAvancement,
                  k < e.i || (k === e.i && enCelebration) ? v.pastilleAvancementPleine : '',
                ].join(' ')}
              />
            ))}
          </div>
        </div>
        <span />
      </header>

      {app.verrMaj && (
        <div className={v.bandeauVerrMaj} role="status">
          <span className={v.toucheDessinee}>
            <svg viewBox="0 0 14 16" width="12" height="14" aria-hidden="true">
              <path d="M4 7V4.6a3 3 0 0 1 6 0V7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <rect x="1.6" y="7" width="10.8" height="8" rx="2" fill="currentColor" />
            </svg>
            Verr. Maj
          </span>
          Appuie sur la touche avec le petit cadenas pour l'éteindre.
        </div>
      )}

      <div className={[v.centre, v.centreLecon].join(' ')}>
        <div className={v.zoneMot}>
          {e.precedent && <span className={v.motPrecedent}>{e.precedent}</span>}
          <span className={v.mot} key={`${e.i}`} data-mot={item?.texte}>
            {[...(item?.texte ?? '')].map((c, k) => (
              <span
                key={k}
                className={[
                  c === ' ' ? v.espaceVisible : '',
                  k < e.curseur ? v.lettreTapee : '',
                  k === e.curseur ? v.lettreCourante : '',
                  k === e.curseur && mainCible === 'droite' ? v.lettreCouranteDroite : '',
                  k > e.curseur ? v.lettreAVenir : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {c === ' ' ? ' ' : c}
              </span>
            ))}
          </span>
          {enCelebration && (
            <span className={v.celebration}>
              <Stars nombre={1} />
            </span>
          )}
        </div>

        {item?.genre === 'syllabe' && <p className={v.etiquetteSyllabe}>on lit et on tape</p>}

        <div className={v.zoneClavier}>
          <div className={clavierMasque ? v.clavierMasque : undefined}>
            <Keyboard
              id={id}
              ensemble={ensemble}
              cible={enCelebration ? undefined : cible}
              fausse={e.fausse ?? undefined}
              blocPulse={e.barreau >= 2 && !enCelebration ? mainCible : undefined}
              etiquetteFrontiere="la frontière"
              espace={{
                etat:
                  e.fausse === 'Space'
                    ? 'fausse'
                    : attendu === ' ' && !enCelebration
                      ? 'cible'
                      : 'ouvert',
                pouce: mainCible,
              }}
              taille="clamp(38px, 4.6vw, 60px)"
            />
            {e.barreau === 3 && !enCelebration && (
              <AideBarreau3 main={mainCible} lettre={attendu} />
            )}
          </div>
          {clavierMasque ? (
            <p className={v.motMasque}>Le clavier revient au mot suivant.</p>
          ) : (
            <button className={v.petitBouton} onClick={() => envoyer({ type: 'masquer' })}>
              Je tape sans regarder
            </button>
          )}
        </div>
      </div>

      <FingerBar actif={enCelebration ? null : doigt} />
    </div>
  );
}

type Geometrie = { cible: { x: number; y: number }; doigt: { x: number; y: number } };

/** Barreau 3 : overlay TRANSITOIRE, main schématique ancrée au bord du clavier. */
function AideBarreau3({ main, lettre }: { main: Main; lettre: string }) {
  const [geo, setGeo] = useState<Geometrie | null>(null);
  const refBoite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = refBoite.current?.parentElement;
    const boite = parent?.getBoundingClientRect();
    const touche = parent?.querySelector<HTMLElement>('[data-etat="cible"]')?.getBoundingClientRect();
    if (!boite || !touche) return setGeo(null);
    setGeo({
      cible: {
        x: touche.left + touche.width / 2 - boite.left,
        y: touche.top + touche.height / 2 - boite.top,
      },
      doigt: { x: main === 'gauche' ? 72 : boite.width - 72, y: boite.height - 26 },
    });
  }, [lettre, main]);

  return (
    <div className={v.aideOverlay} ref={refBoite} aria-hidden="true">
      <span
        className={v.aideNom}
        style={{ left: main === 'gauche' ? 6 : undefined, right: main === 'gauche' ? undefined : 6 }}
      >
        {lettre === ' ' ? 'espace' : lettre.toUpperCase()}
      </span>
      <div
        style={{
          position: 'absolute',
          bottom: -4,
          left: main === 'gauche' ? -6 : undefined,
          right: main === 'gauche' ? undefined : -6,
        }}
      >
        <MainSchematique cote={main} largeur={104} />
      </div>
      {geo && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <marker id="pointe" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
              <path d="M0 0 L7 3.5 L0 7 z" fill="var(--encre)" />
            </marker>
          </defs>
          <path
            d={`M ${geo.doigt.x} ${geo.doigt.y} Q ${geo.cible.x} ${geo.doigt.y} ${geo.cible.x} ${geo.cible.y + 30}`}
            fill="none"
            stroke="var(--encre)"
            strokeWidth="3"
            strokeDasharray="7 6"
            markerEnd="url(#pointe)"
          />
        </svg>
      )}
    </div>
  );
}
