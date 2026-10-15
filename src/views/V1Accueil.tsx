import { useEffect, useRef, useState } from 'react';
import { disposition } from '../core/layouts';
import { estJouable, type Liste } from '../core/listes';
import { ensembleTouches, LECONS_PAR_ETAPE, parcoursFini, rangLecon } from '../core/parcours';
import { NOM_PARCOURS } from '../core/parcours';
import { Keyboard } from '../ui/Keyboard';
import { amorcerLaVoix, useVoixDictee } from '../ui/voix';
import { useApp, useEnvoi } from '../state';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

/** Engrenage DESSINÉ : un glyphe système ne rend pas comme une icône. */
function Engrenage() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="3.4" strokeWidth="2" />
      <path
        d="M12 2.6v3M12 18.4v3M2.6 12h3M18.4 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function V1Accueil() {
  const app = useApp();
  const envoi = useEnvoi();
  const d = disposition(app.disposition);
  /* Une carte qui lance un bloc vide n'est pas une carte : la liste vient du
     COMPTE, la disposition vient de CET appareil, et les deux peuvent ne pas
     s'accorder. Mieux vaut pas de carte qu'une carte sans rien à taper. */
  const jouables = app.listes.filter((liste) => estJouable(liste, app.disposition));
  const voixDictee = useVoixDictee();

  return (
    <div className={v.ecran}>
      <header className={v.entete}>
        <span />
        <span />
        <button
          className={v.engrenage}
          onClick={() => envoi({ type: 'vue', vue: 'V7' })}
          aria-label="Réglages"
        >
          <Engrenage />
        </button>
      </header>

      <div className={`${v.centre} ${jouables.length > 0 ? v.accueilAvecListes : ''}`}>
        {/* Le nom est une image : le logo porte une typographie et un jeu de
            couleurs que la police de l'app ne reproduit pas. Il reste dans un
            h1 avec son texte alternatif — la hiérarchie et les lecteurs
            d'écran ne doivent rien perdre au passage. */}
        <h1 className={`${v.titre} ${v.titreLogo}`}>
          <img src="/logo-dactymalin.png" alt="DactyMalin" className={v.logo} />
        </h1>
        <p className={v.sousTitre}>Apprends où poser tes doigts sur ton vrai clavier.</p>

        {/* Illustration à plat, sans mains ni personnage. */}
        <Keyboard
          id={app.disposition}
          ensemble={ensembleTouches(app.parcours, app.disposition, app.etape)}
          taille="clamp(13px, 2.7vw, 38px)"
          espace={{ etat: 'ouvert', pouce: 'gauche' }}
        />

        {/* Parcours fini : « On commence ! » lancerait une huitième leçon de
            l'étape 10, qui n'existe pas. On renvoie au choix, sans rien
            relancer tout seul. */}
        {parcoursFini(app.etape, app.leconsSurEtape) ? (
          <button
            className={[u.bouton, u.primaire, u.geant].join(' ')}
            onClick={() => envoi({ type: 'vue', vue: 'V6' })}
          >
            Choisir une étape
          </button>
        ) : (
          <button
            className={[u.bouton, u.primaire, u.geant].join(' ')}
            onClick={() => {
              /* La leçon dira peut-être une lettre (barreau 3), hors de tout
                 geste : iPad et Android veulent que la voix soit amorcée ici. */
              amorcerLaVoix();
              envoi({ type: 'commencer', liste: null });
            }}
          >
            On commence !
          </button>
        )}

        {/* #9 — la bibliothèque du foyer, une carte par liste. L'enfant ne
            saisit rien : il reconnaît la carte de sa dictée et appuie. */}
        {jouables.length > 0 && (
          <BibliothequeAccueil listes={jouables} voixDictee={voixDictee} />
        )}
        {/* Une dictée muette est impossible à réussir : pas de repli. */}
        {jouables.length > 0 && voixDictee === false && (
          <p className={v.ligneClavier}>
            Il manque une voix française sur cet appareil. Un parent peut en ajouter une dans les
            réglages du système.
          </p>
        )}

        {/* Le parcours en cours, DIT : le parent l'a choisi dans les réglages,
            et sans cette ligne rien à l'écran ne permet de savoir lequel des
            deux tourne. Pas de bouton ici — ce choix n'est pas celui de
            l'enfant.
            #88 — la POSITION suit, sur la même ligne : l'étape et le rang de la
            leçon étaient déjà là, ils ne servaient qu'à décider si le parcours
            était fini. On informe, on ne félicite pas : un repère, pas un
            score. */}
        <p className={v.ligneClavier}>
          Parcours : <b>{NOM_PARCOURS[app.parcours]}</b>
          {' · '}
          Étape {app.etape}, leçon {rangLecon(app.leconsSurEtape)} sur {LECONS_PAR_ETAPE}
        </p>

        <p className={v.ligneClavier}>
          Ton clavier : <b>{d.nom}</b>
          <button className={v.petitBouton} onClick={() => envoi({ type: 'vue', vue: 'V2' })}>
            Changer
          </button>
        </p>

        <div className={v.liens}>
          <button className={u.lien} onClick={() => envoi({ type: 'vue', vue: 'V6' })}>
            Ma carte du clavier
          </button>
          <button className={u.lien} onClick={() => envoi({ type: 'vue', vue: 'V3' })}>
            Revoir : où mettre mes doigts
          </button>
        </div>
      </div>
    </div>
  );
}

/** Une seule rangée : le nombre de listes ne change jamais la hauteur de l'accueil. */
function BibliothequeAccueil({ listes, voixDictee }: { listes: Liste[]; voixDictee: boolean | null }) {
  const envoi = useEnvoi();
  const bande = useRef<HTMLUListElement>(null);
  const [bords, setBords] = useState({ avant: false, apres: false });

  useEffect(() => {
    const element = bande.current;
    if (!element) return;
    const mesurer = () =>
      setBords({
        avant: element.scrollLeft > 1,
        apres: element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      });
    mesurer();
    const taille = new ResizeObserver(mesurer);
    taille.observe(element);
    element.addEventListener('scroll', mesurer, { passive: true });
    return () => {
      taille.disconnect();
      element.removeEventListener('scroll', mesurer);
    };
  }, [listes]);

  const defiler = (sens: number) => {
    // aria-disabled conserve le focus clavier à la borne ; le clic reste sans effet.
    if ((sens < 0 && !bords.avant) || (sens > 0 && !bords.apres)) return;
    const element = bande.current;
    if (!element) return;
    element.scrollBy({
      left: sens * element.clientWidth * 0.85,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };

  return (
    <div className={v.bibliothequeAccueil} data-defile={bords.avant || bords.apres ? 'oui' : 'non'}>
      <button
        type="button"
        className={v.flecheListes}
        aria-label="Listes précédentes"
        aria-controls="listes-maison"
        aria-disabled={!bords.avant}
        onClick={() => defiler(-1)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="m14 5-7 7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ul
        ref={bande}
        id="listes-maison"
        className={v.cartesListes}
        aria-label="Les listes de la maison"
        onFocus={(e) => (e.target as HTMLElement).closest('li')?.scrollIntoView({ inline: 'nearest', block: 'nearest' })}
      >
        {listes.map((liste) => (
          <li key={liste.id}>
            <button
              className={v.carteListe}
              onClick={() => {
                amorcerLaVoix();
                envoi({ type: 'commencer', liste });
              }}
            >
              <span className={v.carteNom} id={`liste-${liste.id}`}>
                {liste.nom}
              </span>
              <span className={v.carteMots}>
                {liste.mots.length} {liste.mots.length > 1 ? 'mots' : 'mot'}
              </span>
            </button>
            {/* #118 — la même liste, À L'OREILLE. Le nom de la liste décrit
                le bouton sans entrer dans son nom : la carte reste seule à
                le porter. */}
            <button
              className={v.carteDictee}
              disabled={!voixDictee}
              aria-describedby={`liste-${liste.id}`}
              onClick={() => {
                amorcerLaVoix();
                envoi({ type: 'commencer', liste: { ...liste, enDictee: true } });
              }}
            >
              En dictée
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={v.flecheListes}
        aria-label="Listes suivantes"
        aria-controls="listes-maison"
        aria-disabled={!bords.apres}
        onClick={() => defiler(1)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="m10 5 7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
