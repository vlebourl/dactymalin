import { courrielUnique } from '../../../../tests/helpers/courriel';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { creerApp } from '../../app';
import { creerAuth } from '../../auth';
import { creerBase } from '../../db/client';
import { cleAnthropic, user } from '../../db/schema';
import { lireEnv } from '../../env';
import type { VerifierCle } from '../../lib/grammaire';

/**
 * La clé Anthropic PAR COMPTE : saisie dans l'espace parent, vérifiée, stockée
 * chiffrée, jamais renvoyée. Un VRAI PostgreSQL (la cascade et le chiffré se
 * lisent en base) ; sans `TEST_DATABASE_URL`, sautés. Aucun appel réel :
 * vérificateur et fabrique sont simulés.
 */
const URL_TEST = process.env.TEST_DATABASE_URL;
const d = URL_TEST ? describe : describe.skip;

/* Factices, au bon format : aucune vraie clé dans un dépôt public. */
const CLE = 'sk-ant-exemple-factice-0000000000ab12';
const CHEMIN = '/api/compte/cle-anthropic';

d('clé Anthropic par compte', () => {
  let app: ReturnType<typeof creerApp>;
  let base: ReturnType<typeof creerBase>;
  let verdict: Awaited<ReturnType<VerifierCle>> = 'valide';
  const verifier = vi.fn<VerifierCle>(async () => verdict);
  const fabrique = vi.fn((cle: string) => async () => ({ phrase: `Phrase de ${cle.slice(-4)}.`, categorie: 'present' as const }));

  const inscrire = async () => {
    const email = courrielUnique();
    const r = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'motdepasse-solide', name: 'Parent' }),
    });
    expect(r.status).toBe(200);
    const id = (await base.select({ id: user.id }).from(user).where(eq(user.email, email)))[0]!.id;
    return { h: { Cookie: r.headers.get('set-cookie')!.split(';')[0], 'Content-Type': 'application/json' }, id };
  };
  const poser = (h: Record<string, string>, cle: unknown) =>
    app.request(CHEMIN, { method: 'PUT', headers: h, body: JSON.stringify({ cle }) });
  const ligne = async (id: string) => (await base.select().from(cleAnthropic).where(eq(cleAnthropic.userId, id)))[0];
  const etat = async (h: Record<string, string>) => (await app.request('/api/grammaire/etat', { headers: h })).json();

  beforeAll(() => {
    const env = lireEnv({
      NODE_ENV: 'test',
      DATABASE_URL: URL_TEST,
      BETTER_AUTH_SECRET: 'x'.repeat(40),
    } as NodeJS.ProcessEnv);
    base = creerBase(URL_TEST!);
    app = creerApp({ env, base, auth: creerAuth(base, env), verifierCleAnthropic: verifier, fabriqueGrammaire: fabrique });
  });

  it('refuse tout accès sans session', async () => {
    for (const method of ['GET', 'PUT', 'DELETE']) {
      expect((await app.request(CHEMIN, { method })).status).toBe(401);
    }
  });

  it('une clé jamais posée : enregistree false, grammaire indisponible', async () => {
    const { h } = await inscrire();
    expect(await (await app.request(CHEMIN, { headers: h })).json()).toEqual({ enregistree: false });
    expect(await etat(h)).toEqual({ disponible: false });
    expect((await app.request('/api/grammaire/phrase', { headers: h })).status).toBe(503);
  });

  it('un mauvais format répond CLE_INVALIDE sans appeler le vérificateur', async () => {
    const { h } = await inscrire();
    verifier.mockClear();
    for (const cle of ['sk-ant-court', 'sk-ant-exemple factice-0000000000ab12', 'sk-ant-exemple\nfactice-0000000000ab12', 'pas-une-cle-anthropic-du-tout-xxxx', `sk-ant-${'a'.repeat(300)}`, 42, null]) {
      const r = await poser(h, cle);
      expect(r.status).toBe(400);
      expect(await r.json()).toMatchObject({ code: 'CLE_INVALIDE' });
    }
    expect(verifier).not.toHaveBeenCalled();
  });

  it('une clé refusée répond CLE_REFUSEE, injoignable 502, et rien n’est stocké', async () => {
    const { h, id } = await inscrire();
    verdict = 'refusee';
    let r = await poser(h, CLE);
    expect(r.status).toBe(400);
    expect(await r.json()).toMatchObject({ code: 'CLE_REFUSEE' });
    verdict = 'injoignable';
    r = await poser(h, CLE);
    expect(r.status).toBe(502);
    expect(await r.json()).toMatchObject({ code: 'VERIFICATION_IMPOSSIBLE' });
    expect(await ligne(id)).toBeUndefined();
    verdict = 'valide';
  });

  it('une clé valide est stockée chiffrée, jamais renvoyée, et ouvre la grammaire à CE compte', async () => {
    const { h, id } = await inscrire();
    verdict = 'valide';
    const r = await poser(h, `  ${CLE}  `);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ enregistree: true, fin: 'ab12' });
    expect(verifier).toHaveBeenLastCalledWith(CLE);

    const l = (await ligne(id))!;
    expect(l.fin).toBe('ab12');
    expect(l.chiffre).not.toContain(CLE);
    expect(l.chiffre).not.toContain('sk-ant-');

    const lu = await (await app.request(CHEMIN, { headers: h })).text();
    expect(JSON.parse(lu)).toEqual({ enregistree: true, fin: 'ab12' });
    expect(lu).not.toContain(CLE);

    expect(await etat(h)).toEqual({ disponible: true });
    fabrique.mockClear();
    const p = await app.request('/api/grammaire/phrase', { headers: h });
    expect(p.status).toBe(200);
    expect(p.headers.get('cache-control')).toBe('no-store');
    expect(fabrique).toHaveBeenCalledWith(CLE);

    /* Le voisin sans clé ne profite pas de celle-ci. */
    const autre = await inscrire();
    expect(await etat(autre.h)).toEqual({ disponible: false });
    expect((await app.request('/api/grammaire/phrase', { headers: autre.h })).status).toBe(503);
  });

  it('une seconde clé remplace la première (upsert)', async () => {
    const { h, id } = await inscrire();
    expect((await poser(h, CLE)).status).toBe(200);
    expect((await poser(h, CLE.replace('ab12', 'cd34'))).status).toBe(200);
    expect((await ligne(id))!.fin).toBe('cd34');
  });

  it('un chiffré illisible (autre secret) rend la grammaire indisponible, sans planter', async () => {
    const { h, id } = await inscrire();
    await base.insert(cleAnthropic).values({ userId: id, chiffre: 'AAAA', fin: 'ab12' });
    expect((await app.request('/api/grammaire/phrase', { headers: h })).status).toBe(503);
  });

  it('DELETE retire la clé : grammaire indisponible', async () => {
    const { h, id } = await inscrire();
    await poser(h, CLE);
    const r = await app.request(CHEMIN, { method: 'DELETE', headers: h });
    expect(await r.json()).toEqual({ enregistree: false });
    expect(await ligne(id)).toBeUndefined();
    expect(await etat(h)).toEqual({ disponible: false });
  });

  it('la suppression du compte emporte la clé (cascade)', async () => {
    const { h, id } = await inscrire();
    await poser(h, CLE);
    expect(await ligne(id)).toBeDefined();
    expect((await app.request('/api/compte', { method: 'DELETE', headers: h })).status).toBe(200);
    expect(await ligne(id)).toBeUndefined();
  });

  it('limite le débit des enregistrements : le 11e PUT en une minute reçoit 429', async () => {
    const { h } = await inscrire();
    for (let i = 0; i < 10; i++) expect((await poser(h, CLE)).status).toBe(200);
    expect((await poser(h, CLE)).status).toBe(429);
  });
});
