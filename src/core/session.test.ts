import { describe, expect, it } from "vitest";
import {
  creerSession,
  JOURS_AVANT_REVISION,
  optionsDeSession,
  revisionNecessaire,
  TAILLE_VAGUE,
  type EtatPourSession,
} from "./session";
import { ensembleTouches, nouvellesTouches } from "./parcours";
import { DEFAUTS, valider } from "./storage";
import { aSauvegarder, etatDeDepart, reducer } from "../state";

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
  const JOUR = 86_400_000;
  const maintenant = Date.UTC(2026, 0, 30);

  /* #60 : ce test injectait lui-même `derniereLecon` dans `valider`. Il ne
     prouvait que la relecture d'une valeur que PERSONNE n'écrivait — vert
     pendant que la révision du retour était morte en production. Il part
     maintenant d'une leçon réellement terminée. */
  it("est écrite par la leçon qu’on vient de finir", () => {
    const fin = maintenant;
    const apres = reducer(etatDeDepart(), {
      type: "leconTerminee",
      bilan: { etoiles: 3, propres: ["e"], aRevoir: [], items: ["et"], fin },
    });
    expect(valider(aSauvegarder(apres)).derniereLecon).toBe(fin);
  });

  /* Le bout en bout de §7.4, sans DOM : la leçon d'aujourd'hui date la
     sauvegarde, et c'est cette date-là qui, quinze jours plus tard, fait
     commencer la leçon du retour par une révision. */
  it("fait réviser la leçon du retour quinze jours plus tard", () => {
    const finie = reducer(etatDeDepart(), {
      type: "leconTerminee",
      bilan: { etoiles: 3, propres: [], aRevoir: [], items: [], fin: maintenant },
    });
    const { derniereLecon } = valider(aSauvegarder(finie));
    const retour = creerSession({
      ...options,
      etape: 4,
      derniereLecon,
      maintenant: maintenant + (JOURS_AVANT_REVISION + 1) * JOUR,
    });
    const texte = retour
      .items()
      .map((i) => i.texte)
      .join("")
      .toLowerCase();
    for (const c of nouvellesTouches("decouverte", "fr-FR", 4)) {
      expect(texte.includes(c), `« ${c} » servi avant la révision`).toBe(false);
    }
  });

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

describe("la maîtrise compose le contenu (#71)", () => {
  /* Décision 8 : la maîtrise ne commande plus le passage, elle PONDÈRE le
     tirage. Le générateur savait le faire depuis #39 ; le compositeur de
     séance ne lui passait rien, et le tirage restait uniforme en production —
     rater une touche n'avait aucune conséquence sur ce qu'on redonnait à
     taper. */

  /** Une maîtrise où tout est acquis SAUF la touche donnée. */
  const toutAcquisSauf = (faible: string, touches: string[]) => {
    const m: Record<string, number[]> = {};
    for (const t of touches) if (t !== faible) m[t] = [1, 2, 3];
    return m;
  };

  const occurrences = (items: { texte: string }[], lettre: string) =>
    items.reduce((n, i) => n + [...i.texte].filter((c) => c === lettre).length, 0);

  it("fait sortir davantage une touche mal acquise", () => {
    const touches = [...ensembleTouches("decouverte", "fr-FR", 3)];
    const faible = "m";
    /* Plusieurs graines : une seule pourrait pencher par hasard, et on
       mesurerait alors le tirage, pas la pondération. */
    let avec = 0;
    let sans = 0;
    for (let graine = 1; graine <= 40; graine++) {
      const o = { id: "fr-FR" as const, parcours: "decouverte" as const, etape: 3, graine };
      avec += occurrences(creerSession({ ...o, maitrise: toutAcquisSauf(faible, touches) }).items(), faible);
      sans += occurrences(creerSession(o).items(), faible);
    }
    expect(avec).toBeGreaterThan(sans);
  });

  it("sans aucune maîtrise enregistrée, la leçon est celle d’avant", () => {
    // Un enfant qui commence ne doit pas jouer autre chose qu'hier.
    const o = { id: "fr-FR" as const, parcours: "decouverte" as const, etape: 2, graine: 7 };
    expect(creerSession({ ...o, maitrise: {} }).items()).toEqual(creerSession(o).items());
  });

  it("ne touche pas à la vague de révision du retour", () => {
    /* La révision compose sur l'étape PRÉCÉDENTE : la pondération s'y applique
       comme ailleurs, mais elle ne doit pas faire entrer de touche que cette
       vague-là écarte exprès. */
    const o = {
      id: "fr-FR" as const,
      parcours: "decouverte" as const,
      etape: 3,
      graine: 7,
      derniereLecon: 0,
      maintenant: JOURS_AVANT_REVISION * 86_400_000 * 2,
    };
    const touchesPrecedentes = ensembleTouches("decouverte", "fr-FR", 2);
    const premiere = creerSession({
      ...o,
      maitrise: toutAcquisSauf("m", [...ensembleTouches("decouverte", "fr-FR", 3)]),
    })
      .items()
      .slice(0, TAILLE_VAGUE);
    for (const item of premiere) {
      for (const c of item.texte) expect(touchesPrecedentes.has(c), `${item.texte} : ${c}`).toBe(true);
    }
  });
});

describe("ce que l’état donne au compositeur de séance", () => {
  /* Ce passage de témoin a déjà perdu deux champs en silence : `derniereLecon`
     (#47), sans quoi la révision du retour ne se déclenchait jamais en vrai,
     puis `maitrise` (#71), sans quoi le tirage restait uniforme et rater une
     touche n'avait aucune conséquence. Les deux fois la logique était écrite
     ET testée : c'est la transmission qui manquait, et elle vivait dans une
     vue, donc sous le radar de toute la suite. Ce test-ci la tient. */
  const etat: EtatPourSession = {
    parcours: "dactylo",
    etape: 4,
    etapeRejouee: null,
    aReinjecter: ["chat"],
    maitrise: { e: [1, 2, 3] },
    derniereLecon: 1_700_000_000_000,
  };

  it("transmet tout ce dont la composition a besoin, sans en perdre en route", () => {
    expect(optionsDeSession(etat, "fr-CH", 42)).toEqual({
      id: "fr-CH",
      parcours: "dactylo",
      etape: 4,
      aReinjecter: ["chat"],
      maitrise: { e: [1, 2, 3] },
      derniereLecon: 1_700_000_000_000,
      maintenant: 42,
    });
  });

  it("la maîtrise arrive, sinon les touches ratées ne reviennent jamais (#71)", () => {
    expect(optionsDeSession(etat, "fr-FR", 0).maitrise).toBe(etat.maitrise);
  });

  it("la date de la dernière leçon arrive, sinon la révision du retour est morte (#47)", () => {
    expect(optionsDeSession(etat, "fr-FR", 0).derniereLecon).toBe(etat.derniereLecon);
  });

  it("l’étape rejouée l’emporte sur celle de la progression", () => {
    // Rejouer ne fait pas avancer, mais c'est bien l'étape rejouée qu'on compose.
    expect(optionsDeSession({ ...etat, etapeRejouee: 2 }, "fr-FR", 0).etape).toBe(2);
  });

  it("un enfant qui n’a encore rien joué ne fabrique ni date ni maîtrise", () => {
    const neuf = optionsDeSession(
      { parcours: "decouverte", etape: 1, etapeRejouee: null, maitrise: {} },
      "fr-FR",
      0,
    );
    expect(neuf.derniereLecon).toBeUndefined();
    expect(neuf.aReinjecter).toBeUndefined();
    expect(neuf.maitrise).toEqual({});
  });
});
