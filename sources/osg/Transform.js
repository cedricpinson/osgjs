define( [
    'osg/Utils',
    'osg/Node',
    'osg/Matrix',
    'osg/Vec3',
    'osg/TransformEnums'
], function ( MACROUTILS, Node, Matrix, Vec3, TransformEnums ) {

    'use strict';
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

        computeBound: ( function () {
            var xdash = [ 0.0, 0.0, 0.0 ];
            var ydash = [ 0.0, 0.0, 0.0 ];
            var zdash = [ 0.0, 0.0, 0.0 ];
            return function ( bsphere ) {
                Node.prototype.computeBound.call( this, bsphere );
                if ( !bsphere.valid() ) {
                    return bsphere;
                }
                var sphCenter = bsphere._center;
                var sphRadius = bsphere._radius;

                var matrix = Matrix.create();
                this.computeLocalToWorldMatrix( matrix );

                Vec3.copy( sphCenter, xdash );
                xdash[ 0 ] += sphRadius;
                Matrix.transformVec3( matrix, xdash, xdash );

                Vec3.copy( sphCenter, ydash );
                ydash[ 1 ] += sphRadius;
                Matrix.transformVec3( matrix, ydash, ydash );

                Vec3.copy( sphCenter, zdash );
                zdash[ 2 ] += sphRadius;
                Matrix.transformVec3( matrix, zdash, zdash );

                Matrix.transformVec3( matrix, sphCenter, sphCenter );

                var lenXdash = Vec3.distance( xdash, sphCenter );
                var lenYdash = Vec3.distance( ydash, sphCenter );
                var lenZdash = Vec3.distance( zdash, sphCenter );

                if ( lenXdash > lenYdash )
                    bsphere._radius = lenXdash > lenZdash ? lenXdash : lenZdash;
                else
                    bsphere._radius = lenYdash > lenZdash ? lenYdash : lenZdash;
                return bsphere;
            };
        } )()
    } );

    return Transform;
} );
