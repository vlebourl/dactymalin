import { describe, expect, it, beforeAll } from 'vitest';
import { creerApp } from '../../app';
import { creerAuth } from '../../auth';
import { creerBase } from '../../db/client';
import { lireEnv } from '../../env';
import { DEFAUTS } from '../../../../src/core/storage';
import { PRENOM_MAX } from '../../../../src/core/profils';

/**
 * Ces tests parlent à un VRAI PostgreSQL : la règle qui compte ici — un compte
 * ne voit jamais les profils d'un autre — se vérifie sur la base, pas sur un
 * bouchon. Sans `TEST_DATABASE_URL`, ils sont sautés.
 *
 *   docker run -d --name pg-test -e POSTGRES_USER=t -e POSTGRES_PASSWORD=t \
 *     -e POSTGRES_DB=t -p 55432:5432 postgres:17-alpine
 *   TEST_DATABASE_URL=postgresql://t:t@localhost:55432/t npx vitest run server
 */
const URL_TEST = process.env.TEST_DATABASE_URL;
const d = URL_TEST ? describe : describe.skip;

d('profils et progression', () => {
  let app: ReturnType<typeof creerApp>;

  const inscrire = async (email: string) => {
    const r = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'motdepasse-solide', name: 'Parent' }),
    });
    expect(r.status).toBe(200);
    const cookie = r.headers.get('set-cookie')!.split(';')[0];
    return { Cookie: cookie, 'Content-Type': 'application/json' };
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
    expect((await app.request('/api/profils')).status).toBe(401);
  });

  it('crée un profil, le relit, y pousse une progression', async () => {
    const h = await inscrire(`a${Date.now()}@exemple.fr`);
    const cree = await app.request('/api/profils', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ prenom: 'Timo' }),
    });
    expect(cree.status).toBe(201);
    const { id } = (await cree.json()) as { id: string };

    const majLe = new Date().toISOString();
    const pousse = await app.request(`/api/profils/${id}/progression`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({ etat: { ...DEFAUTS, palier: 3 }, majLe }),
    });
    expect(pousse.status).toBe(200);

    const liste = (await (await app.request('/api/profils', { headers: h })).json()) as {
      profils: { id: string; prenom: string; etat: { palier: number } | null }[];
    };
    expect(liste.profils).toHaveLength(1);
    expect(liste.profils[0].prenom).toBe('Timo');
    expect(liste.profils[0].etat?.palier).toBe(3);
  });

  /* La borne est celle de `src/core/profils.ts` : l'écran et le serveur jugent
     avec le MÊME nombre, sinon l'écran promet ce que le serveur refuse. */
  it('refuse à la création un prénom vide, blanc ou trop long', async () => {
    const h = await inscrire(`j${Date.now()}@exemple.fr`);
    const creer = (prenom: unknown) =>
      app.request('/api/profils', { method: 'POST', headers: h, body: JSON.stringify({ prenom }) });

    expect((await creer('')).status).toBe(400);
    expect((await creer('   ')).status).toBe(400);
    expect((await creer('a'.repeat(PRENOM_MAX + 1))).status).toBe(400);
    expect((await creer('a'.repeat(PRENOM_MAX))).status).toBe(201);
  });

  it('refuse un état qui ne ressemble pas à une progression', async () => {
    const h = await inscrire(`b${Date.now()}@exemple.fr`);
    const { id } = (await (
      await app.request('/api/profils', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ prenom: 'Iris' }),
      })
    ).json()) as { id: string };
    const r = await app.request(`/api/profils/${id}/progression`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({ etat: { palier: 99 }, majLe: new Date().toISOString() }),
    });
    expect(r.status).toBe(400);
  });

  it('refuse une version plus ANCIENNE que celle en base (409)', async () => {
    const h = await inscrire(`c${Date.now()}@exemple.fr`);
    const { id } = (await (
      await app.request('/api/profils', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ prenom: 'Lou' }),
      })
    ).json()) as { id: string };
    const corps = (majLe: string) =>
      JSON.stringify({ etat: { ...DEFAUTS, palier: 2 }, majLe });
    await app.request(`/api/profils/${id}/progression`, {
      method: 'PUT',
      headers: h,
      body: corps('2026-08-28T12:00:00.000Z'),
    });
    const vieux = await app.request(`/api/profils/${id}/progression`, {
      method: 'PUT',
      headers: h,
      body: corps('2026-08-28T11:00:00.000Z'),
    });
    expect(vieux.status).toBe(409);
  });

  /* La règle la plus importante du serveur : un id deviné ne donne rien. */
  it("un compte ne voit ni ne touche le profil d'un autre", async () => {
    const a = await inscrire(`d${Date.now()}@exemple.fr`);
    const b = await inscrire(`e${Date.now()}@exemple.fr`);
    const { id } = (await (
      await app.request('/api/profils', {
        method: 'POST',
        headers: a,
        body: JSON.stringify({ prenom: 'Timo' }),
      })
    ).json()) as { id: string };

    const listeB = (await (await app.request('/api/profils', { headers: b })).json()) as {
      profils: unknown[];
    };
    expect(listeB.profils).toHaveLength(0);

    const pousseB = await app.request(`/api/profils/${id}/progression`, {
      method: 'PUT',
      headers: b,
      body: JSON.stringify({ etat: DEFAUTS, majLe: new Date().toISOString() }),
    });
    expect(pousseB.status).toBe(404);

    expect(
      (await app.request(`/api/profils/${id}`, { method: 'DELETE', headers: b })).status,
    ).toBe(404);
  });
  /* #4 : l'identité d'un profil est son id, jamais son prénom. Deux enfants
     homonymes sont deux profils, et renommer n'en perd pas la progression. */
  it('deux enfants du même prénom sont deux profils distincts', async () => {
    const h = await inscrire(`f${Date.now()}@exemple.fr`);
    const creer = () =>
      app.request('/api/profils', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ prenom: 'Timo' }),
      });
    const un = (await (await creer()).json()) as { id: string };
    const deux = (await (await creer()).json()) as { id: string };
    expect(un.id).not.toBe(deux.id);

    await app.request(`/api/profils/${un.id}/progression`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({ etat: { ...DEFAUTS, palier: 6 }, majLe: new Date().toISOString() }),
    });
    const liste = (await (await app.request('/api/profils', { headers: h })).json()) as {
      profils: { id: string; etat: { palier: number } | null }[];
    };
    expect(liste.profils).toHaveLength(2);
    expect(liste.profils.find((p) => p.id === un.id)?.etat?.palier).toBe(6);
    expect(liste.profils.find((p) => p.id === deux.id)?.etat).toBeNull();
  });

  it('renommer un profil conserve sa progression', async () => {
    const h = await inscrire(`g${Date.now()}@exemple.fr`);
    const { id } = (await (
      await app.request('/api/profils', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ prenom: 'Timo' }),
      })
    ).json()) as { id: string };
    await app.request(`/api/profils/${id}/progression`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({ etat: { ...DEFAUTS, palier: 5 }, majLe: new Date().toISOString() }),
    });

    const renomme = await app.request(`/api/profils/${id}`, {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({ prenom: 'Timothée' }),
    });
    expect(renomme.status).toBe(200);

    const liste = (await (await app.request('/api/profils', { headers: h })).json()) as {
      profils: { id: string; prenom: string; etat: { palier: number } | null }[];
    };
    expect(liste.profils).toHaveLength(1);
    expect(liste.profils[0].prenom).toBe('Timothée');
    expect(liste.profils[0].etat?.palier).toBe(5);
  });

  it('refuse un prénom vide, et le renommage du profil d\'un autre compte', async () => {
    const a = await inscrire(`h${Date.now()}@exemple.fr`);
    const b = await inscrire(`i${Date.now()}@exemple.fr`);
    const { id } = (await (
      await app.request('/api/profils', {
        method: 'POST',
        headers: a,
        body: JSON.stringify({ prenom: 'Lou' }),
      })
    ).json()) as { id: string };

    expect(
      (
        await app.request(`/api/profils/${id}`, {
          method: 'PATCH',
          headers: a,
          body: JSON.stringify({ prenom: '   ' }),
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await app.request(`/api/profils/${id}`, {
          method: 'PATCH',
          headers: b,
          body: JSON.stringify({ prenom: 'Pirate' }),
        })
      ).status,
    ).toBe(404);
  });
});
