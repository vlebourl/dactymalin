import { Component, type ReactNode } from 'react';
import u from './ui.module.css';

/**
 * Frontière d'erreur. Un enfant de 7 ans ne doit jamais voir un écran blanc :
 * si une vue tombe (voix de synthèse exotique, stockage refusé…), on lui dit
 * ce qui s'est passé dans SA langue et on lui rend un bouton qui marche.
 */
export class Garde extends Component<{ children: ReactNode }, { tombe: boolean }> {
  state = { tombe: false };

  static getDerivedStateFromError() {
    return { tombe: true };
  }

  render() {
    if (!this.state.tombe) return this.props.children;
    return (
      <div
        style={{
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          padding: 24,
          gap: 18,
        }}
      >
        <div style={{ display: 'grid', gap: 18, justifyItems: 'center' }}>
          <p style={{ fontSize: 'clamp(24px, 3.4vw, 38px)', fontWeight: 600 }}>
            J'ai perdu le fil de la leçon.
          </p>
          <p style={{ color: 'var(--encre-doux)', maxWidth: '34ch' }}>
            Ce n'est pas ta faute, et rien n'est perdu : tes touches apprises sont gardées.
          </p>
          <button
            className={[u.bouton, u.primaire, u.geant].join(' ')}
            onClick={() => window.location.reload()}
          >
            On reprend
          </button>
        </div>
      </div>
    );
  }
}
