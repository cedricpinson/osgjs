( function () {
    'use strict';

    window.OSG.globalify();

    var osg = window.osg;
    var osgUtil = window.osgUtil;
    var osgShader = window.osgShader;


    var UVEffect = {

        name: 'UV',

        getInputTexture: function () {
            return this._sceneTexture;
        },
        getOutputTexture: function () {
            return this._sceneTexture;
        },
        getRootNode: function () {
            return this._effectRoot;
        },
        getCamera: function () {
            return this._cameraRTT;
        },

        update: function () {},


        createScene: function () {

            var result = this._helper.commonScene( this._helper._rttSize, osg.Camera.PRE_RENDER, this._helper._model._userData[ 'model' ], false );
            this._commonNode = result[ 0 ];
            this._sceneTexture = result[ 1 ];
            this._cameraRTT = result[ 2 ];

        },

        buildComposer: function ( helper ) {
            this._helper = helper;
            this.createScene();

            var st;
            st = this._cameraRTT.getOrCreateStateSet();


            var program = this._helper.getShaderProgram( 'UVVert', 'UVFrag', [], false );
            st.setAttributeAndModes( program );

            this._effectRoot = new osg.Node();
            this._effectRoot.addChild( this._commonNode );
        },

        buildGui: function ( mainGui ) {

            var folder = mainGui.addFolder( this.name );
            folder.open();

        }
    };


    window.postScenes.push( UVEffect );
} )();
