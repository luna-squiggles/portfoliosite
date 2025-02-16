const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

const UPLOAD_DIR = path.join(__dirname, "uploads");
const OUTPUT_DIR = path.join(__dirname, "assets");
const ALT_TEXT_FILE = path.join(UPLOAD_DIR, "alt-text.txt");
const PHOTOS_JS_FILE = path.join(__dirname, "photos.js");
const MAX_FILE_SIZE_MB = 3;

fs.ensureDirSync(OUTPUT_DIR);

async function processImages() {
    const files = await fs.readdir(UPLOAD_DIR);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

    if (imageFiles.length === 0) {
        console.log("No images found in /uploads.");
        return [];
    }

    const processedImages = [];

    for (const file of imageFiles) {
        const inputPath = path.join(UPLOAD_DIR, file);
        const outputFileName = path.parse(file).name + ".webp";
        const outputPath = path.join(OUTPUT_DIR, outputFileName);

        try {
            let buffer = await sharp(inputPath)
                .resize({ width: 2000 })
                .toFormat("webp", { quality: 80 })
                .toBuffer();

            while (buffer.length > MAX_FILE_SIZE_MB * 1024 * 1024) {
                buffer = await sharp(buffer)
                    .toFormat("webp", { quality: Math.max(50, 80 - (buffer.length / (1024 * 1024))) })
                    .toBuffer();
            }

            await fs.writeFile(outputPath, buffer);
            console.log(`Processed: ${file} → ${outputFileName}`);
            processedImages.push(outputFileName);
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }

    return processedImages;
}

async function readAltText() {
    try {
        const altText = await fs.readFile(ALT_TEXT_FILE, "utf-8");
        return altText.split("\n").map(line => line.trim()).filter(line => line !== "");
    } catch (error) {
        console.error("Error reading alt-text.txt:", error);
        return [];
    }
}

async function updatePhotosJS(imageFiles, altTexts) {
    if (imageFiles.length === 0) {
        console.log("No new images to update.");
        return;
    }

    const photoData = imageFiles.map((file, index) => ({
        src: `/assets/${file}`,
        alt: altTexts[index] || "No description available"
    }));

    const jsContent = `const photoData = ${JSON.stringify(photoData, null, 4)};\nexport default photoData;`;

    await fs.writeFile(PHOTOS_JS_FILE, jsContent, "utf-8");
    console.log("Updated photos.js successfully.");
}

(async () => {
    console.log("Processing images...");
    const imageFiles = await processImages();
    console.log("Reading alt text...");
    const altTexts = await readAltText();
    console.log("Updating photos.js...");
    await updatePhotosJS(imageFiles, altTexts);
    console.log("Portfolio update complete!");
})();
