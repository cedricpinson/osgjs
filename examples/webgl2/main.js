( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var ExampleOSGJS = window.ExampleOSGJS;

    var Example = function () {

        ExampleOSGJS.call( this );

        this._voxelSize = 128;
    };


    Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {

        createRTT: function ( scene ) {

            var getShader = function () {
                var vertexshader = [
                    '',
                    '#ifdef GL_ES',
                    'precision highp float;',
                    '#endif',
                    'attribute vec3 Vertex;',
                    'uniform mat4 uModelViewMatrix;',
                    'uniform mat4 uProjectionMatrix;',
                    'void main(void) {',
                    '  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(Vertex,1.0);',
                    '}'
                ].join( '\n' );

                var fragmentshader = [
                    '',
                    '#ifdef GL_ES',
                    'precision highp float;',
                    '#endif',

                    'void main(void) {',
                    '  vec4 color = vec4(0.0, 1.0, 0.0, 1.0);',
                    '  if ( gl_FragCoord[0] <= 1.0 || gl_FragCoord[0] >= 127.0 || gl_FragCoord[1] <= 0.0 || gl_FragCoord[2] <= 0.0 )',
                    '       color = vec4(0.0, 0.0, 1.0, 1.0);',
                    '  gl_FragColor = color;',
                    '}',
                    ''
                ].join( '\n' );

                var program = new osg.Program(
                    new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                    new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

                return program;
            };


            var maxDrawBuffer = 8;

            var getShader2 = function () {
                var vertexshader = [
                    '#version 300 es',
                    'precision highp float;',
                    'layout(location = 0) in vec3 Vertex;',
                    'uniform mat4 uModelViewMatrix;',
                    'uniform mat4 uProjectionMatrix;',
                    'void main(void) {',
                    '  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(Vertex,1.0);',
                    '}'
                ].join( '\n' );


                var declarationOutput = ' layout(location = 0) out vec4 rtt[' + maxDrawBuffer + '];';

                var i;
                var output = '';
                for ( i = 0; i < maxDrawBuffer; i++ ) {
                    output += '';
                    output += 'rtt[' + i + '] = vec4(0.0, 1.0,0.0,1.0);\n';
                }

                var fragmentshader = [
                    '#version 300 es',
                    'precision highp float;',
                    'uniform float sliceStart;',
                    declarationOutput,
                    'void main(void) {',
                    'int index = int(7.0 * gl_FragCoord[2]);',
                    '//vec4 color = vec4(gl_FragCoord[2], gl_FragCoord[2], gl_FragCoord[2], 1.0 );',
                    'vec4 color = vec4(0.0, 1.0, 0.0, 1.0 );',
                    'switch ( index ) {',
                    'case 0:',
                    '    rtt[ 7 ] = color;',
                    '    break;',
                    'case 1:',
                    '    rtt[ 6 ] = color;',
                    '    break;',
                    'case 2:',
                    '    rtt[ 5 ] = color;',
                    '    break;',
                    'case 3:',
                    '    rtt[ 4 ] = color;',
                    '    break;',
                    'case 4:',
                    '    rtt[ 3 ] = color;',
                    '    break;',
                    'case 5:',
                    '    rtt[ 2 ] = color;',
                    '    break;',
                    'case 6:',
                    '    rtt[ 1 ] = color;',
                    '    break;',
                    'case 7:',
                    '    rtt[ 0 ] = color;',
                    '    break;',
                    '}',
                    '}',
                    ''
                ].join( '\n' );

                var program = new osg.Program(
                    new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                    new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

                return program;
            };


            var group = new osg.Node();

            var texture = new osg.Texture3D();
            var image = new osg.Image();
            var data = new Uint8Array( this._voxelSize * this._voxelSize * this._voxelSize * 4 );
            for ( var j = 0; j < this._voxelSize * this._voxelSize * this._voxelSize; j += 4 ) {
                data[ j + 0 ] = 0;
                data[ j + 1 ] = 0;
                data[ j + 2 ] = 0;
                data[ j + 3 ] = 0.2;
            }
            image.setWidth( this._voxelSize );
            image.setHeight( this._voxelSize );
            image.setDepth( this._voxelSize );
            image.setImage( data );
            // texture.setTextureSize( this._voxelSize, this._voxelSize, this._voxelSize );
            texture.setImage( image );
            var viewport = new osg.Viewport( 0, 0, this._voxelSize, this._voxelSize );

            var sceneBoundingBox = scene.getBoundingBox();

            var shader = getShader2();
            // var shader = getShader();


            var stateSet = new osg.StateSet();
            stateSet.setAttributeAndModes( shader );

            var sceneSize = osg.vec3.sub( osg.vec3.create(), sceneBoundingBox.getMax(), sceneBoundingBox.getMin() );
            var sceneCenter = sceneBoundingBox.center( osg.vec3.create() );

            var maxAxis = sceneSize[ 0 ] > sceneSize[ 1 ] ? 0 : 1;
            maxAxis = sceneSize[ maxAxis ] < sceneSize[ 2 ] ? 2 : maxAxis;

            var sceneVoxelSize = sceneSize[ maxAxis ] / this._voxelSize;
            var maxSize = sceneSize[ maxAxis ];

            var viewPosition = osg.vec3.fromValues( sceneCenter[ 0 ], sceneCenter[ 1 ], sceneCenter[ 2 ] + maxSize / 2 );
            var view = osg.mat4.lookAt( osg.mat4.create(), viewPosition, sceneCenter, osg.vec3.fromValues( 0, 1, 0 ) );

            var node = new osg.Node();
            node.setStateSet( stateSet );
            node.addChild( scene );
            node.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( osg.CullFace.DISABLE ) );
            var createCameraRTTSlice = function ( sliceIndex ) {
                // needs handle the scene bbox and adjust near/far to clip
                var near = sliceIndex * sceneVoxelSize - 1e-4;
                var far = ( sliceIndex + maxDrawBuffer ) * sceneVoxelSize;
                var projection = osg.mat4.ortho( osg.mat4.create(), -maxSize/2, maxSize/2, -maxSize/2, maxSize/2, near, far );
                var camera = new osg.Camera();
                camera._clampProjectionMatrix = false;
                camera.setViewport( viewport );
                camera.setProjectionMatrix( projection );
                camera.setViewMatrix( view );
                camera.setClearColor( osg.vec4.fromValues( 0, 0, 0, 0 ) );
                for ( var i = 0, l = maxDrawBuffer; i < l; i++ ) {
                    camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0 + i, texture, 0, sliceIndex + i );
                }

                camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
                camera.addChild( node );
                camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
                return camera;
            };

            this._voxelTexture = texture;

            var nbPasses = this._voxelSize / maxDrawBuffer;
            for ( var i = 0, l = nbPasses; i < l; i++ ) {
                var cameraSlice = createCameraRTTSlice( i * maxDrawBuffer );
                group.addChild( cameraSlice );
            }

            if ( false ) {
                // check view from camera for debug without 3d texture
                var camera2d = new osg.Camera();
                camera2d.setViewport( viewport );

                var near = 0 * sceneVoxelSize;
                var far = this._voxelSize * sceneVoxelSize;
                var projection = osg.mat4.create();
                osg.mat4.ortho( projection, -maxSize/2, maxSize/2, -maxSize/2, maxSize/2, -10, 10 );
                camera2d.setProjectionMatrix( projection );
                camera2d.setViewMatrix( view );

                var texture2d = new osg.Texture();
                texture2d.setTextureSize( this._voxelSize, this._voxelSize );
                camera2d.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, texture2d, 0, 0 );
                camera2d.getOrCreateStateSet().setAttributeAndModes( getShader() );
                camera2d.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
                camera2d.addChild( scene );
                camera2d.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
                this.createDebugTextureList( [ texture2d ] );
                group.addChild( camera2d );
            }

            return group;
        },


        createDebugTexture3D: function () {
            // debug use resolution of the voxel and display it as pointcloud
            var getShader = function () {
                var vertexshader = [
                    '#version 300 es',

                    'layout(location = 0) in uvec3 Vertex;',

                    'uniform mat4 uModelViewMatrix;',
                    'uniform mat4 uProjectionMatrix;',
                    'flat out ivec3 vVertex;',
                    'void main(void) {',
                    '  vVertex = ivec3(Vertex);',
                    '  gl_Position = (uProjectionMatrix * uModelViewMatrix) * vec4(vec3(Vertex),1.0);',
                    '}'
                ].join( '\n' );

                var fragmentshader = [
                    '#version 300 es',

                    'precision highp float;',
                    'precision highp int;',
                    'precision highp sampler3D;',
                    'uniform sampler3D Texture0;',
                    'flat in ivec3 vVertex;',

                    'out vec4 color;',
                    'void main(void) {',
                    '  vec4 c = texelFetch(Texture0, vVertex, 0 );',
                    '  if ( c[3] == 0.0 ) discard; //c = vec4(0.0,0.0,0.0,1.0);',
                    '  color = c;',
                    '}',
                    ''
                ].join( '\n' );

                var program = new osg.Program(
                    new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                    new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

                return program;
            };

            var program = getShader();

            var nbVertexes = this._voxelSize * this._voxelSize * this._voxelSize;
            //var buffer = new Float32Array( nbVertexes * 3 );
            var buffer = new Uint8Array( nbVertexes * 3 );
            var index = 0;
            for ( var x = 0; x < this._voxelSize; x++ ) {
                for ( var y = 0; y < this._voxelSize; y++ ) {
                    for ( var z = 0; z < this._voxelSize; z++ ) {
                        buffer[ index ] = x;
                        buffer[ index + 1 ] = y;
                        buffer[ index + 2 ] = z;
                        index += 3;
                    }
                }
            }

            var geom = new osg.Geometry();
            geom.getPrimitiveSetList().push( new osg.DrawArrays( 'POINTS', 0, nbVertexes ) );
            geom.setVertexAttribArray( 'Vertex', new osg.BufferArray( 'ARRAY_BUFFER', buffer, 3, true ) );
            geom.getOrCreateStateSet().setAttributeAndModes( program );
            geom.getOrCreateStateSet().setTextureAttributeAndModes( 0, this._voxelTexture );

            var node = new osg.MatrixTransform();
            osg.mat4.fromTranslation( node.getMatrix(), [ 10, 0, 0 ] );
            node.addChild( geom );
            return node;
        },

        createScene: function () {
            // the root node
            var scene = new osg.Node();
            scene.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 0 ) );

            var mt = new osg.MatrixTransform();
            var grid = osg.createGridGeometry( -30, -40, -3,
                60, 0, 0,
                0, 60, 0,
                15, 15
            );
            mt.addChild( grid );
            mt.addChild( osg.createAxisGeometry() );
            scene.addChild( mt );

            var sceneCube = new osg.Node();
            sceneCube.addChild( osg.createTexturedBoxGeometry( 0, 0, 0, 1, 1, 1 ) );
            sceneCube.addChild( osg.createTexturedBoxGeometry( 4, 4, 4, 1, 1, 1 ) );

            // osgDB.readNodeURL( '../media/models/raceship.osgjs' ).then( function ( model ) {
            //     scene.addChild( model );
            // } );

            var rtt = this.createRTT( sceneCube );
            scene.addChild( sceneCube );

            this.getRootNode().addChild( rtt );
            this.getRootNode().addChild( scene );

            this.getRootNode().addChild( this.createDebugTexture3D() );
            // this.getRootNode().addChild( this.createDebugTexture3D2() );

            //this.getRootNode().addChild( this.createDebugTexture3DQuad() );
            this._viewer.getManipulator().setNode( scene );
            this._viewer.getManipulator().computeHomePosition();

        }

    } );

    window.addEventListener( 'load', function () {

        var example = new Example();
        example.run();
        window.example = example;

    }, true );

} )();
