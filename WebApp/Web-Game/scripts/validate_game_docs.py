#!/usr/bin/env python3
"""Mechanical documentation validation for the Sleepless Kingdom application.

This validator is scoped to `WebApp/Web-Game/`. The outer repository validators do
not scan this directory, so this script is the application's own mechanical gate.

Usage:
    python3 scripts/validate_game_docs.py --root .
    python3 scripts/validate_game_docs.py --root . --report
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

CJK_RE = re.compile("[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]")
MARKDOWN_LINK_RE = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
SCHEME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:")
FENCE_RE = re.compile(r"^\s*(```|~~~)")
# A Markdown hard line break is exactly two trailing spaces after visible content.
HARD_BREAK_RE = re.compile(r"\S {2}$")

TASK_FILENAME_RE = re.compile(r"^(SK-TASK-\d{3})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$")
ISSUE_FILENAME_RE = re.compile(r"^(SK-ISSUE-\d{3})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$")
EVIDENCE_FILENAME_RE = re.compile(r"^(SK-EVID-\d{3})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$")
DECISION_FILENAME_RE = re.compile(r"^(ADR-GAME-\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$")

TASK_CONTROL_HEADING = "## Task Control"
TASK_FIELD_RE = re.compile(r"^- (?P<key>[A-Za-z ]+): (?P<value>.+)$")
BACKTICKED_RE = re.compile(r"^`(?P<value>[^`]+)`$")
CHECKPOINT_RE = re.compile(r"^(CP-\d{2}|none)$")

TASK_FIELDS = (
    "Lifecycle state",
    "Closure type",
    "Checkpoint",
    "Owner",
    "Current increment",
    "Next gate",
)
TASK_LIFECYCLES = {
    "pending",
    "in_progress",
    "verification_pending",
    "blocked",
    "verified",
}
TERMINAL_LIFECYCLES = {"verified"}
TASK_CLOSURE_TYPES = {
    "answered",
    "specified",
    "decided",
    "integrated",
    "contract_verified",
    "runtime_verified",
    "slice_verified",
    "hosted_verified",
    "rejected",
    "deferred",
    "parent_router",
}
ISSUE_STATES = {
    "proposed",
    "triaged",
    "ready",
    "in_progress",
    "blocked",
    "verification_pending",
    "resolved",
    "not_planned",
}
ISSUE_STATE_DIRECTORIES = {
    "pending": ISSUE_STATES - {"resolved", "not_planned"},
    "resolved": {"resolved"},
    "not-planned": {"not_planned"},
}

# Files permitted to carry non-English owner source, and only inside fenced blocks.
FENCED_CJK_ALLOWLIST = {"Docs/Blueprint/01-raw-discussion-reference.md"}

# Next.js writes an instructional block into AGENTS.md. It is deliberately
# outside this application's authored documentation surface and may contain a
# top-level heading of its own. Keep the generated block intact while excluding
# it from structural and language checks.
GENERATED_AGENT_BLOCK = (
    "<!-- BEGIN:nextjs-agent-rules -->",
    "<!-- END:nextjs-agent-rules -->",
)

IGNORED_PARTS = {".git", ".next", "build", "coverage", "dist", "node_modules", "var"}

REQUIRED_PATHS = (
    "AGENTS.md",
    "CLAUDE.md",
    "README.md",
    "Docs/README.md",
    "Docs/00-current-status.md",
    "Docs/00-Workflow/README.md",
    "Docs/00-Workflow/01-session-runbook.md",
    "Docs/Decisions/README.md",
    "Docs/Engineering/README.md",
    "Docs/Engineering/08-development-roadmap-and-checkpoints.md",
    "Docs/Engineering/09-mvp-contract-sheet.md",
    "Docs/Evidence/README.md",
    "Docs/Issues/README.md",
    "Docs/Mechanics/README.md",
    "Docs/Tasks/README.md",
    "Docs/Templates/README.md",
    "scripts/validate_game_docs.py",
)


@dataclass(frozen=True)
class Finding:
    code: str
    path: str
    detail: str

    def render(self) -> str:
        return f"{self.code}: {self.path}: {self.detail}"


def is_ignored(relative: Path) -> bool:
    return any(part in IGNORED_PARTS for part in relative.parts)


def iter_files(root: Path):
    for path in sorted(root.rglob("*")):
        relative = path.relative_to(root)
        if is_ignored(relative):
            continue
        if path.is_file():
            yield path, relative


def read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return None


def fenced_line_numbers(lines: list[str]) -> set[int]:
    """Return 1-indexed line numbers that sit inside a fenced code block."""
    inside: set[int] = set()
    open_fence = False
    for index, line in enumerate(lines, start=1):
        if FENCE_RE.match(line):
            inside.add(index)
            open_fence = not open_fence
            continue
        if open_fence:
            inside.add(index)
    return inside


def generated_agent_line_numbers(lines: list[str]) -> set[int]:
    """Return 1-indexed lines inside a Next.js-generated agent block."""
    inside: set[int] = set()
    active = False
    for index, line in enumerate(lines, start=1):
        if line.strip() == GENERATED_AGENT_BLOCK[0]:
            active = True
            inside.add(index)
            continue
        if active:
            inside.add(index)
            if line.strip() == GENERATED_AGENT_BLOCK[1]:
                active = False
    return inside


def validate_markdown(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path, relative in iter_files(root):
        if path.suffix.lower() != ".md":
            continue
        text = read_text(path)
        display = relative.as_posix()
        if text is None:
            findings.append(Finding("MD_UTF8", display, "cannot be read as UTF-8"))
            continue
        lines = text.splitlines()
        fenced = fenced_line_numbers(lines)
        generated = generated_agent_line_numbers(lines)
        h1_count = sum(
            1
            for number, line in enumerate(lines, start=1)
            if line.startswith("# ") and number not in fenced and number not in generated
        )
        if h1_count != 1:
            findings.append(
                Finding("MD_H1", display, f"expected exactly one H1, found {h1_count}")
            )
        for number, line in enumerate(lines, start=1):
            if line == line.rstrip() or HARD_BREAK_RE.search(line):
                continue
            findings.append(
                Finding(
                    "TRAILING_WS",
                    display,
                    f"line {number} has trailing whitespace that is not a two-space hard break",
                )
            )
        for number, line in enumerate(lines, start=1):
            if number in fenced or number in generated:
                continue
            for raw_target in MARKDOWN_LINK_RE.findall(line):
                target = raw_target.split(" ", 1)[0].strip()
                if not target or target.startswith("#") or SCHEME_RE.match(target):
                    continue
                anchor_free = target.split("#", 1)[0]
                if not anchor_free:
                    continue
                resolved = (path.parent / anchor_free).resolve()
                if not resolved.exists():
                    findings.append(
                        Finding("MD_LINK", display, f"line {number} missing target {target!r}")
                    )
    return findings


def validate_language(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path, relative in iter_files(root):
        display = relative.as_posix()
        if CJK_RE.search(display):
            findings.append(Finding("PATH_LANGUAGE", display, "path contains CJK characters"))
        if path.suffix.lower() not in {".md", ".py", ".ts", ".tsx", ".js", ".mjs", ".json", ".sql"}:
            continue
        text = read_text(path)
        if text is None or not CJK_RE.search(text):
            continue
        lines = text.splitlines()
        allowed_fenced = display in FENCED_CJK_ALLOWLIST
        fenced = fenced_line_numbers(lines) if allowed_fenced else set()
        generated = generated_agent_line_numbers(lines)
        for number, line in enumerate(lines, start=1):
            if not CJK_RE.search(line):
                continue
            if (allowed_fenced and number in fenced) or number in generated:
                continue
            findings.append(
                Finding(
                    "CONTENT_LANGUAGE",
                    display,
                    f"line {number}: project-authored text must be English",
                )
            )
    return findings


def validate_topology(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for required in REQUIRED_PATHS:
        if not (root / required).exists():
            findings.append(Finding("REQUIRED_PATH", required, "required file is missing"))
    root_git = root / ".git"
    for path, relative in iter_files(root):
        display = relative.as_posix()
        if path.is_symlink():
            findings.append(Finding("SYMLINK", display, "symbolic links require explicit review"))
    for path in sorted(root.rglob(".git")):
        if path != root_git:
            findings.append(
                Finding("NESTED_GIT", path.relative_to(root).as_posix(), "nested Git boundary")
            )
    return findings


def parse_task_control(text: str) -> tuple[dict[str, str], str | None]:
    lines = text.splitlines()
    headings = [index for index, line in enumerate(lines) if line.strip() == TASK_CONTROL_HEADING]
    if len(headings) != 1:
        return {}, f"expected exactly one '{TASK_CONTROL_HEADING}' block, found {len(headings)}"
    fields: dict[str, str] = {}
    for line in lines[headings[0] + 1 :]:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            break
        match = TASK_FIELD_RE.match(stripped)
        if not match:
            break
        fields[match.group("key").strip()] = match.group("value").strip()
    return fields, None


def backticked(value: str) -> str | None:
    match = BACKTICKED_RE.match(value)
    return match.group("value") if match else None


def validate_tasks(root: Path) -> tuple[list[Finding], list[dict[str, str]]]:
    findings: list[Finding] = []
    records: list[dict[str, str]] = []
    tasks_dir = root / "Docs" / "Tasks"
    if not tasks_dir.is_dir():
        return findings, records
    seen: dict[str, str] = {}
    for path in sorted(tasks_dir.glob("*.md")):
        if path.name == "README.md":
            continue
        display = path.relative_to(root).as_posix()
        match = TASK_FILENAME_RE.match(path.name)
        if not match:
            findings.append(
                Finding("TASK_FILENAME", display, "expected SK-TASK-NNN-kebab-title.md")
            )
            continue
        task_id = match.group(1)
        if task_id in seen:
            findings.append(Finding("TASK_DUPLICATE_ID", display, f"{task_id} also in {seen[task_id]}"))
            continue
        seen[task_id] = display
        text = read_text(path)
        if text is None:
            findings.append(Finding("TASK_UTF8", display, "cannot be read as UTF-8"))
            continue
        fields, error = parse_task_control(text)
        if error:
            findings.append(Finding("TASK_CONTROL", display, error))
            continue
        missing = [field for field in TASK_FIELDS if field not in fields]
        if missing:
            findings.append(
                Finding("TASK_CONTROL", display, f"missing field(s): {', '.join(missing)}")
            )
            continue
        lifecycle = backticked(fields["Lifecycle state"])
        closure = backticked(fields["Closure type"])
        checkpoint = backticked(fields["Checkpoint"])
        if lifecycle not in TASK_LIFECYCLES:
            findings.append(
                Finding("TASK_LIFECYCLE", display, f"invalid lifecycle {fields['Lifecycle state']!r}")
            )
            continue
        if closure not in TASK_CLOSURE_TYPES:
            findings.append(
                Finding("TASK_CLOSURE", display, f"invalid closure type {fields['Closure type']!r}")
            )
            continue
        if checkpoint is None or not CHECKPOINT_RE.match(checkpoint):
            findings.append(
                Finding("TASK_CHECKPOINT", display, f"invalid checkpoint {fields['Checkpoint']!r}")
            )
            continue
        for field in ("Owner", "Current increment", "Next gate"):
            if not fields[field] or fields[field].startswith("<"):
                findings.append(
                    Finding("TASK_PLACEHOLDER", display, f"{field} is empty or a placeholder")
                )
        records.append(
            {
                "id": task_id,
                "path": display,
                "lifecycle": lifecycle,
                "closure": closure,
                "checkpoint": checkpoint,
                "owner": fields["Owner"],
                "increment": fields["Current increment"],
                "gate": fields["Next gate"],
            }
        )
    return findings, records


def validate_prefixed_records(
    root: Path, directory: str, pattern: re.Pattern[str], code: str, expected: str
) -> list[Finding]:
    findings: list[Finding] = []
    base = root / directory
    if not base.is_dir():
        return findings
    for path in sorted(base.rglob("*.md")):
        if path.name == "README.md":
            continue
        display = path.relative_to(root).as_posix()
        match = pattern.match(path.name)
        if not match:
            findings.append(Finding(code, display, f"expected {expected}"))
            continue
        text = read_text(path)
        if text is not None and match.group(1) not in text:
            findings.append(Finding(code, display, f"body does not name {match.group(1)}"))
    return findings


def validate_issue_state_directories(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    base = root / "Docs" / "Issues"
    if not base.is_dir():
        return findings
    for directory, allowed in ISSUE_STATE_DIRECTORIES.items():
        state_dir = base / directory
        if not state_dir.is_dir():
            continue
        for path in sorted(state_dir.glob("*.md")):
            display = path.relative_to(root).as_posix()
            text = read_text(path)
            if text is None:
                continue
            found = {state for state in ISSUE_STATES if f"`{state}`" in text}
            if found and not (found & allowed):
                findings.append(
                    Finding(
                        "ISSUE_STATE",
                        display,
                        f"state in {sorted(found)} does not belong in {directory}/",
                    )
                )
    return findings


def validate(root: Path) -> tuple[list[Finding], list[dict[str, str]]]:
    findings = validate_markdown(root)
    findings += validate_language(root)
    findings += validate_topology(root)
    task_findings, records = validate_tasks(root)
    findings += task_findings
    findings += validate_prefixed_records(
        root, "Docs/Issues", ISSUE_FILENAME_RE, "ISSUE_FILENAME", "SK-ISSUE-NNN-kebab-title.md"
    )
    findings += validate_prefixed_records(
        root, "Docs/Evidence", EVIDENCE_FILENAME_RE, "EVIDENCE_FILENAME", "SK-EVID-NNN-kebab-title.md"
    )
    findings += validate_prefixed_records(
        root, "Docs/Decisions", DECISION_FILENAME_RE, "DECISION_FILENAME", "ADR-GAME-NNNN-kebab-title.md"
    )
    findings += validate_issue_state_directories(root)
    return findings, records


def render_report(records: list[dict[str, str]]) -> None:
    active = [record for record in records if record["lifecycle"] not in TERMINAL_LIFECYCLES]
    print(f"Non-terminal tasks: {len(active)} of {len(records)}")
    for record in sorted(active, key=lambda item: item["id"]):
        print(
            f"  {record['id']}  {record['lifecycle']:<20} {record['checkpoint']:<6} "
            f"{record['owner']}"
        )
        print(f"      increment: {record['increment']}")
        print(f"      next gate: {record['gate']}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--report", action="store_true", help="print the derived task view")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        print(f"ERROR: root is not a directory: {root}", file=sys.stderr)
        return 2
    if not (root / "Docs" / "00-current-status.md").exists():
        print(f"ERROR: root is not the Sleepless Kingdom application: {root}", file=sys.stderr)
        return 2
    findings, records = validate(root)
    if args.report:
        render_report(records)
        print()
    findings = sorted(findings, key=lambda finding: (finding.path, finding.code, finding.detail))
    if findings:
        for finding in findings:
            print(finding.render())
        print(f"FAIL: {len(findings)} finding(s).")
        return 1
    print("PASS: Sleepless Kingdom documentation validation completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
