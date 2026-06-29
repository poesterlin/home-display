#!/usr/bin/env bash
# Compile (and optionally flash) the e-ink ESPHome firmware.
#
# Usage:
#   ./compile.sh                compile only
#   ./compile.sh run            compile and start an esphome run session
#                                  (will prompt for the serial port)
#   ./compile.sh flash /dev/ttyACM0
#                               compile and flash to a specific port
#   ./compile.sh clean          remove the build directory
#
# Requires:
#   - uv on PATH (used to create the venv with esphome on first run)
#   - python3 (uv will pull one)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${SCRIPT_DIR}/.esphome-venv"
PYTHON_BIN="${VENV_DIR}/bin/python"
ESPHOME_BIN="${VENV_DIR}/bin/esphome"
CONFIG="${SCRIPT_DIR}/dashboard.yaml"
BUILD_DIR="${SCRIPT_DIR}/.esphome/build/eink-dashboard"

# Pin the ESPHome version so the toolchain is reproducible across
# machines. Bump deliberately when you want to upgrade.
ESPHOME_VERSION="2026.6.0"

action="${1:-compile}"

ensure_venv() {
  if [[ ! -x "${ESPHOME_BIN}" ]]; then
    echo "==> creating venv at ${VENV_DIR}"
    uv venv "${VENV_DIR}"
    echo "==> installing esphome==${ESPHOME_VERSION}"
    uv pip install --python "${PYTHON_BIN}" "esphome==${ESPHOME_VERSION}"
  fi
}

run_compile() {
  ensure_venv
  echo "==> esphome compile ${CONFIG}"
  "${ESPHOME_BIN}" compile "${CONFIG}"
  echo
  echo "Build artifacts:"
  echo "  ${BUILD_DIR}/.pioenvs/eink-dashboard/firmware.bin"
  echo "  ${BUILD_DIR}/.pioenvs/eink-dashboard/firmware.factory.bin"
}

run_run() {
  ensure_venv
  echo "==> esphome run ${CONFIG}"
  "${ESPHOME_BIN}" run "${CONFIG}"
}

run_flash() {
  local port="${2:-}"
  if [[ -z "${port}" ]]; then
    echo "usage: $0 flash /dev/ttyACM0" >&2
    exit 1
  fi
  ensure_venv
  echo "==> esphome upload ${CONFIG} --device ${port}"
  "${ESPHOME_BIN}" upload "${CONFIG}" --device "${port}"
}

run_clean() {
  echo "==> removing build directories"
  rm -rf "${SCRIPT_DIR}/.esphome" "${SCRIPT_DIR}/.esphome-venv"
  echo "done"
}

case "${action}" in
  compile)
    run_compile
    ;;
  run)
    run_run
    ;;
  flash)
    shift
    run_flash "$@"
    ;;
  clean)
    run_clean
    ;;
  *)
    echo "unknown action: ${action}" >&2
    echo "usage: $0 [compile|run|flash <port>|clean]" >&2
    exit 1
    ;;
esac
