define( [
    'osg/Notify',
    'osgShader/node/data',
    'osgShader/node/functions',
    'osgShader/node/lights',
    'osgShader/node/operations',
    'osgShader/node/textures',

], function ( Notify, data, functions, lights, operations, textures ) {
    'use strict';

    var registerNodes = function ( objects, map ) {

        Object.keys( objects ).forEach( function ( key ) {

            map.set( key, objects[ key ] );

        } );

    };

    var Factory = function () {

        this._nodes = new Map();

        registerNodes( data, this._nodes );
        registerNodes( textures, this._nodes );
        registerNodes( functions, this._nodes );
        registerNodes( lights, this._nodes );
        registerNodes( operations, this._nodes );
    };

    Factory.prototype = {

        registerNode: function ( name, constructor ) {

            if ( this._nodes.has( name ) ) {
                Notify.warning( 'Node ' + name + ' already registered' );
            }
            this._nodes.set( name, constructor );

        },

        // extra argument are passed to the constructor of the node
        getNode: function ( name ) {

            var Constructor = this._nodes.get( name );
            if ( !Constructor ) {
                Notify.warn( 'Node ' + name + ' does not exist' );
                return undefined;
            }


            // call a constructor with array arguments
            // http://www.ecma-international.org/ecma-262/5.1/#sec-13.2.2
            var instance = Object.create( Constructor.prototype );
            Constructor.apply( instance, Array.prototype.slice.call( arguments, 1 ) );

            return instance;
        }

    };

    var instance = new Factory();

    return instance;

} );
