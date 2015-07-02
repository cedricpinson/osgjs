'use strict';

var OSG = window.OSG;
var osg = OSG.osg;
var osgAnimation = OSG.osgAnimation;
var osgUtil = OSG.osgUtil;
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

var FindBoneVisitor = function () {
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
    this._bones = [];
};
FindBoneVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
    init: function () {},
    apply: function ( node ) {

        if ( node.className() === 'Bone' ) {
            this._bones.push( node );
        }
        this.traverse( node );
    },
    getBones: function () {
        return this._bones;
    },
    getBone: function ( name ) {
        var bones = this.getBones();
        for ( var i = 0, l = bones.length; i < l; i++ ) {
            var bone = bones[ i ];
            if ( bone.getName() === name ) {
                return bone;
            }
        }
        return undefined;
    }
} );

var createScene = function ( viewer, root, url ) {

    // var root = new osg.MatrixTransform();
    osg.Matrix.makeRotate( Math.PI * 0.5, 1, 0, 0, root.getMatrix() );


    //var request = osgDB.readNodeURL( '../media/models/animation/brindherbe_indexed.osgjs.gz' );
    //var request = osgDB.readNodeURL( '../media/models/animation/4x4_anim.osgjs' );
    //var request = osgDB.readNodeURL( '../media/models/animation/brindherbetrs.osgjs' );

    //var request = osgDB.readNodeURL( '../media/models/animation/mixamo wizard magic_attack_05.osgjs' );
    //var request = osgDB.readNodeURL( '../media/models/animation/mixamo horse gallop.osgjs' );
    //var request = osgDB.readNodeURL( '../media/models/animation/mixamo fuse_w_blendshapes waving.osgjs' );

    var request = osgDB.readNodeURL( '../media/models/animation/' + url );

    request.then( function ( node ) {
        root.addChild( node );


        var bfinder = new FindBoneVisitor();
        root.accept( bfinder );
        var bones = bfinder.getBones();

        var geom = osg.createAxisGeometry( 10 );
        for ( var i = 0, l = bones.length; i < l; i++ ) {
            var bone = bones[ i ];
            console.log( bone.getName() );
            var tnode = new osg.Node();
            tnode.addChild( geom );
            //            tnode.addChild( osg.createTexturedBoxGeometry() );
            bone.addChild( tnode );
        }

        window.listBones = function () {
            for ( var i = 0, l = bones.length; i < l; i++ ) {
                var bone = bones[ i ];
                console.log( bone.getName(), bone.getMatrix() );
            }

        };

        viewer.getCamera().setComputeNearFar( false );

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
                window.stop = function () {
                    animationManager.stopAnimation( firstAnimation );
                };
                window.pause = function () {
                    animationManager.pauseAnimation( firstAnimation );
                };
                window.animationManager = animationManager;
                animationManager.playAnimation( firstAnimation );
            }
        }

        //osg.setNotifyLevel( osg.ERROR );

        var visitor = window.visitor;
        visitor.reset();
        if ( window.debugScene ) {
            root.accept( visitor );
            visitor.createGraph();
        }
    } );

    return root;
};


var onLoad = function () {
    var canvas = document.getElementById( 'View' );

    var models = this.models = {
        brindherbe_indexed: 'brindherbe_indexed.osgjs.gz',
        _4x4_anim: '4x4_anim.osgjs',
        brindherbetrs: 'brindherbetrs.osgjs',
        magic: 'mixamo_wizard_magic_attack_05.osgjs',
        horse: 'mixamo_horse_gallop.osgjs',
        fuse: 'mixamo fuse_w_blendshapes waving.osgjs',
        _44f5d95ddb794570a441fce7513bf5d1: '44f5d95ddb794570a441fce7513bf5d1.osgjs',
        _05e94056f21c472da5ac5dfc2404e106: '05e94056f21c472da5ac5dfc2404e106.osgjs',
        _44f5d95ddb794570a441fce7513bf5d1_box: '44f5d95ddb794570a441fce7513bf5d1_box.osgjs',
        BatMeshAnim: 'BatMeshAnim.osgjs',
        BatMeshAnim_box: 'BatMeshAnim_box.osgjs',
        kicking: 'kicking.osgjs',
        zombie_normal: 'zombie_normal.osgjs',
        PBOT_DTF: 'PBOT_DTF.osgjs'
    };

    window.debugScene = false;
    this.visitor = new osgUtil.DisplayNodeGraphVisitor();
    window.play = function () {};
    window.stop = function () {};
    window.pause = function () {};
    window.count = 0;
    window.speed = 1.0;
    window.isPlaying = false;
    window.times = 0;
    window.manual = false;

    var viewer = new osgViewer.Viewer( canvas );
    viewer.init();
    var root = new osg.MatrixTransform();
    viewer.setSceneData( root );
    viewer.setupManipulator();
    viewer.run();

    var gui = new window.dat.GUI();
    var load = function ( value ) {
        root.removeChildren();
        createScene( viewer, root, models[ window.models ] );
    };
    var modelController = gui.add( this, 'models', Object.keys( models ) );
    modelController.onFinishChange( load );
    //modelController.setValue( '_44f5d95ddb794570a441fce7513bf5d1' );
    modelController.setValue( 'PBOT_DTF' );

    var debugSceneController = gui.add( window, 'debugScene' );
    debugSceneController.onFinishChange( load );

    gui.add( window, 'play' );
    gui.add( window, 'stop' );
    gui.add( window, 'pause' );
    var countCursor = gui.add( window, 'count', 0, 10 ).step( 1 );
    gui.add( window, 'speed', -10, 10 );
    gui.add( window, 'manual' );
    var times = gui.add( window, 'times', 0, 1 ).step( 0.05 );
    gui.add( window, 'isPlaying' ).listen();

    countCursor.onFinishChange( function ( value ) {
        if ( !window.animationManager ) return;
        var animations = Object.keys( window.animationManager.getAnimations() );
        var firstAnimation = animations.length ? animations[ 0 ] : undefined;
        window.animationManager.setLoopNum( firstAnimation, value );
    } );

    var update = function () {
        requestAnimationFrame( update );
        if ( !window.animationManager ) return;
        var animations = Object.keys( window.animationManager.getAnimations() );
        var firstAnimation = animations.length ? animations[ 0 ] : undefined;
        window.isPlaying = window.animationManager.isPlaying( firstAnimation );
    };

    update();

    osgAnimation.BasicAnimationManager.prototype.update = function ( node, nv ) {

        if ( this._dirty ) {
            this.findAnimationUpdateCallback( node );
            this.assignTargetToAnimationCallback();
            this._dirty = false;
        }

        if ( !window.manual ) {
            var t = nv.getFrameStamp().getSimulationTime();
            var mult = ( window.speed < 0 ) ? 1.0 / -window.speed : window.speed;
            this.updateManager( t * mult );
        } else {
            if ( this._activeAnimationList[ 0 ] )
                this.updateManager( window.times * this._activeAnimationList[ 0 ].duration );
        }


        return true;
    };
};

window.addEventListener( 'load', onLoad, true );
