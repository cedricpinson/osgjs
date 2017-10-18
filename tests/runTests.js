/* eslint-env node, mocha */
process.chdir(__dirname);
require('./mockup/mockupForNode.js');
var Mocha = require('mocha');

var mocha = new Mocha({
    ui: 'qunit',
    reporter: 'spec'
});

mocha.addFile('../builds/tests/tests.js');

mocha.run().on('end', function() {
    // In case the file has no tests we should make mocha fail
    if (this.stats.tests === 0) {
        console.error('No tests found');
        process.exit(-1);
    }

    // One ore more tests failed or skipped
    if (this.stats.passes < this.stats.tests) {
        console.error('test failed');
        process.exit(-1);
    }
});
