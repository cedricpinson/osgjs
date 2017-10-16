'use strict';
/* eslint-env node, mocha */

process.chdir(__dirname);
require('../tests/mockup/mockupForNode.js');
var Mocha = require('mocha');

var mocha = new Mocha({
    ui: 'qunit',
    reporter: 'list'
});

mocha.addFile('../builds/tests/benchmarks.js');
mocha.run();
