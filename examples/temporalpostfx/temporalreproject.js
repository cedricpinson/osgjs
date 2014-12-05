'use strict';

window.OSG.globalify();

var osg = window.osg;
var osgUtil = window.osgUtil;
var osgShader = window.osgShader;

function getTemporalReproject() {

    var effect = {

        name: 'Temporal Reproject',
        needCommonCube: true,

        getShaderProgram: function ( vs, ps, defines ) {
            if ( !this._shaderProcessor ) {
                this._shaderProcessor = new osgShader.ShaderProcessor(); // singleton call?
            }
            var vertexshader = this._shaderProcessor.getShader( vs, defines );
            var fragmentshader = this._shaderProcessor.getShader( ps, defines );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ), new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;
        },

        getSceneProgram: function () {
            return this.getShaderProgram( 'reconstVert', 'reconstFrag' );
        },

        buildComposer: function ( sceneTexture, finalTexture ) {

            var Filter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'baseFrag' ), {
                    'Texture0': sceneTexture
                }
            );

            var composer = new osgUtil.Composer();
            composer.addPass( Filter, finalTexture );
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