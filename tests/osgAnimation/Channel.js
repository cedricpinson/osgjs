define( [
    'tests/mockup/mockup',
    'osgAnimation/Keyframe',
    'osgAnimation/Vec3LerpChannel',
    'osgAnimation/FloatLerpChannel'
], function ( mockup, Keyframe, Vec3LerpChannel, FloatLerpChannel ) {

    return function () {

        module( 'osgAnimation' );

        test( 'Channel', function () {
            var keys = [];
            keys.push( Keyframe.createVec3Keyframe( 0, [ 1, 1, 1 ] ) );
            keys.push( Keyframe.createVec3Keyframe( 1, [ 0, 0, 0 ] ) );
            keys.push( Keyframe.createVec3Keyframe( 2, [ 3, 3, 3 ] ) );

            var channel = new Vec3LerpChannel( keys );
            channel.update( 1.0 );
            ok( mockup.check_near( channel.getTarget().getValue(), [ 0.0, 0.0, 0.0 ] ), 'Check vec3 channel update' );

            keys.length = 0;
            keys.push( Keyframe.createFloatKeyframe( 0, 1 ) );
            keys.push( Keyframe.createFloatKeyframe( 1, 0 ) );
            keys.push( Keyframe.createFloatKeyframe( 2, 3 ) );

            channel = new FloatLerpChannel( keys );
            channel.update( 1.0 );
            ok( mockup.check_near( channel.getTarget().getValue(), 0.0 ), 'Check float channel update' );
        } );
    };
} );
