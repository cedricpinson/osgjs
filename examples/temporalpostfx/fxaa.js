'use strict';

window.OSG.globalify();

var osg = window.osg;;
var osgUtil = window.osgUtil;;
var osgShader = window.osgShader;

function getFxaa() {
    var effect = {
        name: 'FXAA',
        needCommonCube: true,


        buildComposer: function ( sceneTexture, finalTexture ) {

            var FXAAFilter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'fxaa' ), {
                    'Texture0': sceneTexture,
                    'subpixel_aa': 0.75,
                    'contrast_treshold': 0.1,
                    'edge_treshold': 0.0
                }
            );
            var composer = new osgUtil.Composer();
            composer.addPass( FXAAFilter, finalTexture );
            composer.build();
            return composer;
        },

        buildGui: function ( mainGui ) {
            var folder = mainGui.addFolder( this.name );
            folder.open();
        }
    };
    return effect;
}
