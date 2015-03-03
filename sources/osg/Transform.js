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
    Transform.prototype = MACROUTILS.objectInherit( Node.prototype, {
        setReferenceFrame: function ( value ) {
            this.referenceFrame = value;
        },
        getReferenceFrame: function () {
            return this.referenceFrame;
        },


        computeBound: ( function () {
            var matrix = Matrix.create();
            return function ( bSphere ) {
                Node.prototype.computeBound.call( this, bSphere );
                if ( !bSphere.valid() ) {
                    return bSphere;
                }
                Matrix.makeIdentity( matrix );
                // local to local world (not Global World)
                this.computeLocalToWorldMatrix( matrix );
                Matrix.transformBoundingSphere( matrix, bSphere, bSphere );
                return bSphere;
            };
        } )()
    } );

    return Transform;
} );
