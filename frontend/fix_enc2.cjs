const fs = require('fs');
const base = 'd:/College Project/frontend/src/pages/';
const files = ['CollegeDashboard.jsx','CompanyDashboard.jsx','StudentDashboard.jsx','AdminDashboard.jsx'];

files.forEach(f => {
  // Read as latin1 to get raw bytes as chars
  const raw = fs.readFileSync(base + f, 'latin1');
  // Re-interpret bytes as UTF-8
  const bytes = Buffer.from(raw, 'latin1');
  const text = bytes.toString('utf8');

  // Replace special Unicode chars with safe ASCII alternatives
  const safe = text
    .replace(/\u2014/g, ' - ')
    .replace(/\u2013/g, ' - ')
    .replace(/\u2713/g, '\u2713')   // keep checkmark as unicode escape in output
    .replace(/\u2714/g, '\u2714')
    .replace(/\u2717/g, '\u2717')
    .replace(/\u2718/g, '\u2718')
    // Replace any remaining non-ASCII with ? so the file is pure ASCII-safe
    .replace(/[\u0080-\uFFFF]/g, function(ch) {
      const code = ch.charCodeAt(0);
      // Keep common ones as-is (they'll be stored as UTF-8 bytes correctly)
      return ch;
    });

  fs.writeFileSync(base + f, safe, 'utf8');
  console.log('Done:', f);
});
console.log('All fixed.');
