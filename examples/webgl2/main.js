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
            var self = this;
            var maxDrawBuffer = 8;
            var root = new osg.Node();
            var texture3D = [ new osg.Texture3D(), new osg.Texture3D(), new osg.Texture3D() ];
            var finalTexture3D = new osg.Texture3D();
            var voxelSize = this._voxelSize;
            var viewport = new osg.Viewport( 0, 0, voxelSize, voxelSize );

            var viewMatrix = [ osg.mat4.create(), osg.mat4.create(), osg.mat4.create() ];
            var invViewMatrix = [ osg.mat4.create(), osg.mat4.create(), osg.mat4.create() ];

            var createEachAxisTexture3D = function ( group ) {

                var getShader = function () {
                    var vertexshader = [
                        '#version 300 es',
                        'precision highp float;',
                        'layout(location = 0) in vec3 Vertex;',
                        'uniform mat4 uModelViewMatrix;',
                        'uniform mat4 uProjectionMatrix;',
                        'void main(void) {',
                        '  gl_Position = (uProjectionMatrix * uModelViewMatrix) * vec4(Vertex,1.0);',
                        '}'
                    ].join( '\n' );


                    var i;
                    var output = '';
                    for ( i = 0; i < maxDrawBuffer; i++ ) {
                        output += '';
                        output += 'rtt[' + i + '] = vec4(0.0, 1.0,0.0,1.0);\n';
                    }

                    var fragmentshader = [
                        '#version 300 es',
                        'precision highp float;',
                        'uniform vec4 uColor;',
                        'uniform vec3 uColorTextureAxis;',
                        'uniform float sliceStart;',
                        'layout(location = 0) out vec4 rtt[' + maxDrawBuffer + '];',
                        'void main(void) {',
                        'int index = int(7.0 * gl_FragCoord[2]);',
                        '//vec4 color = vec4(gl_FragCoord[2], gl_FragCoord[2], gl_FragCoord[2], 1.0 );',
                        'vec4 color = uColor; //vec4(0.0, 1.0, 0.0, 1.0 );',
                        '//color = vec4( uColorTextureAxis, 1.0 );',
                        ' //if ( gl_FragCoord.z <= 0.1 ) color = vec4(0.0, 1.0, 0.0, 1.0 );',
                        'switch ( index ) {',
                        'case 0:',
                        '    rtt[ 0 ] = color;',
                        '    break;',
                        'case 1:',
                        '    rtt[ 1 ] = color;',
                        '    break;',
                        'case 2:',
                        '    rtt[ 2 ] = color;',
                        '    break;',
                        'case 3:',
                        '    rtt[ 3 ] = color;',
                        '    break;',
                        'case 4:',
                        '    rtt[ 4 ] = color;',
                        '    break;',
                        'case 5:',
                        '    rtt[ 5 ] = color;',
                        '    break;',
                        'case 6:',
                        '    rtt[ 6 ] = color;',
                        '    break;',
                        'case 7:',
                        '    rtt[ 7 ] = color;',
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

                var sceneBoundingBox = scene.getBoundingBox();

                var shader = getShader();
                var stateSet = new osg.StateSet();
                stateSet.setAttributeAndModes( shader );

                var sceneSize = osg.vec3.sub( osg.vec3.create(), sceneBoundingBox.getMax(), sceneBoundingBox.getMin() );
                var sceneCenter = sceneBoundingBox.center( osg.vec3.create() );

                var maxAxis = sceneSize[ 0 ] > sceneSize[ 1 ] ? 0 : 1;
                maxAxis = sceneSize[ maxAxis ] < sceneSize[ 2 ] ? 2 : maxAxis;

                var maxSize = sceneSize[ maxAxis ];
                var sceneVoxelSize = maxSize / voxelSize;

                var node = new osg.Node();
                node.setStateSet( stateSet );
                node.addChild( scene );
                node.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( osg.CullFace.DISABLE ) );


                var createCameraRTTSlice = function ( view, texture, sliceIndex ) {
                    // needs handle the scene bbox and adjust near/far to clip
                    var near = sliceIndex * sceneVoxelSize - 1e-4;
                    var far = ( sliceIndex + maxDrawBuffer ) * sceneVoxelSize;
                    var projection = osg.mat4.ortho( osg.mat4.create(), -maxSize/2, maxSize/2, -maxSize/2, maxSize/2, near, far );
                    var camera = new osg.Camera();
                    camera.setComputeNearFar( false ); //_clampProjectionMatrix = false;
                    camera.setViewport( viewport );
                    camera.setProjectionMatrix( projection );
                    camera.setViewMatrix( view );
                    camera.setClearColor( osg.vec4.fromValues( 0, 0, 0, 0 ) );
                    for ( var i = 0, l = maxDrawBuffer; i < l; i++ ) {
                        camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0 + i, texture, 0, ( voxelSize - 1 ) - ( sliceIndex + i ) );
                    }

                    camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
                    camera.addChild( node );
                    camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
                    return camera;
                };


                var nbPasses = voxelSize / maxDrawBuffer;
                var i,l;
                var nodeComputing = [ new osg.Node(), new osg.Node(), new osg.Node() ];
                for ( var a = 0; a < 3; a++ ) {
                    // if ( a !== 2 ) continue;

                    texture3D[ a ].setTextureSize( voxelSize, voxelSize, voxelSize );
                    texture3D[ a ].setFlipY( false );

                    var view = osg.vec3.clone( sceneCenter );
                    view[ a ] += maxSize * 0.5;

                    var up = osg.vec3.create();

                    // use up as axis + 1 index
                    up[ ( a + 1 ) % 3 ] = 1.0;

                    osg.mat4.lookAt( viewMatrix[ a ], view, sceneCenter, up );
                    osg.mat4.copy( invViewMatrix[ a ], viewMatrix[ a ] );
                    osg.mat4.setTranslation( invViewMatrix[ a ], [ 0, 0, 0 ] );
                    // osg.mat4.invert( invViewMatrix[ a ], invViewMatrix[ a ] );

                    osg.logMatrix( viewMatrix[ a ] );
                    for ( i = 0, l = nbPasses; i < l; i++ ) {
                        var cameraSlice = createCameraRTTSlice( viewMatrix[ a ], texture3D[ a ], i * maxDrawBuffer, a );
                        nodeComputing[ a ].addChild( cameraSlice );
                        var axisColor = osg.vec3.create();
                        axisColor[ a ] = 1.0;
                        cameraSlice.getOrCreateStateSet().addUniform( osg.Uniform.createFloat3( axisColor, 'uColorTextureAxis' ) );

                    }

                    group.addChild( nodeComputing[ a ] );
                }

                if ( false ) {

                    var getShaderDebug = function () {

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
                            'uniform vec4 uColor;',

                            'void main(void) {',
                            '  //vec4 color = vec4(0.0, 1.0, 0.0, 1.0);',
                            '  //if ( gl_FragCoord[0] <= 1.0 || gl_FragCoord[0] >= 127.0 || gl_FragCoord[1] <= 0.0 || gl_FragCoord[2] <= 0.0 )',
                            '  //     color = vec4(0.0, 0.0, 1.0, 1.0);',
                            '  gl_FragColor = uColor;',
                            '}',
                            ''
                        ].join( '\n' );

                        var program = new osg.Program(
                            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

                        return program;
                    };

                    // check view from camera for debug without 3d texture
                    var camera2d = new osg.Camera();
                    camera2d.setViewport( viewport );

                    var projection = osg.mat4.create();
                    osg.mat4.ortho( projection, -maxSize/2, maxSize/2, -maxSize/2, maxSize/2, -10, 10 );
                    camera2d.setProjectionMatrix( projection );
                    camera2d.setViewMatrix( viewMatrix[ 2 ] );

                    var texture2d = new osg.Texture();
                    texture2d.setTextureSize( voxelSize, voxelSize );
                    camera2d.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, texture2d, 0, 0 );
                    camera2d.getOrCreateStateSet().setAttributeAndModes( getShaderDebug() );
                    camera2d.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
                    camera2d.addChild( scene );
                    camera2d.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
                    self.createDebugTextureList( [ texture2d ] );
                    root.addChild( camera2d );
                }

            };

            var mergeFinalTexture3D = function ( grp ) {

                // merge different 3d texture into one final
                finalTexture3D.setTextureSize( voxelSize, voxelSize, voxelSize );

                // stop here, needs to check how many planes we need to merge axis texture
                // into the final because of the number of maxDrawBuffer
                var nbQuads = voxelSize / maxDrawBuffer;

                var geom = new osg.Geometry();
                var vertexArray = new Float32Array( 6 * nbQuads * 3 );
                geom.setVertexAttribArray( 'Vertex', new osg.BufferArray( 'ARRAY_BUFFER', vertexArray, 3 ) );
                geom.getPrimitiveSetList().push( new osg.DrawArrays( 'TRIANGLES', 0, 6 * nbQuads ) );

                for ( var a = 0, al = nbQuads; a < al; a++ ) {
                    var idx = a * 18;
                    var z = -a * maxDrawBuffer;
                    vertexArray[ idx + 0 ] = 0.0;
                    vertexArray[ idx + 1 ] = 0.0;
                    vertexArray[ idx + 2 ] = z;

                    vertexArray[ idx + 3 ] = 0.0;
                    vertexArray[ idx + 4 ] = voxelSize;
                    vertexArray[ idx + 5 ] = z;

                    vertexArray[ idx + 6 ] = voxelSize;
                    vertexArray[ idx + 7 ] = voxelSize;
                    vertexArray[ idx + 8 ] = z;


                    vertexArray[ idx + 9 ] = 0.0;
                    vertexArray[ idx + 10 ] = 0.0;
                    vertexArray[ idx + 11 ] = z;

                    vertexArray[ idx + 12 ] = voxelSize;
                    vertexArray[ idx + 13 ] = voxelSize;
                    vertexArray[ idx + 14 ] = z;

                    vertexArray[ idx + 15 ] = voxelSize;
                    vertexArray[ idx + 16 ] = 0.0;
                    vertexArray[ idx + 17 ] = z;
                }

                var center = osg.vec3.fromValues( voxelSize/2, voxelSize/2, -voxelSize/2 );
                var view = osg.vec3.fromValues( voxelSize/2, voxelSize/2, 0.0 );
                var up = osg.vec3.fromValues( 1, 0, 0 );
                var matrixView = osg.mat4.create();
                osg.mat4.lookAt( matrixView , view, center, up );

                var maxSize = voxelSize;

                var createCameraMergeTexture3D = function ( sliceIndex ) {

                    // needs handle the scene bbox and adjust near/far to clip
                    var near = sliceIndex - 1e-4;
                    var far = ( sliceIndex + maxDrawBuffer );
                    var projection = osg.mat4.ortho( osg.mat4.create(), -maxSize/2, maxSize/2, -maxSize/2, maxSize/2, near, far );
                    var camera = new osg.Camera();
                    camera.setComputeNearFar( false );
                    camera.setViewport( viewport );
                    camera.setProjectionMatrix( projection );
                    camera.setViewMatrix( matrixView );
                    camera.setClearColor( osg.vec4.fromValues( 0, 0, 0, 0 ) );
                    camera.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( sliceIndex, 'sliceStart' ) );
                    for ( var i = 0, l = maxDrawBuffer; i < l; i++ ) {
                        camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0 + i, finalTexture3D, 0, ( voxelSize - 1 ) - ( sliceIndex + i ) );
                    }

                    camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
                    camera.addChild( geom );
                    camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
                    return camera;
                };

                var getShader = function () {
                    var vertexshader = [
                        '#version 300 es',
                        'precision highp float;',
                        'layout(location = 0) in vec3 Vertex;',
                        'uniform mat4 uModelViewMatrix;',
                        'uniform mat4 uProjectionMatrix;',
                        'void main(void) {',
                        '  gl_Position = (uProjectionMatrix * uModelViewMatrix) * vec4(Vertex,1.0);',
                        '}'
                    ].join( '\n' );


                    var i;
                    var output = '';
                    for ( i = 0; i < maxDrawBuffer; i++ ) {
                        output += '';
                        output += 'rtt[' + i + '] = vec4(0.0, 1.0,0.0,1.0);\n';
                    }

                    var maxVoxelIndex = voxelSize - 1.0;
                    var unroll = [];
                    for ( var m = 0; m < maxDrawBuffer; m++ ) {
                        unroll.push( 'pos = ivec3(gl_FragCoord.x, gl_FragCoord.y, ' + maxVoxelIndex + ' - ( ' + m + ' + sliceStart ) );' );
                        unroll.push( 'x = getTextureX( pos );' );
                        unroll.push( 'y = getTextureY( pos );' );
                        unroll.push( 'z = getTextureZ( pos );' );
                        unroll.push( 'result = x + y + z;' );
                        unroll.push( 'if ( result.w > 0.0 ) result;// /= result.w;' );
                        unroll.push( 'rtt[ ' + m + '] = result;' );
                    }
                    var str = unroll.join( '\n' );

                    var fragmentshader = [
                        '#version 300 es',
                        'precision highp float;',
                        'uniform int sliceStart;',
                        'precision highp sampler3D;',
                        'uniform sampler3D TextureX;',
                        'uniform sampler3D TextureY;',
                        'uniform sampler3D TextureZ;',
                        'uniform mat4 invViewX;',
                        'uniform mat4 invViewY;',
                        'uniform mat4 invViewZ;',
                        'float size = float(' + voxelSize + ')/2.0;',
                        'layout(location = 0) out vec4 rtt[' + maxDrawBuffer + '];',
                        '',
                        'vec4 getTextureX( ivec3 pos ) {',
                        '    vec3 pp =  vec3(pos) - vec3(size);',
                        '    pp =  vec3(size) + vec3( invViewX * vec4(pp,1.0) );',
                        '    ivec3 rotPos = ivec3(pp);',
                        '    vec4 p = texelFetch(TextureX, rotPos, 0 );',
                        '    return p;',
                        '}',
                        '',
                        'vec4 getTextureY( ivec3 pos ) {',
                        '    vec3 pp =  vec3(pos) - vec3(size);',
                        '    pp =  vec3(size) + vec3( invViewY * vec4(pp,1.0) );',
                        '    ivec3 rotPos = ivec3(pp);',
                        '    vec4 p = texelFetch(TextureY, rotPos, 0 );',
                        '    return p;',
                        '}',
                        '',
                        'vec4 getTextureZ( ivec3 pos ) {',
                        '    vec3 pp =  vec3(pos) - vec3(size);',
                        '    pp =  vec3(size) + vec3( invViewZ * vec4(pp,1.0) );',
                        '    ivec3 rotPos = ivec3(pp);',
                        '    vec4 p = texelFetch(TextureZ, rotPos, 0 );',
                        '    return p;',
                        '}',
                        'void main(void) {',
                        'ivec3 pos;',
                        'vec4 x,y,z,result;',
                        '',
                        str,
                        '}'
                    ].join( '\n' );

                    var program = new osg.Program(
                        new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                        new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

                    return program;
                };

                var node = new osg.Node();
                node.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( osg.CullFace.DISABLE ) );
                node.getOrCreateStateSet().setAttributeAndModes( getShader() );
                node.getOrCreateStateSet().setTextureAttributeAndModes( 0, texture3D[ 0 ] );
                node.getOrCreateStateSet().setTextureAttributeAndModes( 1, texture3D[ 1 ] );
                node.getOrCreateStateSet().setTextureAttributeAndModes( 2, texture3D[ 2 ] );

                node.getOrCreateStateSet().addUniform( osg.Uniform.createMat4( invViewMatrix[ 0 ], 'invViewX' ) );
                node.getOrCreateStateSet().addUniform( osg.Uniform.createMat4( invViewMatrix[ 1 ], 'invViewY' ) );
                node.getOrCreateStateSet().addUniform( osg.Uniform.createMat4( invViewMatrix[ 2 ], 'invViewZ' ) );
                node.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'TextureX' ) );
                node.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'TextureY' ) );
                node.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'TextureZ' ) );

                var nbPasses = voxelSize / maxDrawBuffer;
                for ( var i = 0, l = nbPasses; i < l; i++ ) {
                    var cameraSlice = createCameraMergeTexture3D( i * maxDrawBuffer );
                    node.addChild( cameraSlice );
                }

                grp.addChild( node );
                //grp.addChild( geom );
            };

            createEachAxisTexture3D( root );
            this._voxelTexture = finalTexture3D;//texture3D[ 2 ];

            mergeFinalTexture3D( root );

            return root;
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
                    '  if ( c[3] == 0.0 ) discard; //c = vec4(0.0,0.0,0.0,0.2);',
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

            var UpdateCallback = function () {
                this.update = function ( node, nv ) {
                    var fn = nv.getFrameStamp().getFrameNumber();
                    if ( fn === this._frameNumber ) return false;

                    this._frameNumber = fn;
                    osg.mat4.fromRotation( node.getMatrix(), 0.005 * this._frameNumber, [ 0, 1, 0 ] );
                    return false;
                };
            };

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

            var geom, material, color;
            var sceneCube = new osg.MatrixTransform();
            geom = osg.createTexturedBoxGeometry( 0, 0, 0, 1, 1, 1 );
            color = [ 0.0, 0.0, 1.0, 1.0 ];
            material = new osg.Material();
            material.setDiffuse( color );
            geom.getOrCreateStateSet().setAttributeAndModes( material );
            geom.getOrCreateStateSet().addUniform( osg.Uniform.createFloat4( color, 'uColor' ) );
            sceneCube.addChild( geom );

            geom = osg.createTexturedBoxGeometry( 0, 0, 0, 1, 1, 1 );
            color = [ 0.0, 1.0, 0.0, 1.0 ];
            material = new osg.Material();
            material.setDiffuse( color );
            geom.getOrCreateStateSet().setAttributeAndModes( material );
            geom.getOrCreateStateSet().addUniform( osg.Uniform.createFloat4( color, 'uColor' ) );
            var mtg = new osg.MatrixTransform();
            mtg.addUpdateCallback( new UpdateCallback() );
            mtg.addChild( geom );
            var mm = new osg.MatrixTransform();
            osg.mat4.fromTranslation( mm.getMatrix(), [ 2, 2, 2 ] );
            mm.addChild( mtg );
            sceneCube.addChild( mm );

            geom = osg.createTexturedBoxGeometry( 4, 4, 4, 1, 1, 1 );
            color = [ 1.0, 0.0, 0.0, 1.0 ];
            material = new osg.Material();
            material.setDiffuse( color );
            geom.getOrCreateStateSet().setAttributeAndModes( material );
            geom.getOrCreateStateSet().addUniform( osg.Uniform.createFloat4( color, 'uColor' ) );
            sceneCube.addChild( geom );

            var rtt = this.createRTT( sceneCube );
            scene.addChild( sceneCube );

            this.getRootNode().addChild( rtt );
            this.getRootNode().addChild( scene );

            this.getRootNode().addChild( this.createDebugTexture3D() );

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
