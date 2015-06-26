define( [
    'osgShadow/ShadowCastAttribute',
    'osgShadow/ShadowFrustumIntersection',
    'osgShadow/ShadowMap',
    'osgShadow/ShadowReceiveAttribute',
    'osgShadow/ShadowSettings',
    'osgShadow/ShadowTechnique',
    'osgShadow/ShadowTexture',
    'osgShadow/ShadowedScene'
], function ( ShadowCastAttribute, ShadowFrustumIntersection, ShadowMap, ShadowReceiveAttribute, ShadowSettings, ShadowTechnique, ShadowTexture, ShadowedScene ) {
    'use strict';

    var osgShadow = {};

    osgShadow.ShadowCastAttribute = ShadowCastAttribute;
    osgShadow.ShadowReceiveAttribute = ShadowReceiveAttribute;
    osgShadow.ShadowFrustumIntersection = ShadowFrustumIntersection;
    osgShadow.ShadowMap = ShadowMap;
    osgShadow.ShadowedScene = ShadowedScene;
    osgShadow.ShadowSettings = ShadowSettings;
    osgShadow.ShadowTechnique = ShadowTechnique;
    osgShadow.ShadowTexture = ShadowTexture;


    return osgShadow;
} );
