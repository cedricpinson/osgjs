( function () {
    'use strict';

    window.OSG.globalify();

    var osg = window.osg;
    var osgUtil = window.osgUtil;
    var osgShader = window.osgShader;

    var VelocityAttribute = window.VelocityAttribute;

    var VelocityEffect = {

        name: 'Velocity',

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

            var result = this._helper.commonScene( this._helper._rttSize, osg.Camera.PRE_RENDER, this._helper._model, false );
            this._commonNode = result[ 0 ];
            this._sceneTexture = result[ 1 ];
            this._cameraRTT = result[ 2 ];

        },

        buildComposer: function ( helper ) {
            this._helper = helper;
            this.createScene();

            this._velocityAttribute = new VelocityAttribute();
            this._velocityAttribute.setAttributeEnable( true );

            var st;
            st = this._cameraRTT.getOrCreateStateSet();

            this._effectRoot = new osg.Node();

            this._effectRoot.getOrCreateStateSet().setAttributeAndModes( this._velocityAttribute, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

            this._effectRoot.getOrCreateStateSet().setShaderGeneratorName( 'custom' );
            this._effectRoot.addChild( this._commonNode );
        },

        buildGui: function ( mainGui ) {

            var folder = mainGui.addFolder( this.name );
            folder.open();

        }
    };


    window.postScenes.push( VelocityEffect );
} )();