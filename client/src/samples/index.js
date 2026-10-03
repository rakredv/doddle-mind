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
    cards: {
      cards: [
        { id: 'c1', front: 'Nucleus', back: "The cell's control centre. It holds the instructions that run the cell." },
        { id: 'c2', front: 'What do chloroplasts do?', back: 'They use sunlight to make food for the plant.' },
        { id: 'c3', front: 'Cell wall', back: 'A strong outer layer that gives the plant cell its shape and support.' },
        { id: 'c4', front: 'Vacuole', back: 'A storeroom that holds water and nutrients.' },
        { id: 'c5', front: 'Which part is only in plant cells?', back: 'The cell wall and the chloroplasts, which animal cells do not have.' },
      ],
    },
    mcq: {
      questions: [
        {
          id: 'm1', text: 'Which part controls the activities of the cell?',
          options: ['Vacuole', 'Nucleus', 'Cell wall', 'Chloroplast'], answerIndex: 1,
          explanation: 'The nucleus is the control centre of the cell.',
        },
        {
          id: 'm2', text: 'What do chloroplasts make using sunlight?',
          options: ['Food', 'Water', 'Protein walls', 'Heat'], answerIndex: 0,
          explanation: 'Chloroplasts turn sunlight into food for the plant.',
        },
        {
          id: 'm3', text: 'Which part gives a plant cell its fixed shape?',
          options: ['Nucleus', 'Vacuole', 'Chloroplast', 'Cell wall'], answerIndex: 3,
          explanation: 'The rigid cell wall supports and shapes the cell.',
        },
        {
          id: 'm4', text: 'Where does a plant cell store water and nutrients?',
          options: ['Vacuole', 'Nucleus', 'Cell wall', 'Chloroplast'], answerIndex: 0,
          explanation: 'The vacuole works like a storeroom.',
        },
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
