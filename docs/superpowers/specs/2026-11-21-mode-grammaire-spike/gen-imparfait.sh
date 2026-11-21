#!/bin/bash
# usage: gen2.sh <keyfile> <dir> <outfile>
set -u
KEY=$(cat "$1"); D="$2"; OUT="$3"; : > "$OUT"
SUJ=(); while IFS= read -r l; do SUJ+=("$l"); done < "$D/sujets.txt"
VER=(); while IFS= read -r l; do VER+=("$l"); done < "$D/verbes.txt"
THE=(); while IFS= read -r l; do THE+=("$l"); done < "$D/themes.txt"
SYS="Tu écris des phrases d'exercice de grammaire pour un enfant de 8 ans. On te donne un sujet, un verbe à l'infinitif, un thème et un temps. Écris UNE phrase simple en français qui commence par ce sujet, avec ce verbe comme seul verbe conjugué, au temps demandé, en rapport avec le thème. Vocabulaire du quotidien, 12 mots au plus. N'emploie aucun mot qui indique le moment (hier, demain, aujourd'hui, maintenant, bientôt, autrefois, ce matin, la semaine prochaine…) : seul le verbe doit montrer le temps. Si la combinaison est étrange, écris une phrase amusante mais correcte. Mets uniquement la phrase finale dans le champ phrase."
for temps in imparfait; do
  for i in $(seq 1 30); do
   for essai in 1 2 3; do
    s=${SUJ[RANDOM % ${#SUJ[@]}]}; v=${VER[RANDOM % ${#VER[@]}]}; t=${THE[RANDOM % ${#THE[@]}]}
    u="Sujet : $s. Verbe : $v. Thème : $t. Temps : $temps."
    body=$(jq -n --arg s "$SYS" --arg u "$u" '{model:"claude-haiku-5-5",max_tokens:1024,output_config:{effort:"low",format:{type:"json_schema",schema:{type:"object",properties:{phrase:{type:"string"}},required:["phrase"],additionalProperties:false}}},system:$s,messages:[{role:"user",content:$u}]}')
    r=$(curl -s https://api.anthropic.com/v1/messages -H "x-api-key: $KEY" -H "anthropic-version: 2023-06-01" -H "content-type: application/json" -d "$body")
    raw=$(echo "$r" | jq -r "[.content[]? | select(.type==\"text\") | .text] | join(\"\")"); txt=$(echo "$raw" | jq -r .phrase 2>/dev/null || echo "JSON INVALIDE: $raw")
    [ -z "$txt" ] && txt="ERREUR: $(echo "$r" | jq -c '.error // .stop_reason')"
    raison=$("$D/valider.pl" "$D/mots-interdits.txt" "$txt") && { printf '%s\t%s | %s | %s\t%s\t%s\n' "${temps%% *}" "$s" "$v" "$t" "$(echo "$r" | jq -c '[.usage.input_tokens,.usage.output_tokens]')" "$txt" >> "$OUT"; break; }
    printf "REJET\t${temps}\t%s\t%s\t%s\n" "$raison" "$s | $v | $t" "$txt" >> "$OUT"
   done
  done
done
