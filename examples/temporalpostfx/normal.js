( function () {
    'use strict';

    window.OSG.globalify();

    var osg = window.osg;
    var osgUtil = window.osgUtil;
    var osgShader = window.osgShader;


    var NormalEffect = {

        name: 'Normal',

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

        update: function () {
            this._projectionMatrix = this._cameraRTT.getProjectionMatrix();
        },


        createScene: function () {

            var result = this._helper.commonScene( this._helper._rttSize, osg.Camera.PRE_RENDER, this._helper._model, false );
            this._commonNode = result[ 0 ];
            this._sceneTexture = result[ 1 ];
            this._cameraRTT = result[ 2 ];

            this._cameraRTT.removeChild( this._helper.backGround );
            this._cameraRTT.setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
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

            var st;
            st = this._cameraRTT.getOrCreateStateSet();
            var program = this._helper.getShaderProgram( 'normal.vert', 'normal.frag', [ '#define _MeshNormalView' ], false );
            st.setAttributeAndModes( program );

            this._projectionMatrix = this._cameraRTT.getProjectionMatrix();


            var NormalReconstructionFilter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'showNormal.frag' ), {
                    'Texture0': this._sceneTexture,
                    'ProjectionMatrix': this._projectionMatrix
                }
            );

            this.createFinalTexture();


            this._composer = new osgUtil.Composer();
            this._composer.addPass( NormalReconstructionFilter, this._finalTexture );
            this._composer.build();

            this._effectRoot = new osg.Node();
            this._effectRoot.addChild( this._composer );
            this._effectRoot.addChild( this._commonNode );
        },

        buildGui: function ( mainGui ) {

            var folder = mainGui.addFolder( this.name );
            folder.open();

        }
    };

    var NormalFromWorldDerivativesEffect = osg.objectInherit( NormalEffect, {

        name: 'NormalFromWorldDerivativesEffect',
        buildComposer: function ( helper ) {
            this._helper = helper;
            this.createScene();

            var st;
            st = this._cameraRTT.getOrCreateStateSet();
            var program = this._helper.getShaderProgram( 'normal.vert', 'normal.frag', [ '#define _WorldDerivative' ], false );
            st.setAttributeAndModes( program );

            this._projectionMatrix = this._cameraRTT.getProjectionMatrix();


            var NormalReconstructionFilter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'showNormal.frag' ), {
                    'Texture0': this._sceneTexture,
                    'ProjectionMatrix': this._projectionMatrix
                }
            );

            this.createFinalTexture();


            this._composer = new osgUtil.Composer();
            this._composer.addPass( NormalReconstructionFilter, this._finalTexture );
            this._composer.build();

            this._effectRoot = new osg.Node();
            this._effectRoot.addChild( this._composer );
            this._effectRoot.addChild( this._commonNode );
        },

    } );

    var NormalFromViewDerivativesEffect = osg.objectInherit( NormalEffect, {

        name: 'NormalFromViewDerivativesEffect',

        buildComposer: function ( helper ) {
            this._helper = helper;
            this.createScene();

            var st;
            st = this._cameraRTT.getOrCreateStateSet();
            var program = this._helper.getShaderProgram( 'normal.vert', 'normal.frag', [ '#define _ViewDerivative' ], false );
            st.setAttributeAndModes( program );

            this._projectionMatrix = this._cameraRTT.getProjectionMatrix();


            var NormalReconstructionFilter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'showNormal.frag' ), {
                    'Texture0': this._sceneTexture,
                    'ProjectionMatrix': this._projectionMatrix
                }
            );

            this.createFinalTexture();


            this._composer = new osgUtil.Composer();
            this._composer.addPass( NormalReconstructionFilter, this._finalTexture );
            this._composer.build();

            this._effectRoot = new osg.Node();
            this._effectRoot.addChild( this._composer );
            this._effectRoot.addChild( this._commonNode );
        },

    } );

    var NormalFromDerivativesDepthMapEffect = osg.objectInherit( NormalEffect, {

        name: 'NormalFromDerivativesDepthMap',

        buildComposer: function ( helper ) {
            this._helper = helper;
            this.createScene();

            var st;
            st = this._cameraRTT.getOrCreateStateSet();
            var program = this._helper.getShaderProgram( 'depthVert', 'depthFrag', [], false );
            st.setAttributeAndModes( program );

            this._projectionMatrix = this._cameraRTT.getProjectionMatrix();


            var NormalReconstructionFilter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'reconstNormal.frag' ), {
                    'Texture0': this._sceneTexture,
                    'ProjectionMatrix': this._projectionMatrix
                }
            );

            this.createFinalTexture();


            this._composer = new osgUtil.Composer();
            this._composer.addPass( NormalReconstructionFilter, this._finalTexture );
            this._composer.build();

            this._effectRoot = new osg.Node();
            this._effectRoot.addChild( this._composer );
            this._effectRoot.addChild( this._commonNode );
        }

    } );

    window.postScenes.push( NormalEffect );
    window.postScenes.push( NormalFromWorldDerivativesEffect );
    window.postScenes.push( NormalFromViewDerivativesEffect );
    window.postScenes.push( NormalFromDerivativesDepthMapEffect );
} )();
