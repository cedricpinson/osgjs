( function () {
    'use strict';

    window.OSG.globalify();

    var osg = window.osg;
    var osgUtil = window.osgUtil;
    var osgShader = window.osgShader;

    var VelocityAttribute = window.VelocityAttribute;

    var MotionBlurEffect = {

        name: 'MotionBlur',

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
            osg.Matrix.copy( projection, this._cameraRTT2.getProjectionMatrix() );
            osg.Matrix.copy( view, this._cameraRTT2.getViewMatrix() );
        },
        update: function () {},


        createScene: function () {

            var result = this._helper.commonScene( this._helper._rttSize, osg.Camera.PRE_RENDER, this._helper._model, false );
            this._commonNode = result[ 0 ];
            this._sceneTexture = result[ 1 ];
            this._cameraRTT = result[ 2 ];

            var result2 = this._helper.commonScene( this._helper._rttSize, osg.Camera.PRE_RENDER, this._helper._model, false );
            this._commonNode2 = result2[ 0 ];
            this._sceneTexture2 = result2[ 1 ];
            this._cameraRTT2 = result2[ 2 ];

        },

        createFinalTexture: function () {

            this._finalTexture = new osg.Texture();
            this._finalTexture.setTextureSize( this._helper._rttSize[ 0 ], this._helper._rttSize[ 1 ] );

            this._finalTexture.setMinFilter( 'NEAREST' );
            this._finalTexture.setMagFilter( 'NEAREST' );

        },

        buildComposer: function ( helper ) {
            this._helper = helper;
            this._effectRoot = new osg.Node();

            this.createScene();
            this._effectRoot.addChild( this._commonNode2 );

            this._velocityAttribute = new VelocityAttribute();
            this._velocityAttribute.setAttributeEnable( true );

            var st;
            st = this._cameraRTT.getOrCreateStateSet();


            this._commonNode.getOrCreateStateSet().setAttributeAndModes( this._velocityAttribute, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
            this._commonNode.getOrCreateStateSet().setShaderGeneratorName( 'custom' );

            this._effectRoot.addChild( this._commonNode );


            this.createFinalTexture();
            var MotionBlurFilter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'motionBlur' ), {
                    'Texture0': this._sceneTexture,
                    'Texture1': this._sceneTexture2
                }
            );
            this._composer = new osgUtil.Composer();
            this._composer.addPass( MotionBlurFilter, this._finalTexture );
            this._composer.build();
            MotionBlurFilter.camera.setClearColor( [ 1.0, 0.0, 0.0, 1.0 ] );
            this._effectRoot.addChild( this._composer );

        },

        buildGui: function ( mainGui ) {

            var folder = mainGui.addFolder( this.name );
            folder.open();

        }
    };


    window.postScenes.push( MotionBlurEffect );
} )();