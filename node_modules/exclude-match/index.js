'use strict';

var mm = require('micromatch');
var _ = require('lodash');

function checkType(data, type) {
    var selected = _.filter(data, function (o) {
        return typeof o === type;
    });
    return selected.length > 0;
}

function isValid(data) {
    if (data === undefined || data === null ||
        typeof data === 'undefined' || data.length === 0) {
        return false;
    }

    if(!Array.isArray(data)) {
        data = [data];
    }

    var str = checkType(data, "string");

    if (str) {
        return str;
    }

    var num = checkType(data, "number");

    if (num) {
        return num;
    }

    return false;
}

function match(arr, pattern, opts) {
    if (!Array.isArray(pattern)) {
        pattern = [pattern];
    }

    if (checkType(pattern, "number")) {
        return _.difference(arr, pattern);
    }
    var res = mm(arr, pattern, opts);
    return _.difference(arr, res);
}

module.exports = function(arr, pattern, opts) {
    if (typeof arr === "undefined" || !Array.isArray(arr)) {
        throw new TypeError('exclude-match uses an array as the first argument');
    }

    if (!isValid(pattern)) {
        throw new TypeError('exclude-match uses a number, string, or array as the second argument');
    }

    opts = opts || {};

    return match(arr, pattern, opts) || arr;
};