'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var Interpolator = require( 'osgAnimation/Interpolator' );
var Channel = require( 'osgAnimation/Channel' );


module.exports = function () {

    test( 'Vec3LerpInterpolator', function () {

        var keys = mockup.createVec3Keyframes();
        var timeArray = [ -1,
            3,
            0.5,
            1.5,
            5.0
        ];

        var channels = [];

        var i;
        for ( i = 0; i < timeArray.length; i++ ) {
            var c = Channel.createInstanceVec3Channel( keys );
            channels.push( c );
        }

        for ( i = 0; i < timeArray.length; i++ )
            Interpolator.Vec3LerpInterpolator( timeArray[ i ], channels[ i ] );


        var result;
        result = channels[ 0 ];
        assert.equalVector( result.value, [ 1, 1, 1 ], 'Check value when time < first key' );
        assert.isOk( result.key === 0, 'Check key when time < first key' );

        result = channels[ 1 ];
        assert.equalVector( result.value, [ 3, 3, 3 ], 'Check value when time > last key' );
        assert.isOk( result.key === 0, 'Check key when time > last key' );

        result = channels[ 2 ];
        assert.equalVector( result.value, [ 0.5, 0.5, 0.5 ], 'Check value when time == 0.5' );
        assert.isOk( result.key === 0, 'Check key when time == 0.5' );

        result = channels[ 3 ];
        assert.equalVector( result.value, [ 1.5, 1.5, 1.5 ], 'Check value when time == 1.5' );
        assert.isOk( result.key === 1, 'Check key when time == 1.5' );

        result = channels[ 4 ];
        assert.equalVector( result.value, [ 3.0, 3.0, 3.0 ], 'Check value when time == 5.0' );
        assert.isOk( result.key === 0, 'Check key when time == 5.0' );

        var keys2 = {
            keys: [
                1, 1, 1
            ],
            times: [ 0 ]
        };

        var channelOneKey = Channel.createInstanceVec3Channel( keys2 );
        result = channelOneKey;

        Interpolator.Vec3LerpInterpolator( 1, channelOneKey );
        assert.equalVector( result.value, [ 1.0, 1.0, 1.0 ], 'Check value when time == 1.0 with 1 key' );
        assert.isOk( result.key === 0, 'Check key when time == 1.0 with 1 keyframes' );
    } );

    test( 'FloatLerpInterpolator', function () {

        var keys = mockup.createFloatKeyframes();

        var timeArray = [ -1,
            3,
            0.5,
            1.5,
            5
        ];

        var channels = [];

        var i;
        for ( i = 0; i < timeArray.length; i++ ) {
            var c = Channel.createInstanceFloatChannel( keys );
            channels.push( c );
        }

        for ( i = 0; i < timeArray.length; i++ )
            Interpolator.FloatLerpInterpolator( timeArray[ i ], channels[ i ] );

        var result;

        result = channels[ 0 ];
        assert.approximately( result.value, 1, 1e-5, 'Check value when time < first key' );
        assert.isOk( result.key === 0, 'Check key when time < first key' );

        result = channels[ 1 ];
        assert.approximately( result.value, 3, 1e-5, 'Check value when time > last key' );
        assert.isOk( result.key === 0, 'Check key when time > last key' );

        result = channels[ 2 ];
        assert.approximately( result.value, 0.5, 1e-5, 'Check value when time == 0.5' );
        assert.isOk( result.key === 0, 'Check key when time == 0.5' );

        result = channels[ 3 ];
        assert.approximately( result.value, 1.5, 1e-5, 'Check value when time == 1.5' );
        assert.isOk( result.key === 1, 'Check key when time == 1.5' );

        result = channels[ 4 ];
        assert.approximately( result.value, 3.0, 1e-5, 'Check value when time == 5.0' );
        assert.isOk( result.key === 0, 'Check key when time == 5.0' );
    } );

    test( 'FloatCubicBezierChannel', function () {

        var keys = mockup.createFloatCubicBezierKeyframes();

        var timeArray = [ -1,
            3,
            0.5,
            1.5,
            5
        ];

        var channels = [];

        var i;
        for ( i = 0; i < timeArray.length; i++ ) {
            var c = Channel.createInstanceFloatCubicBezierChannel( keys );
            channels.push( c );
        }

        for ( i = 0; i < timeArray.length; i++ )
            Interpolator.FloatCubicBezierInterpolator( timeArray[ i ], channels[ i ] );

        var result;

        result = channels[ 0 ];
        assert.approximately( result.value, 1, 1e-5, 'Check value when time < first key' );
        assert.isOk( result.key === 0, 'Check key when time < first key' );

        result = channels[ 1 ];
        assert.approximately( result.value, 3, 1e-5, 'Check value when time > last key' );
        assert.isOk( result.key === 0, 'Check key when time > last key' );

        result = channels[ 2 ];
        assert.approximately( result.value, 2, 1e-5, 'Check value when time == 0.5' );
        assert.isOk( result.key === 0, 'Check key when time == 0.5' );

        result = channels[ 3 ];
        assert.approximately( result.value, 1.875, 1e-5, 'Check value when time == 1.5' );
        assert.isOk( result.key === 1, 'Check key when time == 1.5' );

        result = channels[ 4 ];
        assert.approximately( result.value, 3, 1e-5, 'Check value when time == 5.0' );
        assert.isOk( result.key === 0, 'Check key when time == 5.0' );
    } );

    test( 'Vec3CubicBezierChannel', function () {

        var keys = mockup.createVec3CubicBezierKeyframes();

        var timeArray = [ -1,
            3,
            0.5,
            1.5,
            5
        ];

        var channels = [];

        var i;
        for ( i = 0; i < timeArray.length; i++ ) {
            var c = Channel.createInstanceVec3CubicBezierChannel( keys );
            channels.push( c );
        }

        for ( i = 0; i < timeArray.length; i++ )
            Interpolator.Vec3CubicBezierInterpolator( timeArray[ i ], channels[ i ] );

        var result;

        result = channels[ 0 ];
        assert.equalVector( result.value, [ 1, 1, 1 ], 'Check value when time < first key' );
        assert.isOk( result.key === 0, 'Check key when time < first key' );

        result = channels[ 1 ];
        assert.equalVector( result.value, [ 6, 6, 6 ], 'Check value when time > last key' );
        assert.isOk( result.key === 0, 'Check key when time > last key' );

        result = channels[ 2 ];
        assert.equalVector( result.value, [ 3.5, 3.5, 3.5 ], 'Check value when time == 0.5' );
        assert.isOk( result.key === 0, 'Check key when time == 0.5' );

        result = channels[ 3 ];
        assert.equalVector( result.value, [ 7.875, 7.875, 7.875 ], 'Check value when time == 1.5' );
        assert.isOk( result.key === 1, 'Check key when time == 1.5' );

        result = channels[ 4 ];
        assert.equalVector( result.value, [ 6, 6, 6 ], 'Check value when time == 5.0' );
        assert.isOk( result.key === 0, 'Check key when time == 5.0' );
    } );

    test( 'QuatLerpChannel', function () {

        var keys = mockup.createQuatLerpKeyFrames();

        var timeArray = [ -1,
            3,
            0.5,
            1.5,
            5
        ];

        var channels = [];

        var i;
        for ( i = 0; i < timeArray.length; i++ ) {
            var c = Channel.createInstanceQuatChannel( keys );
            channels.push( c );
        }

        for ( i = 0; i < timeArray.length; i++ )
            Interpolator.QuatLerpInterpolator( timeArray[ i ], channels[ i ] );

        var result;

        result = channels[ 0 ];
        assert.equalVector( result.value, [ 1.22465e-16, 1.22465e-16, 1.22465e-16, -1 ], 'Check value when time < first key' );
        assert.isOk( result.key === 0, 'Check key when time < first key' );

        result = channels[ 1 ];
        assert.equalVector( result.value, [ 0.126911, -0.0991929, 0.119115, -0.979727 ], 'Check value when time > last key' );
        assert.isOk( result.key === 0, 'Check key when time > last key' );

        result = channels[ 2 ];
        assert.equalVector( result.value, [ 0.382683, 6.62774e-17, 1.60008e-16, -0.92388 ], 'Check value when time == 0.5' );
        assert.isOk( result.key === 2, 'Check key when time == 0.5' );

        result = channels[ 3 ];
        assert.equalVector( result.value, [ 0.126911, -0.0991929, 0.119115, -0.979727 ], 'Check value when time == 1.5' );
        assert.isOk( result.key === 0, 'Check key when time == 1.5' );

        result = channels[ 4 ];
        assert.equalVector( result.value, [ 0.126911, -0.0991929, 0.119115, -0.979727 ], 'Check value when time == 5.0' );
        assert.isOk( result.key === 0, 'Check key when time == 5.0' );
    } );

    test( 'KeysFinding', function () {
        var keys = [ 1, 0, 3 ];
        var times = [ 0, 2.06, 2.5 ];
        var chan = Channel.createFloatChannel( keys, times );
        var iChan = Channel.createInstanceFloatChannel( chan );
        var time;

        //With 3 keys
        time = 0;
        iChan.key = 0;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );
        iChan.key = 1;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );
        iChan.key = 2;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );

        time = 1;
        iChan.key = 0;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );
        iChan.key = 1;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );
        iChan.key = 2;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );

        time = 2.1;
        iChan.key = 0;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 1, 'Test at time = ' + time + ' and key = ' + iChan.key );
        iChan.key = 1;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 1, 'Test at time = ' + time + ' and key = ' + iChan.key );
        iChan.key = 2;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 1, 'Test at time = ' + time + ' and key = ' + iChan.key );

        time = 2.5;
        iChan.key = 0;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );
        iChan.key = 1;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );
        iChan.key = 2;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );

        //with 2 key
        keys = [ 1, 0 ];
        times = [ 0, 2 ];
        chan = Channel.createFloatChannel( keys, times );
        iChan = Channel.createInstanceFloatChannel( chan );

        time = 0;
        iChan.key = 0;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );
        iChan.key = 1;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );

        time = 1;
        iChan.key = 0;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );
        iChan.key = 1;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );

        time = 2;
        iChan.key = 0;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );
        iChan.key = 1;
        Interpolator.FloatLerpInterpolator( time, iChan );
        assert.isOk( iChan.key === 0, 'Test at time = ' + time + ' and key = ' + iChan.key );
    } );
};
