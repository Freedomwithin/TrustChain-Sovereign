const { calculateGini } = require('./services/integrityEngine');
const assert = require('node:assert');

function testGini() {
  console.log('Running: Gini Equality Test');
  const perfectEquality = [{ amount: 10 }, { amount: 10 }, { amount: 10 }, { amount: 10 }];
  const gini1 = calculateGini(perfectEquality);
  assert.strictEqual(gini1, 0, `Perfect Equality Gini should be 0, got ${gini1}`);
  console.log('PASS: Perfect Equality Gini is 0');

  console.log('Running: Gini Inequality Test');
  const totalInequality = [{ amount: 0 }, { amount: 0 }, { amount: 10 }]; // One person has everything
  const gini2 = calculateGini(totalInequality);
  // Manual calc: (0,0,10) -> sorted: 0,0,10. sum=10. n=3.
  // abs diffs: |0-0|+|0-10| + |0-0|+|0-10| + |10-0|+|10-0| = 0+10 + 0+10 + 10+10 = 40.
  // 2*n*sum = 2*3*10 = 60.
  // gini = 40/60 = 0.666...
  // Correction: 0.666... * (3/2) = 1.0
  assert.ok(Math.abs(gini2 - 1.0) < 0.001, `Inequality Gini should be 1.0, got ${gini2}`);
  console.log('PASS: Inequality Gini is correct');
}

try {
  testGini();
  console.log('\nEXISTING TESTS PASSED');
} catch (error) {
  console.error('\nEXISTING TESTS FAILED');
  console.error(error);
  process.exit(1);
}
