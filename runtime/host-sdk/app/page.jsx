"use client";

import { createContinuationPrompt } from
  "@4xeoz/re-entry-sdk/client";

export default function Page() {
  async function testPrompt() {
    const prompt = createContinuationPrompt();

    const result = await prompt.show({
      title: "Continue this workflow?",
      reason: "A later step is ready for your review.",
    });

    alert(result.action);
  }

  return <button onClick={testPrompt}>Test SDK Prompt</button>;
}
