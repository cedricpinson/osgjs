/*global define */

define( [
    'osg/osg',
    'osg/Node',
    'osg/Transform',
    'osg/Matrix',
    'osg/Camera',
    'osg/Vec3'
], function ( osg, Node, Transform, Matrix, Camera, Vec3 ) {
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

    // #FIXME which namespace ?
    Transform.computeLocalToWorld = function ( nodePath, ignoreCameras ) {
        var ignoreCamera = ignoreCameras;
        if ( ignoreCamera === undefined ) {
            ignoreCamera = true;
        }
        var matrix = Matrix.makeIdentity( [] );

        var j = 0;
        if ( ignoreCamera ) {
            for ( j = nodePath.length - 1; j > 0; j-- ) {
                var camera = nodePath[ j ];
                if ( camera.objectType === Camera.prototype.objectType &&
                    ( camera.getReferenceFrame !== Transform.RELATIVE_RF || camera.getParents().length === 0 ) ) {
                    break;
                }
            }
        }

        for ( var i = j, l = nodePath.length; i < l; i++ ) {
            var node = nodePath[ i ];
            if ( node.computeLocalToWorldMatrix ) {
                node.computeLocalToWorldMatrix( matrix );
            }
        }
        return matrix;
    };

    return Transform;
} );