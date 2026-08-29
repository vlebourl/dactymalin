import { describe, expect, it, beforeAll } from 'vitest';
import { creerApp } from '../../app';
import { creerAuth } from '../../auth';
import { creerBase } from '../../db/client';
import { lireEnv } from '../../env';
import { LISTES_MAX, NOM_LISTE_MAX } from '../../../../src/core/listes';

/**
 * Comme pour les profils : un VRAI PostgreSQL, parce que la règle qui compte
 * ici — un foyer ne lit jamais la bibliothèque d'un autre — se vérifie sur la
 * base et pas sur un bouchon. Sans `TEST_DATABASE_URL`, ils sont sautés.
 */
const URL_TEST = process.env.TEST_DATABASE_URL;
const d = URL_TEST ? describe : describe.skip;

d('bibliothèque de listes', () => {
  let app: ReturnType<typeof creerApp>;

  const inscrire = async (email: string) => {
    const r = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'motdepasse-solide', name: 'Parent' }),
    });
    expect(r.status).toBe(200);
    return { Cookie: r.headers.get('set-cookie')!.split(';')[0], 'Content-Type': 'application/json' };
  };

  const creer = (h: HeadersInit, nom: unknown, mots: unknown) =>
    app.request('/api/listes', { method: 'POST', headers: h, body: JSON.stringify({ nom, mots }) });

  const modifier = (h: HeadersInit, id: string, nom: unknown, mots: unknown) =>
    app.request(`/api/listes/${id}`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({ nom, mots }),
    });

  const supprimer = (h: HeadersInit, id: string) =>
    app.request(`/api/listes/${id}`, { method: 'DELETE', headers: h });

  const lire = async (h: HeadersInit) =>
    (await (await app.request('/api/listes', { headers: h })).json()) as {
      listes: { id: string; nom: string; mots: string[]; creeLe: string }[];
    };

  beforeAll(() => {
    const env = lireEnv({
      NODE_ENV: 'test',
      DATABASE_URL: URL_TEST,
      BETTER_AUTH_SECRET: 'x'.repeat(40),
    } as NodeJS.ProcessEnv);
    const base = creerBase(URL_TEST!);
    app = creerApp({ env, base, auth: creerAuth(base, env) });
  });

  it('refuse tout accès sans session', async () => {
    expect((await app.request('/api/listes')).status).toBe(401);
    expect(
      (
        await app.request('/api/listes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom: 'Dictée', mots: ['chat'] }),
        })
      ).status,
    ).toBe(401);
  });

  it('crée une liste nommée et la relit', async () => {
    const h = await inscrire(`l${Date.now()}@exemple.fr`);
    const reponse = await creer(h, '  Dictée de la semaine ', ['chat', ' chien ', 'chat']);
    expect(reponse.status).toBe(201);
    const creee = (await reponse.json()) as { id: string; nom: string; mots: string[] };
    expect(creee.nom).toBe('Dictée de la semaine');
    expect(creee.mots).toEqual(['chat', 'chien']);

    const { listes } = await lire(h);
    expect(listes).toHaveLength(1);
    expect(listes[0]).toMatchObject({ id: creee.id, nom: 'Dictée de la semaine', mots: ['chat', 'chien'] });
    expect(new Date(listes[0].creeLe).getTime()).toBeGreaterThan(0);
  });

  it('refuse un nom vide, blanc ou trop long, et une liste sans mot', async () => {
    const h = await inscrire(`m${Date.now()}@exemple.fr`);
    expect((await creer(h, '', ['chat'])).status).toBe(400);
    expect((await creer(h, '   ', ['chat'])).status).toBe(400);
    expect((await creer(h, 'n'.repeat(NOM_LISTE_MAX + 1), ['chat'])).status).toBe(400);
    expect((await creer(h, 'Vide', [])).status).toBe(400);
    expect((await creer(h, 'Vide', 'pas un tableau')).status).toBe(400);
    const refus = await creer(h, 'Vide', []);
    expect(((await refus.json()) as { code: string }).code).toBe('LISTE_INVALIDE');
  });

  /* La règle qui protège une famille de l'autre : un id deviné ne donne rien,
     et la bibliothèque du voisin n'apparaît jamais dans la sienne. */
  it("un compte ne voit pas la bibliothèque d'un autre", async () => {
    const a = await inscrire(`n${Date.now()}@exemple.fr`);
    const b = await inscrire(`o${Date.now()}@exemple.fr`);
    expect((await creer(a, 'Chez A', ['chat'])).status).toBe(201);

    expect((await lire(b)).listes).toHaveLength(0);
    expect((await lire(a)).listes).toHaveLength(1);
  });

  it('refuse la trente-et-unième liste, et le dit', async () => {
    const h = await inscrire(`p${Date.now()}@exemple.fr`);
    for (let i = 0; i < LISTES_MAX; i++) {
      expect((await creer(h, `Liste ${i}`, ['chat'])).status).toBe(201);
    }
    const uneDeTrop = await creer(h, 'Une de trop', ['chat']);
    expect(uneDeTrop.status).toBe(409);
    expect(((await uneDeTrop.json()) as { code: string }).code).toBe('TROP_DE_LISTES');
    expect((await lire(h)).listes).toHaveLength(LISTES_MAX);
  });

  /* #10 — la dictée change chaque semaine : on modifie la liste, on ne la
     recrée pas. */
  it('modifie les mots et le nom d’une liste, et les relit', async () => {
    const h = await inscrire(`r${Date.now()}@exemple.fr`);
    const { id } = (await (await creer(h, 'Dictée', ['chat'])).json()) as { id: string };

    const modifiee = await modifier(h, id, 'Dictée du 2 septembre', ['chien', 'cheval']);
    expect(modifiee.status).toBe(200);
    expect(await modifiee.json()).toMatchObject({
      id,
      nom: 'Dictée du 2 septembre',
      mots: ['chien', 'cheval'],
    });

    const { listes } = await lire(h);
    expect(listes).toHaveLength(1);
    expect(listes[0]).toMatchObject({ id, nom: 'Dictée du 2 septembre', mots: ['chien', 'cheval'] });
  });

  it('refuse une modification invalide, et laisse la liste intacte', async () => {
    const h = await inscrire(`s${Date.now()}@exemple.fr`);
    const { id } = (await (await creer(h, 'Dictée', ['chat'])).json()) as { id: string };

    expect((await modifier(h, id, '', ['chien'])).status).toBe(400);
    expect((await modifier(h, id, 'Dictée', [])).status).toBe(400);
    expect((await modifier(h, id, 'n'.repeat(NOM_LISTE_MAX + 1), ['chien'])).status).toBe(400);

    expect((await lire(h)).listes[0]).toMatchObject({ nom: 'Dictée', mots: ['chat'] });
  });

  it('supprime une liste, et elle ne revient pas', async () => {
    const h = await inscrire(`t${Date.now()}@exemple.fr`);
    const { id } = (await (await creer(h, 'Morte', ['chat'])).json()) as { id: string };

    const suppression = await supprimer(h, id);
    expect(suppression.status).toBe(200);
    expect((await lire(h)).listes).toHaveLength(0);

    // deux fois de suite : la seconde ne trouve plus rien
    expect((await supprimer(h, id)).status).toBe(404);
  });

  /* Supprimer libère une place sous le plafond : sinon le compte resterait
     bloqué à 30 pour toujours. */
  it('supprimer rend une place sous le plafond', async () => {
    const h = await inscrire(`u${Date.now()}@exemple.fr`);
    const ids: string[] = [];
    for (let i = 0; i < LISTES_MAX; i++) {
      ids.push(((await (await creer(h, `Liste ${i}`, ['chat'])).json()) as { id: string }).id);
    }
    expect((await creer(h, 'Une de trop', ['chat'])).status).toBe(409);
    expect((await supprimer(h, ids[0])).status).toBe(200);
    expect((await creer(h, 'La remplaçante', ['chat'])).status).toBe(201);
  });

  /* La règle non négociable, sur les QUATRE routes : lire, créer, modifier,
     supprimer. C'est ici que fuiraient les données d'une famille vers une
     autre. Un identifiant deviné ne donne rien — et le 404 ne dit même pas
     que la liste existe. */
  it("un compte ne modifie ni ne supprime la liste d'un autre", async () => {
    const a = await inscrire(`v${Date.now()}@exemple.fr`);
    const b = await inscrire(`w${Date.now()}@exemple.fr`);
    const { id } = (await (await creer(a, 'Chez A', ['chat'])).json()) as { id: string };

    expect((await modifier(b, id, 'Volée', ['pirate'])).status).toBe(404);
    expect((await supprimer(b, id)).status).toBe(404);

    // rien n'a bougé chez A
    expect((await lire(a)).listes[0]).toMatchObject({ nom: 'Chez A', mots: ['chat'] });
  });

  it('refuse de modifier ou supprimer sans session', async () => {
    const h = await inscrire(`x${Date.now()}@exemple.fr`);
    const { id } = (await (await creer(h, 'Dictée', ['chat'])).json()) as { id: string };
    const sansCookie = { 'Content-Type': 'application/json' };

    expect(
      (
        await app.request(`/api/listes/${id}`, {
          method: 'PUT',
          headers: sansCookie,
          body: JSON.stringify({ nom: 'Volée', mots: ['pirate'] }),
        })
      ).status,
    ).toBe(401);
    expect(
      (await app.request(`/api/listes/${id}`, { method: 'DELETE', headers: sansCookie })).status,
    ).toBe(401);
  });

  /* Le plafond se compte par compte, pas globalement : le voisin garde ses 30. */
  it('le plafond du voisin est intact', async () => {
    const h = await inscrire(`q${Date.now()}@exemple.fr`);
    expect((await creer(h, 'Sa première', ['chat'])).status).toBe(201);
  });
});
