define( [
    'osg/Utils',
    'osg/Notify',
    'osg/Matrix',
    'osgAnimation/AnimationUpdateCallback'
], function ( MACROUTILS, Notify, Matrix, AnimationUpdateCallback ) {

    'use strict';

    /**
     *  UpdateMatrixTransform
     */
    var UpdateMatrixTransform = function () {
        AnimationUpdateCallback.call( this );

        // maybe could have a more generic name and used by all AnimationUpdateCallback
        this._stackedTransforms = [];

        this._matrix = Matrix.create();

        this._dirty = false;
    };


    UpdateMatrixTransform.prototype = MACROUTILS.objectInherit( AnimationUpdateCallback.prototype, {

        getStackedTransforms: function () {
            return this._stackedTransforms;
        },

        computeChannels: function () {
            this._dirty = true;
            var matrix = this._matrix;
            Matrix.makeIdentity( matrix );
            var transforms = this._stackedTransforms;

            for ( var i = 0, l = transforms.length; i < l; i++ ) {
                var transform = transforms[ i ];
                transform.applyToMatrix( matrix );
            }
        },

        update: function ( node /*, nv */ ) {
            Matrix.copy( this._matrix, node.getMatrix() );
            if ( this._dirty ) {
                node.dirtyBound();
                this._dirty = false;
            }
            return true;
        }

    } );

    return UpdateMatrixTransform;
} );
