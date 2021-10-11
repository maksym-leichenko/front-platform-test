# exclude-match [![npm version](https://badge.fury.io/js/exclude-match.svg)](https://badge.fury.io/js/exclude-match) [![Build Status](https://travis-ci.org/chan1ks/exclude-match.svg?branch=master)](https://travis-ci.org/chan1ks/exclude-match)

> Exclude items in an array matching a given pattern.

## Install with [npm](npmjs.org):

```sh
$ npm install --save exclude-match
```

## Usage

```js
var exclude = require('exclude-match');
exclude(array, patternOrPatterns [, micromatchOptions]);
```

### Strings and Arrays

```js
// match single strings...
var array1 = exclude(['a', 'b', 'c'], 'a');
// ['b', 'c']

// or array of strings
var array2 = exclude(['a', 'b', 'c'], ['a', 'b']);
// ['c']
```

### Globs

```js
// match globs, and ignore case...
var array3 = exclude(['a.txt', 'B.txt', 'C.txt'], '*.txt', {nocase: true});
// ['a.txt', 'B.txt', 'C.txt']

// or array of globs
var array4 = exclude(['a.txt', 'b.json', 'c.js', 'd.txt'], ['*.{js,json}', '!*.txt']);
// ['b.json', 'c.js']
```

### Numbers

```js
// works with numbers too...
var array5 = exclude([1, 2, 3, 4, 5], 4);
// [1, 2, 3, 5]

// and glob matches...
var array6 = exclude([1, 2, 3, 4, 5], '{1...4}');
// [5]

// and even an array of globs
var array7 = exclude([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ['{1...4}', '!{2..3}']);
// [2, 3, 5, 6, 7, 8, 9, 10]
```

* `array` **{Array}**: Array to remove a matched item(s) from.
* `pattern` **{Number|String|Array}**: Glob pattern(s) to match against.
* `options.nocase` **{Boolean}**: Set this to `true` force case-insensitive filename checks. This is useful on case sensitive file systems.
* `returns` **{Array}**: Returns the resolved array with removed matches if they exist, otherwise returns the original array.

## Running tests

Install dev dependencies:

```sh
$ npm install -d && npm test
```

## Contributing

Take care to maintain the existing coding style. Add unit tests for any new or changed functionality.

For bugs or feature requests, [please create an issue](https://github.com/chan1ks/exclude-match/issues).

## Release History

2016-10-09 - v1.0.7 - Patch fixes.  
2016-10-09 - v1.0.6 - Patch fixes.  
2016-10-06 - v1.0.5 - Modified CI build config.  
2016-10-06 - v1.0.4 - Added LICENSE.  
2016-10-05 - v1.0.1 - Added build status to README.  
2016-10-05 - v1.0.0 - Updated README.md. Added CI file for passing builds.  
2016-10-03 - v0.2.0 - Updated dependencies. Reinforced type-checks.  
2016-10-01 - v0.1.0 - Initial release.  

## Author
 
+ [github/chan1ks](https://github.com/chan1ks)
+ [twitter/chan1ks](http://twitter.com/chan1ks)

## License

Copyright © 2016, ["Captain" Morgan Worrell](https://github.com/chan1ks).  
Released under the [MIT license](https://github.com/chan1ks/exclude-match/blob/master/LICENSE).

[micromatch]: http://github.com/jonschlinkert/micromatch