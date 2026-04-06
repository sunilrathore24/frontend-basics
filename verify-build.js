// Quick verification script to count documents in the build
const fs = require('fs');

const appJs = fs.readFileSync('dist/app.js', 'utf8');

// Extract the SITE_CONTENT object
const match = appJs.match(/const SITE_CONTENT = (\{[\s\S]*?\});/);

if (!match) {
  console.error('Could not find SITE_CONTENT in app.js');
  process.exit(1);
}

// Count documents by counting the "id" fields in each category
const sailpointCount = (appJs.match(/"sailpoint":\s*\[[\s\S]*?\]/)?.[0].match(/"id":/g) || []).length;
const architectCount = (appJs.match(/"architect":\s*\[[\s\S]*?\]/)?.[0].match(/"id":/g) || []).length;
const otherCount = (appJs.match(/"other":\s*\[[\s\S]*?\]/)?.[0].match(/"id":/g) || []).length;

console.log('✅ Build Verification Results:');
console.log('================================');
console.log(`Sailpoint files: ${sailpointCount} (expected: 7)`);
console.log(`Architect files: ${architectCount} (expected: 12)`);
console.log(`Other files: ${otherCount} (expected: 27)`);
console.log(`Total: ${sailpointCount + architectCount + otherCount} (expected: 46)`);
console.log('');

if (sailpointCount === 7 && architectCount === 12 && otherCount === 27) {
  console.log('✅ All file counts match expectations!');
} else {
  console.log('⚠️  File counts do not match expectations');
}
