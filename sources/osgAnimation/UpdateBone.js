define( [
    'osg/Utils',
    'osg/Notify',
    'osgAnimation/UpdateMatrixTransform'
], function ( MACROUTILS, Notify, UpdateMatrixTransform ) {

    'use strict';

    /**
     *  UpdateBone
     *  @class UpdateBone
     */
    var UpdateBone = function () {
        UpdateMatrixTransform.call( this );
    };

    /** @lends AnimationUpdateCallback.prototype */
    UpdateMatrixTransform.prototype = MACROUTILS.objectInherit( UpdateMatrixTransform.prototype, {

        update: function ( node /*, nv */ ) {

            //@TODO
            return true;
        }
    } );

    return UpdateBone;
} );
