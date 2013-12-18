/*global define */

define( [
    'osg/Utils',
    'osg/Node',
], function ( MACROUTILS, Node ) {

    /** -*- compile-command: 'jslint-cli Node.js' -*- */

    /** 
     *  LightSource is a positioned node to use with StateAttribute Light
     *  @class LightSource
     */
    var LightSource = function () {
        Node.call( this );
        this._light = undefined;
    };

    /** @lends LightSource.prototype */
    LightSource.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Node.prototype, {
        getLight: function () {
            return this._light;
        },
        setLight: function ( light ) {
            this._light = light;
        }
    } ), 'osg', 'LightSource' );
    LightSource.prototype.objectType = MACROUTILS.objectType.generate( 'LightSource' );

    return LightSource;
} );