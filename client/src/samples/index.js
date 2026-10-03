// Cached responses in the real API shape; set `image` once a sample image is added.
const grade = (answers, keywords) =>
  answers.map((a, i) => {
    const hit = keywords[i].some((k) => a.text.toLowerCase().includes(k));
    return {
      id: a.id,
      verdict: hit ? 'correct' : 'incorrect',
      feedback: hit ? 'Spot on.' : 'Revisit this part of the diagram.',
    };
  });

const plantParts = [
  { label: 'Nucleus', meaning: "Controls the cell's activities" },
  { label: 'Chloroplast', meaning: 'Makes food using sunlight' },
  { label: 'Cell wall', meaning: 'Rigid outer layer that gives shape' },
  { label: 'Vacuole', meaning: 'Stores water and nutrients' },
];

export const SAMPLES = [
  {
    id: 'plant-cell',
    name: 'Plant cell',
    image: null,
    explain: {
      title: 'Plant cell',
      diagramType: 'labelled-diagram',
      parts: plantParts,
      explanation:
        'A plant cell is like a tiny factory. The nucleus is the manager, chloroplasts cook food from sunlight, the vacuole is the storeroom, and the cell wall is the strong outer fence.',
      questions: [
        { id: 'q1', text: 'Which part controls the cell and why?', targetPart: 'Nucleus' },
        { id: 'q2', text: 'What does the chloroplast make?', targetPart: 'Chloroplast' },
        { id: 'q3', text: 'Why does a plant cell need a cell wall?', targetPart: 'Cell wall' },
      ],
    },
    check: (answers) => {
      const results = grade(answers, [['nucleus'], ['food', 'sugar', 'glucose'], ['shape', 'support', 'rigid']]);
      return {
        results,
        score: results.filter((r) => r.verdict === 'correct').length,
        challenge: 'What would happen if a plant cell had no chloroplasts?',
        revisionCard: plantParts.map((p) => ({ term: p.label, meaning: p.meaning })),
      };
    },
  },
];
