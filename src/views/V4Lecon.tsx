import { useEffect, useMemo, useReducer, useRef, useState, type MouseEvent } from 'react';
import { creerEtat, dureeLecon, reducer, verdictFrappe, type FrappeLecon } from '../core/lecon';
import { composerBlocDeListe, pouceDeLEspace } from '../core/generator';
import { creerSession } from '../core/session';
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
import { mainDeLaMaj } from '../core/maj';
import { CONSIGNES, imageMain, type Doigt } from '../core/doigts';
import { doigtDe, ensembleTouches, etapes, ETAPE_MAX, type IdParcours } from '../core/parcours';
import { Keyboard } from '../ui/Keyboard';
import { Stars } from '../ui/Stars';
import { sonItem, sonLettre } from '../ui/son';
import { useKeyInput } from '../hooks/useKeyInput';
import { avancementEtape } from '../core/progression';
import { nomProfilActif } from '../core/profils';
import { useApp, useEnvoi, type BilanBloc } from '../state';
import { MainSchematique } from '../ui/MainSchematique';
import v from './vues.module.css';

/**
 * Un clic SOURIS sur un bouton de la leçon lui laisse le focus : les frappes
 * suivantes lui appartiennent alors et ne comptent plus comme saisie
 * pédagogique. On lui rend la main — mais seulement pour une activation au
 * pointeur (`detail > 0`), pour ne pas casser la navigation au clavier.
 */
/** Douze pastilles fixes : elles disent la part de la leçon écoulée, jamais un
    nombre d'exercices — qui n'est ni connu d'avance ni le même d'un enfant à
    l'autre. */
const PASTILLES_LECON = 12;

function rendreLeClavier(ev: MouseEvent<HTMLButtonElement>): void {
  if (ev.detail > 0) ev.currentTarget.blur();
}

export function V4Lecon() {
  const app = useApp();
  const envoi = useEnvoi();
  const id: IdDisposition = app.disposition;
  /* P6 : c'est DÉCOUVERTE dont la latence est plafonnée à zéro — ce parcours
     entraîne le placement des mains, pas le rappel en mémoire. Le déduire du
     numéro d'étape faisait que les six premières étapes de Dactylo se
     comportaient comme Découverte : la cible apparaissait immédiatement, et la
     fenêtre de rappel n'existait pas là où elle a un sens. */
  const debutant = app.parcours === 'decouverte';
  /* Où la Majuscule s'enseigne dépend du parcours : tôt en Dactylo pour ouvrir
     les phrases, tard en Découverte. La vue ne le sait pas, le parcours si. */
  const etapeMajuscule = etapes(app.parcours, id).find((e) => e.genre === 'majuscule')?.n;

  /* Une LISTE de la maison garde son lot fixe : elle a une fin — les mots que
     la famille a écrits — et s'arrêter au chrono la couperait au milieu.
     Le PARCOURS, lui, dure un temps : son flux se recharge. */
  /* L'étape RÉELLEMENT jouée : celle que l'enfant a choisi de rejouer, sinon la
     sienne. Rejouer ne fait pas avancer la progression — c'est un choix, pas un
     rattrapage. */
  const etapeJouee = app.etapeRejouee ?? app.palier;

  const session = useMemo(
    () =>
      app.listeJouee
        ? null
        : creerSession({
            id,
            parcours: app.parcours,
            etape: etapeJouee,
            aReinjecter: app.aReinjecter,
          }),
    // une nouvelle séance à chaque entrée dans la vue
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, app.parcours, etapeJouee, app.bloc, app.listeJouee],
  );

  const items = useMemo(
    () => (app.listeJouee ? composerBlocDeListe(app.listeJouee.mots, id) : session!.items()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, app.listeJouee, id],
  );

  // Latence de départ 0 : en Découverte elle y reste plafonnée (P6).
  const [e, envoyer] = useReducer(reducer, undefined, () =>
    creerEtat(items, performance.now(), 0, session ? dureeLecon() : undefined),
  );

  /* On rallonge la file AVANT qu'elle ne se vide : une file épuisée finirait la
     leçon au milieu, alors que c'est le chrono qui doit décider. */
  useEffect(() => {
    if (!session || e.fini) return;
    if (!session.aRecharger(e.i)) return;
    const avant = session.items().length;
    session.recharger();
    envoyer({ type: 'ajouter', items: session.items().slice(avant) });
  }, [session, e.i, e.fini]);

  /* Une liste peut employer des lettres pas encore enseignées — le clavier les
     allume quand même : savoir où poser ses doigts n'attend pas le programme. */
  const ensemble = useMemo(() => {
    const base = ensembleTouches(app.parcours, id, etapeJouee);
    if (app.listeJouee) for (const it of items) for (const c of it.texte) base.add(c);
    return base;
  }, [id, app.palier, app.listeJouee, items]);
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
  /* Le doigt à MONTRER n'est pas une propriété de la touche : il dépend du
     parcours suivi (index de la main en Découverte, doigt définitif en
     Dactylo). `parcours.doigtDe` en décide seul — la leçon ne le recalcule
     pas.
     Le parcours vient de l'état : c'est le parent qui l'a choisi en V7 (#42). */
  const parcours: IdParcours = app.parcours;
  const doigt: Doigt =
    attendu === ' '
      ? mainCible === 'gauche'
        ? 'pouce_gauche'
        : 'pouce_droit'
      : (doigtDe(parcours, id, attendu) ??
        (mainCible === 'gauche' ? 'index_gauche' : 'index_droit'));

  /* --------------------------------------------------- un seul rAF (STACK) */
  const refEnvoyer = useRef(envoyer);
  refEnvoyer.current = envoyer;
  /* Horloge SUSPENDUE tant que la fenêtre n'a pas le focus : une fenêtre peut
     rester visible (donc animée par rAF) sans focus, et l'aide d'inactivité se
     déclenchait pendant que l'enfant était ailleurs. Suspendre = rebaser à
     chaque image, ce qui gèle le temps écoulé sur le caractère. */
  const refEnPause = useRef(typeof document !== 'undefined' && !document.hasFocus());
  useEffect(() => {
    let brut = 0;
    const boucle = () => {
      refEnvoyer.current({
        type: refEnPause.current ? 'reprise' : 'tic',
        maintenant: performance.now(),
      });
      brut = requestAnimationFrame(boucle);
    };
    brut = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(brut);
  }, []);

  /* Onglet ou fenêtre quittés puis repris : le temps passé ailleurs n'est pas
     de l'hésitation. On rebase l'horloge du caractère au retour, sans quoi
     l'enfant retrouvait l'aide d'inactivité déjà déclenchée. */
  useEffect(() => {
    const suspendre = () => {
      refEnPause.current = true;
    };
    const reprendre = () => {
      if (document.visibilityState !== 'visible') return;
      refEnPause.current = false;
      refEnvoyer.current({ type: 'reprise', maintenant: performance.now() });
    };
    const surVisibilite = () => (document.visibilityState === 'visible' ? reprendre() : suspendre());
    document.addEventListener('visibilitychange', surVisibilite);
    window.addEventListener('focus', reprendre);
    window.addEventListener('blur', suspendre);
    return () => {
      document.removeEventListener('visibilitychange', surVisibilite);
      window.removeEventListener('focus', reprendre);
      window.removeEventListener('blur', suspendre);
    };
  }, []);

  /* ------------------------------------------------------------- frappes */
  useKeyInput(
    !e.fini,
    (f) => {
      if (f.avecAutreModificateur) return;
      /* UNE frappe = UN geste. L'auto-répétition du système validait les deux
         `l` de « belle » sans relâcher, et faisait grimper l'aide aux barreaux
         2-3 en quelques dizaines de millisecondes sur une touche fausse tenue. */
      if (f.repeat) return;
      /* P2 : aucun modificateur dans le sas débutant — SAUF quand la cible
         l'exige. Une liste perso peut contenir un chiffre AZERTY dès le
         palier 1 : la consigne réclamait alors une Maj que ce garde jetait
         juste après, et le caractère restait injouable à jamais. */
      if (debutant && f.avecMaj && !besoinMaj) return;
      if (f.key.length !== 1 && f.code !== 'Space') return;
      const action: FrappeLecon = {
        type: 'frappe',
        caractere: f.code === 'Space' ? ' ' : f.key,
        code: f.code,
        attendu,
        maintenant: performance.now(),
        debutant,
        id,
        coherente: frappeCoherente(id, f.code, f.key),
        /* Règle contralatérale (P8) : la Maj RÉELLEMENT tenue doit être celle
           de la main opposée. Une Maj homolatérale est une quasi-réussite. */
        majMauvaisCote: !!cibleMaj && !(cibleMaj === MAJ_GAUCHE ? f.majGauche : f.majDroite),
      };
      envoyer(action);
      /* Le son suit le VERDICT du reducer, jamais la seule égalité de
         caractères : une frappe refusée pour mauvaise Maj sonnait la réussite. */
      if (verdictFrappe(e, action) === 'reussite') {
        if (e.curseur + 1 >= (item?.texte.length ?? 0)) sonItem(app.reglages.sons);
        else sonLettre(app.reglages.sons, Math.min(e.curseur, 7));
      }
    },
    (actif) => envoi({ type: 'verrMaj', actif }),
    id,
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

  /* Le bandeau annonce l'ensemble CUMULÉ, pas les seules nouveautés du palier :
     c'est lui la référence de ce qui peut être proposé (P5). Les capitales
     accentuées sont exclues à la source (`libellesEnsemble`). */
  /* Le bandeau annonçait encore le jeu de touches de la table v1 pendant que
     le générateur servait celui de la v2 : l'enfant lisait `e f j n s t u` et
     tapait des mots faits d'autres lettres. */
  const touchesLecon = [...ensembleTouches(app.parcours, id, etapeJouee)]
    .filter((c) => c !== ' ')
    .map((c) => c.toUpperCase());

  /* Ce que les pastilles montrent : la part de la leçon écoulée. Le temps est
     lu au tic du reducer, qui est déjà la seule horloge de l'écran. */
  const partEcoulee =
    e.finLe === null
      ? // une liste de la maison a une fin connue : on suit les items
        e.items.length === 0
        ? 0
        : e.i / e.items.length
      : Math.min(1, Math.max(0, 1 - (e.finLe - e.maintenant) / dureeLecon()));

  /* Le prénom est lu une fois : il ne peut pas changer pendant une leçon. */
  const prenom = useMemo(() => nomProfilActif(), []);
  /* « {n} blocs finis sur 6 » a disparu : il montrait à l'enfant le plafond de
     secours que le produit devait garder silencieux — et ce plafond n'existe
     plus. Reste un décompte lisible d'avance, dans les mots de l'enfant. */
  const avance = avancementEtape(app.blocsSurPalier);
  const etiquetteLecon = `Étape ${app.palier} · Leçon ${Math.min(avance.leconsFaites + 1, avance.total)} sur ${avance.total}`;
  const clavierMasque = e.masque && !e.fini;

  return (
    <div className={v.ecran}>
      <header className={v.entete}>
        <button className={v.retour} onClick={() => envoi({ type: 'vue', vue: 'V1' })} aria-label="Revenir à l'accueil">
          ←
        </button>
        <div>
          {/* Où en est-on ? Deux échelles, chacune avec son indice : la leçon
              (le palier, 7 en tout) et le bloc en cours. Sans elles, monter
              d'une leçon était un événement muet — l'enfant ne savait ni où il
              en était, ni qu'il venait d'avancer. */}
          <p className={v.bandeauLecon}>
            <strong>
              Étape {etapeJouee} sur {ETAPE_MAX}
            </strong>
            <span
              className={v.jaugeLecon}
              role="img"
              aria-label={etiquetteLecon}
              title={etiquetteLecon}
            >
              <span className={v.jaugeLeconPleine} style={{ width: `${avance.part * 100}%` }} />
            </span>
            <span className={v.detailLecon}>{`Leçon ${Math.min(avance.leconsFaites + 1, avance.total)} sur ${avance.total}`}</span>
          </p>
          <p className={v.bandeauTouches}>
            Les touches de cette leçon : <strong>{touchesLecon.join(' ')}</strong>
          </p>
          <div className={v.ligneBloc}>

            {/* Les pastilles suivent le TEMPS, pas les exercices. Une pastille
                par exercice supposait de connaître le total d'avance — ce qui
                n'a plus de sens dans une leçon qui dure douze minutes et dont
                le nombre d'exercices dépend de la vitesse de l'enfant. Elles
                restent une image : aucun chiffre, aucune durée écrite. */}
            <div className={v.avancement} role="img" aria-label="Avancement de la leçon">
              {Array.from({ length: PASTILLES_LECON }, (_, k) => (
                <span
                  key={k}
                  className={[
                    v.pastilleAvancement,
                    k < Math.round(partEcoulee * PASTILLES_LECON) ? v.pastilleAvancementPleine : '',
                  ].join(' ')}
                />
              ))}
            </div>
          </div>
        </div>
        <span className={v.nomProfil}>{prenom}</span>
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
        /* Le doigt visé, porté par la zone de leçon. Il vivait sur la bande de
           photographies ; celle-ci retirée, l'information reste — c'est elle
           que lisent l'annonce vocale et les tests, pas les images. */
        data-doigt={enCelebration ? 'aucun' : doigt}
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
          <div className={[v.deuxCotes, clavierMasque ? v.clavierMasque : ''].filter(Boolean).join(' ')}>
            {/* Les deux mains dessinées encadrent le clavier À CHAQUE TOUR : le
                doigt à employer est surligné sur celle qui joue, l'autre reste
                au repos, aucun doigt marqué. C'est le dessin qui porte le
                DOIGT — mais le libellé de niveau MAIN reste affiché à côté de
                la main active, comme P4 l'exige. Le supprimer laissait l'enfant
                sans aucun mot pour ce qu'il voit. */}
            <div className={v.coteMain} data-main="gauche" data-main-active={mainCible === 'gauche' && !enCelebration ? 'oui' : 'non'}>
              <img src={imageMain('gauche', enCelebration ? undefined : doigt)} alt="" aria-hidden="true" draggable={false} />
              {mainCible === 'gauche' && !enCelebration && (
                <span className={v.consigneMain}>{CONSIGNES[doigt].join(' · ')}</span>
              )}
            </div>
            <Keyboard
              id={id}
              ensemble={ensemble}
              cible={enCelebration ? undefined : cible}
              cibleMaj={cibleMaj}
              /* Les Maj sont dessinées dès l'étape qui les enseigne, et aussi
                 dès que la cible en réclame une — sans quoi la consigne
                 désignait une touche absente du clavier. */
              avecMaj={etapeMajuscule !== undefined && app.palier >= etapeMajuscule || besoinMaj}
              fausse={e.fausse ?? undefined}
              blocPulse={e.barreau >= 2 && !enCelebration ? mainCible : undefined}
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
              taille={app.palier >= 7 ? 'clamp(14px, 4.1vw, 48px)' : 'clamp(16px, 4.6vw, 56px)'}
            />
            <div className={v.coteMain} data-main="droite" data-main-active={mainCible === 'droite' && !enCelebration ? 'oui' : 'non'}>
              <img src={imageMain('droite', enCelebration ? undefined : doigt)} alt="" aria-hidden="true" draggable={false} />
              {mainCible === 'droite' && !enCelebration && (
                <span className={v.consigneMain}>{CONSIGNES[doigt].join(' · ')}</span>
              )}
            </div>
            {e.barreau === 3 && !enCelebration && !e.majManquante && (
              <AideBarreau3 main={mainCible} lettre={attendu} />
            )}
          </div>
          {clavierMasque ? (
            <button className={v.petitBouton} onClick={(ev) => { rendreLeClavier(ev); envoyer({ type: 'montrer' }); }}>
              Remontre-moi le clavier
            </button>
          ) : (
            <button className={v.petitBouton} onClick={(ev) => { rendreLeClavier(ev); envoyer({ type: 'masquer' }); }}>
              Je tape sans regarder
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

const LARGEUR_MAIN = 104;
/** Rapport hauteur/largeur du dessin de main (viewBox 100×130). */
const HAUTEUR_MAIN = LARGEUR_MAIN * 1.3;

/** Abscisse du bout de l'index dans le dessin, en fraction de la largeur. */
const INDEX_X = 0.76;
/** Inclinaison maximale de la main : au-delà, elle ne se lit plus comme une main. */
const ANGLE_MAX = 38;

type Geometrie = {
  /** bulle du nom de lettre : au-dessus du clavier ENTIER, jamais sur une touche */
  bulle: { x: number };
  /** coin haut-gauche du dessin de main + inclinaison vers la touche visée */
  main: { x: number; y: number; angle: number };
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
    /* Le bloc d'une main est désormais découpé en un SEGMENT par rangée : sa
       boîte est l'union des segments, pas celle du premier. */
    const segments = [...(parent?.querySelectorAll<HTMLElement>(`[data-bloc="${main}"]`) ?? [])];
    const bloc = segments.length
      ? segments.slice(1).reduce(
          (u, el) => {
            const r = el.getBoundingClientRect();
            return {
              left: Math.min(u.left, r.left),
              right: Math.max(u.right, r.right),
              top: Math.min(u.top, r.top),
              bottom: Math.max(u.bottom, r.bottom),
            };
          },
          (({ left, right, top, bottom }) => ({ left, right, top, bottom }))(
            segments[0].getBoundingClientRect(),
          ),
        )
      : undefined;
    const touche = parent
      ?.querySelector<HTMLElement>(`[data-bloc="${main}"] [data-etat="cible"]`)
      ?.getBoundingClientRect();
    if (!boite || !bloc || !touche) return setGeo(null);
    const cibleX = touche.left + touche.width / 2 - boite.left;
    const cibleY = touche.top + touche.height / 2 - boite.top;
    /* La main est repoussée du côté EXTÉRIEUR et bornée par la barre d'espace
       elle-même : elle ne peut jamais la recouvrir (itération 002, point 11). */
    const espace = parent?.querySelector<HTMLElement>('[data-code="Space"]')?.getBoundingClientRect();
    const gaucheBloc = bloc.left - boite.left;
    const droiteBloc = bloc.right - boite.left;
    // On aligne le BOUT DE L'INDEX sur la colonne de la touche, pas le centre
    // de la paume : c'est l'index qui désigne.
    const souhaite = cibleX - (main === 'gauche' ? INDEX_X : 1 - INDEX_X) * LARGEUR_MAIN;
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
    /* Le clamp ci-dessus peut écarter la main de la colonne visée : on la fait
       alors PIVOTER sur son poignet pour que l'index continue de désigner la
       touche (itération 003 : « la main ne vise plus rien »). */
    const y = bloc.bottom - boite.top - 16;
    const pivot = { x: x + LARGEUR_MAIN / 2, y: y + HAUTEUR_MAIN * 0.9 };
    const repos = Math.atan2(
      (main === 'gauche' ? 1 : -1) * (INDEX_X - 0.5) * LARGEUR_MAIN,
      HAUTEUR_MAIN * 0.84,
    );
    const vise = Math.atan2(cibleX - pivot.x, pivot.y - cibleY);
    const angle = Math.max(-ANGLE_MAX, Math.min(ANGLE_MAX, ((vise - repos) * 180) / Math.PI));
    setGeo({ bulle: { x: cibleX }, main: { x, y, angle } });
  }, [lettre, main]);

  if (!geo) return <div className={v.aideOverlay} ref={refBoite} aria-hidden="true" />;
  return (
    <div className={v.aideOverlay} ref={refBoite} aria-hidden="true">
      {/* La bulle est posée AU-DESSUS du clavier entier : elle ne peut plus
          recouvrir une touche de la leçon (itération 003 : elle masquait U). */}
      <span className={v.aideNom} style={{ left: geo.bulle.x, top: -46 }}>
        {/^[a-z]$/i.test(lettre) ? lettre.toUpperCase() : lettre === ' ' ? 'espace' : lettre}
      </span>
      <div
        className={v.aideMain}
        style={{
          left: geo.main.x,
          top: geo.main.y,
          height: HAUTEUR_MAIN,
          transform: `rotate(${geo.main.angle.toFixed(1)}deg)`,
          transformOrigin: '50% 90%',
        }}
      >
        <MainSchematique cote={main} largeur={LARGEUR_MAIN} />
      </div>
    </div>
  );
}
