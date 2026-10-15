import { randomUUID } from 'node:crypto';

/** Chaque compte de test est distinct, même dans la même milliseconde et entre workers. */
export const courrielUnique = () => `parent-${randomUUID()}@exemple.fr`;
