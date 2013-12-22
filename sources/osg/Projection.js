define( [
    'osg/Utils',
    'osg/Node',
    'osg/Matrix'
], function ( MACROUTILS, Node, Matrix ) {

    var Projection = function () {
        Node.call( this );
        this.projection = Matrix.makeIdentity( [] );
    };
    Projection.prototype = MACROUTILS.objectInehrit( Node.prototype, {
        getProjectionMatrix: function () {
            return this.projection;
        },
        setProjectionMatrix: function ( m ) {
            this.projection = m;
        }
    } );

    MACROUTILS.setTypeID( Projection );

    return Projection;
} );
