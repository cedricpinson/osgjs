define( ['osg/Quat'], function (Quat) {

    'use strict';

    var OrbitManipulatorDeviceOrientationController = function ( manipulator ) {
        this._manipulator = manipulator;
        this.init();
    };

    var degtorad = Math.PI / 180.0; // Degree-to-Radian conversion

    OrbitManipulatorDeviceOrientationController.prototype = {
        init: function () {
            this._stepFactor = 1.0; // meaning radius*stepFactor to move
            this._quat = Quat.create();
        },
        update: function ( deviceOrientation, screenOrientation ) {

            // If the user goes in landscape mode, he rotates his device with a certain angle
            // around the Z axis counterclockwise and the DeviceOrientation contains this rotation
            // To compensate this, we apply a rotation of the same angle in the opposite way

            computeQuaternion(this._quat, deviceOrientation, screenOrientation);
            this._manipulator.setRotationBaseFromQuat(this._quat);
        },

    };
    var computeQuaternion = (function () {

        var screenTransform = Quat.create();
        var worldTransform = [-Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ]; // - PI/2 around the x-axis
        var minusHalfAngle = 0;

        return function (quat, deviceOrientation, screenOrientation ) {

            var alpha = deviceOrientation.alpha * degtorad;
            var beta = deviceOrientation.beta * degtorad;
            var gamma = deviceOrientation.gamma * degtorad;
            var screenAngle = screenOrientation * degtorad;

            setQuatFromEuler(quat, beta, alpha, -gamma, 'YXZ');

            minusHalfAngle = -screenAngle / 2.0;
            screenTransform[1] = Math.sin( minusHalfAngle );
            screenTransform[2] = Math.cos( minusHalfAngle );

            Quat.mult(quat, screenTransform, quat );
            Quat.mult(quat, worldTransform, quat );

            var yTemp = quat[1];
            quat[1] = -quat[2];
            quat[2] = yTemp;

            return quat;
        };

    })();

    var setQuatFromEuler = function ( quat, x, y, z, order ) {

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

            quat[0] = s1 * c2 * c3 + c1 * s2 * s3;
            quat[1] = c1 * s2 * c3 - s1 * c2 * s3;
            quat[2] = c1 * c2 * s3 + s1 * s2 * c3;
            quat[3] = c1 * c2 * c3 - s1 * s2 * s3;

        } else if ( order === 'YXZ' ) {

            quat[0] = s1 * c2 * c3 + c1 * s2 * s3;
            quat[1] = c1 * s2 * c3 - s1 * c2 * s3;
            quat[2] = c1 * c2 * s3 - s1 * s2 * c3;
            quat[3] = c1 * c2 * c3 + s1 * s2 * s3;

        } else if ( order === 'ZXY' ) {

            quat[0] = s1 * c2 * c3 - c1 * s2 * s3;
            quat[1] = c1 * s2 * c3 + s1 * c2 * s3;
            quat[2] = c1 * c2 * s3 + s1 * s2 * c3;
            quat[3] = c1 * c2 * c3 - s1 * s2 * s3;

        } else if ( order === 'ZYX' ) {

            quat[0] = s1 * c2 * c3 - c1 * s2 * s3;
            quat[1] = c1 * s2 * c3 + s1 * c2 * s3;
            quat[2] = c1 * c2 * s3 - s1 * s2 * c3;
            quat[3] = c1 * c2 * c3 + s1 * s2 * s3;

        } else if ( order === 'YZX' ) {

            quat[0] = s1 * c2 * c3 + c1 * s2 * s3;
            quat[1] = c1 * s2 * c3 + s1 * c2 * s3;
            quat[2] = c1 * c2 * s3 - s1 * s2 * c3;
            quat[3] = c1 * c2 * c3 - s1 * s2 * s3;

        } else if ( order === 'XZY' ) {

            quat[0] = s1 * c2 * c3 - c1 * s2 * s3;
            quat[1] = c1 * s2 * c3 - s1 * c2 * s3;
            quat[2] = c1 * c2 * s3 + s1 * s2 * c3;
            quat[3] = c1 * c2 * c3 + s1 * s2 * s3;

        }
    };

    return OrbitManipulatorDeviceOrientationController;
} );
