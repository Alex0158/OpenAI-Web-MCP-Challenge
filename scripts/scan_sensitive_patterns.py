#!/usr/bin/env python3
"""Scan repository text without printing matched secret values."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


PATTERNS = (
    (
        "PRIVATE_KEY",
        re.compile(
            r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"
            r"\s+(?:[A-Za-z0-9+/=]{16,}\s+){2,}"
            r"-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"
        ),
    ),
    ("AWS_ACCESS_KEY", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("GITHUB_TOKEN", re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b")),
    ("OPENAI_KEY", re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b")),
    ("SLACK_TOKEN", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{20,}\b")),
    ("GOOGLE_API_KEY", re.compile(r"\bAIza[0-9A-Za-z_-]{30,}\b")),
)
IGNORED_PARTS = {".git", ".next", "build", "coverage", "dist", "node_modules"}
MAX_TEXT_BYTES = 2 * 1024 * 1024


@dataclass(frozen=True)
class Finding:
    code: str
    path: str
    line: int

    def render(self) -> str:
        return f"{self.code}: {self.path}:{self.line}: sensitive pattern detected"


def candidate_paths(root: Path) -> list[Path]:
    if (root / ".git").exists():
        result = subprocess.run(
            ["git", "ls-files", "-z"],
            cwd=root,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        if result.returncode == 0:
            return [root / raw.decode("utf-8") for raw in result.stdout.split(b"\0") if raw]
    return [path for path in root.rglob("*") if path.is_file()]


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in sorted(candidate_paths(root)):
        try:
            relative = path.relative_to(root)
        except ValueError:
            continue
        if any(part in IGNORED_PARTS for part in relative.parts):
            continue
        try:
            if path.is_symlink() or path.stat().st_size > MAX_TEXT_BYTES:
                continue
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for code, pattern in PATTERNS:
            for match in pattern.finditer(text):
                line_number = text.count("\n", 0, match.start()) + 1
                findings.append(Finding(code, relative.as_posix(), line_number))
    return findings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    return parser.parse_args()


def main() -> int:
    root = parse_args().root.resolve()
    if not root.is_dir():
        print(f"ERROR: root is not a directory: {root}", file=sys.stderr)
        return 2
    findings = scan(root)
    if findings:
        for finding in findings:
            print(finding.render())
        print(f"FAIL: {len(findings)} sensitive-pattern finding(s).")
        return 1
    print("PASS: no high-confidence sensitive patterns detected.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
