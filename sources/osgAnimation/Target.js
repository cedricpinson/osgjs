define( [
    'osg/Matrix',
    'osg/Quat',
    'osg/Vec3',
    'osgAnimation/channelType'
], function ( Matrix, Quat, Vec3, channelType ) {

    'use strict';

    var target = {};
    target.InvalidTargetID = -1;

    // defaultValue is used when no channels affect the value
    var createTarget = function ( type, value, defaultValue ) {
        return {
            type: type,
            id: target.InvalidTargetID, // -1 means no id assigned yet
            channels: [],
            value: value,
            defaultValue: defaultValue
        };
    };

    var createQuatTarget = function ( defaultValue ) {
        return createTarget( channelType.Quat,
            Quat.copy( defaultValue, Quat.create() ),
            Quat.copy( defaultValue, Quat.create() ) );
    };

    var createMatrixTarget = function ( defaultValue ) {
        return createTarget( channelType.Matrix,
            Matrix.copy( defaultValue, Matrix.create() ),
            Matrix.copy( defaultValue, Matrix.create() ) );
    };

    var createVec3Target = function ( defaultValue ) {
        return createTarget( channelType.Vec3,
            Vec3.copy( defaultValue, Vec3.create() ),
            Vec3.copy( defaultValue, Vec3.create() ) );
    };

    var createFloatTarget = function ( defaultValue ) {
        return createTarget( channelType.Float,
            defaultValue,
            defaultValue );
    };

    target.createQuatTarget = createQuatTarget;
    target.createVec3Target = createVec3Target;
    target.createFloatTarget = createFloatTarget;
    target.createMatrixTarget = createMatrixTarget;

    return target;

} );
