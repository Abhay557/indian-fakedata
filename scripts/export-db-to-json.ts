import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDefaultDatabase } from '../src/database/defaultData.js';
import { compiledNames } from '../src/database/namesData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function exportDatabase() {
  console.log('[*] Compiling database for Python...');
  const db = getDefaultDatabase();

  const pythonDbDir = path.resolve(__dirname, '../python/src/indian_fakedata/database');
  if (!fs.existsSync(pythonDbDir)) {
    fs.mkdirSync(pythonDbDir, { recursive: true });
  }

  // Save compiled default database to JSON
  const dbPath = path.join(pythonDbDir, 'default_data.json');
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log(`[+] Saved compiled default database to: ${dbPath}`);

  // Save compiled names to JSON
  const namesPath = path.join(pythonDbDir, 'names_data.json');
  fs.writeFileSync(namesPath, JSON.stringify(compiledNames, null, 2));
  console.log(`[+] Saved compiled names database to: ${namesPath}`);

  console.log('[OK] Database export completed successfully!');
}

exportDatabase();
