module.exports = function(grunt) {
    'use strict';

    var JSDOC_APP_DIR = 'app',
        MODULES = 'utils',
        JSDOC_CLI = "java -jar";

    grunt.registerMultiTask('docs', 'JSDocs for src, outputted to dest.', function() {
        var path = require('path'),
            done = this.async(),
            jsdoc = this.data  && this.data.jsdoc ? this.data.jsdoc : {includeAll: true, recurse: 4},
            src = path.resolve(this.file.src),
            dest = path.resolve(this.file.dest),
            toolkitDir = './' + MODULES + '/jsdoc-toolkit',
            t = path.resolve(jsdoc.template || toolkitDir + '/templates/jsdoc'),
            p = path.resolve(jsdoc.path || toolkitDir),
            cli = [
				JSDOC_CLI,
				path.resolve(toolkitDir + '/' + '/jsrun.jar'),
                path.resolve(toolkitDir + '/' + JSDOC_APP_DIR + '/'  + (jsdoc.app || 'run.js')),
                jsdoc.includeAll ? '-a' : '',
                jsdoc.includePrivate ? '-p' : '',
                jsdoc.recurse ? '-r=' + (jsdoc.recurse || 4) : '',
                jsdoc.exclude ? '-E=' + jsdoc.exclude : '',
                path.resolve(src),
                '-d='+path.resolve(dest),
                '-t='+t
            ].join(' '),
            child = require('child_process').exec(cli)
                .on('exit', function(code) {
                    done(code == 0)
                });
grunt.log.write(cli);

            child.stdout.on('data', grunt.log.write.bind(grunt.log));
            child.stderr.on('data', grunt.log.error.bind(grunt.log));
    });

};