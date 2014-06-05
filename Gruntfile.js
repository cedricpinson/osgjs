var fs     = require( 'fs' );
var path   = require( 'path' );

var extend = require( 'extend' );
var glob   = require( 'glob' );

var jshintrc = JSON.parse( fs.readFileSync('./.jshintrc').toString() );

// Base paths used by the tasks.
// They always have to finish with a '/'.
//
var SOURCE_PATH = 'sources/';
var BUILD_PATH  = 'builds/';
var DIST_PATH   = path.join( BUILD_PATH, 'dist/');
var UTILS_PATH  = 'tools/build/';

// Utility functions
//
var find = function ( cwd, pattern ) {

    if ( typeof pattern === 'undefined' ) {
        pattern = cwd;
        cwd = undefined;
    }

    var isEntity = function ( pathname ) {
        if ( cwd ) pathname = path.join( cwd, pathname );
        return ! fs.lstatSync( pathname ).isDirectory( ); };

    var options = { };

    if ( cwd )
        options.cwd = cwd;

    return glob.sync( pattern, options ).filter( isEntity );

};

// get source file once and for all, caching results.
var srcFiles =  find( SOURCE_PATH, '**/*.js' ).map( function ( pathname ) { return pathname; } );


// Used to store all Grunt tasks
//
var gruntTasks = { };

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
            //optimize : 'uglify2',
            optimize: 'none',
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
    gruntTasks.gitcommit= {};

    gruntTasks.wintersmith= {};
    // duck the camel. (case)
	gruntTasks[ 'wintersmith_compile' ] = gruntTasks.wintersmith;



} )();


// ## JSHint
//
// Will check the Gruntfile and every "*.js" file in the "statics/sources/" folder.
//
( function ( ) {

    gruntTasks.jshint.self = {
        options : { node : true },
        src : [ 'Gruntfile.js' ] };

    gruntTasks.jshint.sources = {
        options : { globals : { define : true, require : true }
                  },
        src : srcFiles.map( function ( pathname ) {
            return path.join( SOURCE_PATH, pathname ); } ) };

    // add another output from envvar to have better error tracking in emacs
    if ( process.env.GRUNT_EMACS_REPORTER !== undefined ) {
        gruntTasks.jshint.sources.options.reporter = process.env.GRUNT_EMACS_REPORTER;
    }

} )( );


// ## Watch

( function ( ) {

    gruntTasks.watch.src = {
        files: [
            'sources/*.js',
            'sources/**/*.js'
        ],
        tasks: [ 'build:sources' ]
    };

} )();

// ## Require.js
//
( function ( ) {

    gruntTasks.requirejs.distSources = { options : {
        name : path.join( path.relative( SOURCE_PATH, UTILS_PATH ), 'almond' ),
        out : path.join( DIST_PATH, 'OSG.js' ),
        include : [ 'OSG' ],
        paths: {
            'Q': 'vendors/Q',
            'Hammer': 'vendors/Hammer',
            'Leap': 'vendors/Leap',
            'vr': 'vendors/vr'
        },
        wrap : {
            startFile : path.join( UTILS_PATH, 'wrap.start' ),
            endFile : path.join( UTILS_PATH, 'wrap.end' ) } } };

} )( );

// ## Clean
//
( function ( ) {

    gruntTasks.clean.distAfterSourcesRjs = {
        src : [ path.join( DIST_PATH, 'build.txt' ) ] };


    gruntTasks.clean.staticWeb = {
        src : [ path.join( BUILD_PATH, 'web' ) ] };


} )( );


// ## Docco
//
( function ( ) {

    // generate a requirejs without anything to build a docco docs
    gruntTasks.requirejs.docsSources = { options : {
        out : path.join( BUILD_PATH, 'docs/OSG.js' ),
        include : [ 'OSG' ],
        paths: {
            'Q': 'vendors/Q',
            'Hammer': 'vendors/Hammer',
            'Leap': 'vendors/Leap',
            'vr': 'vendors/vr'
        }
    } };

    gruntTasks.docco = {
        singleDoc: {
            src: path.join( BUILD_PATH, 'docs/OSG.js' ),
            //src:  find( SOURCE_PATH, '**/*.js' ).map( function ( path ) { return path.join( SOURCE_PATH, path ); } ),
            options: {
                output: 'docs/annotated-source'
            }
        },
        docs: {
            src:  srcFiles.map( function ( pathname ) { return path.join( SOURCE_PATH, pathname ); } ),
            options: {
                layout: 'classic',
                output: 'docs/annotated-source'
            }
        }
    };

} )( );

// ## Plato
( function () {
    gruntTasks.plato = {
        options: {
            // Task-specific options go here.
        },
        main: {
            files: {
                'docs/analysis': srcFiles.map( function ( pathname ) {
                    return path.join( SOURCE_PATH, pathname ); } )
            }
        }
    };
} ) ();

// ## Qunit and connect
//
( function ( ) {

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
    gruntTasks.connect = {
        server: {
            options: {
                port: 9001,
                base: '.'
            }
        }
    };

} )( );

// ## Symlinks
// (explicit because windows)
( function ( ) {

    gruntTasks.symlink = {
       // Enable overwrite to delete symlinks before recreating them
       options: {
         overwrite: false
        },
        Hammer: {
            src: 'examples/vendors/Hammer-1.0.5.js',
            dest: 'examples/vendors/Hammer.js'
        },
        Require: {
            src: 'examples/vendors/Require-2.1.11.js',
            dest: 'examples/vendors/Require.js'
        },
        RequireText: {
            src: 'examples/vendors/require/Text-2.0.12.js',
            dest: 'examples/vendors/require/Text.js'
        },
        Q: {
            src: 'examples/vendors/Q-0.9.7.js',
            dest: 'examples/vendors/Q.js'
        },
        active: {
            src: DIST_PATH,
            dest: path.join( BUILD_PATH, 'active' )
        }
    };

} )( );

// ## WinterSmith:
// (static site gen for osgjs.org)
( function ( ) {

    gruntTasks.wintersmith = {
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

} )( );


( function ( ) {
    gruntTasks.copy = {
        staticWeb: {
            files: [
              {expand: true, src: ['sources/**'], dest: path.join( BUILD_PATH, 'web/' )},
              {expand: true, src: ['docs/**'], dest: path.join( BUILD_PATH, 'web/' ) },
              {expand: true, src: ['examples/**'], dest: path.join( BUILD_PATH, 'web/' ) },
              {expand: true, src: ['tests/**'], dest: path.join( BUILD_PATH, 'web/' ) },
              {expand: true, cwd: 'builds', src: ['dist/**'], dest: path.join( BUILD_PATH, 'web/builds/' ) },
              {expand: true, cwd: 'builds', src: ['active/**'], dest: path.join( BUILD_PATH, 'web/builds/' ) }
            ]
          }
    };
} )( );

// ## git:
// (static site upload)
( function ( ) {
//git clone -b my-branch git@github.com:user/myproject.git
    gruntTasks.gitclone = {
        staticWeb: {
          options: {
            branch: 'gh-pages',
            repository: '.',
            directory: path.join( BUILD_PATH, 'web' )
            //, depth: -1 // cannot push from a shallow clone
          }
        }
    };


    // missing add --all
    gruntTasks.shell =  {
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
            repository: '.',
            message: 'website update to latest develop'
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
            repository: '.',
          }
        }
    };

} )( );



module.exports = function ( grunt ) {

    grunt.initConfig( extend( {
        pkg : grunt.file.readJSON( 'package.json' )
    }, gruntTasks ) );

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

    grunt.loadNpmTasks( 'grunt-contrib-connect' );
    grunt.loadNpmTasks( 'grunt-contrib-qunit' );

    grunt.loadNpmTasks( 'grunt-docco' );
    grunt.loadNpmTasks( 'grunt-plato' );
    grunt.loadNpmTasks( 'grunt-contrib-jshint' );
    grunt.loadNpmTasks( 'grunt-contrib-copy' );
    grunt.loadNpmTasks( 'grunt-contrib-requirejs' );
    grunt.loadNpmTasks( 'grunt-contrib-clean' );
    grunt.loadNpmTasks( 'grunt-contrib-watch' );
    // windows
    grunt.loadNpmTasks( 'grunt-contrib-symlink' );
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
    grunt.registerTask( 'build', [ 'build:dist', 'symlink' ] );

    grunt.registerTask( 'default', [ 'check', 'build' ] );

    grunt.registerTask( 'website_only', [ 'copy:staticWeb', 'clean:staticWeb', 'gitclone:staticWeb', 'wintersmith:build', 'shell:staticWeb', 'gitcommit:staticWeb', 'gitpush:staticWeb' ] );
    grunt.registerTask( 'website', [ 'default', 'docs', 'website_only' ] );
};
