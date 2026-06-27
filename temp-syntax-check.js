const fs = require('fs');
const text = fs.readFileSync('dashboard.html', 'utf8');
const openTag = text.lastIndexOf('<script>');
const closeTag = text.indexOf('</script>', openTag);
if (openTag === -1 || closeTag === -1) {
  console.error('Inline script block not found');
  process.exit(1);
}
const code = text.slice(openTag + '<script>'.length, closeTag);
try {
  new Function(code);
  console.log('SYNTAX OK');
} catch (err) {
  console.error(err.stack || err.toString());
  process.exit(1);
}
