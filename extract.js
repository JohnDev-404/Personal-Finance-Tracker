let d = '';
process.stdin.on('data', c => d += c);
process.stdin.on('end', () => {
  const j = JSON.parse(d);
  const key = process.argv[2];
  if (!j[key]) {
    console.error('API error:', JSON.stringify(j));
    process.exit(1);
  }
  console.log(j[key].id || j[key]);
});
