import type { Page } from '@playwright/test';

export async function espionnerLaVoix(page: Page, voix: 'presente' | 'absente' | 'differee'): Promise<void> {
  await page.addInitScript((regime) => {
    const francaise = { lang: 'fr-FR', name: 'Voix de test' };
    const voixConnues = regime === 'presente' ? [francaise] : [];
    const ecouteurs: Array<() => void> = [];
    const dits: Array<{ texte: string; debit: number }> = [];
    const w = window as unknown as Record<string, unknown>;
    w.__dits = dits;
    w.__voixArrive = () => {
      voixConnues.push(francaise);
      for (const f of ecouteurs) f();
    };
    /* Une vraie `SpeechSynthesisUtterance` refuse une voix qui n'en est pas
       une : la phrase est remplacée avec la synthèse. */
    w.SpeechSynthesisUtterance = class {
      lang = '';
      rate = 1;
      voice: unknown = null;
      constructor(public text: string) {}
    };
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => voixConnues,
        speak: (p: { text: string; rate: number }) => dits.push({ texte: p.text, debit: p.rate }),
        cancel: () => {},
        addEventListener: (_: string, f: () => void) => ecouteurs.push(f),
        removeEventListener: () => {},
      },
    });
    /* Les noms de lettre sont des fichiers Piper (#139), joués depuis la
       mémoire (`blob:`) : l'élément porte le nom qu'il dit. Rien n'est joué. */
    const joues: string[] = [];
    w.__joues = joues;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (this.src.startsWith('blob:')) joues.push(this.dataset.dit ?? '');
      return Promise.resolve();
    };
  }, voix);
}

