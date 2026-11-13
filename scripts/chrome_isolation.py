#!/usr/bin/env python3
"""Bounded, isolated Chromium subprocess management for migration-only tests."""
from __future__ import annotations
import os
import signal
import subprocess
import time
from dataclasses import dataclass

@dataclass
class ChromeResult:
    returncode: int | None
    stdout: str
    stderr: str
    elapsed_seconds: float
    timed_out: bool = False

def run_chrome(command: list[str], *, timeout: int, label: str) -> ChromeResult:
    """Start Chrome in its own process group; terminate and reap on timeout."""
    started = time.monotonic()
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                               text=True, start_new_session=True)
    try:
        stdout, stderr = process.communicate(timeout=timeout)
        return ChromeResult(process.returncode, stdout, stderr, time.monotonic() - started)
    except subprocess.TimeoutExpired:
        # SIGTERM first; SIGKILL the whole group if descendants keep pipes open.
        try:
            os.killpg(process.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        try:
            stdout, stderr = process.communicate(timeout=3)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            stdout, stderr = process.communicate()
        elapsed = time.monotonic() - started
        print(f"CHROME-TIMEOUT label={label} limit={timeout}s elapsed={elapsed:.1f}s "
              f"exit={process.returncode} stderr_tail={stderr[-400:]!r}", flush=True)
        return ChromeResult(process.returncode, stdout, stderr, elapsed, timed_out=True)
