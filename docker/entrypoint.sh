#!/bin/sh
set -eu

PROCESS_TYPE="${PROCESS_TYPE:-api}"

echo "Starting process type: ${PROCESS_TYPE}"

case "${PROCESS_TYPE}" in
  api)
    exec node dist/server.js
    ;;
  mail-worker)
    exec node dist/modules/mail/mail.worker.js
    ;;
  sms-worker)
    exec node dist/modules/sms/sms.worker.js
    ;;
  *)
    echo "Invalid PROCESS_TYPE: ${PROCESS_TYPE}"
    echo "Allowed values: api, mail-worker, sms-worker"
    exit 1
    ;;
esac
