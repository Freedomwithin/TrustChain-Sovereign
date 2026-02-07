import { calculateGini } from './integrityEngine';

function testGini() {
  const perfectEquality = [10, 10, 10, 10];
  const gini1 = calculateGini(perfectEquality);
  if (gini1 === 0) {
    console.log('PASS: Perfect Equality Gini is 0');
  } else {
    console.error(`FAIL: Perfect Equality Gini is ${gini1}`);
    process.exit(1);
  }

  const totalInequality = [0, 0, 10]; // One person has everything
  const gini2 = calculateGini(totalInequality);
  // Manual calc: (0,0,10) -> sorted: 0,0,10. sum=10. n=3.
  // abs diffs: |0-0|+|0-10| + |0-0|+|0-10| + |10-0|+|10-0| = 0+10 + 0+10 + 10+10 = 40.
  // 2*n*sum = 2*3*10 = 60.
  // gini = 40/60 = 0.666...
  if (Math.abs(gini2 - (2/3)) < 0.001) {
    console.log('PASS: Inequality Gini is correct');
  } else {
    console.error(`FAIL: Inequality Gini is ${gini2}, expected ${2/3}`);
    process.exit(1);
  }
}

testGini();
