"use client";

import { createContinuationPrompt } from "@webmcp-challenge/host-sdk/client";

export default function Page() {
  async function testPrompt() {
    const prompt = createContinuationPrompt();
    const result = await prompt.show({
      title: "Continue this workflow?",
      reason: "A later step is ready for your review.",
    });
    alert(result.action);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Host SDK preview</h1>
      <p>Click the button to open the SDK browser prompt.</p>
      <button type="button" onClick={testPrompt}>
        Test SDK prompt
      </button>
    </main>
  );
}
