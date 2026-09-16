#!/bin/sh
set -eu

# CDS supplies a PostgreSQL URI; Spring expects JDBC plus separate credentials.
# Never log the connection URI: its userinfo may contain a password.
case "${DATABASE_URL:-}" in
  postgresql://*|postgres://*)
    connection=${DATABASE_URL#*://}
    authority=${connection%%/*}
    case "$connection" in
      */*) ;;
      *) echo 'Database URI must include a database path' >&2; exit 1 ;;
    esac
    case "$authority" in
      *@*) authority=${authority##*@} ;;
    esac
    if [ -z "$authority" ] || [ -z "${DATABASE_USERNAME:-}" ] || [ -z "${DATABASE_PASSWORD:-}" ]; then
      echo 'Database host and separate credentials are required' >&2
      exit 1
    fi
    DATABASE_URL="jdbc:postgresql://$authority/${connection#*/}"
    export DATABASE_URL
    ;;
  jdbc:postgresql://*) ;;
  *) echo 'Unsupported database connection format' >&2; exit 1 ;;
esac

exec "$@"
