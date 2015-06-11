'use strict';

var OSG = window.OSG;
var osg = OSG.osg;
var osgAnimation = OSG.osgAnimation;
//var osgUtil = OSG.osgUtil;
var osgViewer = OSG.osgViewer;
var osgDB = OSG.osgDB;

var FindAnimationManagerVisitor = function () {
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
    this._cb = undefined;
};
FindAnimationManagerVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
    init: function () {
        this.found = [];
    },
    getAnimationManager: function () {
        return this._cb;
    },
    apply: function ( node ) {
        var cbs = node.getUpdateCallbackList();
        for ( var i = 0, l = cbs.length; i < l; i++ ) {
            if ( cbs[ 0 ] instanceof osgAnimation.BasicAnimationManager ) {
                this._cb = cbs[ 0 ];
                return;
            }
        }
        this.traverse( node );
    }
} );

var createScene = function ( viewer ) {

    var root = new osg.Node();

    var request = osgDB.readNodeURL( '../media/models/animation/mixamo horse gallop.osgjs' );
    //var request = osgDB.readNodeURL( '../media/models/animation/4x4_anim.osgjs' );
    //var request = osgDB.readNodeURL( '../media/models/animation/roty.osgjs' );

    request.then( function ( node ) {
        root.addChild( node );

        viewer.getManipulator().computeHomePosition();
        var finder = new FindAnimationManagerVisitor();
        node.accept( finder );

        var animationManager = finder.getAnimationManager();
        if ( animationManager ) {
            console.log( animationManager.getAnimations() );
            var animations = Object.keys( animationManager.getAnimations() );
            var firstAnimation = animations.length ? animations[ 0 ] : undefined;
            if ( firstAnimation ) {
                window.play = function () {
                    animationManager.playAnimation( firstAnimation );
                };
                window.animationManager = animationManager;
                animationManager.playAnimation( firstAnimation );
            }
        }

        osg.setNotifyLevel( osg.ERROR );
    } );

    return root;
};


var onLoad = function () {
    var canvas = document.getElementById( 'View' );

    var viewer = new osgViewer.Viewer( canvas );
    viewer.init();
    viewer.setSceneData( createScene( viewer ) );
    viewer.setupManipulator();
    viewer.run();
};

window.addEventListener( 'load', onLoad, true );
