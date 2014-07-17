(function() {
    'use strict';

    var OSG = window.OSG;
    OSG.globalify();
    var osg = window.osg;
    var osgDB = window.osgDB;
    var osgViewer = window.osgViewer;
    var getPokerScene = window.getPokerScene;

    function createScene() {
        var root = new osg.Node();
        // override texture constructor to set the wrap mode repeat for all texture
        var previousTextureDefault = osg.Texture.prototype.setDefaultParameters;
        osg.Texture.prototype.setDefaultParameters = function () {
            previousTextureDefault.call( this );
            this.setWrapS( 'REPEAT' );
            this.setWrapT( 'REPEAT' );
            this.setMagFilter( 'LINEAR' );
            this.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
        };

        Q.when( osgDB.parseSceneGraph( getPokerScene() ) ).then( function ( child ) {
            root.addChild( child );
        } );
        return root;
    }

    window.addEventListener(
        'load',

        function () {

            var canvas = document.getElementById( 'View' );

            var viewer;
            viewer = new osgViewer.Viewer( canvas );
            viewer.init();
            viewer.setSceneData( createScene() );
            viewer.setupManipulator();
            viewer.run();

        }, true );
})();
