define( [], function () {

    var createVec3Keyframe = function ( t, array ) {
        var k = array.slice( 0 );
        k.t = t;
        return k;
    };

    var createQuatKeyframe = function ( t, array ) {
        var k = array.slice( 0 );
        k.t = t;
        return k;
    };

    var createFloatKeyframe = function ( t, value ) {
        var k = [ value ];
        k.t = t;
        return k;
    };

    return {
        createVec3Keyframe: createVec3Keyframe,
        createQuatKeyframe: createQuatKeyframe,
        createFloatKeyframe: createFloatKeyframe
    };
} );
