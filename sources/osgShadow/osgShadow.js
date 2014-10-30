define( [
    'osgShadow/ShadowedScene',
    'osgShadow/ShadowSettings',
    'osgShadow/ShadowTechnique',
    'osgShadow/ShadowFrustumIntersection',
    'osgShadow/ShadowMap'
], function ( ShadowedScene, ShadowSettings, ShadowTechnique, ShadowFrustumIntersection, ShadowMap ) {

    var osgShadow = {};

    osgShadow.ShadowedScene = ShadowedScene;
    osgShadow.ShadowSettings = ShadowSettings;
    osgShadow.ShadowTechnique = ShadowTechnique;
    osgShadow.ShadowFrustumIntersection = ShadowFrustumIntersection;
    osgShadow.ShadowMap = ShadowMap;


    return osgShadow;
} );