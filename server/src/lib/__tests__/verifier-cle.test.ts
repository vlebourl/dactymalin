import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifierAvecAnthropic } from '../grammaire';

/* Aucun appel réel : `fetch` est simulé, le SDK le lit à la construction du client. */
const CLE = 'sk-ant-exemple-factice-0000000000ab12';
const reponse = (status: number, corps: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(corps), { status, headers: { 'content-type': 'application/json' } }));
const MESSAGE = {
  id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-haiku-5-5',
  content: [{ type: 'text', text: 'OK' }], stop_reason: 'end_turn', stop_sequence: null,
  usage: { input_tokens: 5, output_tokens: 1 },
};
const ERREUR = (type: string) => ({ type: 'error', error: { type, message: 'non' } });

describe('verifierAvecAnthropic', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    [200, MESSAGE, 'valide'],
    [401, ERREUR('authentication_error'), 'refusee'],
    [403, ERREUR('permission_error'), 'refusee'],
    [500, ERREUR('api_error'), 'injoignable'],
  ] as const)('HTTP %i donne %s', async (status, corps, attendu) => {
    vi.stubGlobal('fetch', reponse(status, corps));
    const journal = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await verifierAvecAnthropic(CLE)).toBe(attendu);
    expect(JSON.stringify(journal.mock.calls)).not.toContain(CLE);
    journal.mockRestore();
  });

  it('une coupure réseau donne injoignable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed'); }));
    const journal = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await verifierAvecAnthropic(CLE)).toBe('injoignable');
    journal.mockRestore();
  });
});
