( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var $ = window.$;

    var Example = function () {
        var self = this;

        this._config = {
            url: 'http://d8d913s460fub.cloudfront.net/videoserver/cat-test-video-320x240.mp4',
            'PLAY': function () {
                if ( self._currentImageStream ) self._currentImageStream.play();
            },
            'STOP': function () {
                if ( self._currentImageStream ) self._currentImageStream.stop();
            }
        };

        this._scene = new osg.Node();
        this._scene.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
        this._currentImageStream = undefined;

    };

    Example.prototype = {

        initDatGUI: function () {

            var gui = new window.dat.GUI();
            var controller = gui.add( this._config, 'url' );
            controller.onFinishChange( function () {
                this.recreateScene();
            }.bind( this ) );
            this.recreateScene();

            gui.add( this._config, 'PLAY' );
            gui.add( this._config, 'STOP' );

        },


        // get the model
        getOrCreateModel: function ( width, height ) {

            if ( !this._model ) {

                // check osg/Shape.js to see arguements of createTexturedQuadGeometry
                this._model = osg.createTexturedQuadGeometry( -width / 2, 0, -height / 2,
                    width, 0, 0,
                    0, 0, height );

            }

            return this._model;
        },

        recreateScene: function () {
            this._scene.removeChildren();
            var model = this.createTextureVideo();
            this._scene.addChild( model );
        },


        createTextureVideo: function () {

            var root = new osg.Node();

            var videoElement = $( 'video' )[ 0 ];

            var image = new osg.ImageStream( videoElement );

            videoElement.preload = 'auto';
            videoElement.loop = true;
            videoElement.crossOrigin = 'anonymous';
            videoElement.src = this._config.url;

            window.image = image;
            this._currentImageStream = image;

            image.whenReady().then( function ( imageStream ) {

                var w, h;
                w = imageStream.getWidth();
                h = imageStream.getHeight();

                var model = this.getOrCreateModel( w, h );

                root.addChild( model );
                var texture = new osg.Texture();
                texture.setImage( image );

                var stateSet = model.getOrCreateStateSet();
                stateSet.setTextureAttributeAndModes( 0, texture );

                this._viewer.getManipulator().computeHomePosition();

                imageStream.play();

            }.bind( this ) );

            return root;
        },

        run: function ( canvas ) {

            var viewer;
            viewer = new osgViewer.Viewer( canvas, this._osgOptions );
            this._viewer = viewer;
            viewer.init();

            viewer.setSceneData( this._scene );
            viewer.setupManipulator();
            viewer.getManipulator().computeHomePosition();

            viewer.run();

            this.initDatGUI();

        }
    };

    window.addEventListener( 'load', function () {
        var example = new Example();
        var canvas = $( '#View' )[ 0 ];
        example.run( canvas );
    }, true );

} )();
