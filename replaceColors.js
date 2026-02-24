const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const dirToWalk = path.join(__dirname, 'frontend/src');

walkDir(dirToWalk, function(filePath) {
  if (filePath.endsWith('.tsx') && !filePath.includes('contact/page') && !filePath.includes('faq/page') && !filePath.includes('how-it-works/page') && !filePath.includes('terms/page')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace gray text
    content = content.replace(/text-gray-[3456]00/g, 'text-muted-foreground');
    content = content.replace(/text-gray-[12]00/g, 'text-foreground');
    
    // Replace hardcoded whites that are not in a button with bg-accent
    // This is a simple regex: we simply replace text-white everywhere, 
    // EXCEPT inside bg-accent text-white which is common for our buttons
    // Since classNames are string literals, let's just do a blanket replace and fix the buttons back.
    content = content.replace(/text-white/g, 'text-foreground');
    content = content.replace(/bg-accent text-foreground/g, 'bg-accent text-white');
    content = content.replace(/bg-black\/60 (.*)text-foreground/g, 'bg-surface-foreground/60 $1text-background');
    content = content.replace(/bg-surface-foreground\/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-bold text-background/g, 'bg-surface-foreground/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-bold text-background');

    // Make sure we have text-background for premium quality badge
    
    // Border conversions
    content = content.replace(/border-white\/10/g, 'border-surface-border');

    // text-black inside hero image logo (Next.js default boilerplate, we don't care much, but anyway)
    content = content.replace(/text-black/g, 'text-foreground');
    content = content.replace(/bg-white/g, 'bg-background');

    // Fix some Specific replacements in Hero etc.
    content = content.replace(/bg-background text-foreground px-8 py-4 rounded-full font-bold text-lg/g, 'bg-surface text-foreground px-8 py-4 rounded-full font-bold text-lg border border-surface-border');
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
});
console.log('Done replacing colors in TSX files!');
