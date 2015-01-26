( function () {
    'use strict';

    window.OSG.globalify();

    var osg = window.osg;
    var osgUtil = window.osgUtil;
    var osgShader = window.osgShader;

    var MotionBlurEffect = {

        name: 'MotionBlur (Camera/Depth)',

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

        update: function () {

            osg.Matrix.copy( this._viewProjectionMatrix, this._previousViewProjectionMatrix );

            var view = this._cameraRTT2.getViewMatrix();
            var projection = this._cameraRTT2.getProjectionMatrix();
            osg.Matrix.mult( projection, view, this._viewProjectionMatrix );

            // osg.Matrix.inverse( view, this._viewInverseMatrix );
            // osg.Matrix.inverse( projection, this._projectionInverseMatrix );
            // osg.Matrix.mult( this._projectionInverseMatrix, this._viewInverseMatrix, this._viewProjectionInverseMatrix );

            osg.Matrix.inverse( this._viewProjectionMatrix, this._viewProjectionInverseMatrix );

            this._viewProjectionInverseMatrixUnif.set( this._viewProjectionInverseMatrix );
            this._previousViewProjectionMatrixUnif.set( this._previousViewProjectionMatrix );
        },


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
            // normal scene
            this._effectRoot.addChild( this._commonNode2 );
            // normal scene depth
            var st;
            st = this._cameraRTT.getOrCreateStateSet();


            var program = this._helper.getShaderProgram( 'depthVert', 'depthFrag', [], false );


            this._commonNode.getOrCreateStateSet().setAttributeAndModes( program, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

            this._effectRoot.addChild( this._commonNode );

            this._viewProjectionMatrix = osg.Matrix.create();
            this._viewProjectionInverseMatrix = osg.Matrix.create();
            this._previousViewProjectionMatrix = osg.Matrix.create();
            //this._viewInverseMatrix = osg.Matrix.create();
            //this._projectionInverseMatrix = osg.Matrix.create();

            var view = this._cameraRTT.getViewMatrix();
            var projection = this._cameraRTT.getProjectionMatrix();
            osg.Matrix.mult( projection, view, this._viewProjectionMatrix );
            osg.Matrix.copy( this._viewProjectionMatrix, this._previousViewProjectionMatrix );
            osg.Matrix.inverse( this._viewProjectionMatrix, this._viewProjectionInverseMatrix );



            this._viewProjectionInverseMatrixUnif = osg.Uniform.createMatrix4( this._viewProjectionInverseMatrix, 'viewProjectionInverseMatrix' );
            this._previousViewProjectionMatrixUnif = osg.Uniform.createMatrix4( this._previousViewProjectionMatrix, 'previousViewProjectionMatrix' );


            this._sceneTexture2.setMinFilter( 'NEAREST' );
            this._sceneTexture2.setMagFilter( 'NEAREST' );
            this._sceneTexture.setMinFilter( 'NEAREST' );
            this._sceneTexture.setMagFilter( 'NEAREST' );

            this.createFinalTexture();
            var MotionBlurFilter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'motionBlurDepth' ), {
                    'Texture0': this._sceneTexture,
                    'Texture1': this._sceneTexture2,
                    'viewProjectionInverseMatrix': this._viewProjectionInverseMatrixUnif,
                    'previousViewProjectionMatrix': this._previousViewProjectionMatrixUnif
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