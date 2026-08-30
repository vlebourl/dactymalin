import { describe, expect, it } from "vitest";
import {
  creerSession,
  JOURS_AVANT_REVISION,
  revisionNecessaire,
  TAILLE_VAGUE,
} from "./session";
import { ensembleTouches, nouvellesTouches } from "./parcours";
import { DEFAUTS, valider } from "./storage";

const options = {
  id: "fr-FR" as const,
  parcours: "decouverte" as const,
  etape: 2,
  graine: 7,
};

describe("le flux d’exercices d’une leçon", () => {
  it("sert une première vague dès sa création", () => {
    const s = creerSession(options);
    expect(s.items().length).toBe(TAILLE_VAGUE);
  });

  it("ne sert jamais deux fois le même exercice", () => {
    const s = creerSession(options);
    for (let k = 0; k < 12; k++) s.recharger();
    const textes = s.items().map((i) => i.texte);
    expect(new Set(textes).size).toBe(textes.length);
  });

  it("rallonge la file sans rien retirer de ce qui a déjà été joué", () => {
    const s = creerSession(options);
    const avant = s.items().map((i) => i.texte);
    s.recharger();
    expect(
      s
        .items()
        .map((i) => i.texte)
        .slice(0, avant.length),
    ).toEqual(avant);
  });

  /* La couverture des touches NOUVELLES est l'affaire du début de séance : la
     refaire à chaque vague servirait les mêmes quelques mots en boucle. */
  it("couvre les touches nouvelles dans les premiers exercices servis", () => {
    const s = creerSession({ ...options, etape: 3 });
    const texte = s
      .items()
      .map((i) => i.texte)
      .join("")
      .toLowerCase();
    for (const c of ["l", "c", "f", "b"]) {
      expect(texte.includes(c), `« ${c} » absent de la première vague`).toBe(
        true,
      );
    }
  });

  it("à graine égale, sert exactement la même suite", () => {
    const a = creerSession(options);
    const b = creerSession(options);
    for (let k = 0; k < 5; k++) {
      a.recharger();
      b.recharger();
    }
    expect(a.items().map((i) => i.texte)).toEqual(
      b.items().map((i) => i.texte),
    );
  });

  it("à graine différente, sert autre chose", () => {
    const a = creerSession(options);
    const b = creerSession({ ...options, graine: 99 });
    expect(a.items().map((i) => i.texte)).not.toEqual(
      b.items().map((i) => i.texte),
    );
  });

  /* Le corpus d'une étape est fini. Quand il est épuisé, la séance s'arrête —
     elle ne recommence pas au début, ce qui ferait retaper les mêmes mots. */
  it("s’épuise proprement quand l’étape n’a plus rien à servir", () => {
    const s = creerSession({ ...options, etape: 1 });
    let precedent = -1;
    for (let k = 0; k < 400 && s.items().length !== precedent; k++) {
      precedent = s.items().length;
      s.recharger();
    }
    expect(s.epuisee()).toBe(true);
    const textes = s.items().map((i) => i.texte);
    expect(new Set(textes).size).toBe(textes.length);
  });
});

/*
 * LA REPRISE APRÈS UNE PAUSE (#47, cahier §7.4).
 *
 * Trois choses à ne pas confondre : une interruption de plusieurs JOURS, une
 * séance abandonnée en cours, et un rechargement de page. Seule la première
 * déclenche une révision — les deux autres se comptent en minutes.
 */
describe("la reprise après plusieurs jours sans leçon", () => {
  const JOUR = 86_400_000;
  const maintenant = Date.UTC(2026, 0, 30);

  it("ne révise pas quand la dernière leçon date d’hier", () => {
    expect(revisionNecessaire(maintenant - JOUR, maintenant)).toBe(false);
  });

  it("révise au-delà du délai", () => {
    expect(
      revisionNecessaire(
        maintenant - (JOURS_AVANT_REVISION + 1) * JOUR,
        maintenant,
      ),
    ).toBe(true);
  });

  it("ne révise pas un rechargement de page ni une séance abandonnée", () => {
    expect(revisionNecessaire(maintenant - 60_000, maintenant)).toBe(false);
    expect(revisionNecessaire(maintenant - 3 * 3_600_000, maintenant)).toBe(
      false,
    );
  });

  /* Sans date connue, l'enfant n'a pas fait de pause : il n'a encore rien
     fait du tout. Réviser des étapes qu'il n'a jamais jouées n'a aucun sens. */
  it("ne révise pas quand aucune leçon n’a jamais été jouée", () => {
    expect(revisionNecessaire(undefined, maintenant)).toBe(false);
  });

  /* Le délai est un réglage à poser sur un enfant réel, pas une valeur
     démontrée : il se change sans toucher à la logique. */
  it("accepte un délai différent sans changer la logique", () => {
    const troisJours = maintenant - 3 * JOUR;
    expect(revisionNecessaire(troisJours, maintenant, 2)).toBe(true);
    expect(revisionNecessaire(troisJours, maintenant, 30)).toBe(false);
  });

  const apresUnePause = (etape: number) =>
    creerSession({
      ...options,
      etape,
      derniereLecon: maintenant - (JOURS_AVANT_REVISION + 1) * JOUR,
      maintenant,
    });

  it("commence la leçon du retour par les touches des étapes précédentes", () => {
    const s = apresUnePause(4);
    const texte = s
      .items()
      .map((i) => i.texte)
      .join("")
      .toLowerCase();
    for (const c of nouvellesTouches("decouverte", "fr-FR", 4)) {
      expect(texte.includes(c), `« ${c} » servi avant la révision`).toBe(false);
    }
    /* Ce sont bien les étapes PRÉCÉDENTES, pas un exercice vide. */
    expect(s.items().length).toBe(TAILLE_VAGUE);
  });

  it("reprend l’étape courante juste après la révision", () => {
    const s = apresUnePause(4);
    const revision = s.items().length;
    s.recharger();
    const suite = s
      .items()
      .slice(revision)
      .map((i) => i.texte)
      .join("")
      .toLowerCase();
    const nouvelles = nouvellesTouches("decouverte", "fr-FR", 4);
    expect(nouvelles.some((c) => suite.includes(c))).toBe(true);
  });

  /* Rien n'est retiré : la session ne redescend pas d'étape, elle n'ajoute
     qu'une vague devant. */
  it("ne retire aucune étape acquise", () => {
    const s = apresUnePause(4);
    for (let k = 0; k < 6; k++) s.recharger();
    const texte = s
      .items()
      .map((i) => i.texte)
      .join("")
      .toLowerCase();
    const ensemble = ensembleTouches("decouverte", "fr-FR", 4);
    for (const c of nouvellesTouches("decouverte", "fr-FR", 4)) {
      expect(ensemble.has(c)).toBe(true);
    }
    expect(
      nouvellesTouches("decouverte", "fr-FR", 4).some((c) => texte.includes(c)),
    ).toBe(true);
  });

  /* À la première étape il n'y a rien derrière : la leçon du retour est une
     leçon ordinaire. */
  it("ne change rien à la première étape, qui n’a pas de précédente", () => {
    const attendu = creerSession({ ...options, etape: 1 }).items();
    expect(apresUnePause(1).items()).toEqual(attendu);
  });

  it("sert la leçon ordinaire quand la pause est courte", () => {
    const s = creerSession({
      ...options,
      etape: 4,
      derniereLecon: maintenant - JOUR,
      maintenant,
    });
    expect(s.items()).toEqual(creerSession({ ...options, etape: 4 }).items());
  });
});

/* La date de la dernière leçon survit à la sauvegarde : sans elle, chaque
   rechargement croirait à une reprise à froid. */
describe("la date de la dernière leçon dans la sauvegarde", () => {
  it("se relit telle quelle", () => {
    expect(
      valider({ ...DEFAUTS, derniereLecon: 1_700_000_000_000 }).derniereLecon,
    ).toBe(1_700_000_000_000);
  });

  it("reste absente quand elle n’a jamais été écrite, ou qu’elle est aberrante", () => {
    expect(valider({ ...DEFAUTS }).derniereLecon).toBeUndefined();
    expect(
      valider({ ...DEFAUTS, derniereLecon: -5 }).derniereLecon,
    ).toBeUndefined();
    expect(
      valider({ ...DEFAUTS, derniereLecon: "hier" }).derniereLecon,
    ).toBeUndefined();
  });
});
