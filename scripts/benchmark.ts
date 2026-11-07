import { generateStream } from '../src/index.js';

const count = Number(process.argv[2] ?? 10000);
if (!Number.isInteger(count) || count < 1) {
  console.error('Usage: npm run benchmark -- <count>');
  process.exit(1);
}

const started = performance.now();
let profiles = 0;
for (const _profile of generateStream({ count, seed: 42 })) {
  profiles++;
}
const seconds = (performance.now() - started) / 1000;
const rate = profiles / seconds;
const heapMb = process.memoryUsage().heapUsed / 1024 / 1024;

console.log(`${profiles} profiles in ${seconds.toFixed(2)}s`);
console.log(`${rate.toFixed(0)} profiles/sec`);
console.log(`heap: ${heapMb.toFixed(1)} MB`);
