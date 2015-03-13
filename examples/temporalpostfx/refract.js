( function () {
    'use strict';

    window.OSG.globalify();

    var osg = window.osg;
    var osgUtil = window.osgUtil;
    var osgShader = window.osgShader;


    var RefractEffect = {

        name: 'Refract',

        getInputTexture: function () {
            return this._inputs;
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


        },

        updateCamera: function ( projection, view ) {

            osg.Matrix.copy( projection, this._cameraRTT.getProjectionMatrix() );
            osg.Matrix.copy( view, this._cameraRTT.getViewMatrix() );

            osg.Matrix.copy( projection, this._cameraRTT2.getProjectionMatrix() );
            osg.Matrix.copy( view, this._cameraRTT2.getViewMatrix() );

        },
        updateTransNode: function ( x ) {
            osg.Matrix.makeRotate( x, 0, 0, 1, this._transNode.getMatrix() );
            osg.Matrix.makeRotate( x, 0, 0, 1, this._transNode2.getMatrix() );
        },

        createScene: function () {

            var result = this._helper.commonScene( this._helper._rttSize, osg.Camera.PRE_RENDER, this._helper._model._userData[ 'ground' ], false );
            this._commonNode = result[ 0 ];
            this._sceneTexture = result[ 1 ];
            this._cameraRTT = result[ 2 ];
            this._transNode = result[ 3 ];

            var result2 = this._helper.commonScene( this._helper._rttSize, osg.Camera.PRE_RENDER, this._helper._model._userData[ 'model' ], false );
            this._commonNode2 = result2[ 0 ];
            this._sceneTexture2 = result2[ 1 ];
            this._sceneTexture2.preventDiffuseAcc = true;
            this._cameraRTT2 = result2[ 2 ];
            this._transNode2 = result2[ 3 ];

            this._inputs = [ this._sceneTexture, this._sceneTexture2 ];
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

            this._cameraRTT2.removeChild( this._helper.backGround );
            this._cameraRTT2.setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );

            var st;
            st = this._cameraRTT2.getOrCreateStateSet();
            var program = this._helper.getShaderProgram( 'refractVert', 'refractFrag', [], false );
            st.setAttributeAndModes( program );

            st.setTextureAttributeAndModes( 2, this._sceneTexture, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
            st.addUniform( osg.Uniform.createInt1( 2, 'Texture2' ) );



            var alphaBlendFilter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'add.frag' ), {
                    'Texture3': this._sceneTexture,
                    'Texture4': this._sceneTexture2
                }
            );


            this.createFinalTexture();

            this._composer = new osgUtil.Composer();
            this._composer.addPass( alphaBlendFilter, this._finalTexture );
            this._composer.build();

            //alphaBlendFilter.camera.setRenderOrder( osg.Camera.NESTED_RENDER, 0 );


            this._effectRoot = new osg.Node();
            this._effectRoot.addChild( this._commonNode );
            this._effectRoot.addChild( this._commonNode2 );
            this._effectRoot.addChild( this._composer );
        },

        buildGui: function ( mainGui ) {

            var folder = mainGui.addFolder( this.name );
            folder.open();

        }
    };


    window.postScenes.push( RefractEffect );
} )();
