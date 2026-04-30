
import * as fs from 'fs';

const content = fs.readFileSync('src/data/scenarios.ts', 'utf-8');

// Identify scenarios
const scenarioBlocks = content.split(/id: \d+,/);
console.log(`Found ${scenarioBlocks.length - 1} blocks.`);

let optionsMissingFeedback = 0;
let totalOptions = 0;

scenarioBlocks.slice(1).forEach((block, bIdx) => {
    // Find options array
    const optionsMatch = block.match(/options:\s*\[([\s\S]*?)\]\s*(?=},|]$)/);
    if (optionsMatch) {
        const optionsContent = optionsMatch[1];
        // Split by options { }
        const optionBlocks = optionsContent.match(/\{[\s\S]*?\}/g) || [];
        optionBlocks.forEach((opt, oIdx) => {
            totalOptions++;
            if (!opt.includes('feedback:')) {
                optionsMissingFeedback++;
                console.log(`Bock ${bIdx+1} Option ${oIdx+1} is missing feedback!`);
            }
        });
    }
});

console.log(`Total options: ${totalOptions}`);
console.log(`Options missing feedback: ${optionsMissingFeedback}`);
