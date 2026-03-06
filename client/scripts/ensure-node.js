const major = Number(process.versions.node.split('.')[0]);

if (!Number.isFinite(major)) {
  console.error('Unable to detect Node.js version.');
  process.exit(1);
}

if (major >= 22 || major < 18) {
  console.error('\nUnsupported Node.js version for Expo SDK 54: ' + process.version);
  console.error('Use Node 20 LTS, then rerun the command.\n');
  console.error('Recommended commands:');
  console.error('  nvm install 20');
  console.error('  nvm use 20');
  console.error('  cd /Users/jakeryan/Desktop/Fitness_node_api/client');
  console.error('  npm run start:go\n');
  process.exit(1);
}
