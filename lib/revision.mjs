// Exercise reminders reuse the task's own setup and test expectations so they
// stay aligned when an exercise changes. No quiz answers or progress are read.
export function exerciseRevision(question) {
  return {
    points: [...(question.requirements || []), ...(question.hints || []), ...(question.testCases || []).map((test) => `Test expectation: ${test}`)].slice(0, 5),
    mistake: question.trap || 'Treating a successful browser structure check as proof that this exercise works on IBM i.',
    scenario: question.testCases?.[1] || question.testCases?.[0] || question.question,
    answer: 'Work through this case using your own draft. Record the actual output and diagnostics in the test notebook, then compare them with this expected result. Include the setup and failure paths in your explanation.',
  };
}

const escape = (text) => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function revisionHtml(bite) {
  if (!bite) return '';
  return `<details class="quick-revision"><summary>Quick Revision · 2-minute recap</summary><div class="revision-body"><h3>Keep these in mind</h3><ul>${bite.points.map((point) => `<li>${escape(point)}</li>`).join('')}</ul>${bite.example ? `<h3>${escape(bite.example.label)}</h3><pre><code>${escape(bite.example.code)}</code></pre>` : ''}<p><strong>Common mistake:</strong> ${escape(bite.mistake)}</p><h3>Think it through</h3><p>${escape(bite.scenario)}</p><details><summary>Show the reasoning</summary><p>${escape(bite.answer)}</p></details></div></details>`;
}
export function revisionMarkdown(bite) {
  if (!bite) return '';
  return `<details>\n<summary>Quick Revision · 2-minute recap</summary>\n\n### Keep these in mind\n\n${bite.points.map((point) => `- ${point}`).join('\n')}\n\n${bite.example ? `**${bite.example.label}**\n\n\`\`\`text\n${bite.example.code}\n\`\`\`\n\n` : ''}**Common mistake:** ${bite.mistake}\n\n**Think it through:** ${bite.scenario}\n\n<details>\n<summary>Show the reasoning</summary>\n\n${bite.answer}\n\n</details>\n\n</details>\n\n`;
}
