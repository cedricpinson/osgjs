/*global define */

define( [
    'osg/osg',
    'osg/Node',
    'osg/Matrix',
    'osg/Vec3'
], function ( osg, Node, Matrix, Vec3 ) {
    /** -*- compile-command: "jslint-cli Transform.js" -*- */

    /** 
     * Transform - base class for Transform type node ( Camera, MatrixTransform )
     * @class Transform
     * @inherits Node
     */
    var Transform = function () {
        Node.call( this );
        this.referenceFrame = Transform.RELATIVE_RF;
    };
    Transform.RELATIVE_RF = 0;
    Transform.ABSOLUTE_RF = 1;

    /** @lends Transform.prototype */
    Transform.prototype = osg.objectInehrit( Node.prototype, {
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
            var len_xdash = Vec3.length( xdash );

            Vec3.sub( ydash,
                bsphere._center,
                ydash );
            var len_ydash = Vec3.length( ydash );

            Vec3.sub( zdash,
                bsphere._center,
                zdash );
            var len_zdash = Vec3.length( zdash );

            bsphere._radius = len_xdash;
            if ( bsphere._radius < len_ydash ) {
                bsphere._radius = len_ydash;
            }
            if ( bsphere._radius < len_zdash ) {
                bsphere._radius = len_zdash;
            }
            return bsphere;
        }
    } );

    return Transform;
} );