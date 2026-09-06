import raw from '@/content/chapters.json';
import commonRaw from '@/content/common-issues.json';
import codingRaw from '@/content/coding-exercises.json';
import scenarioRaw from '@/content/scenarios.json';
import issueRaw from '@/content/issue-checkpoints.json';
import lessonRaw from '@/content/lessons.json';

export const chapters = [...raw, commonRaw, codingRaw];
export const lessons = lessonRaw;

export const scenarios = scenarioRaw.scenarios.map((scenario) => ({
  ...scenario,
  quiz: Array.from({ length: Math.max(5, scenario.quiz.length) }, (_, index) => ({
    ...scenario.quiz[index % scenario.quiz.length],
    question: scenario.quiz[index % scenario.quiz.length].question + (index >= scenario.quiz.length ? ` (check ${index + 1})` : ''),
  })),
}));
export const challenges = scenarioRaw.challenges.length ? scenarioRaw.challenges : codingRaw.questions.slice(0, 8).map((question, index) => ({
  id: `drill-${question.id}`,
  title: question.topic || `Code decision ${index + 1}`,
  area: 'RPGLE / CLLE', level: question.level, prompt: question.question,
  code: question.freeFormat || question.example || question.fixedFormat || '',
  language: question.fixedFormat ? 'RPGLE' : 'CLLE',
  options: ['Validate the normal and failure paths before writing', 'Ignore the boundary case', 'Grant broad authority', 'Retry forever'], correct: 0,
  explanation: 'A production-ready exercise must account for normal, boundary, and failure behavior. Use the requirements and IBM references to refine the implementation.',
  tests: (question.testCases || []).slice(0, 3).map((item) => ({ input: item, expected: 'Documented outcome on your IBM i test system', why: 'This case checks behavior that the browser cannot execute.' })),
  sources: question.sources || [],
}));
export const issueSections = issueRaw;
