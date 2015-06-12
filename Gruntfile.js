'use strict';
/* global process */

var fs = require( 'fs' );
var path = require( 'path' );

var webpackConfig = require( './webpack.config.js' );

var extend = require( 'extend' );
var glob = require( 'glob' );

var jshintrc = JSON.parse( fs.readFileSync( './.jshintrc' ).toString() );

// Base paths used by the tasks.
// They always have to finish with a '/'.
//
var SOURCE_PATH = 'sources/';
var BUILD_PATH = 'builds/';
var DIST_PATH = path.join( BUILD_PATH, 'dist/' );
var DOCS_PATH = path.join( BUILD_PATH, 'docs/' );

// Utility functions
//
var find = function ( cwd, pattern ) {

    if ( typeof pattern === 'undefined' ) {
        pattern = cwd;
        cwd = undefined;
    }

    var isEntity = function ( pathname ) {
        if ( cwd ) pathname = path.join( cwd, pathname );
        return !fs.lstatSync( pathname ).isDirectory();
    };

    var options = {};

    if ( cwd )
        options.cwd = cwd;

    return glob.sync( pattern, options ).filter( isEntity );

};

// get source file once and for all, caching results.
var srcFiles = find( SOURCE_PATH, '**/*.js' ).map( function ( pathname ) {
    return pathname;
} );


// Used to store all Grunt tasks
//
var gruntTasks = {};

// ## Top-level configurations
//
( function () {

    //lint
    gruntTasks.jshint = {
        options: jshintrc
    };

    //build/bundle
    gruntTasks.copy = {
        options: {}
    };

    gruntTasks.clean = {
        options: {}
    };

    // docs
    gruntTasks.plato = {};

    gruntTasks.docco = {};

    //tests
    gruntTasks.qunit = {};

    gruntTasks.connect = {};

    // static website
    gruntTasks.gitclone = {};
    gruntTasks.gitpush = {};
    gruntTasks.shell = {};
    gruntTasks.gitcommit = {};

    // duck the camel. (case)
    gruntTasks[ 'wintersmith_compile' ] = {};

} )();


// ## Webpack
//
// Build OSGJS with webpack
//
( function () {

    var webpack = require( 'webpack' );

    var targets = {
        build: {
            entry: {
                OSG: [ './sources/OSG.js' ],
                tests: [ './tests/tests.js' ]
            },
            devtool: 'source-map'
        },

        buildrelease: {
            devtool: null,
            output: {
                path: DIST_PATH,
                filename: '[name].min.js',
                libraryTarget: 'umd',
                library: 'OSG'
            },

            // additional plugins for this specific mode
            plugins: [
                new webpack.optimize.UglifyJsPlugin( {
                    sourceMap: false
                } )
            ]
        },
        docs: {
            entry: './sources/OSG.js',
            output: {
                path: DOCS_PATH,
                filename: 'OSG.js'
            }
        }
    };


    gruntTasks.webpack = {
        options: webpackConfig,
        build: targets.build,
        buildrelease: targets.buildrelease,
        docs: targets.docs,
        watch: {
            entry: targets.build.entry,
            devtool: targets.build.devtool,

            // use webpacks watcher
            // You need to keep the grunt process alive
            watch: true,
            keepalive: true

        }
    };


} )();


// ## JSHint
//
// Will check the Gruntfile and every "*.js" file in the "statics/sources/" folder.
//
( function () {

    gruntTasks.jshint.self = {
        options: {
            node: true
        },
        src: [ 'Gruntfile.js' ]
    };

    gruntTasks.jshint.sources = {
        options: {
            globals: {
                define: true,
                require: true
            }
        },
        src: srcFiles.filter( function ( pathName ) {
            return pathName.indexOf( 'vendors' ) === -1;
        } ).map( function ( pathname ) {
            return path.join( SOURCE_PATH, pathname );
        } )
    };

    // add another output from envvar to have better error tracking in emacs
    if ( process.env.GRUNT_EMACS_REPORTER !== undefined ) {
        gruntTasks.jshint.sources.options.reporter = process.env.GRUNT_EMACS_REPORTER;
    }

} )();


( function () {

    gruntTasks.jsbeautifier = {
        default: {
            src: [ 'sources/**/*.js', 'examples/**/*.js', '!examples/vendors/*.js' ],
            options: {
                config: './.jsbeautifyrc'
            }
        },

        check: {
            src: [ 'sources/**/*.js', 'examples/**/*.js', '!examples/vendors/*.js' ],
            // config: './.jsbeautifyrc',
            options: {
                mode: 'VERIFY_ONLY',
                config: './.jsbeautifyrc'
            }
        }
    };
} )();

var generateVersionFile = function () {
    var pkg = JSON.parse( fs.readFileSync( 'package.json' ) );
    var content = [
        'define( [], function () {',
        '    return {',
        '        name: \'' + pkg.name + '\',',
        '        version: \'' + pkg.version + '\',',
        '        author: \'' + pkg.author + '\'',
        '    };',
        '} );',
        ''

    ];
    fs.writeFileSync( path.join( SOURCE_PATH, 'version.js' ), content.join( '\n' ) );
};

// ## Clean
//
( function () {

    gruntTasks.clean.staticWeb = {
        src: [ path.join( BUILD_PATH, 'web' ) ]
    };


} )();


// ## Docco
//
( function () {

    gruntTasks.docco = {
        singleDoc: {
            src: path.join( DOCS_PATH, 'OSG.js' ),
            options: {
                output: 'docs/annotated-source'
            }
        },
        docs: {
            src: srcFiles.map( function ( pathname ) {
                return path.join( SOURCE_PATH, pathname );
            } ),
            options: {
                layout: 'classic',
                output: 'docs/annotated-source'
            }
        }
    };

} )();

// ## Plato
( function () {
    gruntTasks.plato = {
        options: {
            // Task-specific options go here.
        },
        main: {
            files: {
                'docs/analysis': srcFiles.map( function ( pathname ) {
                    return path.join( SOURCE_PATH, pathname );
                } )
            }
        }
    };
} )();

// ## Qunit and connect
//
( function () {

    // qunit using connect
    gruntTasks.qunit = {
        all: {
            options: {
                timeout: 10000,
                urls: [
                    'http://127.0.0.1:9001/tests/index.html'
                ]
            }
        }
    };


    // will start a server on port 9001 with root directory at the same level of
    // the grunt file
    var currentDirectory = path.dirname( path.resolve( './Gruntfile.js', './' ) );
    gruntTasks.connect = {
        server: {
            options: {
                port: 9001,
                hostname: '127.0.0.1'
            }
        },
        dist: {
            options: {
                port: 9000,
                directory: currentDirectory,
                hostname: '0.0.0.0',
                open: true,
                middleware: function ( connect, options, middlewares ) {

                    // inject a custom middleware into the array of default middlewares
                    middlewares.unshift( function ( req, res, next ) {

                        var ext = path.extname( req.url );
                        if ( ext === '.gz' ) {
                            res.setHeader( 'Content-Type', 'text/plain' );
                            res.setHeader( 'Content-Encoding', 'gzip' );
                        }

                        return next();
                    } );

                    return middlewares;
                }
            }
        }

    };

} )();
// ## Copy
// (explicit because windows doesn't support symlinks)
( function () {

    gruntTasks.copyto = {

        main: {
            files: [
                //Hammer:
                {
                    cwd: './',
                    src: 'examples/vendors/hammer-2.0.4.js',
                    dest: 'examples/vendors/hammer.js'
                },
                //Bluebird:
                {
                    cwd: './',
                    src: 'examples/vendors/bluebird-2.9.25.js',
                    dest: 'examples/vendors/bluebird.js'
                },
                //es5-shim:
                {
                    cwd: './',
                    src: 'tests/vendors/es5-shim.js',
                    dest: 'examples/vendors/es5-shim.js'
                },
                //es6-shim:
                {
                    cwd: './',
                    src: 'tests/vendors/es6-shim.js',
                    dest: 'examples/vendors/es6-shim.js'
                }
            ]
        }
    };

} )();

// ## WinterSmith:
// (static site gen for osgjs.org)
( function () {

    gruntTasks[ 'wintersmith_compile' ] = {
        build: {
            options: {
                config: './website/web/config.json',
                output: path.join( BUILD_PATH, 'web' )
            }
        },
        preview: {
            options: {
                action: 'preview',
                config: './website/web/config.json',
                output: path.join( BUILD_PATH, 'web' )
            }
        }
    };

} )();


( function () {
    gruntTasks.copy = {
        staticWeb: {
            files: [ {
                expand: true,
                src: [ 'sources/**' ],
                dest: path.join( BUILD_PATH, 'web/' )
            }, {
                expand: true,
                src: [ 'docs/**' ],
                dest: path.join( BUILD_PATH, 'web/' )
            }, {
                expand: true,
                src: [ 'examples/**' ],
                dest: path.join( BUILD_PATH, 'web/' )
            }, {
                expand: true,
                src: [ 'tests/**' ],
                dest: path.join( BUILD_PATH, 'web/' )
            }, {
                expand: true,
                cwd: 'builds',
                src: [ 'dist/**' ],
                dest: path.join( BUILD_PATH, 'web/builds/' )
            }, {
                expand: true,
                cwd: 'builds',
                src: [ 'active/**' ],
                dest: path.join( BUILD_PATH, 'web/builds/' )
            } ]
        }
    };
} )();

// ## git:
// (static site upload)
( function () {
    //git clone -b my-branch git@github.com:cedricpinson/osgjs.git
    gruntTasks.gitclone = {
        staticWeb: {
            options: {
                branch: 'gh-pages',
                repository: 'git@github.com:cedricpinson/osgjs.git',
                directory: path.join( BUILD_PATH, 'web' )
                    //, depth: -1 // cannot push from a shallow clone
            }
        }
    };


    // missing add --all
    gruntTasks.shell = {
        staticWeb: {
            options: {
                execOptions: {
                    cwd: path.join( BUILD_PATH, 'web' )
                }
            },
            command: 'git add -A -v'
        }
    };

    gruntTasks.gitcommit = {
        staticWeb: {
            options: {
                branch: 'gh-pages',
                repository: 'git@github.com:cedricpinson/osgjs.git',
                message: 'website update to latest develop',
                cwd: path.join( BUILD_PATH, 'web' ),
                verbose: true
            }
        },
        files: {
            src: ''
        }
    };


    gruntTasks.gitpush = {
        staticWeb: {
            options: {
                branch: 'gh-pages',
                repository: 'git@github.com:cedricpinson/osgjs.git',
                cwd: path.join( BUILD_PATH, 'web' ),
                verbose: true
            }
        }
    };

} )();


module.exports = function ( grunt ) {

    var distFullPath = path.normalize( path.join( __dirname, DIST_PATH ) );
    grunt.file.mkdir( distFullPath );

    grunt.initConfig( extend( {
        pkg: grunt.file.readJSON( 'package.json' )
    }, gruntTasks ) );


    generateVersionFile();


    // grunt.event.on('qunit.testStart', function (name) {
    //     grunt.log.ok("Running test: " + name);
    // });

    // grunt.event.on('qunit.log', function (result, actual, expected, message, source) {
    //     if ( !result ) {
    //         if ( expected !== undefined ) {
    //             grunt.log.error('failed ' + message + ' ' + source );
    //         } else {
    //             grunt.log.error('actual: ' + actual + ' expected: ' + expected + ' ,failed ' + message );
    //         }
    //     }
    // });

    grunt.loadNpmTasks( 'grunt-release' );
    grunt.loadNpmTasks( 'grunt-contrib-connect' );
    grunt.loadNpmTasks( 'grunt-contrib-qunit' );

    grunt.loadNpmTasks( 'grunt-docco' );
    grunt.loadNpmTasks( 'grunt-plato' );
    grunt.loadNpmTasks( 'grunt-contrib-jshint' );
    grunt.loadNpmTasks( 'grunt-contrib-copy' );
    grunt.loadNpmTasks( 'grunt-contrib-clean' );

    grunt.loadNpmTasks( 'grunt-jsbeautifier' );

    // windows not supporting link in git repo
    grunt.loadNpmTasks( 'grunt-copy-to' );
    //static site
    grunt.loadNpmTasks( 'grunt-wintersmith-compile' );
    grunt.loadNpmTasks( 'grunt-git' );
    grunt.loadNpmTasks( 'grunt-shell' );
    grunt.loadNpmTasks( 'grunt-webpack' );

    grunt.registerTask( 'watch', [ 'webpack:watch' ] );
    grunt.registerTask( 'check', [ 'jsbeautifier:check', 'jshint:self', 'jshint:sources' ] );
    grunt.registerTask( 'beautify', [ 'jsbeautifier:default' ] );

    grunt.registerTask( 'test', [ 'connect:server', 'qunit:all' ] );

    grunt.registerTask( 'docs', [ 'webpack:docs', 'docco' ] );

    grunt.registerTask( 'build', [ 'copyto', 'webpack:build' ] );
    grunt.registerTask( 'build-release', [ 'copyto', 'webpack:buildrelease' ] );

    grunt.registerTask( 'default', [ 'check', 'build' ] );
    grunt.registerTask( 'serve', [ 'build', 'connect:dist:keepalive' ] );
    grunt.registerTask( 'website_only', [ 'clean:staticWeb', 'gitclone:staticWeb', 'copy:staticWeb', 'wintersmith_compile:build', 'shell:staticWeb', 'gitcommit:staticWeb', 'gitpush:staticWeb' ] );
    grunt.registerTask( 'website', [ 'default', 'docs', 'website_only' ] );


};
