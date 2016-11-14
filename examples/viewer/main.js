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

    var Example = function () {

        this._config = {
            model: null,
        };

        this._animController = {
            anim: null,
            timeFactor: 1.0,
            play: function () {},
            pause: function () {},
            playAll: function() {}
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

            // Hides every models previously added
            // to the proxy root node
            var nodeKeys = window.Object.keys( this._modelNodeMap );
            for ( var i = 0; i < nodeKeys.length; ++i ) {

                var node = this._modelNodeMap[ nodeKeys[ i ] ];
                node.setNodeMask( 0x0 );

            }

            var modelKey = this._config.model;

            var newNode = this._modelNodeMap[ modelKey ];
            newNode.setNodeMask( ~0x0 );

            /*if ( !this._modelAnimationManager[ modelKey ] ) {


            }*/

        },

        createGui: function () {

            var modelFolder = this._gui.addFolder( 'Model' );
            var animationFolder = this._gui.addFolder( 'Animation' );

            modelFolder.add( this._config, 'model', this._modelList )
                .onChange( this.switchModel.bind( this ) );

            animationFolder.add( this._animController, 'timeFactor', 0.0, 10.0 );
            animationFolder.add( this._animController, 'play' );
            animationFolder.add( this._animController, 'pause' );
            animationFolder.add( this._animController, 'playAll' );
            animationFolder.add( this._animController, 'anim', this._animList );
        },

        dragOverEvent: function ( evt ) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy';
        },

        dropEvent: function ( evt ) {

            evt.stopPropagation();
            evt.preventDefault();

            var self = this;
            var files = evt.dataTransfer.files;

            var gltfFileName = null;
            for ( var i = 0; i < files.length; ++i ) {

                if ( files[ i ].name.indexOf( '.gltf' ) !== -1 ) {
                    gltfFileName = files[ i ].name;
                    break;
                }

            }

            this._modelList.push( gltfFileName );


            var promise = osgDB.Registry.instance().getReaderWriterForExtension( 'gltf' ).readNodeURL( files );
            promise.then( function ( root ) {

                if ( !root )
                    return;

                //osg.mat4.scale( root.getMatrix(), root.getMatrix(), [ 20, 20, 20 ] );

                var animationFinder = new FindAnimationManagerVisitor();
                root.accept( animationFinder );

                var animationManager = animationFinder.getManager();
                if ( animationManager ) {

                    self._modelAnimationManager[ gltfFileName ] = animationManager;
                    console.log( animationManager.getAnimations() );

                }

                root.setNodeMask( 0x0 );
                self._modelNodeMap[ gltfFileName ] = root;
                self._proxyModel.addChild( root );

                // Updates the models dropdown list
                var modelFolder = self._gui.__folders.Model;
                var controllers = modelFolder.__controllers;
                controllers[ controllers.length - 1 ].remove();
                modelFolder.add( self._config, 'model', self._modelList ).onChange( self.switchModel.bind( self ) );
            } );

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
