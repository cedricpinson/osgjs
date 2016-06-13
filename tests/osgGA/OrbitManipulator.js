'use strict';
var assert = require( 'chai' ).assert;
var OrbitManipulator = require( 'osgGA/OrbitManipulator' );


module.exports = function () {

    test( 'OrbitManipulator', function () {
        var manipulator = new OrbitManipulator();
        var matrix = manipulator.getInverseMatrix();
        assert.isOk( matrix !== undefined, 'check getInverseMatrix method' );
    } );

    test( 'OrbitManipulator check controllers', function () {
        var manipulator = new OrbitManipulator();
        var list = manipulator.getControllerList();
        assert.isOk( list.StandardMouseKeyboard !== undefined, 'check mouse support' );
        assert.isOk( list.Hammer !== undefined, 'check hammer support' );
        assert.isOk( list.LeapMotion !== undefined, 'check leap motion support' );
        assert.isOk( list.GamePad !== undefined, 'check game pad support' );
    } );
};
