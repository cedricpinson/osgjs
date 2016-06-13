'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var MatrixTransform = require( 'osg/MatrixTransform' );
var BasicAnimationManager = require( 'osgAnimation/BasicAnimationManager' );
var UpdateMatrixTransform = require( 'osgAnimation/UpdateMatrixTransform' );
var StackedRotateAxis = require( 'osgAnimation/StackedRotateAxis' );
var StackedMatrix = require( 'osgAnimation/StackedMatrix' );
var Matrix = require( 'osg/Matrix' );


module.exports = function () {

    test( 'BasicAnimationManager', function () {

        var animation = mockup.createAnimation( 'AnimationTest' );
        var cbMap = mockup.createAnimationUpdateCallback( [ animation ] );


        var basicAnimationManager = new BasicAnimationManager();
        basicAnimationManager.init( [ animation ] );
        basicAnimationManager._animationsUpdateCallback = cbMap;
        basicAnimationManager._registerTargetFoundInAnimationCallback();
        basicAnimationManager._registerAnimations();


        assert.isOk( basicAnimationManager.getAnimations().AnimationTest !== undefined, 'Check animation test' );


        assert.equal( basicAnimationManager._targets[ 0 ].id, 0, 'check target ID [0] created' );
        assert.equal( basicAnimationManager._targets[ 1 ].id, 1, 'check target ID [1] created' );

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
        assert.isOk( basicAnimationManager._startAnimations[ animationName ] !== undefined, 'check start animation queue' );

        basicAnimationManager._dirty = false;
        basicAnimationManager.update( null, nv );
        assert.isOk( basicAnimationManager._activeAnimations[ animationName ] !== undefined, 'check animation ' + animationName + ' is playing' );

        // .x comes from the mockup anmation name
        assert.equal( basicAnimationManager._targets[ 0 ].value, 1, 'check target a value at t = ' + time );
        assert.equal( basicAnimationManager._targets[ 1 ].value, 1, 'check target b value at t = ' + time );

        time = 0.5;
        basicAnimationManager.update( null, nv );
        assert.equal( basicAnimationManager._targets[ 0 ].value, 0.5, 'check target a value at t = ' + time );
        assert.equal( basicAnimationManager._targets[ 1 ].value, 1, 'check target b value at t = ' + time );


        time = 3.5;
        basicAnimationManager.update( null, nv );
        assert.equal( basicAnimationManager._targets[ 0 ].value, 3, 'check target a value at t = ' + time );
        assert.equal( basicAnimationManager._targets[ 1 ].value, 1.5, 'check target b value at t = ' + time );

        time = 6.0;
        basicAnimationManager.update( null, nv );
        assert.equal( basicAnimationManager._targets[ 0 ].value, 3, 'check target a value at t = ' + time );
        assert.equal( basicAnimationManager._targets[ 1 ].value, 3, 'check target b value at t = ' + time );

        assert.isOk( basicAnimationManager._targets[ 0 ].channels.length === 0, 'check target has not channels' );
        assert.isOk( basicAnimationManager._targets[ 1 ].channels.length === 0, 'check target has not channels' );
        assert.isOk( basicAnimationManager._activeAnimations[ animationName ] === undefined, 'check animation ' + animationName + ' is not active' );


    } );


    test( 'BasicAnimationManager Linking', function () {

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
        assert.equal( keys.length, 1, 'check number of animation callback found' );
        var animationCB = basicAnimationManager._animationsUpdateCallback[ keys[ 0 ] ];
        assert.equal( animationCB.getName(), 'testUpdateMatrixTransform', 'check name of the first animation found' );

        assert.equal( basicAnimationManager._animationsUpdateCallbackArray.length, 1, 'check channel assigned to animation callback' );


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
        assert.equal( stackedRotateAxis.getTarget().value, 0.5, 'check target a value at t = ' + time );

        assert.equalVector( animationCallback._matrix, Matrix.createAndSet( 0.8775825618903726, 0.4794255386042031, 0, 0, -0.4794255386042031, 0.8775825618903726, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ), 'check matrix computed' );

    } );

    test( 'BasicAnimationManager Controls', function () {

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

        var time = 0.0;
        var pause = false;
        var togglePause = function () {
            pause = !pause;
            basicAnimationManager.togglePause();
            if ( pause )
                pauseTime = time;
        };

        //mockup a node visitor
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
        assert.isOk( managerTime === 0, 'Manager time at 0' );

        //
        time = 1;
        basicAnimationManager.update( null, nv );

        togglePause();
        assert.isOk( ( managerTime % duration ) === time, 'Pause at ' + time );

        //
        time = 2;
        basicAnimationManager.update( null, nv );
        assert.isOk( ( managerTime % duration ) === pauseTime, 'Time on pause at ' + time );

        //
        time = 6;
        basicAnimationManager.update( null, nv );
        assert.isOk( ( managerTime % duration ) === pauseTime, 'Time on pause at ' + time );

        //
        togglePause();
        basicAnimationManager.update( null, nv );
        assert.isOk( ( managerTime % duration ) === pauseTime, 'Time after pause at ' + time );

        time = 7;
        basicAnimationManager.update( null, nv );
        assert.isOk( ( managerTime % duration ) === pauseTime + 1, 'Time after pause at ' + time );


        //Pause + setTime()
        time = 10;
        togglePause();
        basicAnimationManager.update( null, nv );
        assert.isOk( ( managerTime % duration ) === ( time % duration ), 'Pause at ' + time );

        basicAnimationManager.setSimulationTime( 3 );
        basicAnimationManager.update( null, nv );
        assert.isOk( ( managerTime % duration ) === 3, 'Simulation time at ' + 3 );

        time = 11;
        basicAnimationManager.update( null, nv );
        assert.isOk( ( managerTime % duration ) === 3, 'Simulation time at ' + 3 + ' t + 1' );

        togglePause();
        basicAnimationManager.update( null, nv );
        assert.isOk( ( managerTime % duration ) === 3, 'Value after pause for simulation time at 3' );

        time = 14;
        basicAnimationManager.update( null, nv );
        togglePause();
        basicAnimationManager.update( null, nv );
        assert.isOk( ( managerTime % duration ) === ( time % duration ), 'Pause at ' + time );

        basicAnimationManager.setSimulationTime( 0.5 );
        basicAnimationManager.update( null, nv );
        assert.isOk( ( managerTime % duration ) === 0.5, 'Simulation time at ' + 0.5 );

        basicAnimationManager.setSimulationTime( 1.5 );
        basicAnimationManager.update( null, nv );
        assert.isOk( ( managerTime % duration ) === 1.5, 'Simulation time at ' + 1.5 );

        time = 15;
        basicAnimationManager.update( null, nv );
        assert.isOk( ( managerTime % duration ) === 1.5, 'Simulation time at ' + 1.5 + ' t + 1' );

        togglePause();
        basicAnimationManager.update( null, nv );
        assert.isOk( ( managerTime % duration ) === 1.5, 'Value after pause for simulation time at 1.5' );

        //Time factor on play
        var t;
        var timeFactor;

        time = 17;
        timeFactor = 0.3;
        basicAnimationManager.update( null, nv );
        t = managerTime;
        basicAnimationManager.setTimeFactor( timeFactor );
        basicAnimationManager.update( null, nv );
        assert.approximately( managerTime % duration, t, 1e-5, 'Value after set time factor at ' + timeFactor );

        time = 18;
        timeFactor = 0.5;
        basicAnimationManager.update( null, nv );
        t = managerTime;
        basicAnimationManager.setTimeFactor( timeFactor );
        basicAnimationManager.update( null, nv );
        assert.approximately( managerTime % duration, t % duration, 1e-5, 'Value after set time factor at ' + timeFactor );

        time = 18.5;
        timeFactor = 4.4;
        basicAnimationManager.update( null, nv );
        t = managerTime;
        basicAnimationManager.setTimeFactor( timeFactor );
        basicAnimationManager.update( null, nv );
        assert.approximately( managerTime % duration, t % duration, 1e-5, 'Value after set time factor at ' + timeFactor );

        time = 22.5;
        timeFactor = 0.8;
        basicAnimationManager.update( null, nv );
        t = managerTime;
        basicAnimationManager.setTimeFactor( timeFactor );
        basicAnimationManager.update( null, nv );
        assert.approximately( managerTime % duration, t % duration, 1e-5, 'Value after set time factor at ' + timeFactor );

        time = 26;
        timeFactor = 1;
        basicAnimationManager.update( null, nv );
        t = managerTime;
        basicAnimationManager.setTimeFactor( timeFactor );
        basicAnimationManager.update( null, nv );
        assert.approximately( managerTime % duration, t % duration, 1e-5, 'Value after set time factor at ' + timeFactor );

        //Time Factor on pause
        togglePause();
        assert.isOk( true, 'Toggle Pause at ' + time );

        time += 1;
        timeFactor = 0.3;
        basicAnimationManager.update( null, nv );
        t = managerTime;
        basicAnimationManager.setTimeFactor( timeFactor );
        basicAnimationManager.update( null, nv );
        assert.approximately( managerTime % duration, t % duration, 1e-5, 'Value after set time factor at ' + timeFactor );

        time += 0.5;
        timeFactor = 0.5;
        basicAnimationManager.update( null, nv );
        t = managerTime;
        basicAnimationManager.setTimeFactor( timeFactor );
        basicAnimationManager.update( null, nv );
        assert.approximately( managerTime % duration, t % duration, 1e-5, 'Value after set time factor at ' + timeFactor );

        time += 2;
        timeFactor = 4.4;
        basicAnimationManager.update( null, nv );
        t = managerTime;
        basicAnimationManager.setTimeFactor( timeFactor );
        basicAnimationManager.update( null, nv );
        assert.approximately( managerTime % duration, t % duration, 1e-5, 'Value after set time factor at ' + timeFactor );

        time += 1;
        timeFactor = 0.8;
        basicAnimationManager.update( null, nv );
        t = managerTime;
        basicAnimationManager.setTimeFactor( timeFactor );
        basicAnimationManager.update( null, nv );
        assert.approximately( managerTime % duration, t % duration, 1e-5, 'Value after set time factor at ' + timeFactor );

        time += 0.3;
        timeFactor = 1;
        basicAnimationManager.update( null, nv );
        t = managerTime;
        basicAnimationManager.setTimeFactor( timeFactor );
        basicAnimationManager.update( null, nv );
        assert.approximately( managerTime % duration, t % duration, 1e-5, 'Value after set time factor at ' + timeFactor );

    } );

    test( 'BasicAnimationManager Negative time in animation key', function () {

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

        assert.isOk( a.value === 1, 'Check channel a at t = ' + time );
        assert.isOk( b.value === 1, 'Check channel b at t = ' + time );

        time = 0.5;
        basicAnimationManager.update( null, nv ); //time == 0.5

        assert.isOk( a.value === 0.5, 'Check channel a at t = ' + time );
        assert.isOk( b.value === 1, 'Check channel b at t = ' + time );

        time = -1;
        basicAnimationManager.update( null, nv ); //time == -1

        assert.isOk( a.value === 1, 'Check channel a at t = ' + time );
        assert.isOk( b.value === 1, 'Check channel b at t = ' + time );

        time = 2;
        basicAnimationManager.update( null, nv ); //time == 2

        assert.isOk( a.value === 3, 'Check channel a at t = ' + time );
        assert.isOk( b.value === 1, 'Check channel b at t = ' + time );

        time = 50;
        basicAnimationManager.update( null, nv ); //time == 50

        assert.isOk( a.value === 3, 'Check channel a at t = ' + time );
        assert.isOk( b.value === 1, 'Check channel b at t = ' + time );

    } );

};
