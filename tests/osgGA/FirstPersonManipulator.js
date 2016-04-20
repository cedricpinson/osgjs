'use strict';
var QUnit = require( 'qunit' );
var mockup = require( 'tests/mockup/mockup' );
var FirstPersonManipulator = require( 'osgGA/FirstPersonManipulator' );
var Camera = require( 'osg/Camera' );
var Vec3 = require( 'osg/Vec3' );
var Quat = require( 'osg/Quat' );
var Matrix = require( 'osg/Matrix' );


module.exports = function () {

    QUnit.module( 'osgGA' );

    QUnit.test( 'FirstPersonManipulator', function () {
        var manipulator = new FirstPersonManipulator();
        var matrix = manipulator.getInverseMatrix();
        ok( matrix !== undefined, 'check getInverseMatrix method' );
    } );

    QUnit.test( 'FirstPersonManipulator check controllers', function () {
        var manipulator = new FirstPersonManipulator();
        var list = manipulator.getControllerList();
        ok( list.StandardMouseKeyboard !== undefined, 'check mouse support' );
    } );


    QUnit.test( 'FirstPersonManipulator check computation', function () {
        var manipulator = new FirstPersonManipulator();

        var fakeFS = {
            getFrameStamp: function () {
                return {
                    getDeltaTime: function () {
                        return 0.0;
                    }
                };
            }
        };

        manipulator.setCamera( new Camera() );

        var eye = Vec3.create();
        var target = Vec3.create();
        manipulator.getEyePosition( eye );
        manipulator.getTarget( target );

        mockup.near( eye, [ 0, 25, 10 ], 1e-5, 'check default eye position' );
        mockup.near( target, [ 0, 26, 10 ], 1e-5, 'check default target' );
        mockup.near( manipulator.getDistance(), 1, 1e-5, 'check default distance' );

        manipulator.update( fakeFS );
        mockup.near( manipulator.getInverseMatrix(), [ 1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, -10, 25, 1 ], 1e-5, 'check matrix result' );


        manipulator.setTarget( [ 10, 10, 10 ] );
        manipulator.update( fakeFS );
        mockup.near( manipulator.getInverseMatrix(), [ -0.8320502943378436, 0, -0.5547001962252293, 0, -0.5547001962252293, 0, 0.8320502943378436, 0, 0, 1, 0, 0, 13.867504905630732, -10, -20.80125735844609, 1 ], 1e-5, 'check matrix result' );


        manipulator.computeRotation( 100.0, 0.4 );
        manipulator.update( fakeFS );
        mockup.near( manipulator.getInverseMatrix(), [ 0.017205427761774566, 0.003999397237610259, -0.9998439768670262, 0, -0.9998519756721663, 0.0000688215275227005, -0.017205290118536, 0, 4.41812385287843e-18, 0.9999920000106668, 0.003999989333342668, 0, 24.996299391804158, -10.001640538294735, 0.3901323596299733, 1 ], 1e-5, 'check matrix result' );

    } );


};
