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
import {
  exigeMaj,
  MAJ_DROITE,
  MAJ_GAUCHE,
  mainDe,
  toucheDe,
  type IdDisposition,
  type Main,
} from '../core/layouts';
import { doitProposerV2, frappeCoherente } from '../core/detect';
import { mainDeLaMaj, verdictMaj } from '../core/maj';
import { ensembleTouches, nouvellesTouches, PALIER_MAX_DEBUTANT } from '../core/paliers';
import { CONSIGNES, FingerBar, type Doigt } from '../ui/FingerBar';
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
  /** piège Maj : bonne touche, modificateur manquant — jamais une erreur */
  majManquante: boolean;
  depuisFausse: number;
  debutCaractere: number;
  celebration: number | null;
  etoiles: number;
  propres: string[];
  aRevoir: string[];
  /** items validés dans ce bloc, dans l'ordre — alimente le gain lexical de V5 */
  valides: string[];
  itemAide: boolean;
  masque: boolean;
  fini: boolean;
  /** frappes d'affilée cohérentes avec l'AUTRE disposition (surveillance F7) */
  incoherentes: number;
  /** items enchaînés qui ont saturé l'aide au barreau 3 */
  itemsSatures: number;
  /** l'item en cours a-t-il atteint le barreau 3 ? */
  satureCourant: boolean;
};

type ActionLecon =
  | {
      type: 'frappe';
      caractere: string;
      code: string;
      attendu: string;
      maintenant: number;
      debutant: boolean;
      id: IdDisposition;
      /** true = cohérente, false = cohérente avec l'autre table, null = muette */
      coherente: boolean | null;
    }
  | { type: 'tic'; maintenant: number }
  | { type: 'masquer' }
  | { type: 'montrer' };

function creerEtat(items: Item[], maintenant: number, latence: number): EtatLecon {
  return {
    items,
    i: 0,
    curseur: 0,
    aide: etatInitial(items[0]?.texte[0] ?? '', latence),
    barreau: latence === 0 ? 1 : 0,
    latence,
    fausse: null,
    majManquante: false,
    depuisFausse: 0,
    debutCaractere: maintenant,
    celebration: null,
    etoiles: 0,
    propres: [],
    aRevoir: [],
    valides: [],
    itemAide: false,
    masque: false,
    fini: false,
    incoherentes: 0,
    itemsSatures: 0,
    satureCourant: false,
  };
}

function reducer(e: EtatLecon, a: ActionLecon): EtatLecon {
  switch (a.type) {
    case 'masquer':
      return { ...e, masque: true };

    case 'montrer':
      return { ...e, masque: false };

    case 'tic': {
      let suivant = e;
      if (suivant.fausse && a.maintenant - suivant.depuisFausse >= DUREE_FAUSSE) {
        suivant = { ...suivant, fausse: null };
      }
      if (suivant.celebration !== null && a.maintenant - suivant.celebration >= DUREE_CELEBRATION) {
        suivant = itemSuivant(suivant, a.maintenant);
      }
      const b = calculerBarreau(suivant.aide, a.maintenant - suivant.debutCaractere);
      if (b !== suivant.barreau) {
        suivant = {
          ...suivant,
          barreau: b,
          aide: { ...suivant.aide, atteint: b },
          satureCourant: suivant.satureCourant || b >= 3,
        };
      }
      return suivant === e ? e : suivant;
    }

    case 'frappe': {
      if (e.celebration !== null || e.fini) return e;
      const texte = e.items[e.i].texte;

      /* Surveillance de disposition (F7) : une frappe cohérente avec l'AUTRE
         table et avec aucune de la table courante incrémente le compteur ;
         toute frappe cohérente le remet à zéro. */
      const incoherentes =
        a.coherente === null ? e.incoherentes : a.coherente ? 0 : e.incoherentes + 1;
      e = incoherentes === e.incoherentes ? e : { ...e, incoherentes };

      /* ---- piège Maj : la bonne touche, sans le modificateur. État de
         QUASI-RÉUSSITE : ni erreur, ni escalade d'aide ; la cible reste
         allumée et la touche Maj s'invite à côté d'elle. */
      if (a.caractere !== a.attendu && verdictMaj(a.id, a.attendu, a.caractere) === 'quasi') {
        return { ...e, majManquante: true, fausse: null };
      }

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
      const base = { ...e, propres, fausse: null, majManquante: false };

      if (curseur >= texte.length) {
        return {
          ...base,
          curseur,
          etoiles: e.etoiles + 1,
          celebration: a.maintenant,
          valides: [...e.valides, texte],
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
  if (i >= e.items.length) return { ...e, celebration: null, fini: true };
  return {
    ...e,
    i,
    curseur: 0,
    celebration: null,
    itemAide: false,
    itemsSatures: e.satureCourant ? e.itemsSatures + 1 : 0,
    satureCourant: false,
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

  /* La touche VISÉE est la touche porteuse, que le caractère s'écrive
     directement ou en tenant Maj (régression itération 002 : au palier 7,
     aucun chiffre FR-FR n'avait de cible). */
  const cible = attendu === ' ' ? 'Space' : toucheDe(id, attendu)?.code;
  const mainCible: Main =
    attendu === ' ' ? pouceDeLEspace(mainPrecedente) : (mainDe(id, attendu) ?? 'gauche');
  /* Seul cas du MVP à DEUX touches allumées : la Maj contralatérale. */
  const besoinMaj = attendu !== ' ' && exigeMaj(id, attendu) && !enCelebration;
  const cibleMaj = besoinMaj
    ? mainDeLaMaj(id, attendu) === 'gauche'
      ? MAJ_GAUCHE
      : MAJ_DROITE
    : undefined;
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
        id,
        coherente: frappeCoherente(id, f.code, f.key),
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
    const bilan: BilanBloc = {
      etoiles: e.etoiles,
      propres: e.propres,
      aRevoir: e.aRevoir,
      items: e.valides,
    };
    envoi({ type: 'blocTermine', bilan });
  }, [e.fini]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------ surveillance de disposition (F7)
     5 frappes d'affilée cohérentes avec l'autre clavier, ou 3 items saturés
     au barreau 3 : l'app interrompt d'elle-même et repropose V2. */
  const proposerV2 = doitProposerV2(e.incoherentes, e.itemsSatures);
  useEffect(() => {
    if (proposerV2) envoi({ type: 'vue', vue: 'V2', raison: 'incoherence' });
  }, [proposerV2]); // eslint-disable-line react-hooks/exhaustive-deps

  /* -------------------- nom de la lettre prononcé au barreau 3 (fr-FR) */
  const refDit = useRef('');
  useEffect(() => {
    const cle = `${e.i}:${e.curseur}:${e.barreau}`;
    if (e.barreau !== 3 || refDit.current === cle) return;
    refDit.current = cle;
    if (!app.reglages.sons || typeof speechSynthesis === 'undefined') return;
    // Un navigateur exotique ne doit JAMAIS pouvoir effacer la leçon en cours :
    // la synthèse vocale est un confort, pas une dépendance.
    try {
      const voix = speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith('fr'));
      if (!voix) return; // pas de voix française : l'aide reste purement visuelle
      const phrase = new SpeechSynthesisUtterance(attendu === ' ' ? 'espace' : attendu);
      phrase.voice = voix;
      phrase.lang = 'fr-FR';
      phrase.rate = 0.85;
      speechSynthesis.speak(phrase);
    } catch {
      /* voix indisponible : l'aide reste purement visuelle */
    }
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
        <div className={v.bandeauVerrMaj} role="status" aria-live="polite">
          {/* Illustration de la touche, sans son abréviation technique. */}
          <span className={v.toucheDessinee} aria-hidden="true">
            <svg viewBox="0 0 22 22" width="26" height="26">
              <path d="M11 4 L18 12 H14.5 V18 H7.5 V12 H4 Z" fill="currentColor" />
            </svg>
          </span>
          <span>
            <b>Ton clavier écrit en grandes lettres.</b>
            <br />
            Appuie sur la touche avec le petit cadenas pour l'éteindre.
          </span>
        </div>
      )}

      <div
        className={[v.centre, v.centreLecon, clavierMasque ? v.centreSansClavier : '']
          .filter(Boolean)
          .join(' ')}
      >
        <div className={v.zoneMot}>
          <span
            className={v.mot}
            key={`${e.i}`}
            data-mot={item?.texte}
            data-curseur={e.curseur}
            aria-hidden="true"
          >
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

        {/* Ce que dit un lecteur d'écran : le mot à taper, puis le doigt. */}
        <p className={v.pourLecteur} aria-live="polite">
          {item ? `${item.texte} — ${CONSIGNES[doigt].join(', ')}` : ''}
        </p>

        {item?.genre === 'syllabe' && <p className={v.etiquetteSyllabe}>on lit et on tape</p>}

        {/* Piège Maj : seul cas où DEUX touches sont mises en avant ensemble. */}
        {besoinMaj && (
          <p
            className={[v.rappelMaj, e.majManquante ? v.rappelMajInsiste : ''].join(' ')}
            role="status"
            data-maj={mainDeLaMaj(id, attendu)}
          >
            <span
              className={[
                v.toucheMaj,
                mainDeLaMaj(id, attendu) === 'gauche' ? v.toucheMajGauche : '',
              ].join(' ')}
            >
              <svg viewBox="0 0 22 22" width="22" height="22" aria-hidden="true">
                <path d="M11 4 L18 12 H14.5 V18 H7.5 V12 H4 Z" fill="currentColor" />
              </svg>
            </span>
            {e.majManquante ? 'Presque : garde' : 'Tiens'} la touche Maj avec ta{' '}
            <b>main {mainDeLaMaj(id, attendu)}</b>, puis appuie sur la touche allumée.
          </p>
        )}

        <div className={v.zoneClavier}>
          <div className={clavierMasque ? v.clavierMasque : undefined}>
            <Keyboard
              id={id}
              ensemble={ensemble}
              cible={enCelebration ? undefined : cible}
              cibleMaj={cibleMaj}
              avecMaj={app.palier >= PALIER_MAX_DEBUTANT + 1}
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
              /* La rangée Maj ajoute 3,4 unités de largeur : au palier qui la
                 dessine, la touche rétrécit pour que rien ne déborde. */
              taille={app.palier >= 7 ? 'clamp(17px, 5vw, 50px)' : 'clamp(21px, 6.1vw, 58px)'}
            />
            {e.barreau === 3 && !enCelebration && !e.majManquante && (
              <AideBarreau3 main={mainCible} lettre={attendu} />
            )}
          </div>
          {clavierMasque ? (
            <button className={v.petitBouton} onClick={() => envoyer({ type: 'montrer' })}>
              Remontre-moi le clavier
            </button>
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

const LARGEUR_MAIN = 104;
/** Rapport hauteur/largeur du dessin de main (viewBox 100×130). */
const HAUTEUR_MAIN = LARGEUR_MAIN * 1.3;

type Geometrie = {
  /** bulle du nom de lettre : centrée sur la touche visée, posée au-dessus */
  bulle: { x: number; y: number };
  /** coin haut-gauche du dessin de main, ancré au bord bas du bloc concerné */
  main: { x: number; y: number };
};

/**
 * Barreau 3 : overlay TRANSITOIRE. La bulle du nom de la lettre porte une
 * pointe qui désigne la touche — aucune flèche ne traverse plus le clavier
 * (elle coupait le repère tactile du J), et la main est repoussée du côté
 * EXTÉRIEUR de son bloc pour ne jamais recouvrir la barre d'espace.
 */
function AideBarreau3({ main, lettre }: { main: Main; lettre: string }) {
  const [geo, setGeo] = useState<Geometrie | null>(null);
  const refBoite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = refBoite.current?.parentElement;
    const boite = parent?.getBoundingClientRect();
    const bloc = parent?.querySelector<HTMLElement>(`[data-bloc="${main}"]`)?.getBoundingClientRect();
    const touche = parent
      ?.querySelector<HTMLElement>(`[data-bloc="${main}"] [data-etat="cible"]`)
      ?.getBoundingClientRect();
    if (!boite || !bloc || !touche) return setGeo(null);
    const cibleX = touche.left + touche.width / 2 - boite.left;
    /* La main est repoussée du côté EXTÉRIEUR et bornée par la barre d'espace
       elle-même : elle ne peut jamais la recouvrir (itération 002, point 11). */
    const espace = parent?.querySelector<HTMLElement>('[data-code="Space"]')?.getBoundingClientRect();
    const gaucheBloc = bloc.left - boite.left;
    const droiteBloc = bloc.right - boite.left;
    const souhaite = cibleX - LARGEUR_MAIN / 2;
    const x =
      main === 'gauche'
        ? Math.max(
            gaucheBloc - 14,
            Math.min(
              souhaite,
              (espace ? espace.left - boite.left : droiteBloc) - LARGEUR_MAIN - 10,
            ),
          )
        : Math.min(
            droiteBloc - LARGEUR_MAIN + 14,
            Math.max(souhaite, (espace ? espace.right - boite.left : gaucheBloc) + 10),
          );
    setGeo({
      bulle: { x: cibleX, y: touche.top - boite.top },
      main: { x, y: bloc.bottom - boite.top - 16 },
    });
  }, [lettre, main]);

  if (!geo) return <div className={v.aideOverlay} ref={refBoite} aria-hidden="true" />;
  return (
    <div className={v.aideOverlay} ref={refBoite} aria-hidden="true">
      <span className={v.aideNom} style={{ left: geo.bulle.x, top: geo.bulle.y - 46 }}>
        {lettre === ' ' ? 'espace' : lettre.toUpperCase()}
      </span>
      <div
        className={v.aideMain}
        style={{ left: geo.main.x, top: geo.main.y, height: HAUTEUR_MAIN }}
      >
        <MainSchematique cote={main} largeur={LARGEUR_MAIN} />
      </div>
    </div>
  );
}
