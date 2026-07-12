const fs = require('fs');
const path = require('path');
const https = require('https');

// Disable TLS verification to bypass the "unable to verify the first certificate" error common on government sites
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DATA_DIR = path.join(__dirname, '..', 'data');

const FILES_TO_DOWNLOAD = [
  {
    name: 'C01_religion.xlsx',
    url: 'https://censusindia.gov.in/nada/index.php/catalog/11325/download/14438/RL-0000.xlsx'
  },
  {
    name: 'C16_languages.xlsx',
    url: 'https://censusindia.gov.in/nada/index.php/catalog/10191/download/13303/DDW-C16-STMT-MDDS-0000.XLSX'
  },
  {
    name: 'C17_languages.xlsx',
    url: 'https://censusindia.gov.in/nada/index.php/catalog/10262/download/13374/DDW-C17-0000.XLSX'
  },
  {
    name: 'C08_education.xlsx',
    url: 'https://censusindia.gov.in/nada/index.php/catalog/44790/download/48463/DDW-0000C-08.xlsx'
  },
  {
    name: 'B_series_occupation.xls',
    url: 'https://censusindia.gov.in/nada/index.php/catalog/12597/download/15710/DDW-0000B-01-Census.xls'
  },
  {
    name: 'H_series_assets.xls',
    url: 'https://censusindia.gov.in/nada/index.php/catalog/9038/download/12150/DDW-HH4012-0000.xls'
  },
  {
    name: 'PCA_sc_st.xlsx',
    url: 'https://censusindia.gov.in/nada/index.php/catalog/6191/download/9268/DDW_PCA0000_2011_Indiastatedist.xlsx'
  }
];

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function downloadFile(file) {
  const filePath = path.join(DATA_DIR, file.name);
  console.log(`Starting download: ${file.name} from ${file.url}`);
  
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filePath);
    
    // Using a realistic User-Agent to prevent the government server from blocking the connection
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    
    https.get(file.url, options, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        console.log(`Following redirect for ${file.name} to ${response.headers.location}`);
        https.get(response.headers.location, options, (redirectResponse) => {
          redirectResponse.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            console.log(`Download complete: ${file.name}`);
            resolve();
          });
        }).on('error', (err) => {
          fs.unlink(filePath, () => {});
          console.error(`Error downloading redirect for ${file.name}:`, err.message);
          reject(err);
        });
      } else if (response.statusCode !== 200) {
        fs.unlink(filePath, () => {});
        const err = new Error(`Server returned status code ${response.statusCode} for ${file.name}`);
        console.error(err.message);
        reject(err);
      } else {
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Download complete: ${file.name}`);
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      console.error(`Error downloading ${file.name}:`, err.message);
      reject(err);
    });
  });
}

async function run() {
  console.log('--- Starting Census Master Downloads ---');
  for (const file of FILES_TO_DOWNLOAD) {
    try {
      await downloadFile(file);
      // Brief sleep between downloads to respect server limits
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`Failed to download ${file.name}, trying next...`);
    }
  }
  console.log('--- Downloads Completed ---');
}

run();
