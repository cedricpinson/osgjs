define( [
    'osgShadow/ShadowAttribute',
    'osgShadow/ShadowTexture',
    'osgShadow/ShadowedScene',
    'osgShadow/ShadowSettings',
    'osgShadow/ShadowTechnique',
    'osgShadow/ShadowMap'
], function ( ShadowAttribute, ShadowTexture, ShadowedScene, ShadowSettings, ShadowTechnique, ShadowMap ) {

    var osgShadow = {};

    osgShadow.ShadowAtribute = ShadowAttribute;
    osgShadow.ShadowTexture = ShadowTexture;
    osgShadow.ShadowedScene = ShadowedScene;
    osgShadow.ShadowSettings = ShadowSettings;
    osgShadow.ShadowTechnique = ShadowTechnique;
    osgShadow.ShadowMap = ShadowMap;


    return osgShadow;
} );