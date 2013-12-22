define( [
    'osg/Utils',
    'osg/Notify',
    'osg/Matrix',
    'osgAnimation/AnimationUpdateCallback'
], function ( MACROUTILS, Notify, Matrix, AnimationUpdateCallback ) {

    /**
     *  UpdateMatrixTransform
     *  @class UpdateMatrixTransform
     */
    var UpdateMatrixTransform = function () {
        AnimationUpdateCallback.call( this );
        this._stackedTransforms = [];
    };

    /** @lends AnimationUpdateCallback.prototype */
    UpdateMatrixTransform.prototype = MACROUTILS.objectInehrit( AnimationUpdateCallback.prototype, {
        getStackedTransforms: function () {
            return this._stackedTransforms;
        },
        update: function ( node /*, nv */ ) {

            // not optimized, we could avoid operation the animation did not change
            // the content of the transform element
            var matrix = node.getMatrix();
            Matrix.makeIdentity( matrix );
            var transforms = this._stackedTransforms;
            for ( var i = 0, l = transforms.length; i < l; i++ ) {
                var transform = transforms[ i ];
                transform.update();
                transform.applyToMatrix( matrix );
            }
            return true;
        },
        linkChannel: function ( channel ) {
            var channelName = channel.getName();
            var transforms = this._stackedTransforms;
            for ( var i = 0, l = transforms.length; i < l; i++ ) {
                var transform = transforms[ i ];
                var elementName = transform.getName();
                if ( channelName.length > 0 && elementName === channelName ) {
                    var target = transform.getOrCreateTarget();
                    if ( target ) {
                        channel.setTarget( target );
                        return true;
                    }
                }
            }
            Notify.log( 'can\'t link channel ' + channelName + ', does not contain a symbolic name that can be linked to TransformElements' );
            return false;
        }

    } );

    return UpdateMatrixTransform;
} );
