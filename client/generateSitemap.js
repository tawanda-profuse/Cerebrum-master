const { SitemapStream, streamToPromise } = require('sitemap');
const fs = require('fs');

// Define your routes based on App.jsx
const routes = [
  '/',
  '/chat',
  '/user/settings',
  '/payment-result'
];

const hostname = 'https://yeduai.io';

const sitemap = new SitemapStream({ hostname });

routes.forEach(route => {
  sitemap.write({ url: route, changefreq: 'daily', priority: 0.7 });
});

sitemap.end();

streamToPromise(sitemap)
  .then(sm => fs.writeFileSync('./public/sitemap.xml', sm))
  .catch(console.error);