#!/bin/bash
# Déclenche un déploiement Coolify et attend le verdict.
#
# Un push sur main déclenche déjà le déploiement (webhook GitHub → Coolify).
# Ce script sert à redéployer SANS pousser, ou à voir le verdict et les logs
# sans ouvrir l'interface.
#
# Prérequis : `ssh lyra@coolify` fonctionne, et le jeton API est sur l'hôte
# dans /root/.coolify-claude-token (lisible par root seulement).
set -euo pipefail

APP=${COOLIFY_APP_UUID:-x9tbvf1mbspphk7ml1c68dlv}
HOTE=${COOLIFY_SSH:-lyra@coolify}
PORT_APP=${PORT_APP:-3003}

echo "→ déploiement de $APP"
ssh -o BatchMode=yes "$HOTE" "sudo -n bash -s" <<REMOTE
set -e
T=\$(cat /root/.coolify-claude-token)
D=\$(curl -s -H "Authorization: Bearer \$T" "http://localhost:8000/api/v1/deploy?uuid=$APP" \
  | python3 -c "import json,sys;print(json.load(sys.stdin)['deployments'][0]['deployment_uuid'])")
echo "  déploiement \$D"
for i in \$(seq 1 40); do
  s=\$(curl -s -H "Authorization: Bearer \$T" "http://localhost:8000/api/v1/deployments/\$D" \
      | python3 -c "import json,sys;print(json.load(sys.stdin).get('status'))")
  case "\$s" in
    finished) echo "  construit et démarré"; break ;;
    failed)
      echo "  ÉCHEC — dernières lignes :"
      curl -s -H "Authorization: Bearer \$T" "http://localhost:8000/api/v1/deployments/\$D" \
        | python3 -c "
import json,sys
d=json.load(sys.stdin)
try:
  for l in json.loads(d['logs'])[-15:]: print('   ', l.get('output','')[:200])
except Exception: print(str(d.get('logs'))[-800:])"
      exit 1 ;;
  esac
  sleep 20
done
echo "  santé : \$(curl -s -m 10 http://localhost:$PORT_APP/api/health)"
REMOTE
