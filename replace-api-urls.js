import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, 'frotend', 'src');

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverse(fullPath);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('http://localhost:5000') && !filePath.endsWith('config.ts')) {
    console.log(`✏️ Replacing API URLs in: ${filePath}`);
    
    // 1. Replace single-quoted strings
    content = content.replace(/'http:\/\/localhost:5000([^']*)'/g, "`\${API_URL}$1`");
    
    // 2. Replace double-quoted strings
    content = content.replace(/"http:\/\/localhost:5000([^"]*)"/g, "`\${API_URL}$1`");
    
    // 3. Replace remaining instances (e.g. inside backticks already)
    content = content.replace(/http:\/\/localhost:5000/g, "${API_URL}");
    
    // 4. Inject import statement if not already present
    if (!content.includes('import { API_URL }')) {
      const importStmt = "import { API_URL } from '@/config';\n";
      const useClientMatch = content.match(/^['"]use client['"];?\s*/);
      if (useClientMatch) {
        content = useClientMatch[0] + importStmt + content.slice(useClientMatch[0].length);
      } else {
        content = importStmt + content;
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

console.log('🚀 Starting API URL migration...');
traverse(SRC_DIR);
console.log('✅ API URL migration complete!');
