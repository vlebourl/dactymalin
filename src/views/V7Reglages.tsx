import { useEffect, useMemo, useState } from 'react';
import { TOUTES_DISPOSITIONS } from '../core/layouts';
import { NOM_PARCOURS, PARCOURS } from '../core/parcours';
import { questionAdulte, reponseJuste, type QuestionAdulte } from '../core/porte-adulte';
import { chargerIndex, CLE_CHOISIR, progressionEnCache } from '../core/profils';
import type { Reglages } from '../core/storage';
import { versionServeur } from '../core/sync';
import { useApp, useEnvoi } from '../state';
import { MiniClavier } from '../ui/MiniClavier';
import v from './vues.module.css';
import u from '../ui/ui.module.css';

/* La phrase est écrite POUR LE PARENT : c'est lui qui choisit (cahier §4.2), et
   c'est le seul endroit de l'app où le choix se fait. Elle dit la différence de
   contenu ET l'indépendance des deux progressions — sans quoi le parent croit
   qu'il va perdre ce que son enfant a fait. */
const EXPLICATION_PARCOURS =
  'Découverte apprend les deux moitiés du clavier avec les index. Dactylo apprend les dix doigts. Les deux progressent séparément.';

const INTERRUPTEURS: Array<{ cle: keyof Reglages; libelle: string; detail: string }> = [
  { cle: 'sons', libelle: 'Sons', detail: 'Un petit son quand la touche est la bonne.' },
  { cle: 'texteEspace', libelle: 'Texte plus espacé', detail: 'Plus d\'air entre les lettres.' },
  { cle: 'animationsDouces', libelle: 'Animations douces', detail: 'Les choses bougent tranquillement.' },
];

export function V7Reglages() {
  const app = useApp();
  const envoi = useEnvoi();

  /* La porte de l'espace parent. Elle garde la suppression du compte, celle
     d'un enfant, et les mesures de #63 — vitesse et précision, que §1 interdit
     de montrer à l'enfant. Cet écran-ci s'ouvre depuis l'accueil de l'enfant :
     sans elle, deux clics suffisaient. */
  const [porte, setPorte] = useState<QuestionAdulte | null>(null);
  const [saisie, setSaisie] = useState('');
  const [rate, setRate] = useState(false);

  const demanderLaPorte = () => {
    /* Même interrupteur de harnais que la durée de leçon : les parcours de
       test qui visent l'espace parent n'ont pas à refaire une multiplication à
       chaque fois. Rien en production ne pose ce drapeau. */
    if ((globalThis as { __porteAdulteOuverte?: boolean }).__porteAdulteOuverte) {
      return envoi({ type: 'vue', vue: 'V9' });
    }
    setSaisie('');
    setRate(false);
    setPorte(questionAdulte());
  };

  const repondre = () => {
    if (porte && reponseJuste(porte, saisie)) return envoi({ type: 'vue', vue: 'V9' });
    /* Une question NEUVE à chaque échec, et jamais celle qu'on vient de rater :
       la même reposée invite à réessayer au hasard sur la même cible, et donne
       l'impression que la porte bégaie. */
    setPorte(questionAdulte(Math.random, porte?.reponse));
    setSaisie('');
    setRate(true);
  };

  /* Ce qui tourne, demandé au serveur (#105). Sans réponse — hors ligne, ou
     serveur muet — la chaîne reste vide et le pied de page ne s'affiche pas :
     rien à inventer. */
  const [version, setVersion] = useState('');
  useEffect(() => {
    let vivant = true;
    versionServeur().then((v) => vivant && setVersion(v));
    return () => {
      vivant = false;
    };
  }, []);

  /* Les enfants DU COMPTE, lus dans le cache et non au réseau : les réglages
     s'ouvrent aussi dans le train. Un enfant que cet appareil n'a jamais vu
     jouer n'a pas de palier ici — l'annoncer à « leçon 1 » serait faux. */
  const enfants = useMemo(
    () =>
      chargerIndex().liste.map((p) => ({
        ...p,
        palier: progressionEnCache(p.id)?.palier ?? null,
      })),
    [],
  );

  return (
    <div className={v.ecran}>
      <header className={v.entete}>
        <button className={v.retour} onClick={() => envoi({ type: 'vue', vue: 'V1' })} aria-label="Revenir">
          ←
        </button>
        <span />
        <span />
      </header>

      <div className={`${v.centre} ${v.centreDefilant}`}>
        <h1 className={v.titre} style={{ fontSize: 'clamp(28px, 3.4vw, 42px)' }}>
          Réglages
        </h1>

        {porte && (
          <div className={v.porteAdulte} role="group" aria-label="Question réservée aux parents">
            <p>
              <b>Une question pour les grands.</b> Combien font{' '}
              <b>
                {porte.a} × {porte.b}
              </b>{' '}
              ?
            </p>
            <p className={v.ligneClavier}>
              <input
                className={v.champNom}
                value={saisie}
                autoFocus
                inputMode="numeric"
                aria-label={`Combien font ${porte.a} fois ${porte.b} ?`}
                onChange={(e) => {
                  setSaisie(e.target.value);
                  setRate(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && repondre()}
              />
              <button className={v.petitBouton} onClick={repondre}>
                Entrer
              </button>{' '}
              <button className={u.lien} onClick={() => setPorte(null)}>
                Laisser tomber
              </button>
            </p>
            {rate && (
              <p className={v.erreurCompte} role="alert" data-porte="ratee">
                Ce n'est pas ça. En voici une autre.
              </p>
            )}
          </div>
        )}

        <div className={v.reglages}>
          {/* Les enfants du compte, avec où ils en sont. En LECTURE SEULE :
              ajouter, renommer et supprimer sont des gestes de parent, et cet
              écran-ci s'ouvre depuis l'accueil de l'enfant. */}
          <div className={v.ligneReglage}>
            {/* Un `div`, pas un `span` : une liste n'est pas du contenu de
                phrase, et le navigateur la sortait du `span` en la reparentant. */}
            <div>
              <h2 className={v.titrePetit}>Nos enfants</h2>
              <ul className={v.listeEnfants}>
                {enfants.map((e) => (
                  <li key={e.id} className={v.promessePalier}>
                    {e.nom} —{' '}
                    {e.palier === null ? "pas encore joué sur cet appareil" : `leçon ${e.palier}`}
                  </li>
                ))}
                {enfants.length === 0 && (
                  <li className={v.promessePalier}>Aucun enfant sur le compte.</li>
                )}
              </ul>
            </div>
            <button className={v.petitBouton} onClick={demanderLaPorte}>
              Gérer les enfants
            </button>
          </div>

          {/* Réservé aux parents : c'est le seul chemin vers l'écran de compte. */}
          <div className={v.ligneReglage}>
            <span>
              <b>Notre compte</b>
              <br />
              <span className={v.promessePalier}>
                Pour retrouver la progression des enfants sur un autre ordinateur. Facultatif.
              </span>
            </span>
            <button className={v.petitBouton} onClick={demanderLaPorte}>
              Ouvrir
            </button>
          </div>

          {/* Le choix du PARENT (#42). Les deux parcours sont parallèles :
              basculer ne perd aucune progression, et rien ne se débloque. */}
          <div className={[v.ligneReglage, v.ligneClaviers].join(' ')}>
            <span>
              <b>Parcours</b>
              <br />
              <span className={v.promessePalier}>{EXPLICATION_PARCOURS}</span>
            </span>
            <div className={v.choixClaviers} role="radiogroup" aria-label="Parcours">
              {PARCOURS.map((p) => (
                <button
                  key={p}
                  role="radio"
                  aria-checked={app.parcours === p}
                  className={[v.carteClavier, app.parcours === p ? v.carteClavierChoisie : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => envoi({ type: 'parcours', parcours: p })}
                >
                  <span>{NOM_PARCOURS[p]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Radios ILLUSTRÉS : on choisit un clavier en le reconnaissant. */}
          <div className={[v.ligneReglage, v.ligneClaviers].join(' ')}>
            <span>
              <b>Clavier</b>
              <br />
              <span className={v.promessePalier}>Celui que tu as sous les doigts.</span>
            </span>
            <div className={v.choixClaviers} role="radiogroup" aria-label="Clavier">
              {TOUTES_DISPOSITIONS.map((d) => (
                <button
                  key={d.id}
                  role="radio"
                  aria-checked={app.disposition === d.id}
                  className={[v.carteClavier, app.disposition === d.id ? v.carteClavierChoisie : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => envoi({ type: 'disposition', id: d.id, manuel: true })}
                >
                  <MiniClavier id={d.id} echelle={0.72} />
                  <span>{d.nom}</span>
                </button>
              ))}
            </div>
          </div>

          {INTERRUPTEURS.map((r) => (
            <div key={r.cle} className={v.ligneReglage}>
              <span>
                <b>{r.libelle}</b>
                <br />
                <span className={v.promessePalier}>{r.detail}</span>
              </span>
              <button
                role="switch"
                aria-checked={app.reglages[r.cle]}
                aria-label={r.libelle}
                className={[v.interrupteur, app.reglages[r.cle] ? v.interrupteurActif : ''].join(' ')}
                onClick={() => envoi({ type: 'reglage', cle: r.cle, valeur: !app.reglages[r.cle] })}
              />
            </div>
          ))}
        </div>

        {/* Seul endroit hors onboarding où la légende des couleurs apparaît. */}
        <p className={v.legendeCouleurs} data-testid="legende-couleurs">
          <span>
            <i
              className={v.puce}
              style={{ background: 'var(--teal-pale)', borderColor: 'var(--teal-moyen)' }}
            />
            main gauche
          </span>
          <span>
            <i
              className={v.puce}
              style={{ background: 'var(--orange-pale)', borderColor: 'var(--orange-moyen)' }}
            />
            main droite
          </span>
          {/* Les pouces n'ont pas de couleur à eux : la barre d'espace est
              CRÈME dans le jeu, et le teal comme l'orange y diraient « une
              main ». La puce reprend donc la teinte neutre de la touche, en
              plus large — c'est sa forme, pas sa couleur, qui la fait lire. */}
          <span>
            <i
              className={[v.puce, v.puceEspace].join(' ')}
              style={{ background: 'var(--fond-carte)', borderColor: 'var(--liseré-fort)' }}
            />
            espace : tes pouces
          </span>
        </p>

        <div className={v.liens}>
          <button className={u.lien} onClick={() => envoi({ type: 'vue', vue: 'V3' })}>
            Revoir : où mettre mes doigts
          </button>
          <button
            className={u.lien}
            onClick={() => {
              try {
                sessionStorage.setItem(CLE_CHOISIR, '1');
              } catch {
                /* sans sessionStorage, le rechargement montrera le choix s'il y a plusieurs joueurs */
              }
              location.reload();
            }}
          >
            Changer de joueur
          </button>
        </div>

        {/* Pour l'adulte seulement, et seulement ici : discret, gris, en pied
            de page. L'enfant en train de jouer ne voit jamais cette ligne, et
            elle ne s'adresse pas à lui. */}
        {version && (
          <p className={v.piedVersion} data-testid="version-app">
            {version}
          </p>
        )}
      </div>
    </div>
  );
}
