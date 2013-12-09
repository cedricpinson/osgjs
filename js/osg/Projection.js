/*global define */

define( [
    'osg/osg',
    'osg/Node',
    'osg/Matrix'
], function ( osg, Node, Matrix ) {

    var Projection = function () {
        Node.call( this );
        this.projection = Matrix.makeIdentity( [] );
    };
    Projection.prototype = osg.objectInehrit( Node.prototype, {
        getProjectionMatrix: function () {
            return this.projection;
        },
        setProjectionMatrix: function ( m ) {
            this.projection = m;
        }
    } );
    Projection.prototype.objectType = osg.objectType.generate( 'Projection' );

    return Projection;
} );