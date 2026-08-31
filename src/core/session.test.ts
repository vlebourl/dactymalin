import { describe, expect, it } from "vitest";
import {
  creerSession,
  JOURS_AVANT_REVISION,
  ecartSoutenable,
  optionsDeSession,
  revisionNecessaire,
  TAILLE_VAGUE,
  type EtatPourSession,
} from "./session";
import { TAILLE_BLOC_MIN } from "./generator";
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

describe("un exercice ne revient pas d’une leçon à l’autre (#72)", () => {
  /* Garde-fou §7.2 : « pas deux fois le même exercice dans une leçon, au moins
     trois leçons d'écart entre deux occurrences ». La dé-duplication DANS une
     leçon existait ; celle ENTRE leçons non — le générateur l'acceptait en
     argument, personne ne le lui passait, et rien ne gardait la trace de ce
     qui avait été servi la fois d'avant. */

  it("transmet au compositeur les exercices des leçons précédentes", () => {
    const o = optionsDeSession(
      {
        parcours: "decouverte",
        etape: 2,
        etapeRejouee: null,
        maitrise: {},
        exercicesRecents: [["chat", "rat"], ["pie"]],
      },
      "fr-FR",
      0,
    );
    expect(o.recemmentVus).toEqual(["chat", "rat", "pie"]);
  });

  it("un enfant qui n’a encore rien joué n’interdit rien", () => {
    const o = optionsDeSession(
      { parcours: "decouverte", etape: 1, etapeRejouee: null, maitrise: {} },
      "fr-FR",
      0,
    );
    expect(o.recemmentVus).toBeUndefined();
  });

  it("les exercices de la leçon d’avant ne ressortent pas", () => {
    const o = { id: "fr-FR" as const, parcours: "decouverte" as const, etape: 3, graine: 7 };
    const premiere = creerSession(o).items().map((i) => i.texte);
    const seconde = creerSession({ ...o, graine: 8, recemmentVus: premiere }).items();
    for (const item of seconde) expect(premiere).not.toContain(item.texte);
  });

  it("une étape au corpus trop maigre sert quand même une leçon entière", () => {
    /* C'est l'étape qu'on refait, pas la leçon qu'on ampute : à corpus épuisé
       la règle d'écart cède, sinon l'enfant se retrouverait devant du vide. */
    const o = { id: "fr-FR" as const, parcours: "decouverte" as const, etape: 1, graine: 7 };
    const tout = creerSession(o).items().map((i) => i.texte);
    const items = creerSession({ ...o, graine: 9, recemmentVus: tout }).items();
    // `> 0` passerait sur une leçon d'un seul mot, qui EST l'amputation qu'on
    // dit vouloir éviter. C'est une vague entière qu'il faut servir.
    expect(items.length).toBeGreaterThanOrEqual(TAILLE_BLOC_MIN);
  });
});

describe("l’état retient ce que la leçon vient de servir (#72)", () => {
  const bilan = (items: string[]) => ({
    etoiles: 1,
    propres: [],
    aRevoir: [],
    items,
    fin: 1_700_000_000_000,
  });

  const finir = (etat: ReturnType<typeof etatDeDepart>, items: string[]) =>
    reducer(etat, { type: "leconTerminee", bilan: bilan(items) });

  it("garde les exercices de la leçon qui vient de finir", () => {
    const apres = finir(etatDeDepart(), ["chat", "un rat"]);
    expect(apres.exercicesRecents).toEqual([["chat", "un rat"]]);
  });

  it("n’en garde que les plus récentes, jamais un historique sans fin", () => {
    let etat = etatDeDepart();
    for (const lot of [["a"], ["b"], ["c"], ["d"]]) etat = finir(etat, lot);
    expect(etat.exercicesRecents).toEqual([["c"], ["d"]]);
  });

  it("une liste de la maison ne compte pas : elle est hors parcours", () => {
    /* Elle ne fait avancer aucune étape, et ses mots ne sortent d'aucun corpus
       de parcours : les interdire dans la leçon suivante n'aurait pas de sens. */
    const avec = finir(etatDeDepart(), ["chat"]);
    const liste = reducer(
      { ...avec, listeJouee: { id: "x", nom: "Nos mots", mots: ["papillon"], creeLe: '2026-08-31T00:00:00.000Z' } },
      { type: "leconTerminee", bilan: bilan(["papillon"]) },
    );
    expect(liste.exercicesRecents).toEqual([["chat"]]);
  });

  it("ce qui est retenu arrive jusqu’à la sauvegarde", () => {
    const apres = finir(etatDeDepart(), ["chat", "un rat"]);
    expect(aSauvegarder(apres).exercicesRecents).toEqual([["chat", "un rat"]]);
  });
});

describe("ce que la règle d’écart fait à la réinjection", () => {
  /* §7.2 ne prévoit aucune exception : « au moins trois leçons d'écart entre
     deux occurrences ». Un item aidé au barreau 2 ou 3 vient forcément de la
     leçon qui s'achève — il est donc RETARDÉ, pas supprimé, et ce qui revient
     entre-temps c'est la TOUCHE ratée (#71), jamais le même exercice.

     Conséquence à assumer : `aReinjecter` ne peut plus jamais se déclencher à
     la leçon suivante, puisque tout item aidé est aussi un item servi. Le
     mécanisme est intégralement couvert par la règle d'écart et la pondération.
     Ce test le fixe pour qu'on ne le redécouvre pas par surprise. */
  it("un item aidé ne revient pas à la leçon suivante, il attend son tour", () => {
    const o = { id: "fr-FR" as const, parcours: "decouverte" as const, etape: 4, graine: 7 };
    const servis = creerSession(o).items().map((i) => i.texte);
    const aide = servis[0];
    const suivante = creerSession({
      ...o,
      graine: 8,
      aReinjecter: [aide],
      recemmentVus: servis,
    }).items();
    expect(suivante.map((i) => i.texte)).not.toContain(aide);
  });

  it("mais il redevient tirable dès qu’il sort du souvenir", () => {
    const o = { id: "fr-FR" as const, parcours: "decouverte" as const, etape: 4, graine: 7 };
    const aide = creerSession(o).items()[0].texte;
    const plusTard = creerSession({ ...o, graine: 8, aReinjecter: [aide] }).items();
    expect(plusTard.map((i) => i.texte)).toContain(aide);
  });
});

describe("le souvenir des exercices ne se laisse pas effacer", () => {
  const bilan = (items: string[]) => ({
    etoiles: 1,
    propres: [],
    aRevoir: [],
    items,
    fin: 1_700_000_000_000,
  });
  const finir = (etat: ReturnType<typeof etatDeDepart>, items: string[]) =>
    reducer(etat, { type: "leconTerminee", bilan: bilan(items) });

  it("une leçon où l’enfant n’a rien validé ne chasse pas une vraie leçon", () => {
    /* Il est parti, le chrono a fini seul. Pousser un lot VIDE occuperait une
       des deux places du souvenir : deux départs d'affilée effaçaient la règle
       d'écart sans que rien ne le dise. */
    let etat = finir(etatDeDepart(), ["chat"]);
    etat = finir(etat, []);
    etat = finir(etat, []);
    expect(etat.exercicesRecents).toEqual([["chat"]]);
  });

  it("changer de parcours oublie ce qui a été servi dans l’autre", () => {
    /* Les deux parcours puisent dans le même lexique : garder le souvenir d'à
       côté interdirait ici des mots que l'enfant n'a jamais vus dans ce
       parcours-là. Même raison que pour les items à revoir. */
    const joue = finir(etatDeDepart(), ["chat", "un rat"]);
    const bascule = reducer(joue, { type: "parcours", parcours: "dactylo" });
    expect(bascule.exercicesRecents).toBeUndefined();
    expect(optionsDeSession(bascule, "fr-FR", 0).recemmentVus).toBeUndefined();
  });
});

describe("la règle d’écart ne raccourcit pas la leçon (#72)", () => {
  /* Mesuré, et c'est ce qui a rendu le plafond nécessaire : à l'étape 1 de
     Découverte le vivier fait 254 items et une leçon de douze minutes en
     consomme presque autant. Interdire les deux leçons précédentes en entier
     faisait tomber la séance de 252 exercices servis à 54 — deux ou trois
     minutes au lieu de douze, à l'étape la plus fragile de tout le parcours. */
  const toutServir = (etape: number, recemmentVus?: string[]) => {
    const s = creerSession({
      id: "fr-FR",
      parcours: "decouverte",
      etape,
      graine: 3,
      recemmentVus,
    });
    for (let i = 0; i < 400 && !s.epuisee(); i++) s.recharger();
    return s.items().map((x) => x.texte);
  };

  it("l’étape la plus maigre sert encore de quoi tenir une séance entière", () => {
    const sans = toutServir(1);
    const avec = toutServir(1, sans.slice(0, 200));
    /* Une leçon consomme 50 à 150 exercices (§7.2). En dessous de cent, la
       séance s'arrête avant le chrono, et c'est ce qu'il fallait empêcher. */
    expect(avec.length).toBeGreaterThan(100);
  });

  it("le plafond ne mord pas là où le vivier est large", () => {
    // Aux étapes suivantes le vivier se compte en milliers : rien n'est raboté.
    const sans = toutServir(4);
    const recents = sans.slice(0, 200);
    expect(ecartSoutenable(recents, "decouverte", "fr-FR", 4)).toEqual(recents);
  });

  it("quand il faut raboter, ce sont les plus RÉCENTS qu’on garde", () => {
    const beaucoup = Array.from({ length: 1000 }, (_, i) => `mot${i}`);
    const garde = ecartSoutenable(beaucoup, "decouverte", "fr-FR", 1) ?? [];
    expect(garde.length).toBeLessThan(beaucoup.length);
    expect(garde[garde.length - 1]).toBe("mot999");
  });

  it("sans historique, rien n’est interdit", () => {
    expect(ecartSoutenable(undefined, "decouverte", "fr-FR", 1)).toBeUndefined();
    expect(ecartSoutenable([], "decouverte", "fr-FR", 1)).toBeUndefined();
  });
});
