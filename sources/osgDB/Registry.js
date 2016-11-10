'use strict';

/**
 * This is a very simplistic version of the OSG registry, we could
 * expand/improve it in the future
 */

var Registry = {

    instance: function () {
        if ( !Registry.instance ) {
            Registry.instance = this;
            Registry.instance.plugins = new Map();
        }
        return Registry.instance;
    },

    // We register directly a plugin for a extension.
    addReaderWriter: function ( extension, plugin ) {
        if ( Registry.instance.plugins.get( name ) !== undefined )
            console.log( 'the plugin already exists' );
        Registry.instance.plugins.set( name, plugin );
    },

    getReaderWriterForExtension: function ( name ) {
        return Registry.instance.plugins.get( name );
    }
};


module.exports = Registry;
