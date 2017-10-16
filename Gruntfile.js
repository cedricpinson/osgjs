'use strict';
/*eslint-env node*/

var fs = require('fs');
var path = require('path');

var webpackConfig = require('./webpack.config.js');

var extend = require('extend');
var glob = require('glob');

var webpackSources = webpackConfig[0];
var webpackTests = webpackConfig[1];

// var jshintrc = JSON.parse( fs.readFileSync( './.jshintrc' ).toString() );

// Base paths used by the tasks.
// They always have to finish with a '/'.
var ROOT_PATH = __dirname;
var SOURCE_PATH = path.join(ROOT_PATH, 'sources/');
var EXAMPLE_PATH = path.join(ROOT_PATH, 'examples/');
var BUILD_PATH = path.join(ROOT_PATH, 'builds/');
var TEST_PATH = path.join(ROOT_PATH, 'tests/');
var BENCHMARK_PATH = path.join(ROOT_PATH, 'benchmarks/');
var DIST_PATH = path.join(BUILD_PATH, 'dist/');

var eslintConfigFilename = './.eslintrc.json';
// Utility functions
var find = function(cwd, pattern) {
    if (typeof pattern === 'undefined') {
        pattern = cwd;
        cwd = undefined;
    }

    var isEntity = function(pathname) {
        if (cwd) pathname = path.join(cwd, pathname);
        return !fs.lstatSync(pathname).isDirectory();
    };

    var options = {};

    if (cwd) options.cwd = cwd;

    return glob.sync(pattern, options).filter(isEntity);
};

// get source file once and for all, caching results.
var srcFiles = find(SOURCE_PATH, '**/*.js').map(function(pathname) {
    return pathname;
});

var exampleFiles = find(EXAMPLE_PATH, '**/*.js').map(function(pathname) {
    return pathname;
});

var testFiles = find(TEST_PATH, '**/*.js').map(function(pathname) {
    return pathname;
});

var benchmarkFiles = find(BENCHMARK_PATH, '**/*.js').map(function(pathname) {
    return pathname;
});

// Used to store all Grunt tasks
//
var gruntTasks = {};

// ## Top-level configurations
//
(function() {
    gruntTasks.eslint = {
        options: {
            configFile: eslintConfigFilename
        }
    };

    //build/bundle
    gruntTasks.copy = {
        options: {}
    };

    gruntTasks.clean = {
        options: {}
    };

    //tests
    gruntTasks.qunit = {};

    gruntTasks.connect = {};
})();

// ## Webpack
//
// Build OSGJS with webpack
//
(function() {
    var webpack = require('webpack');

    var release = {
        devtool: 'none',
        output: { filename: '[name].min.js' },

        module: {
            loaders: webpackSources.module.loaders.concat({
                test: /\.js$/,
                loader: 'webpack-strip-block'
            })
        },

        // additional plugins for this specific mode
        plugins: webpackSources.plugins.concat(
            new webpack.optimize.UglifyJsPlugin({ sourceMap: false })
        )
    };

    var watch = {
        watch: true,
        keepalive: true,
        failOnError: false
    };

    gruntTasks.webpack = {
        sources: webpackSources,
        tests: webpackTests,
        release: extend(true, {}, webpackSources, release),
        watch: [extend({}, webpackSources, watch), extend({}, webpackTests, watch)]
    };
})();

// ## ESLint
//
// Will check the Gruntfile and every "*.js" file in the "statics/sources/" folder.
//
(function() {
    gruntTasks.eslint.self = {
        options: {
            node: true
        },
        src: ['Gruntfile.js', 'webpack.config.js']
    };

    gruntTasks.eslint.sources = {
        options: {
            browser: true
        },
        src: srcFiles
            .filter(function(pathName) {
                return (
                    pathName.indexOf('glMatrix') === -1 &&
                    pathName.indexOf('webgl-debug.js') === -1 &&
                    pathName.indexOf('webgl-utils.js') === -1
                );
            })
            .map(function(pathname) {
                return path.join(SOURCE_PATH, pathname);
            })
    };

    gruntTasks.eslint.examples = {
        options: {
            browser: true
        },
        src: exampleFiles.map(function(pathname) {
            return path.join(EXAMPLE_PATH, pathname);
        })
    };

    gruntTasks.eslint.tests = {
        options: {
            browser: true
        },
        src: testFiles
            .filter(function(pathName) {
                return pathName.indexOf('glMatrix') === -1;
            })
            .map(function(pathname) {
                return path.join(TEST_PATH, pathname);
            })
    };

    gruntTasks.eslint.benchmarks = {
        options: {
            browser: true
        },
        src: benchmarkFiles.map(function(pathname) {
            return path.join(BENCHMARK_PATH, pathname);
        })
    };
})();

// ## Clean
//
(function() {
    gruntTasks.clean.staticWeb = {
        src: [path.join(BUILD_PATH, 'web')]
    };
})();

(function() {
    gruntTasks.execute = {
        test: {
            src: ['tests/runTests.js']
        },
        bench: {
            src: ['benchmarks/runBenchmarks.js']
        }
    };
})();

(function() {
    var filesList = ['--write'];
    ['tests', 'examples', 'sources', 'self', 'benchmarks'].forEach(function(target) {
        filesList = filesList.concat(gruntTasks.eslint[target].src);
    });

    gruntTasks.execute.prettier = {
        options: {
            args: filesList
        },
        src: ['node_modules/.bin/prettier']
    };
})();

// ## Documentation
//
(function() {
    gruntTasks.documentation = {
        default: {
            files: [
                {
                    expand: true,
                    cwd: 'sources',
                    src: ['**/*.js']
                }
            ],
            options: {
                destination: 'docs'
            }
        }
    };
})();

// ## Plato
(function() {
    gruntTasks.plato = {
        options: {
            // Task-specific options go here.
        },
        main: {
            files: {
                'docs/analysis': srcFiles.map(function(pathname) {
                    return path.join(SOURCE_PATH, pathname);
                })
            }
        }
    };
})();

// ## connect
//
(function() {
    // will start a server on port 9001 with root directory at the same level of
    // the grunt file
    var currentDirectory = path.dirname(path.resolve('./Gruntfile.js', './'));
    gruntTasks.connect = {
        server: {
            options: {
                port: 9001,
                hostname: 'localhost'
            }
        },
        dist: {
            options: {
                port: 9000,
                directory: currentDirectory,
                hostname: 'localhost',
                open: true,
                middleware: function(connect, options, middlewares) {
                    // inject a custom middleware into the array of default middlewares
                    middlewares.unshift(function(req, res, next) {
                        var ext = path.extname(req.url);
                        if (ext === '.gz') {
                            res.setHeader('Content-Type', 'text/plain');
                            res.setHeader('Content-Encoding', 'gzip');
                        }

                        return next();
                    });

                    return middlewares;
                }
            }
        }
    };
})();

(function() {
    gruntTasks.release = {
        options: {
            npm: false
        }
    };
})();

/* eslint-disable camelcase */
(function() {
    gruntTasks.update_submodules = {
        default: {
            options: {
                // default command line parameters will be used: --init --recursive
            }
        }
    };
})();

/* eslint-enable camelcase */

(function() {
    gruntTasks.copy = {
        staticWeb: {
            files: [
                {
                    expand: true,
                    src: ['sources/**'],
                    dest: path.join(BUILD_PATH, 'web/')
                },
                {
                    expand: true,
                    src: ['docs/**'],
                    dest: path.join(BUILD_PATH, 'web/')
                },
                {
                    expand: true,
                    src: ['examples/**'],
                    dest: path.join(BUILD_PATH, 'web/')
                },
                {
                    expand: true,
                    src: ['tests/**'],
                    dest: path.join(BUILD_PATH, 'web/')
                },
                {
                    expand: true,
                    src: ['tutorials/**'],
                    dest: path.join(BUILD_PATH, 'web/')
                },
                {
                    expand: true,
                    src: ['benchmarks/**'],
                    dest: path.join(BUILD_PATH, 'web/')
                },
                {
                    expand: true,
                    cwd: 'builds',
                    src: ['dist/**'],
                    dest: path.join(BUILD_PATH, 'web/builds/')
                },
                {
                    expand: true,
                    cwd: 'builds',
                    src: ['active/**'],
                    dest: path.join(BUILD_PATH, 'web/builds/')
                }
            ]
        },
        bundles: {
            files: [
                {
                    expand: true,
                    src: 'builds/dist/OSG.min.js',
                    rename: function() {
                        return 'builds/dist/OSG.js'; // The function must return a string with the complete destination
                    }
                },
                {
                    expand: true,
                    src: 'builds/dist/tests.min.js',
                    rename: function() {
                        return 'builds/dist/tests.js'; // The function must return a string with the complete destination
                    }
                },
                {
                    expand: true,
                    src: 'builds/dist/benchmarks.min.js',
                    rename: function() {
                        return 'builds/dist/benchmarks.js'; // The function must return a string with the complete destination
                    }
                }
            ]
        }
    };
})();

module.exports = function(grunt) {
    grunt.file.mkdir(path.normalize(DIST_PATH));

    grunt.initConfig(
        extend(
            {
                pkg: grunt.file.readJSON('package.json')
            },
            gruntTasks
        )
    );

    grunt.loadNpmTasks('grunt-documentation');

    grunt.loadNpmTasks('grunt-plato');

    grunt.loadNpmTasks('grunt-release');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-update-submodules');
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-webpack');

    grunt.loadNpmTasks('grunt-execute');

    grunt.registerTask('watch', ['webpack:watch']);
    grunt.registerTask('check', [
        'eslint:self',
        'eslint:sources',
        'eslint:examples',
        'eslint:tests',
        'eslint:benchmarks'
    ]);

    grunt.registerTask('prettier', ['execute:prettier']);

    grunt.registerTask('sync', ['update_submodules:default']);

    grunt.registerTask('test', ['execute:test']);
    grunt.registerTask('benchmarks', ['execute:bench']);

    grunt.registerTask('build', ['webpack:sources', 'webpack:tests']);
    grunt.registerTask('build-release', ['webpack:release', 'copy:bundles']);

    grunt.registerTask('docs', ['plato', 'documentation:default']);
    grunt.registerTask('default', ['check', 'build']);
    grunt.registerTask('serve', ['sync', 'build', 'connect:dist:keepalive']);
};
