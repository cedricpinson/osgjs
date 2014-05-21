/**
 * @author Jordi Torres
 */


define( [
    'osg/Utils',
    'osg/Lod',
    'osg/NodeVisitor',
    'osg/Matrix',
    'osg/Vec3',
    'osg/Shape'
], function ( MACROUTILS, Lod, NodeVisitor, Matrix, Vec3, Shape ) {
    /**
     *  PagedLOD that can contains paged child nodes
     *  @class Lod
     */
    var PagedLOD = function () {
        Lod.call( this );
        this.radius = -1;
        this.range = [];
    };
    /** @lends Lod.prototype */
    PagedLOD.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Lod.prototype, {
        // Functions here
        setRange: function ( childNo, min, max ) {
         if ( childNo >= this.range.length ) {
                var r = [];
                r.push( [ min, min ] );
                this.range.push( r );
            }
            this.range[ childNo ][ 0 ] = min;
            this.range[ childNo ][ 1 ] = max;
        },

        traverse: (function() {

            // avoid to generate variable on the heap to limit garbage collection
            // instead create variable and use the same each time
            var zeroVector = [ 0.0, 0.0, 0.0 ];
            var eye = [ 0.0, 0.0, 0.0 ];
            var viewModel = Matrix.create();

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
                    var needToLoadChild = false;
                    var lastChildTraversed = -1;
                    for ( var j = 0; j < this.range.length; ++j ) {
                        if ( this.range[ j ][ 0 ] <= requiredRange && requiredRange < this.range[ j ][ 1 ] ) {
                            if ( j < numChildren ) {
                                // if (updateTimeStamp)....
                                this.children[ j ].accept( visitor );
                                lastChildTraversed = j;
                            }
                            else {
                                needToLoadChild = true;
                            }
                        }
                    }
                    if ( needToLoadChild )
                    {
                        if ( numChildren > 0 && numChildren -1 !== lastChildTraversed ) {
                            // if (updateTimeStamp) ....
                            this.children[numChildren-1].accept( visitor );
                        }
                         // now request the loading of the next unloaded child.
                         if ( numChildren < this.range.length ){

                            // Here we should do the request
                            console.log('Requesting the child number ', numChildren, visitor.nodePath[visitor.nodePath.length -1]);
                            var group = visitor.nodePath[visitor.nodePath.length -1];
                            group.addChildNode(Shape.createAxisGeometry(10));
                         }
                    }
                    break;

                default:
                    break;
                }
            };
        })()



        } ), 'osg', 'PagedLOD' );

    MACROUTILS.setTypeID( PagedLOD );
    return PagedLOD;
});