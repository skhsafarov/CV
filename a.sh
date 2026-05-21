#!/usr/bin/env bash
set -Eeuo pipefail

PKG_OOB="com.google.android.apps.work.oobconfig"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log(){ echo -e "$1"; }
ok(){ log "${GREEN}[OK]${NC} $1"; }
warn(){ log "${YELLOW}[WARN]${NC} $1"; }
err(){ log "${RED}[ERR]${NC} $1"; }

echo -e "${YELLOW}=== HARD SAFE BLOCK OOBCONFIG ===${NC}"

# =========================
# 1. Check device
# =========================
adb start-server >/dev/null 2>&1

if ! adb get-state 2>/dev/null | grep -q "device"; then
    err "Device not ready"
    exit 1
fi

ok "Device connected"

# =========================
# 2. Force stop loop
# =========================
adb shell am force-stop "$PKG_OOB" || true

# =========================
# 3. Disable main package
# =========================
adb shell pm disable-user --user 0 "$PKG_OOB" || true
adb shell pm suspend "$PKG_OOB" || true
adb shell pm hide "$PKG_OOB" || true

ok "Package disabled layer"

# =========================
# 4. Remove for user 0 (safe uninstall)
# =========================
adb shell pm uninstall -k --user 0 "$PKG_OOB" || warn "uninstall skipped"

# =========================
# 5. AppOps HARD DENY
# =========================
OPS=(
WAKE_LOCK
RUN_IN_BACKGROUND
RUN_ANY_IN_BACKGROUND
START_FOREGROUND
SYSTEM_ALERT_WINDOW
TOAST_WINDOW
POST_NOTIFICATION
)

for op in "${OPS[@]}"; do
    adb shell cmd appops set "$PKG_OOB" "$op" deny >/dev/null 2>&1 || true
done

ok "AppOps restricted"

# =========================
# 6. Disable ALL components (key part)
# =========================
echo "[*] Disabling components..."

adb shell dumpsys package "$PKG_OOB" \
| grep "$PKG_OOB/" \
| awk '{print $1}' \
| while read -r comp; do
    adb shell pm disable "$comp" >/dev/null 2>&1 || true
done

ok "Components disabled"

# =========================
# 7. Clear all state
# =========================
adb shell pm clear "$PKG_OOB" || true

# =========================
# 8. Block wake + restart signals
# =========================
adb shell cmd appops set "$PKG_OOB" RECEIVE_BOOT_COMPLETED deny || true
adb shell cmd appops set "$PKG_OOB" RUN_ANY_IN_BACKGROUND deny || true

# =========================
# 9. Verification
# =========================
echo
echo "[*] Checking disabled state..."

adb shell pm list packages -d | grep -q "$PKG_OOB" \
&& ok "Package is disabled" \
|| warn "Not fully disabled (OEM limitation possible)"

echo
ok "DONE. Reboot recommended."
