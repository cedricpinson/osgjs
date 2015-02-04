var fs = require( 'fs' );
var path = require( 'path' );

var extend = require( 'extend' );
var glob = require( 'glob' );

var jshintrc = JSON.parse( fs.readFileSync( './.jshintrc' ).toString() );

// Base paths used by the tasks.
// They always have to finish with a '/'.
//
var SOURCE_PATH = 'sources/';
var BUILD_PATH = 'builds/';
var DIST_PATH = path.join( BUILD_PATH, 'dist/' );
var UTILS_PATH = 'tools/build/';



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

    gruntTasks.uglify = {
        options: {}
    };

    gruntTasks.requirejs = {
        options: {
            //optimize: 'uglify2',
            optimize: 'none',
            //            generateSourceMaps: true,
            //            useSourceUrl: true,
            preserveLicenseComments: false,
            findNestedDependencies: true,
            optimizeAllPluginResources: true,
            baseUrl: SOURCE_PATH

        }
    };

    gruntTasks.clean = {
        options: {}
    };

    gruntTasks.requirejsconfiguration = {
        options: {}
    };

    gruntTasks.watch = {
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


// ## Watch

( function () {

    gruntTasks.watch.src = {
        files: [
            'sources/*.js',
            'sources/**/*.js',
            'sources/*.glsl',
            'sources/**/*.glsl'
        ],
        tasks: [ 'build:sources' ]
    };

} )();


var generateVersionFile = function() {
    var pkg = JSON.parse( fs.readFileSync('package.json' ) );
    var content = [
        'define( [], function() {',
        '    return {',
        '        name: \'' + pkg.name + '\',',
        '        version: \'' + pkg.version + '\',',
        '        author: \'' + pkg.author +'\'',
        '    };',
        '} );'

    ];
    fs.writeFileSync( path.join( SOURCE_PATH, 'version.js'), content.join('\n'));
};


// ## Require.js
//
( function () {

    gruntTasks.requirejs.distSources = {
        options: {
            name: path.join( path.relative( SOURCE_PATH, UTILS_PATH ), 'almond' ),
            out: path.join( DIST_PATH, 'OSG.js' ),
            include: [ 'OSG' ],
            paths: {
                'q': 'vendors/q',
                'hammer': 'vendors/hammer',
                'leap': 'vendors/leap',
                'jquery': 'vendors/jquery',
                'text': 'vendors/require/text'
            },
            wrap: {
                startFile: path.join( UTILS_PATH, 'wrap.start' ),
                endFile: path.join( UTILS_PATH, 'wrap.end' )
            }
        }
    };

} )();

// ## Clean
//
( function () {

    gruntTasks.clean.distAfterSourcesRjs = {
        src: [ path.join( DIST_PATH, 'build.txt' ) ]
    };


    gruntTasks.clean.staticWeb = {
        src: [ path.join( BUILD_PATH, 'web' ) ]
    };


} )();


// ## Docco
//
( function () {

    // generate a requirejs without anything to build a docco docs
    gruntTasks.requirejs.docsSources = {
        options: {
            out: path.join( BUILD_PATH, 'docs/OSG.js' ),
            include: [ 'OSG' ],
            paths: {
                'q': 'vendors/q',
                'hammer': 'vendors/hammer',
                'leap': 'vendors/leap'
            }
        }
    };

    gruntTasks.docco = {
        singleDoc: {
            src: path.join( BUILD_PATH, 'docs/OSG.js' ),
            //src:  find( SOURCE_PATH, '**/*.js' ).map( function ( path ) { return path.join( SOURCE_PATH, path ); } ),
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
                    'http://localhost:9001/tests/index.html'
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
                hostname: '127.0.0.1',
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
                    src: 'examples/vendors/hammer-1.0.5.js',
                    dest: 'examples/vendors/hammer.js'
                },
                //RequireTextBuild:
                {
                    cwd: './',
                    src: 'sources/vendors/require/Text-2.0.12.js',
                    dest: 'sources/vendors/require/text.js'
                },
                //Q:
                {
                    cwd: './',
                    src: 'examples/vendors/q-0.9.7.js',
                    dest: 'examples/vendors/q.js'
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
    grunt.loadNpmTasks( 'grunt-contrib-requirejs' );
    grunt.loadNpmTasks( 'grunt-contrib-clean' );
    grunt.loadNpmTasks( 'grunt-contrib-watch' );

    // windows not supporting link in git repo
    grunt.loadNpmTasks( 'grunt-copy-to' );
    //static site
    grunt.loadNpmTasks( 'grunt-wintersmith-compile' );
    grunt.loadNpmTasks( 'grunt-git' );
    grunt.loadNpmTasks( 'grunt-shell' );

    grunt.registerTask( 'check', [ 'jshint:self', 'jshint:sources' ] );

    grunt.registerTask( 'test', [ 'connect:server', 'qunit:all' ] );

    grunt.registerTask( 'docs', [ 'requirejs:docsSources', 'docco' ] );

    grunt.registerTask( 'build:sources:dist', [ 'requirejs:distSources', 'clean:distAfterSourcesRjs' ] );
    grunt.registerTask( 'build:sources', [ 'build:sources:dist' ] );

    grunt.registerTask( 'build:dist', [ 'build:sources:dist' ] );
    grunt.registerTask( 'build', [ 'copyto', 'build:dist' ] );

    grunt.registerTask( 'default', [ 'check', 'build' ] );
    grunt.registerTask( 'serve', [ 'build', 'connect:dist:keepalive' ] );
    grunt.registerTask( 'website_only', [ 'clean:staticWeb', 'gitclone:staticWeb', 'copy:staticWeb', 'wintersmith_compile:build', 'shell:staticWeb', 'gitcommit:staticWeb', 'gitpush:staticWeb' ] );
    grunt.registerTask( 'website', [ 'default', 'docs', 'website_only' ] );

//    grunt.registerTask( 'release', [ 'release:patch', 'build:sources:dist', 'release:patch' ] );

};
