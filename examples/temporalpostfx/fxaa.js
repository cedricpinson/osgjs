( function () {
    'use strict';

    window.OSG.globalify();

    var osg = window.osg;
    var osgUtil = window.osgUtil;
    var osgShader = window.osgShader;

    function getFxaa() {

        var effect = {
            name: 'FXAA',

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

                var FXAAFilter = new osgUtil.Composer.Filter.Custom(
                    osgShader.ShaderProcessor.instance.getShader( 'fxaa' ), {
                        'Texture0': this._sceneTexture,
                        'subpixel_aa': 0.75,
                        'contrast_treshold': 0.1,
                        'edge_treshold': 0.0
                    }
                );

                this.createFinalTexture();


                this._composer = new osgUtil.Composer();
                this._composer.addPass( FXAAFilter, this._finalTexture );
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

    window.postScenes.push( getFxaa() );
} )();