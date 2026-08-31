#!/usr/bin/env bash
# Rejoue la chaîne de contenu de bout en bout dans un dossier jetable, puis
# compare le résultat aux fichiers versionnés de `src/data/`.
#
# C'est le test de non-régression de la chaîne : elle n'est réparée que si elle
# reproduit à l'octet près ce que le dépôt sert déjà. Rien n'est écrit dans
# `src/`, le rejeu a sa propre racine.
#
#   scripts/analyse/verifier-rejeu.sh [dossier-donnees]   # défaut /tmp/dactylo-data
set -euo pipefail

D=${1:-/tmp/dactylo-data}
RACINE=$(cd "$(dirname "$0")/../.." && pwd)

for f in duboisbuyse.txt Lexique383.tsv; do
  if [ ! -s "$D/$f" ]; then
    echo "données absentes : $D/$f — voir « Données » dans scripts/analyse/README.md" >&2
    exit 2
  fi
done

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
mkdir -p "$T/data" "$T/racine/src/data"
cp "$D/duboisbuyse.txt" "$D/Lexique383.tsv" "$T/data/"

node "$RACINE/scripts/analyse/dump-app.mjs" > "$T/data/app.json"
python3 "$RACINE/scripts/analyse/construire-lexique-v3.py" "$T/data" 5.0 > "$T/data/lexique-v3.json"
(cd "$RACINE/scripts/analyse" && python3 generer-lecons.py "$T/data" "$T/racine")

echec=0
for f in lexique-v3.json parcours.json; do
  if diff -q "$T/racine/src/data/$f" "$RACINE/src/data/$f" > /dev/null; then
    echo "OK   $f — rejeu identique au fichier versionné"
  else
    echo "DIFF $f — le rejeu ne reproduit plus le fichier versionné :" >&2
    diff "$RACINE/src/data/$f" "$T/racine/src/data/$f" | head -20 >&2
    echec=1
  fi
done
exit $echec
