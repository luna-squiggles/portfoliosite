const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { exec } = require('child_process');

const assetsDir = path.join(__dirname, 'assets');
const distDir = path.join(__dirname, 'dist');
const altTextFile = path.join(assetsDir, 'alt-text.txt');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

const altTexts = fs.readFileSync(altTextFile, 'utf8').split('\n').map(line => line.trim());

const photos = [];
fs.readdirSync(assetsDir).forEach((file, index) => {
    if (file.match(/\.(png|jpe?g)$/i)) {
        const filePath = path.join(assetsDir, file);
        const webpFileName = `${path.parse(file).name}.webp`;
        const webpFilePath = path.join(distDir, webpFileName);

        sharp(filePath)
            .resize(1200)
            .webp({ quality: 80 })
            .toFile(webpFilePath, (err) => {
                if (err) {
                    console.error(`Error processing ${file}:`, err);
                } else {
                    photos.push({
                        src: `/dist/${webpFileName}`,
                        alt: altTexts[index] || `Photo ${index + 1}`
                    });
                    console.log(`Processed ${file} -> ${webpFileName}`);

                    if (index === fs.readdirSync(assetsDir).length - 1) {
                        const photosJsContent = `const photoData = ${JSON.stringify(photos, null, 2)};`;
                        fs.writeFileSync(path.join(distDir, 'photos.js'), photosJsContent);
                        console.log('Generated photos.js');
                    }
                }
            });
    }
});
