#!/bin/bash
set -euo pipefail

# Installe les dépendances pour que lint, build et tests fonctionnent
# dès le démarrage d'une session Claude Code sur le web.
# Limité à l'environnement distant : inutile en local.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# npm install (et non ci) pour profiter du cache du conteneur ; idempotent.
npm install
