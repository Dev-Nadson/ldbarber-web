#!/usr/bin/env bash
# Recria o banco de teste e roda o roteiro. Uso: PGPORT=55434 supabase/tests/rodar.sh
set -euo pipefail
cd "$(dirname "$0")/.."
export PGPASSWORD="${PGPASSWORD:-test}" PGHOST="${PGHOST:-localhost}" PGPORT="${PGPORT:-55434}" PGUSER="${PGUSER:-postgres}"
psql -q -c "drop database if exists ldbarber" -c "create database ldbarber"
psql -q -d ldbarber -v ON_ERROR_STOP=1 -f tests/stub-supabase.sql 2>&1 | grep -v -e wal_level -e HINT || true
psql -q -d ldbarber -v ON_ERROR_STOP=1 -f schema.sql
psql -q -d ldbarber -v ON_ERROR_STOP=1 -f tests/regras.sql 2>&1 | grep -E "ok:|FALHOU|ERROR|TUDO OK" | sed 's/^psql:tests\/regras.sql:[0-9]*: NOTICE:  //'
