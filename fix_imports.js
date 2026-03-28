const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'apps/web'));
let count = 0;
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes("import { api } from '@/lib/api'")) {
        fs.writeFileSync(f, content.replace(/import \{ api \} from '@\/lib\/api';/g, "import api from '@/lib/api';"));
        console.log('Fixed', f);
        count++;
    }
});
console.log('Fixed', count, 'files');
