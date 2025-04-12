const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Update Clerk version to be compatible with Next.js 14.1.0
packageJson.dependencies['@clerk/nextjs'] = '^5.0.0';

// Write the updated package.json back to disk
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Updated @clerk/nextjs to ^5.0.0');
console.log('Now run "npm install" to install the updated dependencies'); 