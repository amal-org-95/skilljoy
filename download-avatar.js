const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';
const dest = path.resolve(__dirname, 'assets/default-avatar.png');

https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to get image. Status code: ${res.statusCode}`);
    res.resume();
    return;
  }

  const file = fs.createWriteStream(dest);
  res.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('Image downloaded and saved to assets/default-avatar.png');
  });
}).on('error', (err) => {
  console.error(`Error: ${err.message}`);
});
