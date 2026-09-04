#!/usr/bin/env python3
"""Unit tests for the sensitive-pattern scanner."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scan_sensitive_patterns import scan


class SensitivePatternScannerTests(unittest.TestCase):
    def test_reports_a_key_without_rendering_its_value(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            secret = "sk-" + "abcdefghijklmnopqrstuvwxyz123456"
            (root / "fixture.txt").write_text(secret, encoding="utf-8")
            findings = scan(root)
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].code, "OPENAI_KEY")
            self.assertNotIn(secret, findings[0].render())

    def test_skips_binary_and_symlink_content(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            secret = "ghp_" + "abcdefghijklmnopqrstuvwxyz123456"
            binary = root / "binary.bin"
            binary.write_bytes(b"\xff\xfe" + secret.encode("utf-8"))
            external = root / "external.txt"
            external.write_text(secret, encoding="utf-8")
            link = root / "linked.txt"
            link.symlink_to(external)
            findings = scan(root)
            self.assertEqual([finding.path for finding in findings], ["external.txt"])

    def test_ignores_repository_task_and_evidence_identifiers(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "records.md").write_text(
                "\n".join(
                    (
                        "`sk-task-066-cp12-canvas-mission-fresh.sqlite`",
                        "`sk-evid-053-cp12-canvas-mission-state-readback-runtime-verification`",
                    )
                ),
                encoding="utf-8",
            )
            self.assertEqual(scan(root), [])

    def test_distinguishes_a_pem_header_from_a_complete_private_key_block(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            header = "-----BEGIN " + "PRIVATE KEY-----"
            footer = "-----END " + "PRIVATE KEY-----"
            (root / "header.txt").write_text(header, encoding="utf-8")
            (root / "block.txt").write_text(
                "\n".join((header, "A" * 32, "B" * 32, footer)), encoding="utf-8"
            )
            findings = scan(root)
            self.assertEqual([(finding.code, finding.path) for finding in findings], [("PRIVATE_KEY", "block.txt")])


if __name__ == "__main__":
    unittest.main()
