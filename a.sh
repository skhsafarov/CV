#!/usr/bin/env bash

# =========================================================
# HARD SAFE BLOCK FOR OOBCONFIG — Android 16 Edition
# =========================================================

set -Eeuo pipefail

PKG_OOB="com.google.android.apps.work.oobconfig"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log(){ echo -e "$1"; }
ok(){ log "${GREEN}[OK]${NC} $1"; }
warn(){ log "${YELLOW}[WARN]${NC} $1"; }
err(){ log "${RED}[ERR]${NC} $1"; }

echo -e "${YELLOW}=== HARD SAFE OOBCONFIG BLOCK (Android 16) ===${NC}"

# =========================================================
# 0. Detect Android version
# =========================================================
# Android 16 = API 36. Некоторые команды работают только там.
# =========================================================

adb start-server >/dev/null 2>&1

if ! adb get-state 2>/dev/null | grep -q "device"; then
    err "Device not connected or unauthorized"
    exit 1
fi

API_LEVEL=$(adb shell getprop ro.build.version.sdk | tr -d '[:space:]')
ok "Device connected | API level: $API_LEVEL"

# =========================================================
# 1. Force stop
# =========================================================

adb shell am force-stop "$PKG_OOB" || true
ok "Force-stopped"

# =========================================================
# 2. Multi-layer package disabling
# =========================================================
# Android 13+: pm suspend требует явного --user 0
# Android 16: pm hide может быть deprecated у некоторых OEM
# =========================================================

adb shell pm disable-user --user 0 "$PKG_OOB" || true
adb shell pm suspend --user 0 "$PKG_OOB" || true   # <-- исправлено для A13+
adb shell pm hide --user 0 "$PKG_OOB" || true

ok "Package disabled (multi-layer)"

# =========================================================
# 3. Safe uninstall for user 0
# =========================================================

adb shell pm uninstall -k --user 0 "$PKG_OOB" || warn "Uninstall not supported (system pkg)"

# =========================================================
# 4. AppOps hard restriction
# =========================================================
# ignore = более агрессивный вариант deny для некоторых ops
# =========================================================

OPS=(
    WAKE_LOCK
    RUN_IN_BACKGROUND
    RUN_ANY_IN_BACKGROUND
    START_FOREGROUND
    SYSTEM_ALERT_WINDOW
    TOAST_WINDOW
    POST_NOTIFICATION
    RECEIVE_BOOT_COMPLETED       # перенесено сюда из шага 8
    SCHEDULE_EXACT_ALARM         # NEW: A12+, блокирует точные будильники
    USE_EXACT_ALARM              # NEW: A13+
    MANAGE_MEDIA                 # NEW: на случай если пакет получит media hook
)

for op in "${OPS[@]}"; do
    adb shell cmd appops set "$PKG_OOB" "$op" ignore >/dev/null 2>&1 \
    || adb shell cmd appops set "$PKG_OOB" "$op" deny >/dev/null 2>&1 \
    || true
done

ok "AppOps restrictions applied (ignore/deny)"

# =========================================================
# 5. [NEW Android 9+] App Standby Bucket → restricted
# =========================================================
# Это отдельный слой от AppOps.
# "restricted" = жесточайшие лимиты на jobs, alarms, network.
# На Android 16 этот bucket стал ещё жёстче (job quotas).
# Требует: adb shell dumpsys battery unplug (иначе ignored).
# =========================================================

echo "[*] Setting App Standby Bucket to restricted..."
adb shell dumpsys battery unplug >/dev/null 2>&1 || true
adb shell am set-standby-bucket "$PKG_OOB" restricted || warn "set-standby-bucket not supported"
ok "Standby bucket → restricted"

# =========================================================
# 6. [NEW Android 16] Job quota enforcement
# =========================================================
# Android 16 ввёл квоты даже для active bucket.
# Для restricted bucket квоты ещё жёстче.
# Эта команда отключает overrides если они были выставлены.
# =========================================================

if [ "$API_LEVEL" -ge 36 ] 2>/dev/null; then
    adb shell am compat disable OVERRIDE_QUOTA_ENFORCEMENT_TO_TOP_STARTED_JOBS "$PKG_OOB" >/dev/null 2>&1 || true
    adb shell am compat disable OVERRIDE_QUOTA_ENFORCEMENT_TO_FGS_JOBS "$PKG_OOB" >/dev/null 2>&1 || true
    ok "Android 16: job quota overrides disabled"
fi

# =========================================================
# 7. Revoke runtime permissions
# =========================================================
# NEW: явный revoke опасных permissions,
# которые могут помочь oobconfig re-activate.
# =========================================================

PERMS=(
    android.permission.RECEIVE_BOOT_COMPLETED
    android.permission.FOREGROUND_SERVICE
    android.permission.REQUEST_INSTALL_PACKAGES
    android.permission.CHANGE_NETWORK_STATE
    android.permission.INTERNET
)

echo "[*] Revoking permissions..."
for perm in "${PERMS[@]}"; do
    adb shell pm revoke "$PKG_OOB" "$perm" >/dev/null 2>&1 || true
done

ok "Permissions revoked (best-effort)"

# =========================================================
# 8. Disable ALL internal components
# =========================================================

echo "[*] Disabling internal components..."

adb shell dumpsys package "$PKG_OOB" \
| grep -o "${PKG_OOB}/[^ ]*" \
| while read -r comp; do
    adb shell pm disable "$comp" >/dev/null 2>&1 || true
done

ok "Components disabled"

# =========================================================
# 9. Clear data & cache
# =========================================================

adb shell pm clear "$PKG_OOB" || true
ok "Data cleared"

# =========================================================
# 10. Reset battery state (important!)
# =========================================================
# Мы делали dumpsys battery unplug — нужно сбросить,
# иначе система думает, что кабель отключён.
# =========================================================

adb shell dumpsys battery reset >/dev/null 2>&1 || true
ok "Battery state reset"

# =========================================================
# 11. Verification
# =========================================================

echo
echo "[*] Verification..."

adb shell pm list packages -d | grep -q "$PKG_OOB" \
    && ok "Package in disabled list" \
    || warn "Not visible as disabled (OEM may override)"

BUCKET=$(adb shell am get-standby-bucket "$PKG_OOB" 2>/dev/null || echo "unknown")
echo "    Standby bucket: $BUCKET"

echo
ok "DONE — reboot recommended"
echo
