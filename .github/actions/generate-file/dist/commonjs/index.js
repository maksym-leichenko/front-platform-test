'use strict';

var fs = require('fs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

/* eslint-disable @typescript-eslint/no-var-requires */


fs__default['default'].writeFileSync('test.json', JSON.stringify(Math.random() * 1000), { flag: 'w' });

// (async function run() {
// }());

var src = {

};

module.exports = src;
