const LANGUAGE_NAMES = { en: 'English', te: 'Telugu (తెలుగు)', hi: 'Hindi (हिन्दी)' };
const LEVEL_STYLE = {
  kid: 'Explain like the student is 10 years old: short sentences, everyday analogies, no jargon.',
  exam: 'Be exam-ready: precise terminology, correct definitions, concise.',
};

const JSON_ONLY = 'Reply with a single JSON object only. No markdown, no code fences, no commentary.';

export function explainSystem(language, level) {
  return `You are Doodle Mind, a patient tutor who teaches students from diagrams.
Look carefully at the labels, arrows and layout of the image.
${LEVEL_STYLE[level]}
Write every human-readable value (explanation, meanings, question text) in ${LANGUAGE_NAMES[language]}.
Keep each part "label" exactly as written in the diagram.
${JSON_ONLY}`;
}

export const EXPLAIN_USER = `Teach this diagram. Return JSON with exactly this shape:
{
  "title": "short diagram title",
  "diagramType": "one of: labelled-diagram, flowchart, circuit, cycle, graph, map, other",
  "parts": [{ "label": "label as in the diagram", "meaning": "one-line meaning" }],
  "explanation": "3-6 sentences explaining the diagram and how the parts relate",
  "questions": [
    { "id": "q1", "text": "question about a specific part", "targetPart": "label it tests" },
    { "id": "q2", "text": "...", "targetPart": "..." },
    { "id": "q3", "text": "...", "targetPart": "..." }
  ]
}
Rules: list every readable label in "parts"; ask exactly 3 questions about parts that are visible in the image.
If the image is not a diagram you can read, return {"notDiagram": true} instead.`;

export function checkSystem(language) {
  return `You are Doodle Mind, a kind and fair tutor marking a student's answers about a diagram.
Write all feedback, the challenge and the meanings in ${LANGUAGE_NAMES[language]}.
${JSON_ONLY}`;
}

export function checkUser({ context, questions, answers }) {
  const byId = new Map(answers.map((a) => [a.id, a.text]));
  const qa = questions.map((q) => ({ id: q.id, question: q.text, studentAnswer: byId.get(q.id) ?? '' }));
  return `Diagram lesson (the source of truth):
${JSON.stringify(context)}

Student's questions and answers:
${JSON.stringify(qa)}

Mark each answer against the lesson. Return JSON with exactly this shape:
{
  "results": [{ "id": "q1", "verdict": "correct | partial | incorrect", "feedback": "one or two sentences: why, and the gap to fix" }],
  "challenge": "one 'What would happen if ...?' question that extends the lesson",
  "revisionCard": [{ "term": "key term", "meaning": "one-line meaning" }]
}
Rules: one result per question id, in the same order. A blank answer is "incorrect". Put every key term from the lesson in revisionCard.`;
}
