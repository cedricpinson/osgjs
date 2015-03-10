define( [
    'tests/osgShadow/ShadowMap',
    'tests/osgShadow/ShadowedScene'
], function ( ShadowMap, ShadowedScene ) {

    'use strict';

    return function () {
        ShadowMap();
        ShadowedScene();
    };
} );
