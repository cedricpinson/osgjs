var Fs     = require( 'fs' );
var Path   = require( 'path' );

var extend = require( 'extend' );
var glob   = require( 'glob' );

// Base paths used by the tasks.
// They always have to finish with a '/'.
//
var SOURCE_PATH = 'sources/';
var BUILD_PATH   = 'builds/';
var DIST_PATH   = BUILD_PATH+'dist/';
var UTILS_PATH  = 'tools/build/';

// Utility functions
//
var find = function ( cwd, pattern ) {

    if ( typeof pattern === 'undefined' ) {
        pattern = cwd;
        cwd = undefined;
    }

    var isEntity = function ( path ) {
        if ( cwd ) path = Path.join( cwd, path );
        return ! Fs.lstatSync( path ).isDirectory( ); };

    var options = { };

    if ( cwd )
        options.cwd = cwd;

    return glob.sync( pattern, options ).filter( isEntity );

};

// Used to store all Grunt tasks
//
var gruntTasks = { };

// ## Top-level configurations
//
( function ( ) {

    gruntTasks.jshint = {
        options : {
            quotmark  : 'single',
            bitwise   :  true,
            camelcase :  true,
            eqeqeq    :  true,
            immed     :  true,
            latedef   :  true,
            newcap    :  true,
            noarg     :  true,
            undef     :  true,
            unused    :  true,
            trailing  :  true,

            eqnull    :  true,
            laxcomma  :  true,
            sub       :  true,

            browser   :  true,
            devel     :  true }
        };

    gruntTasks.copy = { options : {
        } };

    gruntTasks.uglify = { options : {
        } };

    gruntTasks.requirejs = { options : {
        //optimize : 'uglify2',
        optimize : 'none',
        preserveLicenseComments : false,

        findNestedDependencies: true,
        optimizeAllPluginResources: true,

        baseUrl : SOURCE_PATH } };

    gruntTasks.clean = { options : {
        } };

    gruntTasks.requirejsconfiguration = { options : {
        } };

    gruntTasks.watch = { options : {
        } };

    gruntTasks.plato = {};

    gruntTasks.docco = {};

    gruntTasks.qunit = {};

    gruntTasks.connect = {};


} )( );

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
        src : find( SOURCE_PATH, '**/*.js' ).map( function ( path ) {
            return Path.join( SOURCE_PATH, path ); } ) };

    // add another output from envvar to have better error tracking in emacs
    if ( process.env.GRUNT_EMACS_REPORTER !== undefined ) {
        gruntTasks.jshint.sources.options.reporter = process.env.GRUNT_EMACS_REPORTER;
    }

} )( );

// ## Require.js
//
( function ( ) {

    gruntTasks.requirejs.distSources = { options : {
        name : Path.join( Path.relative( SOURCE_PATH, UTILS_PATH ), 'almond' ),
        out : Path.join( DIST_PATH, 'OSG.js' ),
        include : [ 'OSG' ],
        paths: {
            'Q': 'vendors/Q',
            'Hammer': 'vendors/Hammer',
            'Leap': 'vendors/Leap',
            'vr': 'vendors/vr'
        },
        wrap : {
            startFile : Path.join( UTILS_PATH, 'wrap.start' ),
            endFile : Path.join( UTILS_PATH, 'wrap.end' ) } } };

} )( );

// ## Clean
//
( function ( ) {

    gruntTasks.clean.distAfterSourcesRjs = {
        src : [ Path.join( DIST_PATH, 'build.txt' ) ] };

} )( );


// ## Docco
//
( function ( ) {

    // generate a requirejs without anything to build a docco docs
    gruntTasks.requirejs.docsSources = { options : {
        out : Path.join( BUILD_PATH, 'docs/OSG.js' ),
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
            src: Path.join( BUILD_PATH, 'docs/OSG.js' ),
            //src:  find( SOURCE_PATH, '**/*.js' ).map( function ( path ) { return Path.join( SOURCE_PATH, path ); } ),
            options: {
                output: 'docs/annotated-source'
            }
        },
        docs: {
            src:  find( SOURCE_PATH, '**/*.js' ).map( function ( path ) { return Path.join( SOURCE_PATH, path ); } ),
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
                'docs/analysis': find( SOURCE_PATH, '**/*.js' ).map( function ( path ) {
                    return Path.join( SOURCE_PATH, path ); } )
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
                urls: [
                    'http://localhost:9001/tests/index.html'
                ]
            }
	},
	local: ['tests/index.html']
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

    grunt.registerTask( 'check', [ 'jshint:self', 'jshint:sources' ] );

    grunt.registerTask( 'webtest', [ 'connect:server', 'qunit' ] );
    grunt.registerTask( 'test', [ 'qunit:local' ] );

    grunt.registerTask( 'docs', [ 'requirejs:docsSources', 'docco' ] );

    grunt.registerTask( 'build:sources:dist', [ 'requirejs:distSources', 'clean:distAfterSourcesRjs' ] );
    grunt.registerTask( 'build:sources', [ 'build:sources:dist' ] );

    grunt.registerTask( 'build:dist', [ 'build:sources:dist' ] );
    grunt.registerTask( 'build', [ 'build:dist' ] );

    grunt.registerTask( 'default', [ 'check', 'build' ] );

};
