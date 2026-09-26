#!/bin/bash
# 클라우드 세션은 node_modules 없이 시작한다 — 없으면 typecheck·consumer·es-ceiling 이 거짓 빨강 (ci 는 lock 을 안 고친다).
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
npm ci --no-audit --no-fund
