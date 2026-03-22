#!/usr/bin/env bash
set -euo pipefail
if [ $# -lt 1 ]; then
  echo "Usage: $0 <command...>" >&2
  exit 1
fi
ROOT=$(pwd)
if [ ! -d "$ROOT/logs" ]; then
  mkdir -p "$ROOT/logs"
fi
LOG_FILE="$ROOT/logs/commands.json"
if [ ! -f "$LOG_FILE" ]; then
  echo '[]' > "$LOG_FILE"
fi
CMD="$*"
START=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ENTRY=$(python3 - <<'PY'
import json, pathlib, sys
path = pathlib.Path('$LOG_FILE')
data = json.loads(path.read_text())
entry = {
  'command': '''$CMD''',
  'start': '$START',
  'status': 'running',
  'output': '',
}
data.append(entry)
path.write_text(json.dumps(data, indent=2))
print(len(data)-1)
PY
)
set +e
OUTPUT=$(mktemp)
STATUS=0
bash -c "$CMD" &> "$OUTPUT" || STATUS=$?
END=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SUMMARY=$(tail -n 20 "$OUTPUT" | python3 - <<'PY'
import sys
print('\n'.join([line.rstrip() for line in sys.stdin]))
PY
)
python3 - <<'PY'
import json, pathlib
path = pathlib.Path('$LOG_FILE')
data = json.loads(path.read_text())
idx = $ENTRY
entry = data[idx]
entry.update({
  'status': 'success' if $STATUS == 0 else 'failed',
  'end': '$END',
  'return_code': $STATUS,
  'output': '''$SUMMARY''',
})
data[idx] = entry
path.write_text(json.dumps(data, indent=2))
PY
rm "$OUTPUT"
set -e
if [ $STATUS -ne 0 ]; then
  echo "Command failed with exit code $STATUS" >&2
  exit $STATUS
fi
