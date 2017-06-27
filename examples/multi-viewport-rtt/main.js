 ( function () {
     'use strict';

     var ExampleOSGJS = window.ExampleOSGJS;
     var osg = window.OSG.osg;

     // inherits for the ExampleOSGJS prototype
     var Example = function () {

         ExampleOSGJS.call( this );

         this._config = {
             camera: 4
         };

     };


     Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {


         createCameraSharedRTT: function ( texture, clearColor, index, num ) {

             var camera = new osg.Camera();
             camera.setName( 'camera ' + index );
             var size = texture.getWidth() / num;
             var offset = index * size;
             camera.setViewport( new osg.Viewport( offset, 0, size, texture.getHeight() ) );
             camera.setClearColor( clearColor );
             camera.getOrCreateStateSet().setAttributeAndModes( new osg.Scissor( offset, 0, size, texture.getHeight() ) );

             camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
             camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, texture );
             camera.attachRenderBuffer( osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16 );
             camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
             return camera;
         },

         createCameraFinal: function ( texture ) {

             var texturedQuadUsingTargetTexture = osg.createTexturedQuadGeometry( -1, -1, 0,
                 2, 0, 0,
                 0, 2, 0
             );

             texturedQuadUsingTargetTexture.getOrCreateStateSet().setTextureAttributeAndModes( 0, texture );

             var camera = new osg.Camera();
             camera.setName( 'final' );

             camera.setViewport( new osg.Viewport( 0, 0, this._canvas.width, this._canvas.height ) );
             osg.mat4.ortho( camera.getProjectionMatrix(), -1, 1, -1, 1, -5, 5 );
             osg.mat4.fromTranslation( camera.getViewMatrix(), [ 0, 0, 0 ] );

             texturedQuadUsingTargetTexture.getOrCreateStateSet().setAttributeAndModes( this.getDebugProgram() );
             camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
             camera.addChild( texturedQuadUsingTargetTexture );
             return camera;
         },

         getOrCreateModel: function () {

             var node = new osg.Node();

             var mtx = new osg.MatrixTransform();
             osg.mat4.fromTranslation( mtx.getMatrix(), osg.vec3.fromValues( 0.5, 0, 0 ) );
             var shape0 = osg.createTexturedBoxGeometry();
             mtx.addChild( shape0 );
             node.addChild( mtx );


             mtx = new osg.MatrixTransform();
             osg.mat4.fromTranslation( mtx.getMatrix(), osg.vec3.fromValues( -0.5, 0, 0 ) );
             var shape1 = osg.createTexturedSphereGeometry();
             mtx.addChild( shape1 );
             node.addChild( mtx );

             return node;
         },

         createScene: function () {

             var num = 4;
             var width = this._canvas.width / num;
             var height = this._canvas.height;

             var texture = new osg.Texture();
             texture.setTextureSize( width, height );

             var scene = this.getOrCreateModel();

             var positions = [
                 osg.vec3.fromValues( 0, 0, -5 ),
                 osg.vec3.fromValues( 5, 0, 0 ),
                 osg.vec3.fromValues( 0, 0, 5 ),
                 osg.vec3.fromValues( -5, 0, 0 )
             ];

             var clearColors = [
                 osg.vec4.fromValues( 1, 0, 0, 0 ),
                 osg.vec4.fromValues( 0, 1, 0, 0 ),
                 osg.vec4.fromValues( 0, 0, 1, 0 ),
                 osg.vec4.fromValues( 1, 0, 1, 0 )
             ];

             for ( var i = 0; i < num; i++ ) {

                 var camera = this.createCameraSharedRTT( texture, clearColors[ i ], i, num );

                 camera.setViewMatrix( osg.mat4.lookAt(
                     osg.mat4.create(),
                     positions[ i ],
                     osg.vec3.fromValues( 0, 0, 0 ),
                     osg.vec3.fromValues( 0, 1, 0 ) ) );

                 camera.setProjectionMatrix( osg.mat4.perspective( osg.mat4.create(), Math.PI / 180 * 60, width / height, 0.1, 100.0 ) );

                 camera.addChild( scene );
                 this._root.addChild( camera );

             }

             // this is to debug
             // this.createDebugTextureList( [ texture ], {
             //     w: 200*num,
             //     h: 200
             // } );
             // this.showDebugTextureList();


             this._root.addChild( this.createCameraFinal( texture ) );

         }


     } );


     window.addEventListener( 'load', function () {
         var example = new Example();
         example.run();
     }, true );

 } )();
