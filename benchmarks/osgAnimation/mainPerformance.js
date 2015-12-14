'use strict';
var QUnit = require( 'qunit' );
var mockup = require( 'tests/mockup/mockup' );
var reportStats = require( 'benchmarks/reportStats' );
var Timer = require( 'osg/Timer' );
var BasicAnimationManager = require( 'osgAnimation/BasicAnimationManager' );

module.exports = function () {

    QUnit.module( 'osg Animation Loop' );

    QUnit.test( 'BasicAnimationManager Performance', function () {

        var basicAnimationManager = new BasicAnimationManager();
        var animations = [];

        // create an animation with an animation UpdateCallback in a node
        var createAnimation = function () {

            var index = animations.length.toString();
            var targetName = 'testUpdateMatrixTransform_' + index;
            var animation = mockup.createAnimation( 'AnimationTest_' + index, targetName, targetName );
            animations.push( animation );

        };

        var maxAnimations = 50;
        for ( var i = 0; i < maxAnimations; i++ ) {
            createAnimation();
        }

        var cbMap = mockup.createAnimationUpdateCallback( animations );

        basicAnimationManager.init( animations );
        basicAnimationManager._animationsUpdateCallback = cbMap;
        basicAnimationManager._registerTargetFoundInAnimationCallback();
        basicAnimationManager._registerAnimations();


        // console.log( 'nb animations ' + Object.keys( basicAnimationManager._animationsUpdateCallback ).length );

        //
        var time = 0.0;
        var nv = {
            getFrameStamp: function () {
                return {
                    getSimulationTime: function () {
                        return time;
                    }
                };
            }
        };

        var animationMap = basicAnimationManager.getAnimations();
        for ( var j = 0; j < maxAnimations; j++ ) {
            var animationName = Object.keys( animationMap )[ j ];
            basicAnimationManager.playAnimation( animationName );
        }

        // add a simple operation to be sure the jit will not discard our code
        var fakeResult = 0.0;

        var timed = Timer.instance().tick();
        console.profile();
        console.time( 'time' );

        var nCount = 200;
        for ( var n = 0; n < nCount; n++ )
            for ( var t = 0.0; t < 5.0; t += 0.016 ) {
                time = t;
                basicAnimationManager.update( null, nv );
                for ( var k = 0, l = basicAnimationManager._animationsUpdateCallbackArray.length; k < l; k++ )
                    fakeResult += basicAnimationManager._animationsUpdateCallbackArray[ k ]._matrix[ 0 ];
            }

        console.timeEnd( 'time' );
        console.profileEnd();
        timed = Timer.instance().tick() - timed;

        module.fakeResult = fakeResult; // keep the variable on a scope to avoid JIT otimimization and remove code
        reportStats( timed, 'Animation Loop' );

    } );


};
