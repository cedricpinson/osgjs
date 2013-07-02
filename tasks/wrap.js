/**
 * grunt-wrap
 * https://github.com/chrissrogers/grunt-wrap
 *
 * Copyright (c) 2012 Christopher Rogers
 * Licensed under the MIT license.
 */

// wrap: {
//   modules: {
//     src: ['assets/*.js'],
//     dest: 'dist/',
//     wrapper: ['define(function (require, exports, module) {\n', '\n});']
//   }
// }

module.exports = function(grunt) {

  var wrap;

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('wrap', 'Wrap files.', function () {
    var path = require('path'),
        src;
        if (!this.data.prefix)
          this.data.prefix = '';
    // Concat specified files.
    this.files.forEach(function(file) {

      if (!file.files) return;
      file.files.map(function(filepath) {
        filename = filepath.split( this.data.pathSep ).slice( -1 )[0];
        grunt.log.writeln( path.join(this.data.dest, this.data.prefix + filename) );
        src = wrap(filepath, { wrapper: this.data.wrapper });
        grunt.file.write(path.join(this.data.dest, this.data.prefix + filename), src);
      }, this);
    }, this);

    // Fail task if errors were logged.
    if (this.errorCount) return false;

    // Otherwise, print a success message.
    grunt.log.writeln('Wrapped files created in "' + path.join(this.data.dest, this.data.prefix) + '".');
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  wrap = function (filepath, options) {
    options = grunt.util._.defaults(options || {}, {
      wrapper: ['', '']
    });
    return options.wrapper[0] + grunt.file.read(filepath) + options.wrapper[1];
  }

};
