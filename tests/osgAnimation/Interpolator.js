define( [
    'tests/mockup/mockup',
    'osgAnimation/Keyframe',
    'osgAnimation/Interpolator'
], function ( mockup, Keyframe, Interpolator ) {

    return function () {

        module( 'osgAnimation' );

        test( 'Vec3LerpInterpolator', function () {
            var keys = [];
            keys.push( Keyframe.createVec3Keyframe( 0, [ 1, 1, 1 ] ) );
            keys.push( Keyframe.createVec3Keyframe( 1, [ 0, 0, 0 ] ) );
            keys.push( Keyframe.createVec3Keyframe( 2, [ 3, 3, 3 ] ) );

            var result = {
                'value': 0,
                'key': 0
            };

            Interpolator.Vec3LerpInterpolator( keys, -1, result );
            ok( mockup.check_near( result.value, [ 1, 1, 1 ] ), 'Check value when time < first key' );
            ok( result.key === 0, 'Check key when time < first key' );

            Interpolator.Vec3LerpInterpolator( keys, 3, result );
            ok( mockup.check_near( result.value, [ 3, 3, 3 ] ), 'Check value when time > last key' );
            ok( result.key === 0, 'Check key when time > last key' );

            Interpolator.Vec3LerpInterpolator( keys, 0.5, result );
            ok( mockup.check_near( result.value, [ 0.5, 0.5, 0.5 ] ), 'Check value when time == 0.5' );
            ok( result.key === 0, 'Check key when time == 0.5' );

            Interpolator.Vec3LerpInterpolator( keys, 1.5, result );
            ok( mockup.check_near( result.value, [ 1.5, 1.5, 1.5 ] ), 'Check value when time == 1.5' );
            ok( result.key === 1, 'Check key when time == 1.5' );

            // with 2 keys only
            keys = keys.slice( 1 );
            result.key = 0;
            Interpolator.Vec3LerpInterpolator( keys, 1.5, result );
            ok( mockup.check_near( result.value, [ 1.5, 1.5, 1.5 ] ), 'Check value when time == 1.5 with 2 keyframes' );
            ok( result.key === 0, 'Check key when time == 1.5 with 2 keyframes' );

            // with 1 key only
            keys = keys.slice( 1 );
            result.key = 0;
            Interpolator.Vec3LerpInterpolator( keys, 2.0, result );
            ok( mockup.check_near( result.value, [ 3.0, 3.0, 3.0 ] ), 'Check value when time == 2.0 with 1 keyframe' );
            ok( result.key === 0, 'Check key when time == 2.0 with 1 keyframe' );

        } );

        test( 'FloatLerpInterpolator', function () {
            var keys = [];
            keys.push( Keyframe.createFloatKeyframe( 0, 1 ) );
            keys.push( Keyframe.createFloatKeyframe( 1, 0 ) );
            keys.push( Keyframe.createFloatKeyframe( 2, 3 ) );

            var result = {
                'value': 0,
                'key': 0
            };

            Interpolator.FloatLerpInterpolator( keys, -1, result );
            ok( mockup.check_near( result.value, 1 ), 'Check value when time < first key' );
            ok( result.key === 0, 'Check key when time < first key' );

            Interpolator.FloatLerpInterpolator( keys, 3, result );
            ok( mockup.check_near( result.value, 3 ), 'Check value when time > last key' );
            ok( result.key === 0, 'Check key when time > last key' );

            Interpolator.FloatLerpInterpolator( keys, 0.5, result );
            ok( mockup.check_near( result.value, 0.5 ), 'Check value when time == 0.5' );
            ok( result.key === 0, 'Check key when time == 0.5' );

            Interpolator.FloatLerpInterpolator( keys, 1.5, result );
            ok( mockup.check_near( result.value, 1.5 ), 'Check value when time == 1.5' );
            ok( result.key === 1, 'Check key when time == 1.5' );

            // with 2 keys only
            keys = keys.slice( 1 );
            result.key = 0;
            Interpolator.FloatLerpInterpolator( keys, 1.5, result );
            ok( mockup.check_near( result.value, 1.5 ), 'Check value when time == 1.5 with 2 keyframes' );
            ok( result.key === 0, 'Check key when time == 1.5 with 2 keyframes' );

            // with 1 key only
            keys = keys.slice( 1 );
            result.key = 0;
            Interpolator.FloatLerpInterpolator( keys, 2.0, result );
            ok( mockup.check_near( result.value, 3.0 ), 'Check value when time == 2.0 with 1 keyframe' );
            ok( result.key === 0, 'Check key when time == 2.0 with 1 keyframe' );

        } );
    };
} );
