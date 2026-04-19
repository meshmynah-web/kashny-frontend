const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('d:/post-system1/frontend/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  if (content.includes("import axios from 'axios'") || content.includes("import axios from \"axios\"")) {
    const isWindows = path.sep === '\\\\';
    const splitStr = isWindows ? 'frontend\\\\src\\\\' : 'frontend/src/';
    const relativePathParts = file.split(isWindows ? 'frontend\\\\src\\\\' : 'frontend/src/');
    
    // Some paths use generic path.sep
    const srcIndex = file.indexOf('src' + path.sep);
    if (srcIndex !== -1) {
      const afterSrc = file.substring(srcIndex + 4);
      const depth = afterSrc.split(path.sep).length - 1;
      let relativePath = depth === 0 ? './config' : '../'.repeat(depth) + 'config';
      newContent = newContent.replace(/import axios from ['\"]axios['\"];?/g, `import axios from '${relativePath}';`);
    }
  }
  
  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
  }
});
console.log('Done replacing axios imports');
