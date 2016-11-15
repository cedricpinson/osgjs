( function () {

    'use strict';

    var OSG = window.OSG;
    var osg = window.OSG.osg;
    var osgDB = OSG.osgDB;
    var osgViewer = OSG.osgViewer;
    var osgAnimation = OSG.osgAnimation;

    var $ = window.$;

    var FindAnimationManagerVisitor = function () {

        osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );

        this._cb = undefined;

    };

    FindAnimationManagerVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {

        getManager: function () {
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

    var FindSkeletonVisitor = function () {
        osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
    };

    FindSkeletonVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {

        apply: function ( node ) {
            if ( node instanceof osgAnimation.Skeleton ) {
                this.skl = node;
                return;
            }
            this.traverse( node );
        }

    } );

    var Example = function () {

        this._config = {
            model: null,
        };

        this._animController = {
            anim: null,
            timeFactor: 1.0,
            loop: true,
            play: function () {},
            stop: function () {},
            playAll: function () {},
            stopAll: function () {},
            pause: function () {}
        };

        this._modelList = [];
        this._modelNodeMap = {};
        this._modelAnimationManager = {};

        this._animList = [];

        this._proxyModel = new osg.Node();

        this._gui = new window.dat.GUI();

    };

    Example.prototype = {

        run: function ( canvas ) {

            var viewer = new osgViewer.Viewer( canvas );
            viewer.init();

            viewer.setupManipulator();
            viewer.getManipulator().computeHomePosition();
            viewer.setSceneData( this._proxyModel );

            viewer.run();

        },

        switchModel: function () {

            var i = 0;
            var animationManager = null;

            // Processes every model by hiding them
            // and stopping every running animations
            var nodeKeys = window.Object.keys( this._modelNodeMap );
            for ( i = 0; i < nodeKeys.length; ++i ) {

                var node = this._modelNodeMap[ nodeKeys[ i ] ];
                node.setNodeMask( 0x0 );

                animationManager = this._modelAnimationManager[ nodeKeys[ i ] ];
                if ( animationManager )
                    animationManager.stopAllAnimation();

            }

            var modelKey = this._config.model;

            var newNode = this._modelNodeMap[ modelKey ];
            newNode.setNodeMask( ~0x0 );

            this._animList = [];
            this._animController.anim = null;
            animationManager = this._modelAnimationManager[ modelKey ];
            if ( animationManager ) {

                var animationsKeys = window.Object.keys( animationManager.getAnimations() );

                for ( i = 0; i < animationsKeys.length; ++i ) {

                    this._animList.push( animationsKeys[ i ] );

                }

            }

            var animationFolder = this._gui.__folders.Animation;
            var controllers = animationFolder.__controllers;
            controllers[ controllers.length - 1 ].remove();
            animationFolder.add( this._animController, 'anim', this._animList );

        },

        playAnimation: function ( playAll ) {

            var animationManager = this._modelAnimationManager[ this._config.model ];
            if ( !animationManager ) return;

            var config = {
                name: this._animController.anim,
                loop: this._animController.loop
            };

            if ( !playAll && this._animController.anim ) {

                animationManager.playAnimation( config );
                return;

            }

            for ( var i = 0; i < this._animList.length; ++i ) {

                config.name = this._animList[ i ];
                animationManager.playAnimation( config );

            }

        },

        stopAnimation: function ( stopAll ) {

            var animationManager = this._modelAnimationManager[ this._config.model ];
            if ( !animationManager ) return;

            if ( stopAll ) {

                animationManager.stopAllAnimation();

                var skletonFinder = new FindSkeletonVisitor();
                this._modelNodeMap[ this._config.model ].accept( skletonFinder );

                var skl = skletonFinder.skl;
                skl.setRestPose();

            } else if ( !stopAll && this._animController.anim ) {

                animationManager.stopAnimation( this._animController.anim );

            }

        },

        pauseAnimation: function () {

            var animationManager = this._modelAnimationManager[ this._config.model ];
            animationManager.togglePause();
        },

        updateAnimationTimeFactor: function ( value ) {

            var animationManager = this._modelAnimationManager[ this._config.model ];
            animationManager.setTimeFactor( value );

        },

        createGui: function () {

            var modelFolder = this._gui.addFolder( 'Model' );
            var animationFolder = this._gui.addFolder( 'Animation' );

            modelFolder.add( this._config, 'model', this._modelList )
                .onChange( this.switchModel.bind( this ) );

            animationFolder.add( this._animController, 'loop' ).listen();

            animationFolder.add( this._animController, 'timeFactor', 0.0, 10.0 )
                .onFinishChange( this.updateAnimationTimeFactor.bind( this ) );

            animationFolder.add( this._animController, 'playAll' )
                .onChange( this.playAnimation.bind( this, true ) );
            animationFolder.add( this._animController, 'stopAll' )
                .onChange( this.stopAnimation.bind( this, true ) );
            animationFolder.add( this._animController, 'play' )
                .onChange( this.playAnimation.bind( this ) );
            animationFolder.add( this._animController, 'stop' )
                .onChange( this.stopAnimation.bind( this ) );
            animationFolder.add( this._animController, 'pause' )
                .onChange( this.pauseAnimation.bind( this ) );

            animationFolder.add( this._animController, 'anim', this._animList );

        },

        loadModel: function ( urlOrFiles ) {

            var self = this;
            var promise = null;
            var fileName = null;

            if ( typeof ( urlOrFiles ) === 'string' ) {

                promise = osgDB.readNodeURL( urlOrFiles );
                fileName = urlOrFiles.split( '/' ).pop();

            } else if ( urlOrFiles instanceof FileList ) {

                promise = osgDB.Registry.instance().getReaderWriterForExtension( 'gltf' ).readNodeURL( urlOrFiles );
                for ( var i = 0; i < urlOrFiles.length; ++i ) {

                    if ( urlOrFiles[ i ].name.indexOf( '.gltf' ) !== -1 ) {
                        fileName = urlOrFiles[ i ].name;
                        break;
                    }

                }

            } else {

                return;

            }

            this._modelList.push( fileName );

            promise.then( function ( root ) {

                if ( !root )
                    return;

                //osg.mat4.scale( root.getMatrix(), root.getMatrix(), [ 20, 20, 20 ] );

                var animationFinder = new FindAnimationManagerVisitor();
                root.accept( animationFinder );

                var animationManager = animationFinder.getManager();
                if ( animationManager ) {

                    self._modelAnimationManager[ fileName ] = animationManager;
                    console.log( animationManager.getAnimations() );

                }

                root.setNodeMask( 0x0 );
                self._modelNodeMap[ fileName ] = root;
                self._proxyModel.addChild( root );

                // Updates the models dropdown list
                var modelFolder = self._gui.__folders.Model;
                var controllers = modelFolder.__controllers;
                controllers[ controllers.length - 1 ].remove();
                modelFolder.add( self._config, 'model', self._modelList ).onChange( self.switchModel.bind( self ) );
            } );


        },

        dragOverEvent: function ( evt ) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy';
        },

        dropEvent: function ( evt ) {

            evt.stopPropagation();
            evt.preventDefault();

            var files = evt.dataTransfer.files;

            this.loadModel( files );

        }

    };


    var onLoad = function () {


        var canvas = $( '#View' )[ 0 ];

        var example = new Example();
        example.createGui();
        example.run( canvas );

        var dropZone = document.getElementById( 'DropZone' );
        dropZone.addEventListener( 'dragover', example.dragOverEvent.bind( example ), false );
        dropZone.addEventListener( 'drop', example.dropEvent.bind( example ), false );

    };


    window.addEventListener( 'load', onLoad, true );

} )();
