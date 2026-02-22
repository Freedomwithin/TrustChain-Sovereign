const fs = require('fs');
const path = require('path');

const idlPath = path.join(__dirname, '../target/idl/trustchain_notary.json');
const rootEnvPath = path.join(__dirname, '../.env.local');
const backendEnvPath = path.join(__dirname, '../backend/.env');

if (!fs.existsSync(idlPath)) {
  console.error(`IDL file not found at ${idlPath}. Please run 'anchor build' first.`);
  process.exit(1);
}

try {
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
  const programId = idl.address;

  if (!programId) {
    console.error('Program ID (address) not found in IDL.');
    process.exit(1);
  }

  console.log(`Found Program ID: ${programId}`);

  function updateEnvFile(filePath, key, value) {
    let content = '';
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf8');
    }

    const lines = content.split('\n');
    let found = false;
    const newLines = lines.map(line => {
      if (line.startsWith(`${key}=`)) {
        found = true;
        return `${key}=${value}`;
      }
      return line;
    });

    if (!found) {
      if (newLines.length > 0 && newLines[newLines.length - 1] !== '') {
        newLines.push('');
      }
      newLines.push(`${key}=${value}`);
    }

    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log(`Updated ${filePath}`);
  }

  updateEnvFile(rootEnvPath, 'SOLANA_PROGRAM_ID', programId);
  updateEnvFile(backendEnvPath, 'SOLANA_PROGRAM_ID', programId);

} catch (error) {
  console.error('Error updating environment variables:', error);
  process.exit(1);
}
