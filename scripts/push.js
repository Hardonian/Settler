const { execSync } = require('child_process');
try {
  execSync('git push -u origin optimize-rls-status-script', { stdio: 'inherit' });
} catch (e) {
  console.error(e);
}
