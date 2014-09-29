define( [
        'osgShadow/ShadowedScene',
        'osgShadow/ShadowSettings',
        'osgShadow/ShadowTechnique',
        'osgShadow/ShadowMap'
    ],
    function(
        ShadowedScene,
        ShadowSettings,
        ShadowTechnique,
        ShadowMap ) {

        var osgShadow = {};

        osgShadow.ShadowedScene = ShadowedScene;
        osgShadow.ShadowSettings = ShadowSettings;
        osgShadow.ShadowTechnique = ShadowTechnique;
        osgShadow.ShadowMap = ShadowMap;


        return osgShadow;
    } );