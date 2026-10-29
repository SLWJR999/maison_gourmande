const http = require('http');

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

(async () => {
  const url = 'http://localhost:3000/menu';
  try {
    const html = await fetchUrl(url);
    const lower = html.toLowerCase();
    const hasCategory = lower.includes('categorie') || lower.includes('categories') || lower.includes('mini-fataya') || lower.includes('nems') || lower.includes('product');
    console.log('Found category/products?', hasCategory);
    if (!hasCategory) {
      console.error('Menu page appears empty or missing key content.');
      process.exit(1);
    }
    console.log('Page fetched successfully.');
  } catch (err) {
    console.error('Error fetching menu page:', err.message);
    process.exit(1);
  }
})();