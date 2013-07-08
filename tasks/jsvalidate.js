/*
  grunt-jsvalidate
  https://github.com/ariya/grunt-jsvalidate

  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

module.exports = function(grunt) {
  'use strict';

  grunt.registerMultiTask('jsvalidate', 'Validate JavaScript source.', function() {
    var globals, options;

    options = this.options({
        tolerant: true
    });

    var jsvalidate = function(src, options, globals, extraMsg) {
      var esprima, syntax;

      //grunt.log.write('Validating' + (extraMsg ? ' ' + extraMsg : '') + '  ');
      esprima = require('esprima');
      try {
        // Skip shebang.
        if (src[0] === '#' && src[1] === '!') src = '//' + src.substr(2, src.length);

        syntax = esprima.parse(src, options);
        if (syntax.errors.length === 0) {
          //grunt.log.ok();
          return;
        } else {
        grunt.log.write('Validating' + (extraMsg ? ' ' + extraMsg : '') + '  ');
          grunt.log.write('\n');
          syntax.errors.forEach(function(e) {
            grunt.log.error(e.message);
          });
          return;
        }
      } catch (e) {
        grunt.log.write('Validating' + (extraMsg ? ' ' + extraMsg : '') + '  ');
        grunt.log.write('\n');
        grunt.log.error(e.message);
        grunt.fail.errorcount++;
      }
    };


    grunt.file.expand({
      filter: 'isFile'
    }, this.data.src).forEach(function(filepath) {
      grunt.verbose.write('jsvalidate ' + filepath);
      jsvalidate(grunt.file.read(filepath), options, globals, filepath);
    });

    if (this.errorCount === 0) {
      grunt.log.writeln('Everything is valid.');
    }

    return (this.errorCount === 0);
  });

};