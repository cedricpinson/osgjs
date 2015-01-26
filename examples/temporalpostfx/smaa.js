( function () {
    'use strict';

    window.OSG.globalify();

    var osg = window.osg;
    var osgUtil = window.osgUtil;
    var osgShader = window.osgShader;

    function getSMAA() {

        var effect = {
            name: 'SMAA',

            getInputTexture: function () {
                return this._sceneTexture;
            },
            getOutputTexture: function () {
                return this._finalTexture;
            },
            getRootNode: function () {
                return this._effectRoot;
            },
            getCamera: function () {
                return this._cameraRTT;
            },

            updateCamera: function ( projection, view ) {
                osg.Matrix.copy( projection, this._cameraRTT.getProjectionMatrix() );
                osg.Matrix.copy( view, this._cameraRTT.getViewMatrix() );
            },
            update: function () {
                // nothing.
            },

            createScene: function () {

                var result = this._helper.commonScene( this._helper._rttSize, osg.Camera.PRE_RENDER, this._helper._model, false );
                this._commonNode = result[ 0 ];
                this._sceneTexture = result[ 1 ];
                this._cameraRTT = result[ 2 ];

            },

            createFinalTexture: function () {

                this._finalTexture = new osg.Texture();
                this._finalTexture.setTextureSize( this._helper._rttSize[ 0 ], this._helper._rttSize[ 1 ] );

                this._finalTexture.setMinFilter( 'NEAREST' );
                this._finalTexture.setMagFilter( 'NEAREST' );

            },

            buildComposer: function ( helper ) {

                this._helper = helper;
                this.createScene();

                // check/test SMAA_DIRECTX9_LINEAR_BLEND
                // check/test Lod

                var smaaVS1 = osgShader.ShaderProcessor.instance.getShader( 'smaa', [ '#define _EDGE_VS 1' ] );
                var smaaFS1 = osgShader.ShaderProcessor.instance.getShader( 'smaa', [ '#define _EDGE_FS 1' ] );
                var SMAAFilter1 = new osgUtil.Composer.Filter.Custom( smaaFS1, {
                        'Texture0': this._sceneTexture
                    },
                    smaaVS1
                );
                /*
                var smaaVS2 = osgShader.ShaderProcessor.instance.getShader( 'smaa', [ '_BLEND_VS', '#define SMAA_ONLY_COMPILE_VS 1' ] );
                var smaaFS2 = osgShader.ShaderProcessor.instance.getShader( 'smaa', [ '#define _BLEND_FS', '#define SMAA_ONLY_COMPILE_FS 1' ] );
                var SMAAFilter2 = new osgUtil.Composer.Filter.Custom( smaaFS2, {}, smaaVS2 );

                var smaaVS3 = osgShader.ShaderProcessor.instance.getShader( 'smaa', [ '#define _NEIGH_VS 1', '#define SMAA_ONLY_COMPILE_VS 1' ] );
                var smaaFS3 = osgShader.ShaderProcessor.instance.getShader( 'smaa', [ '#define _NEIGH_FS 1', '#define SMAA_ONLY_COMPILE_FS 1' ] );
                var SMAAFilter3 = new osgUtil.Composer.Filter.Custom( smaaFS3, {}, smaaVS3 );
*/
                this.createFinalTexture();


                this._composer = new osgUtil.Composer();
                this._composer.addPass( SMAAFilter1, this._finalTexture );
                /*
                this._composer.addPass( SMAAFilter1, this._sceneTexture );

      this._composer.addPass( SMAAFilter2 );
                this._composer.addPass( SMAAFilter3, this._finalTexture );
*/
                this._composer.build();


                this._effectRoot = new osg.Node();
                this._effectRoot.addChild( this._composer );
                this._effectRoot.addChild( this._commonNode );

                return this._effectRoot;
            },

            buildGui: function ( mainGui ) {

                var folder = mainGui.addFolder( this.name );
                folder.open();
            }
        };
        return effect;
    };

    window.postScenes.push( getSMAA() );
} )();