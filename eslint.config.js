import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/* ESLint ne fait ici que DEUX choses que `strict` ne voit pas (#131) : les
   dépendances des hooks React et les promesses lancées sans être attendues.
   Pas de règles de style — le code n'en a pas besoin pour être lu.

   Les hooks : `rules-of-hooks` et `exhaustive-deps`, et pas le préréglage
   `recommended` de la v7. Celui-ci ajoute les règles du React Compiler
   (`refs`, `purity`, `set-state-in-effect`…), que l'app n'utilise pas : elles
   refusent des motifs voulus, comme la référence tenue à jour pendant le
   rendu pour la boucle rAF de la leçon. */
export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'gan-harness/', 'maquettes/', 'recherche/'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: { allowDefaultProject: ['drizzle.config.ts'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    /* Une suppression devenue inutile ment sur le code : elle échoue aussi. */
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    plugins: { 'react-hooks': reactHooks, '@typescript-eslint': tseslint.plugin },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
);
