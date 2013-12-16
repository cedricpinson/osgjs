/*global define */

define( [
    //#FIXME enum fix 'osg/Camera', 
    'osg/Matrix',
    'osg/Enums'
], function ( /* Camera, */ Matrix, Enums ) {
    /** -*- compile-command: "jslint-cli Transform.js" -*- */

    computeLocalToWorld = function ( nodePath, ignoreCameras ) {
        var ignoreCamera = ignoreCameras;
        if ( ignoreCamera === undefined ) {
            ignoreCamera = true;
        }
        var matrix = Matrix.makeIdentity( [] );

        var j = 0;
        if ( ignoreCamera ) {
            for ( j = nodePath.length - 1; j > 0; j-- ) {
                var camera = nodePath[ j ];
                if ( camera.objectType === 1 /* #FIXME enum fix Camera.prototype.objectType */ &&
                    ( camera.getReferenceFrame !== Enums.TRANSFORM_RELATIVE_RF || camera.getParents().length === 0 ) ) {
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

    return {
        computeLocalToWorld: computeLocalToWorld
    };
} );