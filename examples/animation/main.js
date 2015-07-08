( function () {

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

    var createScene = function ( viewer, root, url, config, controller ) {

        //init controller
        controller.count = 0;
        controller.speed = 1.0;
        controller.isPlaying = false;
        //controller.times = config.time;
        controller.manual = false;

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

            if ( window.debug && config[ 'axis' ] ) {
                var axisSize = config[ 'axisSize' ];
                var geom = osg.createAxisGeometry( axisSize );
                for ( var i = 0, l = bones.length; i < l; i++ ) {
                    var bone = bones[ i ];
                    console.log( bone.getName() );
                    var tnode = new osg.Node();
                    tnode.addChild( geom );
                    //tnode.addChild( osg.createTexturedBoxGeometry() );
                    bone.addChild( tnode );
                }
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
                //console.log( animationManager.getAnimations() );
                var animations = Object.keys( animationManager.getAnimations() );
                var firstAnimation = animations.length ? animations[ 0 ] : undefined;
                config.currentAnim = config.anim || firstAnimation;
                if ( config.currentAnim ) {
                    controller.play = function () {
                        animationManager.playAnimation( config.currentAnim );
                    };
                    controller.stop = function () {
                        animationManager.stopAnimation( config.currentAnim );
                    };
                    controller.pause = function () {
                        animationManager.togglePause();
                    };
                    controller.bind = function () {
                        controller.manual = false;
                        animationManager.stopAllAnimation();
                        animationManager.bindModel();
                    };
                    window.animationManager = animationManager;
                    animationManager.playAnimation( config.currentAnim );

                    if ( config[ 'time' ] ) {
                        animationManager.updateManager( 0 );
                        controller.manual = true;

                        //Find this current anim
                        var animationList = window.animationManager._animationsList;
                        for ( var a = 0, m = animationList.length; a < m; a++ )
                            if ( animationList[ a ].name === config.currentAnim ) break;

                            //controller.times = ( config[ 'time' ] % animationList[ a ].duration ) / animationList[ a ].duration;
                        controller.times = config.time * 100;
                    }
                }
            }
            //osg.setNotifyLevel( osg.ERROR );

            var visitor = window.visitor;
            visitor.reset();
            if ( controller.debugScene ) {
                root.accept( visitor );
                visitor.createGraph();
            }
        } );

        return root;
    };


    var onLoad = function () {

        var canvas = document.getElementById( 'View' );
        var viewer = new osgViewer.Viewer( canvas );
        viewer.init();
        var root = new osg.MatrixTransform();
        viewer.setSceneData( root );
        viewer.setupManipulator();
        viewer.run();

        //Manage Args in url
        var queryDict = {};
        window.location.search.substr( 1 ).split( '&' ).forEach( function ( item ) {
            queryDict[ item.split( '=' )[ 0 ] ] = item.split( '=' )[ 1 ];
        } );

        var config = this._config = {
            'axis': false, //Debug axis on bone
            'axisSize': 5, //Size of debug axis
            'debug': false, //Debug scene graph
            'url': undefined, //Relative path to the model
            'time': undefined, //Stop time on loading t € [ 0, anim.duration ]
            'anim': undefined, //Name of anim to play
            'playMode': 0, //0 -> loop; 1 -> once; 2 -> twice; ...
            'currentAnim': undefined
        };

        var controller = this._controller = {
            debugScene: !!this._config[ 'debug' ],
            play: function () {},
            stop: function () {},
            pause: function () {},
            bind: function () {},
            count: 0,
            speed: 1.0,
            isPlaying: false,
            times: 0.0,
            manual: false,
            models: {
                '_4x4_anim': '4x4_anim.osgjs',
                'brindherbetrs': 'brindherbetrs.osgjs',
                'magic': 'mixamo_wizard_magic_attack_05.osgjs',
                'horse': 'mixamo_horse_gallop.osgjs',
                'fuse': 'mixamo_fuse_w_blendshapes_waving.osgjs',
                '_44f5d95ddb794570a441fce7513bf5d1': '44f5d95ddb794570a441fce7513bf5d1.osgjs',
                '_05e94056f21c472da5ac5dfc2404e106': '05e94056f21c472da5ac5dfc2404e106.osgjs',
                'BatMeshAnim': 'BatMeshAnim.osgjs',
                'kicking': 'kicking.osgjs',
                'zombie_normal': 'zombie_normal.osgjs',
                'PBOT_DTF': 'PBOT_DTF.osgjs'
            }
        };

        this.models = this._controller.models;

        //Load args in the _config Obj
        var keys = Object.keys( queryDict );
        for ( var i = 0; i < keys.length; i++ ) {
            var property = keys[ i ];
            this._config[ property ] = queryDict[ property ];
        }

        //GUI SETUP
        var gui = new window.dat.GUI();

        var defaultChoice = 'PBOT_DTF';

        var overrideURL = this._config[ 'url' ];
        if ( overrideURL ) {
            var filename = this._config[ 'url' ].replace( /^.*[\\\/]/, '' ).replace( ' ', '_' );
            var dot = filename.indexOf( '.' );
            if ( dot !== -1 ) filename = filename.substring( 0, dot );
            models[ filename ] = overrideURL;
            defaultChoice = filename;
        }

        this.visitor = new osgUtil.DisplayNodeGraphVisitor();

        var currentAnim = this._config[ 'currentAnim' ];
        this._config.currentAnim = this._config[ 'anim' ];


        var playMode = this._config[ 'playMode' ];
        if ( playMode ) {
            if ( !window.animationManager ) return;
            window.animationManager.setLoopNum( currentAnim, playMode );
        }

        var modelController = gui.add( this._controller, 'models', Object.keys( this._controller.models ) );
        modelController.listen();

        var load = function ( value ) {
            root.removeChildren();
            createScene( viewer, root, this.models[ this._controller.models ], this._config, this._controller );
        };
        load = load.bind( this );

        modelController.onFinishChange( load );
        //modelController.setValue( '_44f5d95ddb794570a441fce7513bf5d1' );
        modelController.setValue( defaultChoice );

        var debugSceneController = gui.add( this._controller, 'debugScene' );
        debugSceneController.onFinishChange( load );

        gui.add( this._controller, 'play' );

        gui.add( this._controller, 'stop' );

        gui.add( this._controller, 'pause' );

        gui.add( this._controller, 'bind' );

        var countCursor = gui.add( this._controller, 'count', 0, 10 ).step( 1 ).listen();
        countCursor.onFinishChange( function ( value ) {
            if ( !window.animationManager ) return;
            window.animationManager.setLoopNum( currentAnim, value );
        } );

        var speed = gui.add( this._controller, 'speed', -10, 10 );

        var manu = gui.add( this._controller, 'manual' );
        manu.listen();
        manu.onFinishChange( function ( /*value*/) {
            var activeAnimation = window.animationManager._activeAnimations;
            var keys = Object.keys( activeAnimation );

            var unCheck = true;

            for ( var a = 0, l = keys.length; a < l; a++ ) {
                var key = keys[ a ];
                var anim = activeAnimation[ key ];
                if ( anim ) {
                    unCheck = false;
                    break;
                }
            }
            if ( unCheck ) window.manual = false;
            window.times = 0;
        } );

        var times = gui.add( this._controller, 'times', 0, 1000 ).step( 1 ).listen();
        times.onFinishChange( function ( value ) {
            var activeAnimation = window.animationManager._activeAnimationList[ 0 ];
            if ( activeAnimation )
                console.log( 'Manual time : ' + value / 100 );
        } );

        gui.add( this._controller, 'isPlaying' ).listen();

        var update = function () {
            requestAnimationFrame( update );
            if ( !window.animationManager ) return;
            controller.isPlaying = window.animationManager.isPlaying( config.currentAnim );
        };
        update();


        //Override function for custom behavior
        // osgAnimation.BasicAnimationManager.prototype.update = function ( node, nv ) {

        //     if ( this._dirty ) {
        //         this.findAnimationUpdateCallback( node );
        //         this.assignTargetToAnimationCallback();
        //         this._dirty = false;
        //     }

        //     if ( !controller.manual ) {
        //         var t = nv.getFrameStamp().getSimulationTime();
        //         var mult = ( controller.speed < 0 ) ? 1.0 / -controller.speed : controller.speed;
        //         this.updateManager( t * mult );
        //         if ( !!!animationManager._instanceAnimations[ config.currentAnim ].pause && animationManager.isPlaying( config.currentAnim ) )
        //             controller.times = ( ( t * mult ) - this._activeAnimationList[ 0 ].channels[ 0 ].t ) * 100;
        //     } else {

        //         var resetActiveChannelType = function ( channels ) {
        //             for ( var c = 0, l = channels.length; c < l; c++ ) {
        //                 channels[ c ].key = 0;
        //             }
        //         };

        //         resetActiveChannelType( this._quatActiveChannels );
        //         resetActiveChannelType( this._vec3ActiveChannels );
        //         resetActiveChannelType( this._floatActiveChannels );
        //         resetActiveChannelType( this._floatCubicBezierActiveChannels );
        //         resetActiveChannelType( this._vec3CubicBezierActiveChannels );

        //         var activeAnimation = this._activeAnimationList[ 0 ];
        //         if ( activeAnimation )
        //             this.updateManager( ( controller.times / 100 ) /* activeAnimation.duration*/ + ( activeAnimation.channels[ 0 ].t ) );
        //     }


        //     return true;
        // };
    };

    window.addEventListener( 'load', onLoad, true );

} )();
