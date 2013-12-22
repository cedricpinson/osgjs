define( [
    'osg/Utils',
    'osg/Node'
], function ( MACROUTILS, Node ) {

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

    MACROUTILS.setTypeID( LightSource );

    return LightSource;
} );
