#!/usr/bin/env python3
"""Validate active OpenAI-WebMCP documentation and governance structure."""

from __future__ import annotations

import hashlib
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import unquote


CJK_RE = re.compile("[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]")
MARKDOWN_LINK_RE = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
SCHEME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:")
TASK_FILENAME_RE = re.compile(r"^(TASK-\d{3})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$")
TASK_H1_RE = re.compile(r"^# (TASK-\d{3}): .+$", re.MULTILINE)
TEXT_SUFFIXES = {
    ".css",
    ".env",
    ".example",
    ".html",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".py",
    ".sh",
    ".sql",
    ".toml",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml",
}
ACTIVE_ROOT_FILES = {".gitignore", ".node-version", "AGENTS.md", "README.md"}
ACTIVE_DIRECTORIES = {".github", "Docs", "reentry-core", "scripts"}
IGNORED_PARTS = {".git", ".next", "build", "coverage", "dist", "node_modules"}
REQUIRED_PATHS = (
    ".node-version",
    ".github/workflows/quality.yml",
    "AGENTS.md",
    "README.md",
    "Docs/README.md",
    "Docs/Core/00-current-status.md",
    "Docs/Decisions/README.md",
    "Docs/Development/README.md",
    "Docs/Engineering/README.md",
    "Docs/Engineering/01-development-standard.md",
    "Docs/Engineering/02-testing-and-verification.md",
    "Docs/Engineering/03-primary-development-runbook.md",
    "Docs/Tasks/README.md",
    "reentry-core/README.md",
    "reentry-core/package.json",
)
LEGACY_CJK_HASHES = {
    "Docs/01-official-rules.md": "0ee4a95a5778f9e2fd21ac1b253b9f33c504c628998625d25c8d97e15e8184dd",
    "Docs/02-submission-evaluation-strategy.md": "b5004bb8e03162989d55066643348d0104cfd01a1c7d25e49281801594d09224",
    "Docs/03-technical-build-verification.md": "12b98a4c7e6b8a000b2c9b4d2867308d226b67d0a692916afc26b76e669a8b0f",
    "Docs/04-research-judgment-and-project-options.md": "c92b52f53cd600289dd4528684413c882155e39562c804fe8130d6a4b1b065fd",
    "Docs/05-requirement-evidence-audit.md": "42bdff68448bc5aa26a672d0bb99665889e4c690890814ae2637b87e7ad959f2",
}
TASK_TYPES = {
    "implementation",
    "defect",
    "investigation",
    "risk",
    "decision",
    "documentation",
    "verification",
    "operations",
}
TASK_LIFECYCLES = {
    "pending",
    "in_progress",
    "verification_pending",
    "blocked",
    "closed",
    "not_planned",
}
TASK_PRIORITIES = {"P0", "P1", "P2"}
TERMINAL_TASK_LIFECYCLES = {"closed", "not_planned"}


@dataclass(frozen=True)
class Finding:
    code: str
    path: str
    detail: str

    def render(self) -> str:
        return f"{self.code}: {self.path}: {self.detail}"


def is_active_path(path: Path, root: Path) -> bool:
    try:
        relative = path.relative_to(root)
    except ValueError:
        return False
    if any(part in IGNORED_PARTS for part in relative.parts):
        return False
    if len(relative.parts) == 1:
        return relative.as_posix() in ACTIVE_ROOT_FILES
    return relative.parts[0] in ACTIVE_DIRECTORIES


def iter_active_files(root: Path):
    if (root / ".git").exists():
        result = subprocess.run(
            ["git", "ls-files", "-z"],
            cwd=root,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        if result.returncode == 0:
            for raw_path in sorted(result.stdout.split(b"\0")):
                if not raw_path:
                    continue
                path = root / raw_path.decode("utf-8")
                if path.is_file() and is_active_path(path, root):
                    yield path
            return
    for path in sorted(root.rglob("*")):
        if path.is_file() and is_active_path(path, root):
            yield path


def read_text(path: Path) -> str | None:
    if path.suffix.lower() not in TEXT_SUFFIXES and path.name not in ACTIVE_ROOT_FILES:
        return None
    try:
        return path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return None


def validate_required_paths(root: Path) -> list[Finding]:
    return [
        Finding("REQUIRED_PATH", relative, "required project authority is missing")
        for relative in REQUIRED_PATHS
        if not (root / relative).is_file()
    ]


def validate_markdown(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in iter_active_files(root):
        if path.suffix.lower() != ".md":
            continue
        relative = path.relative_to(root).as_posix()
        text = read_text(path)
        if text is None:
            findings.append(Finding("MD_UTF8", relative, "cannot be read as UTF-8"))
            continue
        h1_count = sum(1 for line in text.splitlines() if line.startswith("# "))
        if h1_count != 1:
            findings.append(Finding("MD_H1", relative, f"expected one H1, found {h1_count}"))
        for line_number, line in enumerate(text.splitlines(), start=1):
            trailing = line[len(line.rstrip(" \t")) :]
            if trailing and trailing != "  ":
                findings.append(
                    Finding("TRAILING_WS", relative, f"line {line_number} has trailing whitespace")
                )
        for raw_target in MARKDOWN_LINK_RE.findall(text):
            target = raw_target.strip()
            if target.startswith("<") and target.endswith(">"):
                target = target[1:-1]
            if not target or target.startswith("#") or SCHEME_RE.match(target):
                continue
            path_part = unquote(target.split("#", 1)[0])
            if not path_part:
                continue
            resolved = (path.parent / path_part).resolve()
            if not resolved.exists():
                findings.append(
                    Finding("MD_LINK", relative, f"missing relative target {raw_target!r}")
                )
    return findings


def validate_english(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in iter_active_files(root):
        text = read_text(path)
        if text is None or not CJK_RE.search(text):
            continue
        relative = path.relative_to(root).as_posix()
        expected_hash = LEGACY_CJK_HASHES.get(relative)
        if expected_hash is None:
            findings.append(Finding("CJK", relative, "active project-authored text must be English"))
            continue
        actual_hash = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual_hash != expected_hash:
            findings.append(
                Finding(
                    "LEGACY_CJK_CHANGED",
                    relative,
                    "legacy non-English snapshot changed without an English canonical replacement",
                )
            )
    return findings


def task_control_value(text: str, field: str) -> str | None:
    match = re.search(rf"^- {re.escape(field)}: `?([^`\n]+?)`?$", text, re.MULTILINE)
    return match.group(1).strip() if match else None


def validate_tasks(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    task_directory = root / "Docs/Tasks"
    index_path = task_directory / "README.md"
    index_text = read_text(index_path) or ""
    active_paths = set(iter_active_files(root))
    for path in sorted(task_directory.glob("TASK-*.md")):
        if path not in active_paths:
            continue
        relative = path.relative_to(root).as_posix()
        text = read_text(path) or ""
        filename_match = TASK_FILENAME_RE.fullmatch(path.name)
        h1_match = TASK_H1_RE.search(text)
        if filename_match is None:
            findings.append(Finding("TASK_FILENAME", relative, "invalid task filename"))
            continue
        task_id = filename_match.group(1)
        if h1_match is None or h1_match.group(1) != task_id:
            findings.append(Finding("TASK_H1", relative, "task ID does not match the H1"))
        required_fields = ("Type", "Lifecycle", "Priority", "Owner", "Current increment", "Next gate", "Dependencies")
        values = {field: task_control_value(text, field) for field in required_fields}
        for field, value in values.items():
            if value is None:
                findings.append(Finding("TASK_CONTROL", relative, f"missing Task Control field {field}"))
        if values["Type"] is not None and values["Type"] not in TASK_TYPES:
            findings.append(Finding("TASK_TYPE", relative, f"invalid type {values['Type']!r}"))
        if values["Lifecycle"] is not None and values["Lifecycle"] not in TASK_LIFECYCLES:
            findings.append(
                Finding("TASK_LIFECYCLE", relative, f"invalid lifecycle {values['Lifecycle']!r}")
            )
        if values["Priority"] is not None and values["Priority"] not in TASK_PRIORITIES:
            findings.append(Finding("TASK_PRIORITY", relative, f"invalid priority {values['Priority']!r}"))
        for heading in ("## 4. Non-goals", "## 5. Verification and closure", "## 6. Reopen condition"):
            if heading not in text:
                findings.append(Finding("TASK_SECTION", relative, f"missing section {heading!r}"))
        occurrences = index_text.count(f"({path.name})")
        lifecycle = values["Lifecycle"]
        expected = 0 if lifecycle in TERMINAL_TASK_LIFECYCLES else 1
        if occurrences != expected:
            findings.append(
                Finding(
                    "TASK_INDEX",
                    relative,
                    f"expected {expected} non-terminal index link(s), found {occurrences}",
                )
            )
    return findings


def validate_index_membership(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    active_paths = set(iter_active_files(root))
    checks = (
        ("Docs/Decisions", "ADR-*.md", "Docs/Decisions/README.md", "ADR_INDEX"),
        ("Docs/Development", "*.md", "Docs/Development/README.md", "DEVELOPMENT_INDEX"),
        ("Docs/Engineering", "*.md", "Docs/Engineering/README.md", "ENGINEERING_INDEX"),
    )
    for directory_text, pattern, index_text, code in checks:
        directory = root / directory_text
        index_path = root / index_text
        index = read_text(index_path) or ""
        for path in sorted(directory.glob(pattern)):
            if path.name == "README.md":
                continue
            if path not in active_paths:
                continue
            relative = path.relative_to(root).as_posix()
            if f"({path.name})" not in index:
                findings.append(Finding(code, relative, f"not linked from {index_text}"))
    return findings


def validate(root: Path) -> list[Finding]:
    findings = validate_required_paths(root)
    findings += validate_markdown(root)
    findings += validate_english(root)
    findings += validate_tasks(root)
    findings += validate_index_membership(root)
    return sorted(findings, key=lambda finding: (finding.path, finding.code, finding.detail))
