( function () {
    'use strict';

    window.OSG.globalify();

    var osg = window.osg;
    var osgUtil = window.osgUtil;
    var osgShader = window.osgShader;

    // the update callback gets near/far
    var CullCallback = function ( target ) {
        this._target = target;
        this.cull = function ( node, nv ) {

            // see ShadowTechnique CameraCullCallback
            node.traverse( nv );


            if ( nv.getComputeNearFar() === true && nv.getComputedFar() >= nv.getComputedNear() ) {
                this._target._nearFar[ 0 ] = nv.getComputedNear();
                this._target._nearFar[ 0 ] = this._target._nearFar[ 0 ] < 0.0001 ? 0.0001 : this._target._nearFar[ 0 ];
                this._target._nearFar[ 1 ] = nv.getComputedFar();
                this._target._nearFarUnif.set( this._target._nearFar );
            }
            return false;
        };
    };


    var DepthEffect = {

        name: 'Depth',

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
            this._nearFarUnif.set( this._nearFar );
        },


        createScene: function () {

            var result = this._helper.commonScene( this._helper._rttSize, osg.Camera.PRE_RENDER, this._helper._model, false );
            this._commonNode = result[ 0 ];
            this._sceneTexture = result[ 1 ];
            this._cameraRTT = result[ 2 ];

            this._cameraRTT.setCullCallback( new CullCallback( this ) );

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
            var program = this._helper.getShaderProgram( 'depthVert', 'depthFrag', [], false );
            st.setAttributeAndModes( program );

            this._projectionMatrix = this._cameraRTT.getProjectionMatrix();

            this._nearFar = [ 0.0001, 200.0 ];

            var DepthReconstructionFilter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'reconstFrag' ), {
                    'Texture0': this._sceneTexture,
                    'ProjectionMatrix': this._projectionMatrix,
                    'NearFar': this._nearFar
                }
            );
            this.createFinalTexture();

            this._composer = new osgUtil.Composer();
            this._composer.addPass( DepthReconstructionFilter, this._finalTexture );
            this._composer.build();

            this._nearFarUnif = DepthReconstructionFilter._stateSet.getUniformList().NearFar.getUniform();

            st.addUniform( this._nearFarUnif );

            this._effectRoot = new osg.Node();
            this._effectRoot.addChild( this._composer );
            this._effectRoot.addChild( this._commonNode );
        },

        buildGui: function ( mainGui ) {

            var folder = mainGui.addFolder( this.name );
            folder.open();

        }
    };


    window.postScenes.push( DepthEffect );
} )();
