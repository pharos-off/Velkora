const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

const shaderPath = path.join(process.env.APPDATA, '.minecraft', 'shaderpacks', 'ComplementaryReimagined_r5.7.1.zip');

console.log(`Testing file: ${shaderPath}`);
console.log(`File exists: ${fs.existsSync(shaderPath)}`);

if (fs.existsSync(shaderPath)) {
  try {
    const zip = new AdmZip(shaderPath);
    const entries = zip.getEntries();
    
    console.log(`\nTotal entries: ${entries.length}`);
    console.log(`\nFirst 20 entries:`);
    entries.slice(0, 20).forEach(entry => {
      console.log(`  - ${entry.entryName} (dir: ${entry.isDirectory})`);
    });
    
    // Look for images
    console.log(`\n\nSearching for images...`);
    const images = entries.filter(e => /\.(png|jpg|jpeg)$/i.test(e.entryName.toLowerCase()));
    console.log(`Found ${images.length} image files:`);
    images.slice(0, 10).forEach(img => {
      console.log(`  - ${img.entryName}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}
