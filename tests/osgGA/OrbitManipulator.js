'use strict';
var QUnit = require( 'qunit' );
var OrbitManipulator = require( 'osgGA/OrbitManipulator' );


module.exports = function () {

    QUnit.module( 'osgGA' );

    QUnit.test( 'OrbitManipulator', function () {
        var manipulator = new OrbitManipulator();
        var matrix = manipulator.getInverseMatrix();
        ok( matrix !== undefined, 'check getInverseMatrix method' );
    } );

    QUnit.test( 'OrbitManipulator check controllers', function () {
        var manipulator = new OrbitManipulator();
        var list = manipulator.getControllerList();
        ok( list.StandardMouseKeyboard !== undefined, 'check mouse support' );
        ok( list.Hammer !== undefined, 'check hammer support' );
        ok( list.LeapMotion !== undefined, 'check leap motion support' );
        ok( list.GamePad !== undefined, 'check game pad support' );
    } );
};
