import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { creerSynthese } from '../voix';

/* #124 — le VRAI Piper n'existe que dans l'image de production. Ici, un faux
   binaire de trois lignes tient son rôle : il lit le mot sur l'entrée, écrit
   un « WAV » à l'endroit demandé, et note chaque appel — c'est ce journal qui
   dit si le cache a servi. */
let dossier: string;
let journal: string;

function fauxPiper(corps: string): string {
  const chemin = join(dossier, 'piper');
  writeFileSync(chemin, `#!/bin/sh\n${corps}\n`);
  chmodSync(chemin, 0o755);
  return chemin;
}

const HONNETE = `
mot=$(cat)
while [ $# -gt 0 ]; do [ "$1" = "--output_file" ] && sortie="$2"; shift; done
echo "$mot" >> "${'$'}{JOURNAL}"
printf 'RIFF%s' "$mot" > "$sortie"`;

beforeEach(() => {
  dossier = mkdtempSync(join(tmpdir(), 'voix-test-'));
  journal = join(dossier, 'journal');
  writeFileSync(journal, '');
  process.env.JOURNAL = journal;
});

const appels = () => readFileSync(journal, 'utf8').split('\n').filter(Boolean);

describe('synthèse vocale du serveur', () => {
  it("n'existe pas sans Piper : le client retombera sur la voix du navigateur", () => {
    expect(creerSynthese({}, dossier)).toBeNull();
    expect(creerSynthese({ PIPER_BIN: '/nulle/part', PIPER_MODELE: '/rien.onnx' }, dossier)).toBeNull();
  });

  it('rend le son du mot', async () => {
    const dire = creerSynthese({ PIPER_BIN: fauxPiper(HONNETE), PIPER_MODELE: __filename }, dossier)!;
    const son = await dire('papillon');
    expect(son?.subarray(0, 4).toString()).toBe('RIFF');
    expect(appels()).toEqual(['papillon.']);
  });

  it('ne resynthétise pas un mot déjà dit', async () => {
    const dire = creerSynthese({ PIPER_BIN: fauxPiper(HONNETE), PIPER_MODELE: __filename }, dossier)!;
    const premier = await dire('chat');
    const second = await dire('chat');
    expect(second).toEqual(premier);
    expect(appels()).toHaveLength(1);
  });

  it('ne lance qu’UNE synthèse pour un mot demandé deux fois en même temps', async () => {
    const dire = creerSynthese({ PIPER_BIN: fauxPiper(HONNETE), PIPER_MODELE: __filename }, dossier)!;
    const [a, b] = await Promise.all([dire('lune'), dire('lune')]);
    expect(a).toEqual(b);
    expect(appels()).toHaveLength(1);
  });

  it('rend null quand Piper échoue, et ne garde rien du raté', async () => {
    const chemin = fauxPiper('cat > /dev/null; exit 3');
    const dire = creerSynthese({ PIPER_BIN: chemin, PIPER_MODELE: __filename }, dossier)!;
    expect(await dire('chat')).toBeNull();
    // Piper réparé : le mot se synthétise, le raté n'a pas empoisonné le cache
    fauxPiper(HONNETE);
    expect((await dire('chat'))?.subarray(0, 4).toString()).toBe('RIFF');
  });

  it('dit UNE phrase : un retour à la ligne glissé dans un mot ne devient pas deux énoncés', async () => {
    const dire = creerSynthese({ PIPER_BIN: fauxPiper(HONNETE), PIPER_MODELE: __filename }, dossier)!;
    await dire('un\ntemps');
    expect(appels()).toEqual(['un temps.']);
  });
});
