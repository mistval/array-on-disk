const fs = require('fs');
const path = require('path');
const LinkedListQueue = require('./linked_list_queue.js');

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
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }
      return fulfill(data);
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

async function getPageAsLineArray(directoryPath, fileIndex) {
  const filePath = path.join(directoryPath, `${fileIndex}.json`);
  const pageData = await readFile(filePath);
  return pageData.split('\n');
}

class DiskArray {
  constructor(directoryPath, metaData, cache) {
    this.directoryPath_ = directoryPath;
    this.length = metaData.arrayLength;
    this.linesPerFile_ = metaData.linesPerFile;
    this.cache_ = cache || new LinkedListQueue(0);
  }

  async get(index) {
    if (index >= this.length) {
      throw new Error('Index out of bounds');
    }

    const fileIndex = Math.floor(index / this.linesPerFile_);
    const cacheKey = `${this.directoryPath_} - ${fileIndex}`;

    let page = this.cache_.getItemForKey(cacheKey);
    if (!page) {
      page = await getPageAsLineArray(this.directoryPath_, fileIndex);
      this.cache_.add(cacheKey, page);
    }

    const lineOffset = index % this.linesPerFile_;
    const lineText = page[lineOffset];
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

async function load(directoryPath, cache) {
  const metaDataFilePath = metadataFilePathForDirectory(directoryPath);
  const metaData = JSON.parse(await readFile(metaDataFilePath));
  return new DiskArray(directoryPath, metaData, cache);
}

module.exports = {
  create,
  load,
  Cache: LinkedListQueue,
};
