const fs = require('fs');
const path = require('path');

const colorMap = {
  '"#07111F"': '"var(--bg-main)"',
  '"#101B2D"': '"var(--bg-sec)"',
  '"#132238"': '"var(--card-bg)"',
  '"#0B1F3A"': '"var(--input-bg)"',
  '"#00AEEF"': '"var(--primary)"',
  '"#00C96D"': '"var(--success)"',
  '"#F5B700"': '"var(--warning)"',
  '"#FFFFFF"': '"var(--text-main)"',
  '"#A9B4C7"': '"var(--text-sec)"',
  '"#6B778C"': '"var(--text-muted)"',
  '"rgba(255,255,255,0.08)"': '"var(--border-color)"',
  '"rgba(255, 255, 255, 0.08)"': '"var(--border-color)"',
  '"rgba(255,255,255,0.05)"': '"var(--border-light)"',
  '"rgba(255, 255, 255, 0.05)"': '"var(--border-light)"',
  '"rgba(255,255,255,0.06)"': '"var(--border-light)"',
  '"rgba(255, 255, 255, 0.06)"': '"var(--border-light)"',
  '"rgba(255,255,255,0.02)"': '"var(--bg-hover)"',
  '"rgba(255, 255, 255, 0.02)"': '"var(--bg-hover)"',
  '"rgba(255,255,255,0.03)"': '"var(--bg-hover-strong)"',
  '"rgba(255, 255, 255, 0.03)"': '"var(--bg-hover-strong)"',
  '"rgba(0,174,239,0.1)"': '"var(--primary-light)"',
  '"rgba(0, 174, 239, 0.1)"': '"var(--primary-light)"',
  '"rgba(0,174,239,0.15)"': '"var(--primary-light-strong)"',
  '"rgba(0, 174, 239, 0.15)"': '"var(--primary-light-strong)"',
  '"rgba(0,201,109,0.1)"': '"var(--success-light)"',
  '"rgba(0, 201, 109, 0.1)"': '"var(--success-light)"',
  '"rgba(245,183,0,0.1)"': '"var(--warning-light)"',
  '"rgba(245, 183, 0, 0.1)"': '"var(--warning-light)"',
  '"rgba(7, 17, 31, 0.9)"': '"var(--bg-main-transparent)"',
  '"rgba(7, 17, 31, 0.8)"': '"var(--bg-main-transparent)"'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        processDirectory(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const [hex, variable] of Object.entries(colorMap)) {
        if (content.includes(hex)) {
          content = content.split(hex).join(variable);
          modified = true;
        }
        
        // Also check for single quotes
        const singleHex = hex.replace(/"/g, "'");
        const singleVar = variable.replace(/"/g, "'");
        if (content.includes(singleHex)) {
          content = content.split(singleHex).join(singleVar);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory('./app');
processDirectory('./components');
processDirectory('./lib');
processDirectory('./types');
console.log("Done!");
