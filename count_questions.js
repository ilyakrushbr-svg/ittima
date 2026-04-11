
import scenarios from './src/data/scenarios';

const spheres = [
  'phishing', 'social_engineering', 'online_games', 'finance', 'privacy',
  'malware', 'child_safety', 'passwords', 'work_safety', 'deepfakes', 'cyber_fraud'
];
const difficulties = ['easy', 'medium', 'hard'];

const counts = {};

spheres.forEach(s => {
  counts[s] = {};
  difficulties.forEach(d => {
    counts[s][d] = scenarios.filter(q => q.sphere === s && q.difficulty === d).length;
  });
});

console.log(JSON.stringify(counts, null, 2));
