define( [
    'osg/Utils',
    'osg/Node',
    'osg/Matrix',
    'osg/Vec3',
    'osg/TransformEnums'
], function ( MACROUTILS, Node, Matrix, Vec3, TransformEnums ) {
        /**
     * Transform - base class for Transform type node ( Camera, MatrixTransform )
     * @class Transform
     * @inherits Node
     */
    var Transform = function () {
        Node.call( this );
        this.referenceFrame = TransformEnums.RELATIVE_RF;
    };

    /** @lends Transform.prototype */
    Transform.prototype = MACROUTILS.objectInehrit( Node.prototype, {
        setReferenceFrame: function ( value ) {
            this.referenceFrame = value;
        },
        getReferenceFrame: function () {
            return this.referenceFrame;
        },

        computeBound: function ( bsphere ) {
            Node.prototype.computeBound.call( this, bsphere );
            if ( !bsphere.valid() ) {
                return bsphere;
            }
            var matrix = Matrix.makeIdentity( [] );
            this.computeLocalToWorldMatrix( matrix );

            var xdash = Vec3.copy( bsphere._center, [] );
            xdash[ 0 ] += bsphere._radius;
            Matrix.transformVec3( matrix, xdash, xdash );

            var ydash = Vec3.copy( bsphere._center, [] );
            ydash[ 1 ] += bsphere._radius;
            Matrix.transformVec3( matrix, ydash, ydash );

            var zdash = Vec3.copy( bsphere._center, [] );
            zdash[ 2 ] += bsphere._radius;
            Matrix.transformVec3( matrix, zdash, zdash );

            Matrix.transformVec3( matrix, bsphere._center, bsphere._center );

            Vec3.sub( xdash,
                bsphere._center,
                xdash );
            var lenXdash = Vec3.length( xdash );

            Vec3.sub( ydash,
                bsphere._center,
                ydash );
            var lenYdash = Vec3.length( ydash );

            Vec3.sub( zdash,
                bsphere._center,
                zdash );
            var lenZdash = Vec3.length( zdash );

            bsphere._radius = lenXdash;
            if ( bsphere._radius < lenYdash ) {
                bsphere._radius = lenYdash;
            }
            if ( bsphere._radius < lenZdash ) {
                bsphere._radius = lenZdash;
            }
            return bsphere;
        }
    } );

    return Transform;
} );
