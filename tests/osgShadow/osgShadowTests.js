define( [
    'tests/osgShadow/ShadowMap',
    'tests/osgShadow/ShadowedScene'
], function ( ShadowMap, ShadowedScene ) {

    return function () {
        ShadowMap();
        ShadowedScene();
    };
} );
