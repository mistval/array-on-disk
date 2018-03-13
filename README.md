# Disk array

Store a large array on disk and access it randomly with caching.

## Usage

### Writing an array to disk

```js
const diskArray = require('disk-array');
const path = require('path');

const DIRECTORY_PATH = path.resolve(__dirname, 'array');

const array = [10, 9, 8, 7];
const options = {elementsPerFile: 100};
diskArray.create(array, DIRECTORY_PATH, options);
```

### Reading from an array on disk

```js
const diskArray = require('disk-array');
const path = require('path');

const DIRECTORY_PATH = path.resolve(__dirname, 'array');
const MAX_CACHED_PAGES = 100;

const cache = new diskArray.Cache(MAX_CACHED_PAGES);
diskArray.load(DIRECTORY_PATH, cache).then(array => {
  console.log(`Array length: ${array.length}`);
  return array.get(array.length - 1).then(element => {
    console.log(`Last element: ${element}`);
  });
});
```

## Discussion

Creating a disk array simply breaks up your array into chunks and writes them to separate files as newline-separated JSON elements. Getting an element from the array retrieves it from the cache or loads it from disk if necessary. When the cache reaches max size, pages will be ejected from the cache in order of when they were last accessed. You can load multiple arrays with the same cache and they will share the cache.
