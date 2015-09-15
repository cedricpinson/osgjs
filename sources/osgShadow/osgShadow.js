define( [
    'osgShadow/ShadowCastAttribute',
    'osgShadow/ShadowCastCompiler',
    'osgShadow/ShadowCastShaderGenerator',
    'osgShadow/ShadowCasterVisitor',
    'osgShadow/ShadowFrustumIntersection',
    'osgShadow/ShadowMap',
    'osgShadow/ShadowReceiveAttribute',
    'osgShadow/ShadowSettings',
    'osgShadow/ShadowTechnique',
    'osgShadow/ShadowTexture',
    'osgShadow/ShadowedScene'
], function ( ShadowCastAttribute, ShadowCastCompiler, ShadowCastShaderGenerator, ShadowCasterVisitor, ShadowFrustumIntersection, ShadowMap, ShadowReceiveAttribute, ShadowSettings, ShadowTechnique, ShadowTexture, ShadowedScene ) {

    'use strict';

    var osgShadow = {};

    osgShadow.ShadowCastAttribute = ShadowCastAttribute;
    osgShadow.ShadowCastCompiler = ShadowCastCompiler;
    osgShadow.ShadowReceiveAttribute = ShadowReceiveAttribute;
    osgShadow.ShadowCasterVisitor = ShadowCasterVisitor;
    osgShadow.ShadowFrustumIntersection = ShadowFrustumIntersection;
    osgShadow.ShadowMap = ShadowMap;
    osgShadow.ShadowedScene = ShadowedScene;
    osgShadow.ShadowSettings = ShadowSettings;
    osgShadow.ShadowCastShaderGenerator = ShadowCastShaderGenerator;
    osgShadow.ShadowTechnique = ShadowTechnique;
    osgShadow.ShadowTexture = ShadowTexture;


    return osgShadow;
} );
