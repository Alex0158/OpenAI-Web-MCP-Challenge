#!/usr/bin/env python3
"""Unit tests for repository governance validators."""

from __future__ import annotations

import tempfile
import subprocess
import unittest
from pathlib import Path

from validate_docs import validate_english, validate_markdown, validate_tasks


class ValidatorTests(unittest.TestCase):
    def test_markdown_accepts_a_resolved_relative_link(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            docs = root / "Docs"
            docs.mkdir()
            (docs / "target.md").write_text("# Target\n", encoding="utf-8")
            (docs / "source.md").write_text("# Source\n\n[Target](target.md)\n", encoding="utf-8")
            self.assertEqual(validate_markdown(root), [])

    def test_markdown_reports_a_missing_relative_link(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            docs = root / "Docs"
            docs.mkdir()
            (docs / "source.md").write_text("# Source\n\n[Missing](missing.md)\n", encoding="utf-8")
            codes = {finding.code for finding in validate_markdown(root)}
            self.assertIn("MD_LINK", codes)

    def test_markdown_allows_an_explicit_hard_break_but_rejects_other_trailing_space(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            docs = root / "Docs"
            docs.mkdir()
            (docs / "valid.md").write_text("# Valid  \n\nText.\n", encoding="utf-8")
            (docs / "invalid.md").write_text("# Invalid \n", encoding="utf-8")
            findings = validate_markdown(root)
            self.assertEqual(
                [(finding.code, finding.path) for finding in findings],
                [("TRAILING_WS", "Docs/invalid.md")],
            )

    def test_active_non_english_text_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            docs = root / "Docs"
            docs.mkdir()
            non_english = "".join(chr(codepoint) for codepoint in (0x975E, 0x82F1, 0x6587))
            (docs / "new.md").write_text(
                f"# English title\n\n{non_english}.\n", encoding="utf-8"
            )
            codes = {finding.code for finding in validate_english(root)}
            self.assertEqual(codes, {"CJK"})

    def test_git_index_scope_excludes_untracked_collaborator_content(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            docs = root / "Docs"
            docs.mkdir()
            subprocess.run(["git", "init", "--quiet"], cwd=root, check=True)
            (docs / "tracked.md").write_text("# Tracked\n", encoding="utf-8")
            subprocess.run(["git", "add", "Docs/tracked.md"], cwd=root, check=True)
            non_english = "".join(chr(codepoint) for codepoint in (0x975E, 0x82F1, 0x6587))
            (docs / "untracked.md").write_text(
                f"# Untracked\n\n{non_english}.\n", encoding="utf-8"
            )
            self.assertEqual(validate_english(root), [])

    def test_task_validator_rejects_an_invalid_lifecycle(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            tasks = root / "Docs/Tasks"
            tasks.mkdir(parents=True)
            (tasks / "README.md").write_text("# Tasks\n", encoding="utf-8")
            (tasks / "TASK-001-example.md").write_text(
                """# TASK-001: Example

## Task Control

- Type: `implementation`
- Lifecycle: `almost_done`
- Priority: `P0`
- Owner: Team
- Current increment: Implement the example.
- Next gate: Verification passes.
- Dependencies: None.

## 4. Non-goals

None.

## 5. Verification and closure

Verify.

## 6. Reopen condition

Reopen on regression.
""",
                encoding="utf-8",
            )
            codes = {finding.code for finding in validate_tasks(root)}
            self.assertIn("TASK_LIFECYCLE", codes)
            self.assertIn("TASK_INDEX", codes)


if __name__ == "__main__":
    unittest.main()
