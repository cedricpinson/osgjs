var Fs     = require( 'fs' );
var Path   = require( 'path' );

var extend = require( 'extend' );
var glob   = require( 'glob' );

// Base paths used by the tasks.
// They always have to finish with a '/'.
//
var SOURCE_PATH = 'sources/';
var DIST_PATH   = 'builds/dist/';
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
        include : [ 'OSG' ], insertRequire : [ 'OSG' ],
        wrap : {
            startFile : Path.join( UTILS_PATH, 'osg.start.js' ),
            endFile : Path.join( UTILS_PATH, 'osg.end.js' ) } } };

} )( );

// ## Clean
//
( function ( ) {

    gruntTasks.clean.distAfterSourcesRjs = {
        src : [ Path.join( DIST_PATH, 'build.txt' ) ] };

} )( );

module.exports = function ( grunt ) {

    grunt.initConfig( extend( {
        pkg : grunt.file.readJSON( 'package.json' )
    }, gruntTasks ) );

    grunt.loadNpmTasks( 'grunt-contrib-jshint' );
    grunt.loadNpmTasks( 'grunt-contrib-copy' );
    grunt.loadNpmTasks( 'grunt-contrib-requirejs' );
    grunt.loadNpmTasks( 'grunt-contrib-clean' );
    grunt.loadNpmTasks( 'grunt-contrib-watch' );

    grunt.registerTask( 'check', [ 'jshint:self', 'jshint:sources' ] );
    grunt.registerTask( 'checkEmacs', [ 'jshint:self', 'jshint:sourcesEmacs' ] );

    grunt.registerTask( 'build:sources:dist', [ 'requirejs:distSources', 'clean:distAfterSourcesRjs' ] );
    grunt.registerTask( 'build:sources', [ 'build:sources:dist' ] );

    grunt.registerTask( 'build:dist', [ 'build:sources:dist' ] );
    grunt.registerTask( 'build', [ 'build:dist' ] );

    grunt.registerTask( 'default', [ 'check', 'build' ] );

};
