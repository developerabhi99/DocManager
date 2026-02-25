"use strict";
const { execSync } = require('child_process');
console.log('Building project...');
execSync('npm run build', { stdio: 'inherit' });
console.log('Running seed...');
execSync('node dist/prisma/seeder/seed.js', { stdio: 'inherit' });
//# sourceMappingURL=seed.cjs.map