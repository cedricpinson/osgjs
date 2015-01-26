( function () {
    'use strict';

    window.OSG.globalify();

    var osg = window.osg;

    var sceneEffect = {
        name: 'None',
        scale: 1,

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

        updateCamera: function ( projection, view ) {
            osg.Matrix.copy( projection, this._cameraRTT.getProjectionMatrix() );
            osg.Matrix.copy( view, this._cameraRTT.getViewMatrix() );
        },
        update: function () {
            // nothing.
        },

        createScene: function () {

            var rttSize = [];

            rttSize[ 0 ] = this._helper._rttSize[ 0 ] * this.scale;
            rttSize[ 1 ] = this._helper._rttSize[ 1 ] * this.scale;

            var result = this._helper.commonScene( rttSize, osg.Camera.PRE_RENDER, this._helper._model, false );
            this._commonNode = result[ 0 ];
            this._sceneTexture = result[ 1 ];
            this._cameraRTT = result[ 2 ];

        },

        buildComposer: function ( helper ) {

            this._helper = helper;
            this.createScene();

            this._effectRoot = new osg.Node();
            this._effectRoot.addChild( this._commonNode );

            return this._effectRoot;
        },

        buildGui: function ( mainGui ) {

            var folder = mainGui.addFolder( this.name );
            folder.open();
        }
    };

    window.postScenes.push( sceneEffect );

    var sceneX2 = osg.objectInherit( sceneEffect, {
        name: 'SSAA 2x',
        scale: 2
    } );
    window.postScenes.push( sceneX2 );
    var sceneX4 = osg.objectInherit( sceneEffect, {
        name: 'SSAA 4x',
        scale: 4
    } );
    window.postScenes.push( sceneX4 );
    var sceneX8 = osg.objectInherit( sceneEffect, {
        name: 'SSAA 8x',
        scale: 8
    } );

    window.postScenes.push( sceneX8 );
} )();