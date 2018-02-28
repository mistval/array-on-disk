const fs = require('fs');
const path = require('path');
const nthLine = require('nthline');

const metadataFileName = 'meta.json';

function mkdirIgnoreError(directoryPath) {
  return new Promise((fulfill, reject) => {
    fs.mkdir(directoryPath, () => {
      fulfill();
    });
  });
}

function writeFile(path, content) {
  return new Promise((fulfill, reject) => {
    fs.writeFile(path, content, err => {
      if (err) {
        return reject(err);
      }
      return fulfill();
    });
  });
}

function readFile(path) {
  return new Promise((fulfill, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) {
        return reject(err);
      }
      return fulfill(JSON.parse(data));
    })
  });
}

function writeArrayFile(directoryPath, fileNumber, array) {
  const stringToWrite = array.map(arrayElement => JSON.stringify(arrayElement)).join('\n');
  const filePath = path.join(directoryPath, `${fileNumber}.json`);
  return writeFile(filePath, stringToWrite);
}

function metadataFilePathForDirectory(directoryPath) {
  return path.join(directoryPath, metadataFileName);
}

class DiskArray {
  constructor(directoryPath, metaData) {
    this.directoryPath_ = directoryPath;
    this.length = metaData.arrayLength;
    this.linesPerFile_ = metaData.linesPerFile;
  }

  async get(index) {
    const fileIndex = Math.floor(index / this.linesPerFile_);
    const filePath = path.join(this.directoryPath_, `${fileIndex}.json`);
    const lineOffset = index % this.linesPerFile_;
    const lineText = await nthLine.read(lineOffset, filePath);
    return JSON.parse(lineText);
  }
}

async function create(array, directoryPath, options) {
  options = options || {};
  const metaDataFilePath = metadataFilePathForDirectory(directoryPath);

  const linesPerFile = options.linesPerFile || 100;
  const arrayLength = array.length;
  const metaData = {arrayLength, linesPerFile};
  await mkdirIgnoreError(directoryPath);
  await writeFile(metaDataFilePath, JSON.stringify(metaData));

  const writeFilePromises = [];
  let fileNumber = 0;
  for (let i = 0; i < arrayLength; i += linesPerFile, ++fileNumber) {
    const arrayChunk = array.slice(i, i + linesPerFile);
    writeFilePromises.push(writeArrayFile(directoryPath, fileNumber, arrayChunk));
  }

  await Promise.all(writeFilePromises);
  return new DiskArray(directoryPath, metaData);
}

async function load(directoryPath) {
  const metaDataFilePath = metadataFilePathForDirectory(directoryPath);
  const metaData = await readFile(metaDataFilePath);
  return new DiskArray(directoryPath, metaData);
}

module.exports = {
  create,
  load,
};
