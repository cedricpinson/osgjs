define( [
    'qunit',
    'tests/mockup/mockup',
    'osg/MatrixTransform',
    'osgAnimation/BasicAnimationManager',
    'osgAnimation/UpdateMatrixTransform',
    'osgAnimation/StackedRotateAxis',
    "osgAnimation/StackedMatrix"
], function ( QUnit, mockup, MatrixTransform, BasicAnimationManager, UpdateMatrixTransform, StackedRotateAxis, StackedMatrix ) {

    'use strict';

    return function () {

        QUnit.module( 'osgAnimation' );

        QUnit.test( 'BasicAnimationManager', function () {

            var animation = mockup.createAnimation( 'AnimationTest' );
            var cbMap = mockup.createAnimationUpdateCallback( [ animation ] );


            var basicAnimationManager = new BasicAnimationManager();
            basicAnimationManager.init( [ animation ] );
            basicAnimationManager._animationsUpdateCallback = cbMap;
            basicAnimationManager._registerTargetFoundInAnimationCallback();
            basicAnimationManager._registerAnimations();


            ok( basicAnimationManager.getAnimations()[ 'AnimationTest' ] !== undefined, 'Check animation test' );


            equal( basicAnimationManager._targets[ 0 ].id, 0, 'check target ID [0] created' );
            equal( basicAnimationManager._targets[ 1 ].id, 1, 'check target ID [1] created' );

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

            var animations = basicAnimationManager.getAnimations();
            var animationName = Object.keys( animations )[ 0 ];
            basicAnimationManager.playAnimation( animationName, false );
            ok( basicAnimationManager._startAnimations[ animationName ] !== undefined, 'check start animation queue' );

            basicAnimationManager._dirty = false;
            basicAnimationManager.update( null, nv );
            ok( basicAnimationManager._activeAnimations[ animationName ] !== undefined, 'check animation ' + animationName + ' is playing' );

            // .x comes from the mockup anmation name
            equal( basicAnimationManager._targets[ 0 ].value, 1, 'check target a value at t = ' + time );
            equal( basicAnimationManager._targets[ 1 ].value, 1, 'check target b value at t = ' + time );

            time = 0.5;
            basicAnimationManager.update( null, nv );
            equal( basicAnimationManager._targets[ 0 ].value, 0.5, 'check target a value at t = ' + time );
            equal( basicAnimationManager._targets[ 1 ].value, 1, 'check target b value at t = ' + time );


            time = 3.5;
            basicAnimationManager.update( null, nv );
            equal( basicAnimationManager._targets[ 0 ].value, 3, 'check target a value at t = ' + time );
            equal( basicAnimationManager._targets[ 1 ].value, 1.5, 'check target b value at t = ' + time );

            time = 6.0;
            basicAnimationManager.update( null, nv );
            equal( basicAnimationManager._targets[ 0 ].value, 3, 'check target a value at t = ' + time );
            equal( basicAnimationManager._targets[ 1 ].value, 3, 'check target b value at t = ' + time );

            ok( basicAnimationManager._targets[ 0 ].channels.length === 0, 'check target has not channels' );
            ok( basicAnimationManager._targets[ 1 ].channels.length === 0, 'check target has not channels' );
            ok( basicAnimationManager._activeAnimations[ animationName ] === undefined, 'check animation ' + animationName + ' is not active' );


        } );


        QUnit.test( 'BasicAnimationManager Linking', function () {

            var animation = mockup.createAnimation( 'AnimationTest', 'testUpdateMatrixTransform' );
            var basicAnimationManager = new BasicAnimationManager();
            basicAnimationManager.init( [ animation ] );

            // adds animationUpdateCallback to test compute UpdateMatrixTransform
            // create a dumy tree with simple animation update callback
            var node = new MatrixTransform();
            var animationCallback = new UpdateMatrixTransform();
            animationCallback.setName( 'testUpdateMatrixTransform' );
            var stackedRotateAxis = new StackedRotateAxis( 'rotateX' );
            animationCallback.getStackedTransforms().push( stackedRotateAxis );
            
            animationCallback.getStackedTransforms().push( new StackedMatrix( 'matrix' ) );
            node.addUpdateCallback( animationCallback );

            basicAnimationManager._findAnimationUpdateCallback( node );
            basicAnimationManager._registerTargetFoundInAnimationCallback();
            basicAnimationManager._registerAnimations();


            // get keys
            var keys = Object.keys( basicAnimationManager._animationsUpdateCallback );
            equal( keys.length, 1, 'check number of animation callback found' );
            var animationCB = basicAnimationManager._animationsUpdateCallback[ keys[ 0 ] ];
            equal( animationCB.getName(), 'testUpdateMatrixTransform', 'check name of the first animation found' );

            equal( basicAnimationManager._animationsUpdateCallbackArray.length, 1, 'check channel assigned to animation callback' );


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

            var animations = basicAnimationManager.getAnimations();
            var animationName = Object.keys( animations )[ 0 ];
            basicAnimationManager.playAnimation( animationName );

            time = 0.0;
            basicAnimationManager.update( null, nv );

            time = 0.5;
            basicAnimationManager.update( null, nv );
            equal( stackedRotateAxis.getTarget().value, 0.5, 'check target a value at t = ' + time );

            deepEqual( animationCallback._matrix, [ 0.8775825618903726, 0.4794255386042031, 0, 0, -0.4794255386042031, 0.8775825618903726, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ], 'check matrix computed' );

        } );



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


            console.log( 'nb animations ' + Object.keys( basicAnimationManager._animationsUpdateCallback ).length );

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
            console.profile();

            console.time( 'time' );
            for ( var n = 0; n < 200; n++ )
                for ( var t = 0.0; t < 5.0; t += 0.016 ) {
                    time = t;
                    basicAnimationManager.update( null, nv );
                    for ( var k = 0, l = basicAnimationManager._animationsUpdateCallbackArray.length; k < l; k++ )
                        fakeResult += basicAnimationManager._animationsUpdateCallbackArray[ k ]._matrix[ 0 ];
                }

            console.timeEnd( 'time' );
            console.profileEnd();
            console.log( fakeResult );
            ok( true, 'ok' );

        } );

        QUnit.test( 'BasicAnimationManager Controls', function () {

            var animation = mockup.createAnimation();
            var duration = 4;

            var cbMap = mockup.createAnimationUpdateCallback( [ animation ] );

            var basicAnimationManager = new BasicAnimationManager();
            basicAnimationManager.init( [ animation ] );
            basicAnimationManager._animationsUpdateCallback = cbMap;
            basicAnimationManager._registerTargetFoundInAnimationCallback();
            basicAnimationManager._registerAnimations();

            var managerTime = 0.0;
            var pauseTime;

            basicAnimationManager.updateManager = function ( t ) {
                managerTime = t;
            };

            var pause = false;
            var togglePause = function () {
                pause = !pause;
                basicAnimationManager.togglePause();
                if ( pause )
                    pauseTime = time;
            };

            //mockup a node visitor
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

            //play animation
            basicAnimationManager.playAnimation( 'Test Controls' );


            //Simple Pause
            basicAnimationManager.update( null, nv );
            ok( managerTime === 0, 'Manager time at 0' );

            //
            time = 1;
            basicAnimationManager.update( null, nv );

            togglePause();
            ok( ( managerTime % duration ) === time, 'Pause at ' + time );

            //
            time = 2;
            basicAnimationManager.update( null, nv );
            ok( ( managerTime % duration ) === pauseTime, 'Time on pause at ' + time );

            //
            time = 6;
            basicAnimationManager.update( null, nv );
            ok( ( managerTime % duration ) === pauseTime, 'Time on pause at ' + time );

            //
            togglePause();
            basicAnimationManager.update( null, nv );
            ok( ( managerTime % duration ) === pauseTime, 'Time after pause at ' + time );

            time = 7;
            basicAnimationManager.update( null, nv );
            ok( ( managerTime % duration ) === pauseTime + 1, 'Time after pause at ' + time );


            //Pause + setTime()
            time = 10;
            togglePause();
            basicAnimationManager.update( null, nv );
            ok( ( managerTime % duration ) === ( time % duration ), 'Pause at ' + time );

            basicAnimationManager.setSimulationTime( 3 );
            basicAnimationManager.update( null, nv );
            ok( ( managerTime % duration ) === 3, 'Simulation time at ' + 3 );

            time = 11;
            basicAnimationManager.update( null, nv );
            ok( ( managerTime % duration ) === 3, 'Simulation time at ' + 3 + ' t + 1' );

            togglePause();
            basicAnimationManager.update( null, nv );
            ok( ( managerTime % duration ) === 3, 'Value after pause for simulation time at 3' );

            time = 14;
            basicAnimationManager.update( null, nv );
            togglePause();
            basicAnimationManager.update( null, nv );
            ok( ( managerTime % duration ) === ( time % duration ), 'Pause at ' + time );

            basicAnimationManager.setSimulationTime( 0.5 );
            basicAnimationManager.update( null, nv );
            ok( ( managerTime % duration ) === 0.5, 'Simulation time at ' + 0.5 );

            basicAnimationManager.setSimulationTime( 1.5 );
            basicAnimationManager.update( null, nv );
            ok( ( managerTime % duration ) === 1.5, 'Simulation time at ' + 1.5 );

            time = 15;
            basicAnimationManager.update( null, nv );
            ok( ( managerTime % duration ) === 1.5, 'Simulation time at ' + 1.5 + ' t + 1' );

            togglePause();
            basicAnimationManager.update( null, nv );
            ok( ( managerTime % duration ) === 1.5, 'Value after pause for simulation time at 1.5' );

            //Time factor on play
            var t;
            var timeFactor;

            time = 17;
            timeFactor = 0.3;
            basicAnimationManager.update( null, nv );
            t = managerTime;
            basicAnimationManager.setTimeFactor( timeFactor );
            basicAnimationManager.update( null, nv );
            ok( mockup.checkNear( managerTime % duration, t ), 'Value after set time factor at ' + timeFactor );

            time = 18;
            timeFactor = 0.5;
            basicAnimationManager.update( null, nv );
            t = managerTime;
            basicAnimationManager.setTimeFactor( timeFactor );
            basicAnimationManager.update( null, nv );
            ok( mockup.checkNear( managerTime % duration, t % duration ), 'Value after set time factor at ' + timeFactor );

            time = 18.5;
            timeFactor = 4.4;
            basicAnimationManager.update( null, nv );
            t = managerTime;
            basicAnimationManager.setTimeFactor( timeFactor );
            basicAnimationManager.update( null, nv );
            ok( mockup.checkNear( managerTime % duration, t % duration ), 'Value after set time factor at ' + timeFactor );

            time = 22.5;
            timeFactor = 0.8;
            basicAnimationManager.update( null, nv );
            t = managerTime;
            basicAnimationManager.setTimeFactor( timeFactor );
            basicAnimationManager.update( null, nv );
            ok( mockup.checkNear( managerTime % duration, t % duration ), 'Value after set time factor at ' + timeFactor );

            time = 26;
            timeFactor = 1;
            basicAnimationManager.update( null, nv );
            t = managerTime;
            basicAnimationManager.setTimeFactor( timeFactor );
            basicAnimationManager.update( null, nv );
            ok( mockup.checkNear( managerTime % duration, t % duration ), 'Value after set time factor at ' + timeFactor );

            //Time Factor on pause
            togglePause();
            ok( true, 'Toggle Pause at ' + time );

            time += 1;
            timeFactor = 0.3;
            basicAnimationManager.update( null, nv );
            t = managerTime;
            basicAnimationManager.setTimeFactor( timeFactor );
            basicAnimationManager.update( null, nv );
            ok( mockup.checkNear( managerTime % duration, t % duration ), 'Value after set time factor at ' + timeFactor );

            time += 0.5;
            timeFactor = 0.5;
            basicAnimationManager.update( null, nv );
            t = managerTime;
            basicAnimationManager.setTimeFactor( timeFactor );
            basicAnimationManager.update( null, nv );
            ok( mockup.checkNear( managerTime % duration, t % duration ), 'Value after set time factor at ' + timeFactor );

            time += 2;
            timeFactor = 4.4;
            basicAnimationManager.update( null, nv );
            t = managerTime;
            basicAnimationManager.setTimeFactor( timeFactor );
            basicAnimationManager.update( null, nv );
            ok( mockup.checkNear( managerTime % duration, t % duration ), 'Value after set time factor at ' + timeFactor );

            time += 1;
            timeFactor = 0.8;
            basicAnimationManager.update( null, nv );
            t = managerTime;
            basicAnimationManager.setTimeFactor( timeFactor );
            basicAnimationManager.update( null, nv );
            ok( mockup.checkNear( managerTime % duration, t % duration ), 'Value after set time factor at ' + timeFactor );

            time += 0.3;
            timeFactor = 1;
            basicAnimationManager.update( null, nv );
            t = managerTime;
            basicAnimationManager.setTimeFactor( timeFactor );
            basicAnimationManager.update( null, nv );
            ok( mockup.checkNear( managerTime % duration, t % duration ), 'Value after set time factor at ' + timeFactor );

            start();
        } );

        QUnit.test( 'BasicAnimationManager Negative time in animation key', function () {


            var animation = mockup.createAnimationWithNegativeKey( 'NegativeKeys' );

            var cbMap = mockup.createAnimationUpdateCallback( [ animation ] );

            var basicAnimationManager = new BasicAnimationManager();
            basicAnimationManager.init( [ animation ] );
            basicAnimationManager._animationsUpdateCallback = cbMap;
            basicAnimationManager._registerTargetFoundInAnimationCallback();
            basicAnimationManager._registerAnimations();

            //mockup a node visitor
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

            //play animation
            basicAnimationManager.playAnimation( 'NegativeKeys' );

            //Collect targets
            var a = basicAnimationManager._targetMap[ 'a.rotateX' ];
            var b = basicAnimationManager._targetMap[ 'b.rotateY' ];


            basicAnimationManager.update( null, nv ); //time == 0

            ok( a.value === 1, 'Check channel a at t = ' + time );
            ok( b.value === 1, 'Check channel b at t = ' + time );

            time = 0.5;
            basicAnimationManager.update( null, nv ); //time == 0.5

            ok( a.value === 0.5, 'Check channel a at t = ' + time );
            ok( b.value === 1, 'Check channel b at t = ' + time );

            time = -1;
            basicAnimationManager.update( null, nv ); //time == -1

            ok( a.value === 1, 'Check channel a at t = ' + time );
            ok( b.value === 1, 'Check channel b at t = ' + time );

            time = 2;
            basicAnimationManager.update( null, nv ); //time == 2

            ok( a.value === 3, 'Check channel a at t = ' + time );
            ok( b.value === 1, 'Check channel b at t = ' + time );

            time = 50;
            basicAnimationManager.update( null, nv ); //time == 50

            ok( a.value === 3, 'Check channel a at t = ' + time );
            ok( b.value === 1, 'Check channel b at t = ' + time );

            start();
        } );

    };
} );
