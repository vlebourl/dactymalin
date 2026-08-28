/**
 * Sauvegarde OBLIGATOIRE avant migration.
 *
 * Une migration qui tourne sans filet sur la progression d'un enfant est un
 * risque qu'on refuse : si la sauvegarde n'existe pas, ne part pas, ou échoue,
 * la migration n'a pas lieu — et la nouvelle révision ne démarre pas. Mieux
 * vaut une version figée qu'une base abîmée.
 */

export type OptionsSauvegarde = {
  databaseUrl?: string;
  webhookUrl?: string;
  apiToken?: string;
  /** injecté dans les tests */
  fetchImpl?: typeof fetch;
  /** injecté dans les tests : attente entre deux sondages */
  attendre?: (ms: number) => Promise<void>;
  /** budget total d'attente, en millisecondes */
  budgetMs?: number;
};

export type Verdict = { fait: boolean; raison: string };

type Execution = { status: string; created_at?: string };

const PAS_MS = 2000;
const BUDGET_MS = 120_000;

/** L'hôte de `DATABASE_URL` est l'UUID de la ressource Coolify. */
export function uuidBaseDepuisUrl(url: string): string {
  const hote = new URL(url).hostname;
  if (!hote) throw new Error('DATABASE_URL sans hôte : impossible de trouver la base Coolify.');
  return hote;
}

function baseApi(webhookUrl: string): string {
  return `${new URL(webhookUrl).origin}/api/v1`;
}

export async function sauvegarderAvantMigration(o: OptionsSauvegarde): Promise<Verdict> {
  const { webhookUrl, apiToken, databaseUrl } = o;
  /* Développement : les deux variables absentes = pas de Coolify, on passe.
     UNE SEULE présente = configuration à moitié faite, c'est une erreur. */
  if (!webhookUrl && !apiToken) return { fait: false, raison: 'coolify_absent' };
  if (!webhookUrl || !apiToken) {
    throw new Error(
      'COOLIFY_WEBHOOK_URL et COOLIFY_API_TOKEN vont par paire : configuration incomplète.',
    );
  }
  if (!databaseUrl) throw new Error('DATABASE_URL manquante : rien à sauvegarder.');

  const fetchImpl = o.fetchImpl ?? fetch;
  const attendre = o.attendre ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const budget = o.budgetMs ?? BUDGET_MS;
  const api = baseApi(webhookUrl);
  const uuid = uuidBaseDepuisUrl(databaseUrl);
  const entetes = { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' };

  /* Un `fetch failed` nu ne dit pas QUI on n'a pas pu joindre : depuis un
     conteneur, `host.docker.internal` ne résout pas sous Linux. */
  const listes = await fetchImpl(`${api}/databases/${uuid}/backups`, { headers: entetes }).catch(
    (e: unknown) => {
      throw new Error(
        `Coolify injoignable sur ${api} (${e instanceof Error ? e.message : e}).`,
      );
    },
  );
  if (!listes.ok) throw new Error(`Coolify : lecture des sauvegardes impossible (${listes.status}).`);
  const configs = (await listes.json()) as { uuid: string; enabled: boolean }[];
  const active = configs.find((c) => c.enabled);
  if (!active) {
    throw new Error(
      "Aucune sauvegarde planifiée active sur la base Coolify : la migration n'aura pas lieu.",
    );
  }

  const lance = await fetchImpl(`${api}/databases/${uuid}/backups/${active.uuid}`, {
    method: 'PATCH',
    headers: entetes,
    body: JSON.stringify({ backup_now: true }),
  });
  if (!lance.ok) throw new Error(`Coolify : sauvegarde non déclenchée (${lance.status}).`);

  const debut = Date.now();
  while (Date.now() - debut < budget) {
    await attendre(PAS_MS);
    const r = await fetchImpl(`${api}/databases/${uuid}/backups/${active.uuid}/executions`, {
      headers: entetes,
    });
    if (!r.ok) continue;
    /* Coolify répond `{ executions: [...] }` sur cette route, là où la liste
       des configurations est un tableau nu : on accepte les deux formes. */
    const brut = (await r.json()) as Execution[] | { executions?: Execution[] };
    const execs = Array.isArray(brut) ? brut : (brut.executions ?? []);
    const derniere = [...execs].sort((a, b) =>
      String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')),
    )[execs.length - 1];
    if (!derniere) continue;
    if (derniere.status === 'success') return { fait: true, raison: 'sauvegarde_ok' };
    if (derniere.status === 'failed') throw new Error('Coolify : la sauvegarde a échoué.');
  }
  throw new Error("Coolify : la sauvegarde n'a pas abouti dans le temps imparti.");
}
