import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');

const DATASETS = [
  {
    name: 'Indian-Male-Names.csv',
    url: 'https://gist.githubusercontent.com/mbejda/7f86ca901fe41bc14a63/raw/Indian-Male-Names.csv'
  },
  {
    name: 'Indian-Female-Names.csv',
    url: 'https://gist.githubusercontent.com/mbejda/9b93c7545c9dd93060bd/raw/b582593330765df3ccaae6f641f8cddc16f1e879/Indian-Female-Names.csv'
  }
];

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function downloadFile(file: typeof DATASETS[0]): Promise<void> {
  const filePath = path.join(DATA_DIR, file.name);
  console.log(`[Crawler] Fetching names dataset: ${file.name}`);

  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filePath);
    
    https.get(file.url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(filePath, () => {});
        reject(new Error(`Server returned status code ${response.statusCode}`));
        return;
      }
      
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`[Crawler] Completed download: ${file.name}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      console.error(`[Crawler] Failed to download ${file.name}:`, err.message);
      reject(err);
    });
  });
}

async function run() {
  console.log('[Crawler] Commencing Indian names data acquisition...');
  for (const dataset of DATASETS) {
    try {
      await downloadFile(dataset);
      await new Promise(r => setTimeout(r, 500)); // Politeness delay
    } catch (err: any) {
      console.error(`[Crawler] Error acquiring ${dataset.name}: ${err.message}`);
    }
  }
  console.log('[Crawler] Data acquisition sequence complete.');
}

run();
