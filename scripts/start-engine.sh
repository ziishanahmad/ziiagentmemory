#!/bin/bash
# ziiagentmemory engine starter for Hermes terminal
# Usage: bash scripts/start-engine.sh
#
# Uses Python subprocess with DETACHED_PROCESS to create a truly orphaned
# Windows process. Also kills old iii.exe + node.exe on our ports first.
# If iii.exe can't be killed without admin, prints the command for the user.

cd /c/Projects/ziiagentmemory

# Kill any existing engine on our ports
PIDS=$(netstat -ano 2>/dev/null | grep -E "0\.0\.0\.0:49134.*LISTENING|127\.0\.0\.1:311[1-6].*LISTENING" | awk '{print $5}' | sort -u)
NEEDS_ADMIN=""
for PID in $PIDS; do
  if cmd.exe /c "taskkill /PID $PID /F" >nul 2>&1; then
    echo "[ziiagentmemory] Killed PID $PID"
  else
    NEEDS_ADMIN="$NEEDS_ADMIN $PID"
  fi
done

if [ -n "$NEEDS_ADMIN" ]; then
  echo "[ziiagentmemory] These PIDs need admin to kill:$NEEDS_ADMIN"
  echo "[ziiagentmemory] Run in admin shell: taskkill /PID$(echo $NEEDS_ADMIN | sed 's/ / \/PID /g') /F"
  exit 1
fi

# Wait for ports to clear
sleep 5

# Start the engine fully detached via Python subprocess with 8GB heap
python3 -c "
import subprocess, os
env = os.environ.copy()
env['NODE_OPTIONS'] = '--max-old-space-size=8192'
proc = subprocess.Popen(
    ['node', 'dist/cli.mjs', 'engine', 'start'],
    cwd=r'C:\\Projects\\ziiagentmemory',
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
    env=env,
    creationflags=0x00000008 | 0x00000200  # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP
)
print(f'[ziiagentmemory] Engine started PID {proc.pid} (heap=8GB)')
"

# Wait for engine to come up
sleep 12

# Verify
if curl -s --max-time 5 http://localhost:3111/agentmemory/health > /dev/null 2>&1; then
  echo "[ziiagentmemory] Engine started successfully"
  echo "[ziiagentmemory] API at http://localhost:3111/agentmemory/health"
  echo "[ziiagentmemory] Viewer at http://localhost:3113"
else
  echo "[ziiagentmemory] ERROR: Engine failed to start"
  exit 1
fi