'use strict';
var assert = require('chai').assert;
var OrbitManipulator = require('osgGA/OrbitManipulator');

module.exports = function() {
    test('OrbitManipulator', function() {
        var manipulator = new OrbitManipulator();
        var matrix = manipulator.getInverseMatrix();
        assert.isOk(matrix !== undefined, 'check getInverseMatrix method');
    });

    test('OrbitManipulator check controllers', function() {
        var manipulator = new OrbitManipulator();
        var list = manipulator.getControllerList();
        assert.isOk(list.StandardMouseKeyboard !== undefined, 'check mouse support');
        assert.isOk(list.Hammer !== undefined, 'check hammer support');
        assert.isOk(list.GamePad !== undefined, 'check game pad support');
    });

    test('OrbitManipulator test limits yaw', function() {
        var orbit = new OrbitManipulator();
        var yaw;

        //small angle no offset
        yaw = orbit._computeYaw(0, 0.01, -0.2, 0.2);
        assert.isOk(
            yaw === 0.01,
            'Small angle no offset / small inc inside range. Yaw is ' + yaw + ' and should be 0.01'
        );

        yaw = orbit._computeYaw(0.19, 0.02, -0.2, 0.2);
        assert.isOk(
            yaw === 0.2,
            'Small angle no offset / small inc outside range (right). Yaw is ' +
                yaw +
                ' and should be 0.2'
        );

        yaw = orbit._computeYaw(0, 0.3, -0.2, 0.2);
        assert.isOk(
            yaw === 0.2,
            'Small angle no offset / big inc outside range (right). Yaw is ' +
                yaw +
                ' and should be 0.2'
        );

        yaw = orbit._computeYaw(-0.19, -0.02, -0.2, 0.2);
        assert.isOk(
            yaw === -0.2,
            'Small angle no offset / small inc outside range (left). Yaw is ' +
                yaw +
                ' and should be -0.2'
        );

        yaw = orbit._computeYaw(0, -0.3, -0.2, 0.2);
        assert.isOk(
            yaw === -0.2,
            'Small angle no offset / big inc outside range (left). Yaw is ' +
                yaw +
                ' and should be -0.2'
        );

        //big angle no offset
        yaw = orbit._computeYaw(0, 0.01, -3.0, 3.0);
        assert.isOk(
            yaw === 0.01,
            'Big angle no offset / small inc inside range. Yaw is ' + yaw + ' and should be 0.01'
        );

        yaw = orbit._computeYaw(2.99, 0.02, -3.0, 3.0);
        assert.isOk(
            yaw === 3.0,
            'Big angle no offset / small inc outside range (right). Yaw is ' +
                yaw +
                ' and should be 3.0'
        );

        yaw = orbit._computeYaw(2.5, 0.6, -3.0, 3.0);
        assert.isOk(
            yaw === 3.0,
            'Big angle no offset / big inc outside range (right). Yaw is ' +
                yaw +
                ' and should be 3.0'
        );

        yaw = orbit._computeYaw(-2.99, -0.02, -3.0, 3.0);
        assert.isOk(
            yaw === -3.0,
            'Big angle no offset / small inc outside range (left). Yaw is ' +
                yaw +
                ' and should be -3.0'
        );

        yaw = orbit._computeYaw(-2.5, -0.6, -3.0, 3.0);
        assert.isOk(
            yaw === -3.0,
            'Big angle no offset / big inc outside range (left). Yaw is ' +
                yaw +
                ' and should be -3.0'
        );

        //small angle 180 offset (left right inverted)'
        yaw = orbit._computeYaw(-2.5, 0.0, 3.0, -3.0);
        assert.isOk(
            yaw === -3.0,
            'Small angle 180 offset / snap to right. Yaw is ' + yaw + ' and should be -3.0'
        );

        yaw = orbit._computeYaw(-3.01, 0.02, 3.0, -3.0);
        assert.isOk(
            yaw === -3.0,
            'Small angle 180 offset / small inc outside range (right). Yaw is ' +
                yaw +
                ' and should be -3.0'
        );

        yaw = orbit._computeYaw(-3.14, 0.3, 3.0, -3.0);
        assert.isOk(
            yaw === -3.0,
            'Small angle 180 offset / big inc outside range (right). Yaw is ' +
                yaw +
                ' and should be -3.0'
        );

        yaw = orbit._computeYaw(3.01, -0.02, 3.0, -3.0);
        assert.isOk(
            yaw === 3.0,
            'Small angle 180 offset / small inc outside range (left). Yaw is ' +
                yaw +
                ' and should be 3.0'
        );

        yaw = orbit._computeYaw(-3.14, -0.3, 3.0, -3.0);
        assert.isOk(
            yaw === 3.0,
            'Small angle 180 offset / big inc outside range (left). Yaw is ' +
                yaw +
                ' and should be 3.0'
        );

        //right left both positive
        yaw = orbit._computeYaw(1.5, 0.0, 2.0, 3.0);
        assert.isOk(
            yaw === 2.0,
            'Right left same quadrant / snap to left. Yaw is ' + yaw + ' and should be 2.0'
        );

        yaw = orbit._computeYaw(2.5, 0.02, 2.0, 3.0);
        assert.isOk(
            yaw === 2.52,
            'Right left same quadrant / small inc inside range. Yaw is ' +
                yaw +
                ' and should be 2.52'
        );

        yaw = orbit._computeYaw(2.99, 0.02, 2.0, 3.0);
        assert.isOk(
            yaw === 3.0,
            'Right left same quadrant / small inc outside range (right). Yaw is ' +
                yaw +
                ' and should be 3.0'
        );

        yaw = orbit._computeYaw(2.01, -0.02, 2.0, 3.0);
        assert.isOk(
            yaw === 2.0,
            'Right left same quadrant / small inc outside range (left). Yaw is ' +
                yaw +
                ' and should be 2.0'
        );

        //edge case when prev yaw is slightly over limit
        yaw = orbit._computeYaw(
            1.9198621771937627,
            0.00296099990606308,
            1.8500490071139892,
            1.9198621771937625
        );
        assert.isOk(
            yaw === 1.9198621771937625,
            'Right left same quadrant / small inc outside range (right, rounding issue on equal). Yaw is ' +
                yaw +
                ' and should be 1.9198621771937625'
        );
    });
};
