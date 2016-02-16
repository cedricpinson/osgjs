'use strict';
var Quat = require( 'osg/Quat' );

var degtorad = Math.PI / 180.0; // Degree-to-Radian conversion

var makeRotateFromEuler = function ( x, y, z, order, quat ) {

    // http://www.mathworks.com/matlabcentral/fileexchange/
    // 20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
    // content/SpinCalc.m

    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );

    if ( order === 'XYZ' ) {

        quat[ 0 ] = s1 * c2 * c3 + c1 * s2 * s3;
        quat[ 1 ] = c1 * s2 * c3 - s1 * c2 * s3;
        quat[ 2 ] = c1 * c2 * s3 + s1 * s2 * c3;
        quat[ 3 ] = c1 * c2 * c3 - s1 * s2 * s3;

    } else if ( order === 'YXZ' ) {

        quat[ 0 ] = s1 * c2 * c3 + c1 * s2 * s3;
        quat[ 1 ] = c1 * s2 * c3 - s1 * c2 * s3;
        quat[ 2 ] = c1 * c2 * s3 - s1 * s2 * c3;
        quat[ 3 ] = c1 * c2 * c3 + s1 * s2 * s3;

    } else if ( order === 'ZXY' ) {

        quat[ 0 ] = s1 * c2 * c3 - c1 * s2 * s3;
        quat[ 1 ] = c1 * s2 * c3 + s1 * c2 * s3;
        quat[ 2 ] = c1 * c2 * s3 + s1 * s2 * c3;
        quat[ 3 ] = c1 * c2 * c3 - s1 * s2 * s3;

    } else if ( order === 'ZYX' ) {

        quat[ 0 ] = s1 * c2 * c3 - c1 * s2 * s3;
        quat[ 1 ] = c1 * s2 * c3 + s1 * c2 * s3;
        quat[ 2 ] = c1 * c2 * s3 - s1 * s2 * c3;
        quat[ 3 ] = c1 * c2 * c3 + s1 * s2 * s3;

    } else if ( order === 'YZX' ) {

        quat[ 0 ] = s1 * c2 * c3 + c1 * s2 * s3;
        quat[ 1 ] = c1 * s2 * c3 + s1 * c2 * s3;
        quat[ 2 ] = c1 * c2 * s3 - s1 * s2 * c3;
        quat[ 3 ] = c1 * c2 * c3 - s1 * s2 * s3;

    } else if ( order === 'XZY' ) {

        quat[ 0 ] = s1 * c2 * c3 - c1 * s2 * s3;
        quat[ 1 ] = c1 * s2 * c3 - s1 * c2 * s3;
        quat[ 2 ] = c1 * c2 * s3 + s1 * s2 * c3;
        quat[ 3 ] = c1 * c2 * c3 + s1 * s2 * s3;

    }
    return quat;
};


var FirstPersonManipulatorDeviceOrientationController = function ( manipulator ) {
    this._manipulator = manipulator;
    this.init();
};

FirstPersonManipulatorDeviceOrientationController.computeQuaternion = ( function () {

    var screenTransform = Quat.create();
    var worldTransform = Quat.createAndSet( -Math.sqrt( 0.5 ), 0.0, 0.0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

    // but on ios alpha is relative to the first question:
    //
    // http://www.html5rocks.com/en/tutorials/device/orientation/
    // For most browsers, alpha returns the compass heading, so when the device is pointed
    // north, alpha is zero. With Mobile Safari, alpha is based on the direction the
    // device was pointing when device orientation was first requested. The compass
    // heading is available in the webkitCompassHeading parameter.

    return function ( quat, deviceOrientation, screenOrientation ) {

        var alpha = deviceOrientation.alpha * degtorad;
        var beta = deviceOrientation.beta * degtorad;
        var gamma = deviceOrientation.gamma * degtorad;

        // If the user goes in landscape mode, he rotates his device with a certain angle
        // around the Z axis counterclockwise and the DeviceOrientation contains this
        // rotation To compensate this, we apply a rotation of the same angle in the
        // opposite way

        var screenAngle = screenOrientation * degtorad;

        // alpha is heading -> X
        // beta             -> Z Up
        // Gamma            -> Y view direction
        makeRotateFromEuler( beta, alpha, -gamma, 'YXZ', quat );
        // equivalent to
        // var rotateX = Matrix.makeRotate( beta, 1,0,0, Matrix.create() );
        // var rotateY = Matrix.makeRotate( alpha, 0,1,0, Matrix.create() );
        // var rotateZ = Matrix.makeRotate( -gamma, 0,0,1, Matrix.create() );
        // var result = Matrix.create();
        // Matrix.mult( rotateY, rotateX, result );
        // Matrix.mult( result, rotateZ, result );
        // Matrix.getRotate( result, quat );

        var minusHalfAngle = -screenAngle / 2.0;
        screenTransform[ 1 ] = Math.sin( minusHalfAngle );
        screenTransform[ 3 ] = Math.cos( minusHalfAngle );

        Quat.mult( quat, screenTransform, quat );
        Quat.mult( quat, worldTransform, quat );

        var yTemp = quat[ 1 ];
        quat[ 1 ] = -quat[ 2 ];
        quat[ 2 ] = yTemp;

        return quat;
    };

} )();

FirstPersonManipulatorDeviceOrientationController.prototype = {

    init: function () {
        this._stepFactor = 1.0; // meaning radius*stepFactor to move
        this._quat = Quat.create();
    },

    update: function ( deviceOrientation, screenOrientation ) {

        FirstPersonManipulatorDeviceOrientationController.computeQuaternion( this._quat, deviceOrientation, screenOrientation );
        this._manipulator.setRotationBaseFromQuat( this._quat );
    }

};

module.exports = FirstPersonManipulatorDeviceOrientationController;
