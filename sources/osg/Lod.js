/**
 * @author Jordi Torres
 */


define( [
    'osg/Utils',
    'osg/Node',
    'osg/NodeVisitor',
    'osg/Matrix',
    'osg/Vec3'
], function ( MACROUTILS, Node, NodeVisitor, Matrix, Vec3) {
    /**
     *  Lod that can contains child node
     *  @class Lod
     */
    var Lod = function () {
        Node.call( this );
        this.radius = -1;
        this.range = [];
    };
    /** @lends Lod.prototype */
    Lod.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Node.prototype, {
        // Functions here
        getRadius: function () {
            return this.radius;
        },

        /** Set the object-space reference radius of the volume enclosed by the LOD.
         * Used to determine the bounding sphere of the LOD in the absence of any children.*/
        setRadius: function ( radius ) {
            this.radius = radius;
        },

        addChild: function ( node, min, max ) {
            Node.prototype.addChild.call( this, node );

            if ( this.children.length > this.range.length ) {
                var r = [];
                r.push( [ min, min ] );
                this.range.push( r );
            }
            this.range[ this.children.length - 1 ][ 0 ] = min;
            this.range[ this.children.length - 1 ][ 1 ] = max;
            return true;
        },

        traverse: (function() {

            // avoid to generate variable on the heap to limit garbage collection
            // instead create variable and use the same each time
            var zeroVector = [ 0.0, 0.0, 0.0 ];
            var eye = [ 0.0, 0.0, 0.0 ];
            var viewModel = Matrix.makeIdentity( [] );

            return function ( visitor ) {
                var traversalMode = visitor.traversalMode;

                switch ( traversalMode ) {

                case NodeVisitor.TRAVERSE_ALL_CHILDREN:

                    for ( var index = 0; index < this.children.length; index++ ) {
                        this.children[ index ].accept( visitor );
                    }
                    break;

                case ( NodeVisitor.TRAVERSE_ACTIVE_CHILDREN ):
                    var requiredRange = 0;

                    // First approximation calculate distance from viewpoint
                    var matrix = visitor.getCurrentModelviewMatrix();
                    Matrix.inverse( matrix, viewModel );
                    Matrix.transformVec3( viewModel, zeroVector, eye );
                    var d = Vec3.distance( eye, this.getBound().center() );
                    requiredRange = d;

                    var numChildren = this.children.length;
                    if ( this.range.length < numChildren ) numChildren = this.range.length;

                    for ( var j = 0; j < numChildren; ++j ) {
                        if ( this.range[ j ][ 0 ] <= requiredRange && requiredRange < this.range[ j ][ 1 ] ) {
                            this.children[ j ].accept( visitor );
                        }
                    }
                    break;

                default:
                    break;
                }
            };
        })()

    } ), 'osg', 'Lod' );

    MACROUTILS.setTypeID( Lod );
    return Lod;
});
