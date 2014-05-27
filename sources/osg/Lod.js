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
        this.rangeMode = Lod.DISTANCE_FROM_EYE_POINT;
    };
    
    Lod.DISTANCE_FROM_EYE_POINT = 0;
    Lod.PIXEL_SIZE_ON_SCREEN = 1;

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

        projectSphere: function ( sph, camMatrix, fle ) {
            //from http://www.iquilezles.org/www/articles/sphereproj/sphereproj.htm
            // Need to change basis to Y-UP
            var matrix3 = [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1];
            var yup = Matrix.mult(camMatrix, matrix3, []);
            var sphVector = [sph.center()[0],sph.center()[1],sph.center()[2]];
            // transform to camera space
            var sphv = Matrix.transformVec3 (matrix3, sphVector,[]);
            var o4 = [0,0,0];
            Matrix.transformVec3(yup, sphv, o4 );
            var o = [o4[0],o4[1],o4[2]];
            var r2 = sph.radius2(); var r4 = r2*r2;
            var z2 = o[2]*o[2];     var z4 = z2*z2;
            var l2 = Vec3.dot(o,o); var l4 = l2*l2;

            var m = (r2-l2)*(r2-z2); // m = -discriminant{ f(x,y) } = c² - 4ab
            var n = r2*(r4 - r2*(l2-z2) + (z4 - l2 - z2 - l2*z2*(l2-z2) )) + l4 + l4*z2 - l2*z4 - z4;
            var area = Math.PI*n*fle*fle/Math.sqrt(m*m*m);
            var cen = [];
            cen[0]= fle*o[1]*o[0]/(z2-r2);
            cen[1]= fle*o[1]*o[2]/(z2-r2);
            if( m < 0.0 ) area=-1.0;
            return area;
        },

        setRangeMode: function (mode) {
            //TODO: check if mode is correct
            this.rangeMode = mode;
        },

        addChildNode: function ( node ) {

            Node.prototype.addChild.call( this, node );
            if ( this.children.length > this.range.length ) {
                var r = [];
                var max = 0.0;
                if (this.range.lenght > 0 )
                    max = this.range[ this.range.length -1 ][1];
                r.push( [ max, max ] );
                this.range.push( r );
            }
        return true;
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
                    // First approximation calculate distance from viewpoint
                    if ( this.rangeMode ===  Lod.DISTANCE_FROM_EYE_POINT){
                        Matrix.transformVec3( viewModel, zeroVector, eye );
                        var d = Vec3.distance( eye, this.getBound().center() );
                        requiredRange = d;
                    } else {
                        // Calculate pixels on screen, not exact yet
                        var viewMatrix = Matrix.create();
                        var center = [ 0.0, 0.0, 0.0 ];
                        var up = [ 0.0, 0.0, 0.0 ];
                        // Get the View Matrix
                        Matrix.getLookAt( viewModel, eye, center, up, 1 );
                        Matrix.makeLookAt( eye, Vec3.neg(center, center), up, viewMatrix);
                        var projmatrix = visitor.getCurrentProjectionMatrix();
                        var info = {};
                        Matrix.getFrustum(projmatrix, info);
                        requiredRange = this.projectSphere(this.getBound(),viewMatrix, info.zNear/info.right);
                        // Try to get near the real value
                        requiredRange = (requiredRange*visitor.getViewport().width()*visitor.getViewport().width())/ 6;
                        if ( requiredRange < 0 ) requiredRange = 0;
                        //console.log ('PIXEL SIZE =' , requiredRange, 'center', center );
                    }

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
