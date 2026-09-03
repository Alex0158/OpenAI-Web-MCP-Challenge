#!/usr/bin/env python3
"""Self-tests for the Sleepless Kingdom documentation validator.

Run with:
    python3 scripts/test_validate_game_docs.py
"""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import validate_game_docs as validator  # noqa: E402


def write(root: Path, relative: str, text: str) -> None:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def minimal_tree(root: Path) -> None:
    """Create the smallest tree that satisfies every required path."""
    for required in validator.REQUIRED_PATHS:
        title = Path(required).stem.replace("-", " ").title()
        write(root, required, f"# {title}\n\nBody.\n")


def codes(root: Path) -> set[str]:
    findings, _ = validator.validate(root)
    return {finding.code for finding in findings}


class ValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self._temp = tempfile.TemporaryDirectory()
        self.root = Path(self._temp.name)
        minimal_tree(self.root)

    def tearDown(self) -> None:
        self._temp.cleanup()

    def test_minimal_tree_passes(self) -> None:
        self.assertEqual(codes(self.root), set())

    def test_missing_required_path_is_reported(self) -> None:
        (self.root / "Docs" / "00-Workflow" / "01-session-runbook.md").unlink()
        self.assertIn("REQUIRED_PATH", codes(self.root))

    def test_second_h1_is_reported(self) -> None:
        write(self.root, "Docs/extra.md", "# One\n\n# Two\n")
        self.assertIn("MD_H1", codes(self.root))

    def test_h1_inside_a_fence_is_not_counted(self) -> None:
        write(self.root, "Docs/extra.md", "# One\n\n```text\n# Not a heading\n```\n")
        self.assertEqual(codes(self.root), set())

    def test_next_generated_agent_block_is_not_counted_as_a_second_h1(self) -> None:
        write(
            self.root,
            "AGENTS.md",
            "# One\n\n"
            "<!-- BEGIN:nextjs-agent-rules -->\n"
            "# Generated guidance\n"
            "<!-- END:nextjs-agent-rules -->\n",
        )
        self.assertEqual(codes(self.root), set())

    def test_broken_relative_link_is_reported(self) -> None:
        write(self.root, "Docs/extra.md", "# One\n\n[gone](./missing-file.md)\n")
        self.assertIn("MD_LINK", codes(self.root))

    def test_link_with_anchor_resolves_against_the_file(self) -> None:
        write(self.root, "Docs/extra.md", "# One\n\n[map](./README.md#authority-order)\n")
        self.assertEqual(codes(self.root), set())

    def test_two_space_hard_break_is_allowed(self) -> None:
        write(self.root, "Docs/extra.md", "# One\n\n**Role:** Thing  \n**Status:** Active\n")
        self.assertEqual(codes(self.root), set())

    def test_single_trailing_space_is_reported(self) -> None:
        write(self.root, "Docs/extra.md", "# One\n\nText \n")
        self.assertIn("TRAILING_WS", codes(self.root))

    def test_cjk_outside_the_allowlist_is_reported(self) -> None:
        write(self.root, "Docs/extra.md", "# One\n\n\u6e2c\u8a66\n")
        self.assertIn("CONTENT_LANGUAGE", codes(self.root))

    def test_fenced_cjk_in_the_allowlisted_source_is_permitted(self) -> None:
        write(
            self.root,
            "Docs/Blueprint/01-raw-discussion-reference.md",
            "# Raw Discussion Reference\n\n```text\n\u6e2c\u8a66\n```\n",
        )
        self.assertEqual(codes(self.root), set())

    def test_unfenced_cjk_in_the_allowlisted_source_is_reported(self) -> None:
        write(
            self.root,
            "Docs/Blueprint/01-raw-discussion-reference.md",
            "# Raw Discussion Reference\n\n\u6e2c\u8a66\n",
        )
        self.assertIn("CONTENT_LANGUAGE", codes(self.root))

    def test_valid_task_control_passes_and_reports(self) -> None:
        write(
            self.root,
            "Docs/Tasks/SK-TASK-001-probe-runtime.md",
            "# SK-TASK-001: Probe Runtime\n\n"
            "## Task Control\n\n"
            "- Lifecycle state: `pending`\n"
            "- Closure type: `runtime_verified`\n"
            "- Checkpoint: `CP-02`\n"
            "- Owner: Game owner\n"
            "- Current increment: Probe the page capability.\n"
            "- Next gate: The probe result is recorded.\n",
        )
        findings, records = validator.validate(self.root)
        self.assertEqual({finding.code for finding in findings}, set())
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["id"], "SK-TASK-001")
        self.assertEqual(records[0]["checkpoint"], "CP-02")

    def test_invalid_lifecycle_is_reported(self) -> None:
        write(
            self.root,
            "Docs/Tasks/SK-TASK-001-probe-runtime.md",
            "# SK-TASK-001: Probe Runtime\n\n"
            "## Task Control\n\n"
            "- Lifecycle state: `done`\n"
            "- Closure type: `integrated`\n"
            "- Checkpoint: `CP-02`\n"
            "- Owner: Game owner\n"
            "- Current increment: Something.\n"
            "- Next gate: Something.\n",
        )
        self.assertIn("TASK_LIFECYCLE", codes(self.root))

    def test_missing_task_control_field_is_reported(self) -> None:
        write(
            self.root,
            "Docs/Tasks/SK-TASK-001-probe-runtime.md",
            "# SK-TASK-001: Probe Runtime\n\n"
            "## Task Control\n\n"
            "- Lifecycle state: `pending`\n"
            "- Closure type: `integrated`\n"
            "- Owner: Game owner\n",
        )
        self.assertIn("TASK_CONTROL", codes(self.root))

    def test_unfilled_task_placeholder_is_reported(self) -> None:
        write(
            self.root,
            "Docs/Tasks/SK-TASK-001-probe-runtime.md",
            "# SK-TASK-001: Probe Runtime\n\n"
            "## Task Control\n\n"
            "- Lifecycle state: `pending`\n"
            "- Closure type: `integrated`\n"
            "- Checkpoint: `CP-02`\n"
            "- Owner: <owner>\n"
            "- Current increment: Something.\n"
            "- Next gate: Something.\n",
        )
        self.assertIn("TASK_PLACEHOLDER", codes(self.root))

    def test_bad_task_filename_is_reported(self) -> None:
        write(self.root, "Docs/Tasks/task-one.md", "# Task One\n\nBody.\n")
        self.assertIn("TASK_FILENAME", codes(self.root))

    def test_bad_issue_filename_is_reported(self) -> None:
        write(self.root, "Docs/Issues/pending/broken.md", "# Broken\n\nBody.\n")
        self.assertIn("ISSUE_FILENAME", codes(self.root))

    def test_issue_body_must_name_its_own_id(self) -> None:
        write(
            self.root,
            "Docs/Issues/pending/SK-ISSUE-001-cargo-duplicated.md",
            "# Cargo Duplicated\n\nBody without the identifier.\n",
        )
        self.assertIn("ISSUE_FILENAME", codes(self.root))

    def test_resolved_state_in_pending_directory_is_reported(self) -> None:
        write(
            self.root,
            "Docs/Issues/pending/SK-ISSUE-001-cargo-duplicated.md",
            "# SK-ISSUE-001: Cargo Duplicated\n\n- State: `resolved`\n",
        )
        self.assertIn("ISSUE_STATE", codes(self.root))

    def test_bad_decision_filename_is_reported(self) -> None:
        write(self.root, "Docs/Decisions/ADR-GAME-1-short.md", "# Adr\n\nBody.\n")
        self.assertIn("DECISION_FILENAME", codes(self.root))

    def test_ignored_directories_are_skipped(self) -> None:
        write(self.root, "node_modules/pkg/readme.md", "# One\n\n# Two\n")
        self.assertEqual(codes(self.root), set())


if __name__ == "__main__":
    unittest.main(verbosity=2)
