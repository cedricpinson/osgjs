define( [
    'osgShader/node/animation',
    'osgShader/node/data',
    'osgShader/node/textures',
    'osgShader/node/functions',
    'osgShader/node/lights',
    'osgShader/node/operations'

], function ( /*animation, data, textures, functions, lights, operations */) {
    'use strict';

    var lib = {};

    // use sublib except _ of course
    var subnamespace = Array.prototype.slice.call( arguments, 0 );

    // add all sub component to root level of the lib
    subnamespace.forEach( function ( component /*, index */ ) {

        Object.keys( component ).forEach( function ( key ) {

            var element = component[ key ];

            if ( this[ key ] !== undefined ) { // if exist throw exception
                throw 'duplicate entry in node library';
            }

            this[ key ] = element;

        }, this );

    }, lib );

    return lib;
} );
