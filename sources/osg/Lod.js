/**
 * @author Jordi Torres
 */


define( [
    'osg/Utils',
    'osg/Node',
    'osg/NodeVisitor',
    'osg/Matrix',
    'osg/Vec3',
    'osg/BoundingSphere'
], function ( MACROUTILS, Node, NodeVisitor, Matrix, Vec3, BoundingSphere ) {
    /**
     *  Lod that can contains child node
     *  @class Lod
     */
    var Lod = function () {
        Node.call( this );
        this._radius = -1;
        this._range = [];
        this._rangeMode = Lod.DISTANCE_FROM_EYE_POINT;
        this._userDefinedCenter = [];
        this._centerMode = Lod.USE_BOUNDING_SPHERE_CENTER;
    };

    Lod.DISTANCE_FROM_EYE_POINT = 0;
    Lod.PIXEL_SIZE_ON_SCREEN = 1;

    Lod.USE_BOUNDING_SPHERE_CENTER = 0;
    Lod.USER_DEFINED_CENTER = 1;
    Lod.UNION_OF_BOUNDING_SPHERE_AND_USER_DEFINED = 2;

    /** @lends Lod.prototype */
    Lod.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Node.prototype, {
        // Functions here
        getRadius: function () {
            return this._radius;
        },

        /** Set the object-space reference radius of the volume enclosed by the LOD.
         * Used to determine the bounding sphere of the LOD in the absence of any children.*/
        setRadius: function ( radius ) {
            this._radius = radius;
        },

        setCenter: function ( center ) {
            if ( this._centerMode !== Lod.UNION_OF_BOUNDING_SPHERE_AND_USER_DEFINED )
                this._centerMode = Lod.USER_DEFINED_CENTER;
            this._userDefinedCenter = center;
        },

        getCenter: function () {
            if ( ( this._centerMode === Lod.USER_DEFINED_CENTER ) || ( this._centerMode === Lod.UNION_OF_BOUNDING_SPHERE_AND_USER_DEFINED ) )
                return this._userDefinedCenter;
            else return this.getBound().center();
        },

        setCenterMode: function ( centerMode ) {
            this._centerMode = centerMode;
        },

        computeBound: function ( bsphere ) {
            if ( this._centerMode === Lod.USER_DEFINED_CENTER && this._radius >= 0.0)
            {
                bsphere.set( this._userDefinedCenter, this._radius);
                return bsphere;
            }
            else if ( this._centerMode === Lod.UNION_OF_BOUNDING_SPHERE_AND_USER_DEFINED && this._radius >= 0.0)
            {
                bsphere.set( this._userDefinedCenter, this._radius);
                var bs = new BoundingSphere();
                bsphere.expandBy( Node.prototype.computeBound.call( this, bs ) );
                return bsphere;
            }
            else
            {
                Node.prototype.computeBound.call( this, bsphere );
                return bsphere;
            }
        },

        projectBoundingSphere: ( function () {
            // from http://www.iquilezles.org/www/articles/sphereproj/sphereproj.htm
            // Sample code at http://www.shadertoy.com/view/XdBGzd?
            var o = Vec3.create();
            return function ( sph, camMatrix, fle ) {
                Matrix.transformVec3( camMatrix, sph.center(), o );
                var r2 = sph.radius2();
                var z2 = o[ 2 ] * o[ 2 ];
                var l2 = Vec3.length2( o );
                var area = -Math.PI * fle * fle * r2 * Math.sqrt( Math.abs( ( l2 - r2 ) / ( r2 - z2 ) ) ) / ( r2 - z2 );
                return area;
            };
        } )(),

        setRangeMode: function ( mode ) {
            //TODO: check if mode is correct
            this._rangeMode = mode;
        },

        addChildNode: function ( node ) {

            Node.prototype.addChild.call( this, node );
            if ( this.children.length > this._range.length ) {
                var r = [];
                var max = 0.0;
                if ( this._range.lenght > 0 )
                    max = this._range[ this._range.length - 1 ][ 1 ];
                r.push( [ max, max ] );
                this._range.push( r );
            }
            return true;
        },

        addChild: function ( node, min, max ) {
            Node.prototype.addChild.call( this, node );

            if ( this.children.length > this._range.length ) {
                var r = [];
                r.push( [ min, min ] );
                this._range.push( r );
            }
            this._range[ this.children.length - 1 ][ 0 ] = min;
            this._range[ this.children.length - 1 ][ 1 ] = max;
            return true;
        },

        traverse: ( function () {

            // avoid to generate variable on the heap to limit garbage collection
            // instead create variable and use the same each time
            var zeroVector = Vec3.create();
            var eye = Vec3.create();
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
                    var matrix = visitor.getCurrentModelviewMatrix();
                    Matrix.inverse( matrix, viewModel );
                    // Calculate distance from viewpoint
                    if ( this._rangeMode === Lod.DISTANCE_FROM_EYE_POINT ) {
                        Matrix.transformVec3( viewModel, zeroVector, eye );
                        var d = Vec3.distance( eye, this.getBound().center() );
                        requiredRange = d;
                    } else {
                        // Let's calculate pixels on screen
                        var projmatrix = visitor.getCurrentProjectionMatrix();
                        // focal lenght is the value stored in projmatrix[0]
                        requiredRange = this.projectBoundingSphere( this.getBound(), matrix, projmatrix[ 0 ] );
                        // Multiply by a factor to get the real area value
                        requiredRange = ( requiredRange * visitor.getViewport().width() * visitor.getViewport().width() ) * 0.25;
                    }

                    var numChildren = this.children.length;
                    if ( this._range.length < numChildren ) numChildren = this._range.length;

                    for ( var j = 0; j < numChildren; ++j ) {
                        if ( this._range[ j ][ 0 ] <= requiredRange && requiredRange < this._range[ j ][ 1 ] ) {
                            this.children[ j ].accept( visitor );
                        }
                    }
                    break;

                default:
                    break;
                }
            };
        } )()

    } ), 'osg', 'Lod' );

    MACROUTILS.setTypeID( Lod );
    return Lod;
} );
