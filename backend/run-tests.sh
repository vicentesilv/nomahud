#!/usr/bin/env bash

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'
PASS=0
FAIL=0
FAILED_TESTS=()

run_test() {
  local label="$1"
  local file="$2"
  printf "\n${CYAN}━━━ ${BOLD}${label}${NC}${CYAN} ━━━${NC}\n"
  if npx jest --no-coverage --silent "$file"; then
    printf " ${GREEN}✓ PASS${NC}  ${label}\n"
    ((PASS++))
  else
    printf " ${RED}✗ FAIL${NC}  ${label}\n"
    ((FAIL++))
    FAILED_TESTS+=("$label")
  fi
}

printf "${BOLD}Ejecutando tests individualmente...${NC}\n"

# ── Auth ──
run_test "Auth Service"  "src/auth/test/auth.service.spec.ts"
run_test "Auth Controller" "src/auth/test/auth.controller.spec.ts"

# ── Usuarios ──
run_test "Usuarios Service"  "src/usuarios/tests/usuarios.service.spec.ts"
run_test "Usuarios Controller" "src/usuarios/tests/usuarios.controller.spec.ts"

# ── Perfiles ──
run_test "Perfiles Service"  "src/perfiles/tests/perfiles.service.spec.ts"
run_test "Perfiles Controller" "src/perfiles/tests/perfiles.controller.spec.ts"

# ── Clientes ──
run_test "Clientes Service"  "src/clientes/tests/clientes.service.spec.ts"
run_test "Clientes Controller" "src/clientes/tests/clientes.controller.spec.ts"

# ── Finanzas ──
run_test "Finanzas Service"  "src/finanzas/tests/finanzas.service.spec.ts"
run_test "Finanzas Controller" "src/finanzas/tests/finanzas.controller.spec.ts"

# ── Tiempo ──
run_test "Tiempo Service"  "src/tiempo/tests/tiempo.service.spec.ts"
run_test "Tiempo Controller" "src/tiempo/tests/tiempo.controller.spec.ts"

# ── Proyectos ──
run_test "Proyectos Service"  "src/proyectos/tests/proyectos.service.spec.ts"
run_test "Proyectos Controller" "src/proyectos/tests/proyectos.controller.spec.ts"

# ── Tareas ──
run_test "Tareas Service"  "src/tareas/tests/tareas.service.spec.ts"
run_test "Tareas Controller" "src/tareas/tests/tareas.controller.spec.ts"

# ── Viajes ──
run_test "Viajes Service"  "src/viajes/tests/viajes.service.spec.ts"
run_test "Viajes Controller" "src/viajes/tests/viajes.controller.spec.ts"

# ── Documentos ──
run_test "Documentos Service"  "src/documentos/tests/documentos.service.spec.ts"
run_test "Documentos Controller" "src/documentos/tests/documentos.controller.spec.ts"

# ── Dashboard ──
run_test "Dashboard Service"  "src/dashboard/tests/dashboard.service.spec.ts"
run_test "Dashboard Controller" "src/dashboard/tests/dashboard.controller.spec.ts"

# ── Otros ──
run_test "Mail Service"    "src/mail/test/mail.service.spec.ts"
run_test "Auth Tokens Job" "src/common/jobs/test/auth-tokens-cleanup.job.spec.ts"

# ── Resumen ──
printf "\n${BOLD}${CYAN}════════════════════════════════════════${NC}\n"
printf "${BOLD}  Total: %d  |  ${GREEN}PASS: %d${NC}  |  ${RED}FAIL: %d${NC}${NC}\n" $((PASS + FAIL)) "$PASS" "$FAIL"
if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  printf "${RED}  Fallaron:${NC}\n"
  for t in "${FAILED_TESTS[@]}"; do
    printf "    ${RED}•${NC} %s\n" "$t"
  done
fi
printf "${BOLD}${CYAN}════════════════════════════════════════${NC}\n"
exit $FAIL
