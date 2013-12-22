define( [
    'tests/mockup/mockup',
    'osgAnimation/Sampler',
    'osgAnimation/Keyframe',
    'osgAnimation/Interpolator'
], function ( mockup, Sampler, Keyframe, Interpolator ) {

    return function () {

        module( 'osgAnimation' );

        test( 'Sampler', function () {
            var keys = [];
            keys.push( Keyframe.createVec3Keyframe( 0.1, [ 1, 1, 1 ] ) );
            keys.push( Keyframe.createVec3Keyframe( 1, [ 0, 0, 0 ] ) );
            keys.push( Keyframe.createVec3Keyframe( 2.1, [ 3, 3, 3 ] ) );

            var sampler = new Sampler( keys, Interpolator.Vec3LerpInterpolator );
            ok( sampler.getStartTime() === 0.1, 'Check Start Time' );
            ok( sampler.getEndTime() === 2.1, 'Check End Time' );

            var result = {
                'value': 0,
                'key': 0
            };
            sampler.getValueAt( 1.0, result );
            ok( mockup.check_near( result.value, [ 0.0, 0.0, 0.0 ] ), 'Check value when time == 1.0' );

            sampler.setKeyframes( [] );
            ok( sampler.getStartTime() === undefined, 'Check Start Time without keyframes' );
            ok( sampler.getEndTime() === undefined, 'Check End Time without keyframes' );
        } );
    };
} );
