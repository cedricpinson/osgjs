define( [
    'qunit',
    'tests/mockup/mockup',
    'osgAnimation/BasicAnimationManager',
    'osg/Utils',
    'osg/NodeVisitor',
    'osgDB/ReaderParser',
    'osgAnimation/LinkVisitor'
], function ( QUnit, Q, mockup, BasicAnimationManager ) {

    'use strict';

    return function () {

        QUnit.module( 'osgAnimation' );

        QUnit.test( 'BasicAnimationManager', function () {

            var animation = mockup.createAnimation( 'AnimationTest' );
            var basicAnimationManager = new BasicAnimationManager();
            basicAnimationManager.init( [ animation ] );

            ok( basicAnimationManager.getAnimations()['AnimationTest'] !== undefined, 'Check animation test' );


            equal( basicAnimationManager._targetID[0].id, 0, 'check target ID [0] created');
            equal( basicAnimationManager._targetID[1].id, 1, 'check target ID [1] created');

        } );
    };
} );
