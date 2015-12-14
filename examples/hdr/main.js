( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgViewer = OSG.osgViewer;
    var Viewer;

    function decodeHDRHeader( buf ) {
        var info = {
            exposure: 1.0
        };

        // find header size
        var size = -1,
            size2 = -1,
            i;
        for ( i = 0; i < buf.length - 1; i++ ) {
            if ( buf[ i ] === 10 && buf[ i + 1 ] === 10 ) {
                size = i;
                break;
            }
        }
        for ( i = size + 2; i < buf.length - 1; i++ ) {
            if ( buf[ i ] === 10 ) {
                size2 = i;
                break;
            }
        }

        // convert header from binary to text lines
        var header = String.fromCharCode.apply( null, new Uint8Array( buf.subarray( 0, size ) ) ); // header is in text format
        var lines = header.split( '\n' );
        if ( lines[ 0 ] !== '#?RADIANCE' ) {
            console.error( 'Invalid HDR image.' );
            return false;
        }

        var line;
        var matches;
        for ( i = 0; i < lines.length; i++ ) {
            line = lines[ i ];
            matches = line.match( /(\w+)=(.*)/i );
            if ( matches !== null ) {
                var key = matches[ 1 ],
                    value = matches[ 2 ];

                if ( key === 'FORMAT' )
                    info.format = value;
                else if ( key === 'EXPOSURE' )
                    info.exposure = parseFloat( value );
            }
        }

        // fill image resolution
        line = String.fromCharCode.apply( null, new Uint8Array( buf.subarray( size + 2, size2 ) ) );
        matches = line.match( /-Y (\d+) \+X (\d+)/ );
        info.width = parseInt( matches[ 2 ] );
        info.height = parseInt( matches[ 1 ] );
        info.scanlineWidth = parseInt( matches[ 2 ] );
        info.numScanlines = parseInt( matches[ 1 ] );

        info.size = size2 + 1;
        return info;
    }

    // Read a radiance .hdr file (http://radsite.lbl.gov/radiance/refer/filefmts.pdf)
    // Ported from http://www.graphics.cornell.edu/~bjw/rgbe.html
    osg.readHDRImage = function ( url, options ) {
        if ( options === undefined ) {
            options = {};
        }

        var img = {
            'data': null,
            'width': 0,
            'height': 0
        };

        // download .hdr file
        var xhr = new XMLHttpRequest();
        xhr.open( 'GET', url, true );
        xhr.responseType = 'arraybuffer';

        var defer = P.defer();
        xhr.onload = function ( /*ev*/) {
            if ( xhr.response ) {
                var bytes = new Uint8Array( xhr.response );

                var header = decodeHDRHeader( bytes );
                if ( header === false )
                    return;

                // initialize output buffer
                var data = new Uint8Array( header.width * header.height * 4 );
                var imgOffset = 0;

                if ( ( header.scanlineWidth < 8 ) || ( header.scanlineWidth > 0x7fff ) ) {
                    console.error( 'not rle compressed .hdr file' );
                    return;
                }

                // read in each successive scanline
                var scanlineBuffer = new Uint8Array( 4 * header.scanlineWidth );
                var readOffset = header.size;
                var numScanlines = header.numScanlines;
                while ( numScanlines > 0 ) {
                    var offset = 0;
                    var rgbe = [ bytes[ readOffset++ ], bytes[ readOffset++ ], bytes[ readOffset++ ], bytes[ readOffset++ ] ];
                    var buf = [ 0, 0 ];

                    if ( ( rgbe[ 0 ] !== 2 ) || ( rgbe[ 1 ] !== 2 ) || ( rgbe[ 2 ] & 0x80 ) ) {
                        console.error( 'this file is not run length encoded' );
                        return;
                    }

                    if ( ( ( rgbe[ 2 ] ) << 8 | rgbe[ 3 ] ) !== header.scanlineWidth ) {
                        console.error( 'wrong scanline width' );
                        return;
                    }

                    // read each of the four channels for the scanline into the buffer
                    var count;
                    for ( var i = 0; i < 4; i++ ) {
                        var offsetEnd = ( i + 1 ) * header.scanlineWidth;
                        while ( offset < offsetEnd ) {
                            buf[ 0 ] = bytes[ readOffset++ ];
                            buf[ 1 ] = bytes[ readOffset++ ];

                            if ( buf[ 0 ] > 128 ) {
                                // a run of the same value
                                count = buf[ 0 ] - 128;
                                if ( ( count === 0 ) || ( count > offsetEnd - offset ) ) {
                                    console.error( 'bad scanline data' );
                                    return;
                                }
                                while ( count-- > 0 )
                                    scanlineBuffer[ offset++ ] = buf[ 1 ];
                            } else {
                                // a non-run
                                count = buf[ 0 ];
                                if ( ( count === 0 ) || ( count > offsetEnd - offset ) ) {
                                    console.error( 'bad scanline data' );
                                    return;
                                }
                                scanlineBuffer[ offset++ ] = buf[ 1 ];

                                if ( --count > 0 ) {
                                    while ( count-- > 0 ) {
                                        scanlineBuffer[ offset++ ] = bytes[ readOffset++ ];
                                    }
                                }
                            }
                        }
                    }

                    // fill the image array
                    for ( i = 0; i < header.scanlineWidth; i++ ) {
                        data[ imgOffset++ ] = scanlineBuffer[ i ];
                        data[ imgOffset++ ] = scanlineBuffer[ i + header.scanlineWidth ];
                        data[ imgOffset++ ] = scanlineBuffer[ i + 2 * header.scanlineWidth ];
                        data[ imgOffset++ ] = scanlineBuffer[ i + 3 * header.scanlineWidth ];
                    }

                    numScanlines--;
                }

                // send deferred info
                img.data = data;
                img.width = header.width;
                img.height = header.height;
                defer.resolve( img );
            }
        };

        // async/defer
        xhr.send( null );
        return defer.promise;
    };

    var nbLoading = 0;
    var removeLoading = function () {
        nbLoading -= 1;
        if ( nbLoading === 0 ) {
            document.getElementById( 'loading' ).style.display = 'None';
            Viewer.getManipulator().computeHomePosition();
        }
    };
    var addLoading = function () {
        nbLoading += 1;
        document.getElementById( 'loading' ).style.display = 'Block';
    };

    function getShaderBackground() {
        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'attribute vec3 Vertex;',
            'attribute vec3 Normal;',
            'attribute vec2 TexCoord0;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'uniform mat4 NormalMatrix;',

            'varying vec3 osg_FragNormal;',
            'varying vec3 osg_FragEye;',
            'varying vec3 osg_FragVertex;',
            'varying vec2 osg_TexCoord0;',

            'void main(void) {',
            '  osg_FragVertex = Vertex;',
            '  osg_TexCoord0 = TexCoord0;',
            '  osg_FragEye = vec3(ModelViewMatrix * vec4(Vertex,1.0));',
            '  osg_FragNormal = vec3(NormalMatrix * vec4(Normal, 1.0));',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            '#define PI 3.14159',

            'uniform sampler2D Texture0;',
            'uniform float hdrExposure;',
            'uniform float hdrGamma;',

            'varying vec3 osg_FragNormal;',
            'varying vec3 osg_FragEye;',
            'varying vec3 osg_FragVertex;',
            'varying vec2 osg_TexCoord0;',

            // convert 8-bit RGB channels into floats using the common E exponent
            'vec3 decodeRGBE(vec4 rgbe) {',
            '  float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
            '  return rgbe.rgb * 255.0 * f;',
            '}',

            // apply some gamma correction (http://www.geeks3d.com/20101001/tutorial-gamma-correction-a-story-of-linearity/)
            'vec3 toneMapHDR(vec3 rgb) {',
            '  return pow(rgb * hdrExposure, 1.0 / vec3(hdrGamma));',
            '}',

            // fetch from environment sphere texture
            'vec4 textureSphere(sampler2D tex, vec3 n) {',
            '  float yaw = acos(n.y) / PI;',
            '  float pitch = (atan(n.x, n.z) + PI) / (2.0 * PI);',
            '  return texture2D(tex, vec2(pitch, yaw));',
            '}',

            'void main(void) {',
            '  vec3 normal = normalize(osg_FragVertex.xyz);',
            '  vec3 c = toneMapHDR(decodeRGBE(textureSphere(Texture0, normal)));',
            '  gl_FragColor = vec4(c, 1.0);',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    }

    function getShader() {
        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            'attribute vec3 Vertex;',
            'attribute vec3 Normal;',

            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'uniform mat4 NormalMatrix;',

            'varying vec3 osg_FragEye;',
            'varying vec3 osg_FragNormal;',
            'varying vec3 osg_FragNormalWorld;',
            'varying vec3 osg_FragLightDirection;',

            'void main(void) {',
            '  osg_FragEye = vec3(ModelViewMatrix * vec4(Vertex, 1.0));',
            '  osg_FragNormal = vec3(NormalMatrix * vec4(Normal, 0.0));',
            '  osg_FragNormalWorld = Normal;',
            '  osg_FragLightDirection = vec3(NormalMatrix * vec4(0.0, -1.0, 0.0, 1.0));',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            '#define PI 3.14159',

            'uniform sampler2D Texture0;',
            'uniform sampler2D Texture1;',
            'uniform float hdrExposure;',
            'uniform float hdrGamma;',
            'uniform mat4 CubemapTransform;',

            'varying vec3 osg_FragEye;',
            'varying vec3 osg_FragNormal;',
            'varying vec3 osg_FragNormalWorld;',
            'varying vec3 osg_FragLightDirection;',

            'vec3 cubemapReflectionVector(const in mat4 transform, const in vec3 view, const in vec3 normal)',
            '{',
            '  vec3 lv = reflect(view, normal);',
            '  lv = normalize(lv);',
            '  vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);',
            '  vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);',
            '  vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);',
            '  mat3 m = mat3(x,y,z);',
            '  return m*lv;',
            '}',

            // convert 8-bit RGB channels into floats using the common E exponent
            'vec3 decodeRGBE(vec4 rgbe) {',
            '  float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
            '  return rgbe.rgb * 255.0 * f;',
            '}',

            // apply some gamma correction (http://www.geeks3d.com/20101001/tutorial-gamma-correction-a-story-of-linearity/)
            'vec3 toneMapHDR(vec3 rgb) {',
            '  return pow(rgb * hdrExposure, 1.0 / vec3(hdrGamma));',
            '}',

            // fetch from environment sphere texture
            'vec4 textureSphere(sampler2D tex, vec3 n) {',
            '  float yaw = acos(n.y) / PI;',
            '  float pitch = (atan(n.x, n.z) + PI) / (2.0 * PI);',
            '  return texture2D(tex, vec2(pitch, yaw));',
            '}',

            'void main(void) {',
            '  vec3 normalWorld = normalize(osg_FragNormalWorld);',
            '  vec3 N = normalize(osg_FragNormal);',
            '  vec3 L = normalize(osg_FragLightDirection);',
            '  vec3 E = normalize(osg_FragEye);',
            '  vec3 R = cubemapReflectionVector(CubemapTransform, E, N);',

            '  float NdotL = dot(-N, L);',
            '  vec3 diffuse = toneMapHDR(decodeRGBE(textureSphere(Texture1, normalWorld)));',
            '  vec3 specular = toneMapHDR(decodeRGBE(textureSphere(Texture0, R)));',
            '  gl_FragColor = vec4(mix(diffuse, specular, 1.0), 1.0);',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    }

    function getEnvSphere( size, scene ) {
        // create the environment sphere
        //var geom = osg.createTexturedSphere(size, 32, 32);
        var geom = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size );
        geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
        geom.getOrCreateStateSet().setAttributeAndModes( getShaderBackground() );

        var cubemapTransform = osg.Uniform.createMatrix4( osg.Matrix.create(), 'CubemapTransform' );
        var mt = new osg.MatrixTransform();
        mt.setMatrix( osg.Matrix.makeRotate( -Math.PI / 2.0, 1, 0, 0, [] ) );
        mt.addChild( geom );
        var CullCallback = function () {
            this.cull = function ( node, nv ) {
                // overwrite matrix, remove translate so environment is always at camera origin
                osg.Matrix.setTrans( nv.getCurrentModelViewMatrix(), 0, 0, 0 );
                var m = nv.getCurrentModelViewMatrix();
                osg.Matrix.copy( m, cubemapTransform.getInternalArray() );
                return true;
            };
        };
        mt.setCullCallback( new CullCallback() );
        scene.getOrCreateStateSet().addUniform( cubemapTransform );

        var cam = new osg.Camera();

        cam.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
        cam.addChild( mt );


        // the update callback get exactly the same view of the camera
        // but configure the projection matrix to always be in a short znear/zfar range to not vary depend on the scene size
        var UpdateCallback = function () {
            this.update = function ( /*node, nv*/) {
                var rootCam = Viewer.getCamera();

                //rootCam.
                var info = {};
                osg.Matrix.getPerspective( rootCam.getProjectionMatrix(), info );
                var proj = [];
                osg.Matrix.makePerspective( info.fovy, info.aspectRatio, 1.0, 100.0, proj );
                cam.setProjectionMatrix( proj );
                cam.setViewMatrix( rootCam.getViewMatrix() );

                return true;
            };
        };
        cam.setUpdateCallback( new UpdateCallback() );

        scene.addChild( cam );

        return geom;
    }

    var getModel = function () {
        var root = new osg.MatrixTransform();
        osg.Matrix.makeRotate( Math.PI, 0, 0, 1, root.getMatrix() );
        addLoading();
        osgDB.readNodeURL( '../media/models/material-test/file.osgjs' ).then( function ( node ) {
            root.addChild( node );
            removeLoading();
        } );
        return root;
    };

    function readImageURL( url ) {
        var ext = url.split( '.' ).pop();
        if ( ext === 'hdr' )
            return osg.readHDRImage( url );

        return osgDB.readImageURL( url );
    }

    // change the environment maps (reflective included)
    // Images are 8-bit RGBE encoded based on the radiance file format
    // The example supports radiance .hdr files, but uses .png which contains the exact same information for better size and speed.
    function setEnvironment( name, background, ground ) {
        var textures = {
            'Alexs_Apartment': [ 'Alexs_Apt_2k.png', 'Alexs_Apt_Env.png' ],
            'Arches_E_PineTree': [ 'Arches_E_PineTree_3k.png', 'Arches_E_PineTree_Env.png' ],
            'GrandCanyon_C_YumaPoint': [ 'GCanyon_C_YumaPoint_3k.png', 'GCanyon_C_YumaPoint_Env.png' ],
            'Milkyway': [ 'Milkyway_small.png', 'Milkyway_Light.png' ],
            'Walk_Of_Fame': [ 'Mans_Outside_2k.png', 'Mans_Outside_Env.png' ]
        };
        var urls = textures[ name ];

        P.all( [
            readImageURL( 'textures/' + name + '/' + urls[ 0 ] ),
            readImageURL( 'textures/' + name + '/' + urls[ 1 ] )
        ] ).then( function ( images ) {
            var textureHigh = new osg.Texture();
            textureHigh.setImage( images[ 0 ] );
            if ( images[ 0 ].data ) {
                textureHigh.setTextureSize( images[ 0 ].width, images[ 0 ].height );
                textureHigh.setImage( images[ 0 ].data, osg.Texture.RGBA );
            }
            background.getOrCreateStateSet().setTextureAttributeAndModes( 0, textureHigh );
            background.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );

            var textureEnv = new osg.Texture();
            textureEnv.setImage( images[ 1 ] );
            if ( images[ 0 ].data ) {
                textureEnv.setTextureSize( images[ 0 ].width, images[ 0 ].height );
                textureEnv.setImage( images[ 0 ].data, osg.Texture.RGBA );
            }
            ground.getOrCreateStateSet().setTextureAttributeAndModes( 0, textureHigh );
            ground.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );
            ground.getOrCreateStateSet().setTextureAttributeAndModes( 1, textureEnv );
            ground.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'Texture1' ) );
        } );
    }

    function createScene() {
        var group = new osg.Node();

        // HDR parameters uniform
        var uniformCenter = osg.Uniform.createFloat1( 1, 'hdrExposure' );
        var uniformGamma = osg.Uniform.createFloat1( 2.2, 'hdrGamma' );

        var size = 500;
        var background = getEnvSphere( size, group );
        background.getOrCreateStateSet().addUniform( uniformCenter );
        background.getOrCreateStateSet().addUniform( uniformGamma );

        var ground = getModel();
        ground.getOrCreateStateSet().setAttributeAndModes( getShader() );
        ground.getOrCreateStateSet().addUniform( uniformCenter );
        ground.getOrCreateStateSet().addUniform( uniformGamma );

        // gui
        document.getElementById( 'rangeExposure' ).onchange = function () {
            uniformCenter.setFloat( parseFloat( this.value ) );
        };
        document.getElementById( 'rangeGamma' ).onchange = function () {
            uniformGamma.setFloat( parseFloat( this.value ) );
        };
        document.getElementById( 'texture' ).onchange = function () {
            setEnvironment( this.value, background, ground );
        };
        setEnvironment( 'Alexs_Apartment', background, ground );

        group.addChild( ground );
        return group;
    }

    var main = function () {
        //osg.ReportWebGLError = true;

        var canvas = document.getElementById( 'View' );

        var viewer;
        try {
            viewer = new osgViewer.Viewer( canvas, {
                antialias: true
            } );
            Viewer = viewer;
            viewer.init();
            var rotate = new osg.MatrixTransform();
            rotate.addChild( createScene() );
            viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
            viewer.setSceneData( rotate );
            viewer.setupManipulator();
            viewer.getManipulator().computeHomePosition();

            //viewer.getManipulator().setDistance(100.0);
            //viewer.getManipulator().setTarget([0,0,0]);

            viewer.run();


            var mousedown = function ( ev ) {
                ev.stopPropagation();
            };
            document.getElementById( 'explanation' ).addEventListener( 'mousedown', mousedown, false );

        } catch ( er ) {
            osg.log( 'exception in osgViewer ' + er );
        }
    };

    window.addEventListener( 'load', main, true );
} )();
