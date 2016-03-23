'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Node = require( 'osg/Node' );
var Matrix = require( 'osg/Matrix' );
var TransformEnums = require( 'osg/TransformEnums' );

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

    computeBoundingSphere: ( function () {
        var matrix = Matrix.create();
        return function ( bSphere ) {
            Node.prototype.computeBoundingSphere.call( this, bSphere );
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

module.exports = Transform;
