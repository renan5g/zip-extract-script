const fs = require('fs');
const promises = require('fs/promises');
const AdmZip = require('adm-zip');
const path = require('path');
const sharp = require('sharp');

const avifOptions = {
  quality: 50,
  lossless: false,
  speed: 8, // default is 5
  chromaSubsampling: '4:2:0',
};

const tmpFolder = path.join(process.cwd(), 'tmp');

async function compressFile({ inputDir, outputDir, filename }) {
  try {
    if (!fs.existsSync(`${tmpFolder}/${outputDir}`)) {
      await promises.mkdir(`${tmpFolder}/${outputDir}`, {
        recursive: true,
      });
    }

    const filePath = path.join(inputDir, filename);
    const fileOut = path.join(
      `${tmpFolder}/${outputDir}`,
      `${filename.split('.')[0]}.avif`
    );

    await sharp(filePath).toFormat('avif').avif(avifOptions).toFile(fileOut);

    try {
      await promises.stat(filePath);
    } catch {
      return;
    }
    await promises.unlink(filePath);

    return `${outputDir}/${filename.split('.')[0]}.avif`;
  } catch (error) {
    console.log(error);
  }
}

async function extractArchive(filepath, folder) {
  try {
    const zip = new AdmZip(filepath);
    const outputDir = path.join(tmpFolder, `${path.parse(filepath).name}`);
    zip.extractAllTo(outputDir);

    const files = fs.readdirSync(outputDir);

    const filePromises = files.map((filename) =>
      compressFile({
        filename,
        inputDir: outputDir,
        outputDir: `${folder}/${path.parse(filepath).name}`,
      })
    );

    const filesCompressed = await Promise.all(filePromises);
    await promises.rmdir(outputDir);

    console.log(filesCompressed);
  } catch (e) {
    console.log(`Something went wrong. ${e}`);
  }
}

extractArchive('01.zip', 'chapters/manga');
