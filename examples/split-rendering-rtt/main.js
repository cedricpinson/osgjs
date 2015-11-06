( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var osgShader = OSG.osgShader;
    var ExampleOSGJS = window.ExampleOSGJS;

    var $ = window.$;


    var Example = function () {

        ExampleOSGJS.call( this );

    };

    Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {

        createCameraRTT: function ( texture, is3D ) {
            var camera = new osg.Camera();
            camera.setName( is3D ? 'MainCamera' : 'composer2D' );
            camera.setViewport( new osg.Viewport( 0, 0, this._canvas.width, this._canvas.height ) );

            camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
            camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, texture, 0 );

            //
            camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );

            if ( is3D ) {
                camera.attachRenderBuffer( osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16 );
                camera.setClearColor( osg.Vec4.create( [ 0.0, 0.0, 0.1, 1.0 ] ) );
            } else {

                camera.setClearMask( 0 );

            }
            return camera;
        },

        ///// UTILS
        // createTextureRTT( 'name', osg.Texture.LINEAR, osg.Texture.UNSIGNED_BYTE );
        createTextureRTT: function ( name, filter, type ) {
            var texture = new osg.Texture();
            texture.setInternalFormatType( type );
            texture.setTextureSize( this._canvas.width, this._canvas.height );

            texture.setInternalFormat( osg.Texture.RGBA );
            texture.setMinFilter( filter );
            texture.setMagFilter( filter );
            texture.setName( name );
            return texture;
        },

        // show the renderTexture as ui quad on left bottom screen
        // in fact show all texture inside this._rtt
        showHideFrameBuffers: function ( optionalArgs ) {

            // debug Scene
            if ( !this._rttDebugNode ) {
                this._rttDebugNode = new osg.Node();
                this._rttDebugNode.setName( '_rttDebugNode' );
                this._root.addChild( this._rttDebugNode );
            } else if ( this._rttDebugNode.getChildren().length !== 0 ) {
                this._rttDebugNode.removeChildren();
                return;
            }

            var ComposerdebugNode = new osg.Node();
            ComposerdebugNode.setName( 'debugComposerNode' );
            ComposerdebugNode.setCullingActive( false );
            var ComposerdebugCamera = new osg.Camera();
            ComposerdebugCamera.setName( '_ComposerdebugCamera' );
            this._rttDebugNode.addChild( ComposerdebugCamera );

            var optionsDebug = {
                x: 0,
                y: 100,
                w: 100,
                h: 80,
                horizontal: true,
                screenW: 1024,
                screenH: 768,
                fullscreen: false
            };
            if ( optionalArgs )
                osg.extend( optionsDebug, optionalArgs );

            var matrixDest = ComposerdebugCamera.getProjectionMatrix();
            osg.Matrix.makeOrtho( 0, optionsDebug.screenW, 0, optionsDebug.screenH, -5, 5, matrixDest );

            // not really needed until we do matrix caches
            ComposerdebugCamera.setProjectionMatrix( matrixDest );

            matrixDest = ComposerdebugCamera.getViewMatrix();
            osg.Matrix.makeTranslate( 0, 0, 0, matrixDest );
            ComposerdebugCamera.setViewMatrix( matrixDest );
            ComposerdebugCamera.setRenderOrder( osg.Camera.NESTED_RENDER, 0 );
            ComposerdebugCamera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
            ComposerdebugCamera.addChild( ComposerdebugNode );

            var texture;
            var xOffset = optionsDebug.x;
            var yOffset = optionsDebug.y;
            ComposerdebugNode.removeChildren();

            var stateset;

            stateset = ComposerdebugNode.getOrCreateStateSet();

            if ( !optionsDebug.fullscreen ) {
                stateset.setAttributeAndModes( new osg.Depth( 'DISABLE' ) );
            }

            for ( var i = 0, l = this._renderTextures.length; i < l; i++ ) {
                texture = this._renderTextures[ i ];
                if ( texture ) {
                    var quad = osg.createTexturedQuadGeometry( xOffset, yOffset, 0, optionsDebug.w, 0, 0, 0, optionsDebug.h, 0 );

                    stateset = quad.getOrCreateStateSet();

                    quad.setName( 'debugCompoGeom' + i );

                    stateset.setTextureAttributeAndModes( 0, texture );
                    stateset.setAttributeAndModes( new osg.Depth( 'DISABLE' ) );

                    ComposerdebugNode.addChild( quad );

                    if ( optionsDebug.horizontal ) {
                        xOffset += optionsDebug.w + 2;
                    } else {
                        yOffset += optionsDebug.h + 2;
                    }
                }
            }
        },

        createScene: function () {

            // the root node
            this._root = new osg.Node();
            var scene = new osg.Node();

            // camera RTT
            var texture = this.createTextureRTT( 'mainScene', osg.Texture.NEAREST, osg.Texture.UNSIGNED_BYTE );
            var camera = this.createCameraRTT( texture, true );
            camera.addChild( scene );
            this._root.addChild( camera );

            // create the model
            var model0 = this.createModel( '../media/models/material-test/file.osgjs' );
            var model1 = this.createModel( '../media/models/material-test/file.osgjs' );

            osg.Matrix.makeTranslate( -10, 0, 0, model0.getMatrix() );
            osg.Matrix.makeTranslate( 10, 0, 0, model1.getMatrix() );


            var stateSet = model1.getOrCreateStateSet();
            var material = new osg.Material();
            material.setTransparency( 0.4 );

            stateSet.setRenderingHint( 'TRANSPARENT_BIN' );
            stateSet.setAttributeAndModes( new osg.BlendFunc( 'ONE', 'ONE_MINUS_SRC_ALPHA' ) );
            stateSet.setAttributeAndModes( material );

            scene.addChild( model0 );
            scene.addChild( model1 );

            // create textured quad with the texture rtt
            var geometry = osg.createTexturedFullScreenFakeQuadGeometry();
            geometry.getOrCreateStateSet().setTextureAttributeAndModes( 0, texture );
            this._root.addChild( geometry );

            return this._root;
        }

    } );

    window.Example = Example;

    window.addEventListener( 'load', function () {
        var example = new Example();
        example.run();
    }, true );

} )();
