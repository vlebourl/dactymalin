import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';

export type Base = ReturnType<typeof creerBase>;

export function creerBase(url: string) {
  /* `max: 5` : l'app sert une famille, pas une foule. Une petite réserve suffit
     et laisse la base tranquille. */
  const client = postgres(url, { max: 5, onnotice: () => {} });
  return drizzle(client, { schema });
}

/** Sonde du healthcheck : vraie requête, pas un simple « la socket est ouverte ». */
export function sondeDe(base: Base) {
  return async (): Promise<boolean> => {
    await base.execute(sql`select 1`);
    return true;
  };
}
