define( [
    'osg/Notify',
    'osgShader/node/animation',
    'osgShader/node/data',
    'osgShader/node/functions',
    'osgShader/node/lights',
    'osgShader/node/shadows',
    'osgShader/node/operations',
    'osgShader/node/textures',

], function ( Notify, animation, data, functions, lights, shadows, operations, textures ) {
    'use strict';

    var Factory = function () {

        this._nodes = new Map();

        this.registerNodes( animation );
        this.registerNodes( data );
        this.registerNodes( textures );
        this.registerNodes( functions );
        this.registerNodes( lights );
        this.registerNodes( shadows );
        this.registerNodes( operations );
    };

    Factory.prototype = {

        registerNodes: function ( obj ) {
            var self = this;
            Object.keys( obj ).forEach( function ( key ) {
                self.registerNode( key, obj[ key ] );
            } );
        },

        registerNode: function ( name, constructor ) {

            if ( this._nodes.has( name ) ) {
                Notify.warn( 'Node ' + name + ' already registered' );
            }
            this._nodes.set( name, constructor );

        },
        // extra argument are passed to the constructor of the node
        getNode: function ( name ) {

            var Constructor = this._nodes.get( name );
            if ( !Constructor ) {
                // Means either:
                // - the node isn't registered by methods above
                // - you mistyped the name
                // - Core Node has changed its Name
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
