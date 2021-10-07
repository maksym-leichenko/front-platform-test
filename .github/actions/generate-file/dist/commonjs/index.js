'use strict';

var fs = require('fs');
var path = require('path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);

/* eslint-disable @typescript-eslint/no-var-requires */



(async function run() {
    fs__default['default'].writeFileSync(path__default['default'].resolve('src/test.json'), JSON.stringify(Math.random() * 1000), { flag: 'w' });
}());

var src = {

};

module.exports = src;
