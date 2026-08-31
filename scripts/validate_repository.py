#!/usr/bin/env python3
"""Run project-wide mechanical validation for OpenAI-WebMCP."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from validate_docs import Finding, IGNORED_PARTS, is_active_path, validate


def validate_repository_shape(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    root_git = (root / ".git").resolve()
    for path in sorted(root.rglob("*")):
        try:
            relative = path.relative_to(root)
        except ValueError:
            continue
        if any(part in IGNORED_PARTS for part in relative.parts):
            continue
        relative_text = relative.as_posix()
        if path.is_symlink() and is_active_path(path, root):
            findings.append(Finding("SYMLINK", relative_text, "active symlink requires explicit review"))
        if path.name == ".git" and path.resolve() != root_git:
            findings.append(Finding("NESTED_GIT", relative_text, "nested Git boundary is not allowed"))
    return findings


def git_diff_check(root: Path, *, cached: bool) -> list[Finding]:
    if not (root / ".git").exists():
        return []
    command = ["git", "diff"]
    if cached:
        command.append("--cached")
    command.append("--check")
    result = subprocess.run(
        command,
        cwd=root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    if result.returncode == 0:
        return []
    detail = result.stdout.strip().splitlines()
    return [
        Finding(
            "GIT_DIFF_CHECK_CACHED" if cached else "GIT_DIFF_CHECK",
            ".",
            detail[0] if detail else f"git diff --check exited {result.returncode}",
        )
    ]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    return parser.parse_args()


def main() -> int:
    root = parse_args().root.resolve()
    if not root.is_dir():
        print(f"ERROR: root is not a directory: {root}", file=sys.stderr)
        return 2
    findings = validate(root)
    findings += validate_repository_shape(root)
    findings += git_diff_check(root, cached=False)
    findings += git_diff_check(root, cached=True)
    findings = sorted(findings, key=lambda finding: (finding.path, finding.code, finding.detail))
    if findings:
        for finding in findings:
            print(finding.render())
        print(f"FAIL: {len(findings)} repository finding(s).")
        return 1
    print("PASS: repository validation completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
