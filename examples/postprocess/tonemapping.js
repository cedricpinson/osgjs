( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgUtil = OSG.osgUtil;
    var osgDB = OSG.osgDB;

    /*
        This filter is used to 'correctly' render HDR images
        Monitors's output range is limited (LDR, Low Dynamic Range) so
        they can't directly display HDR (High Dynamic Range) images.
        To do this we modify the range of the image by 'mapping' it to
        LDR and try to conserve as much detail as possible in the process.
    */
    window.getPostSceneToneMapping = function () {

        var scenes = {
            'Alexs_Apartment': 'Alexs_Apt_2k.hdr',
            'Arches_E_PineTree': 'Arches_E_PineTree_3k.hdr',
            'GrandCanyon_C_YumaPoint': 'GCanyon_C_YumaPoint_3k.hdr',
            'Milkyway': 'Milkyway_small.hdr',
            'Walk_Of_Fame': 'Mans_Outside_2k.hdr',
            'PaperMill_Ruins_E': 'PaperMill_E_3k.hdr',
            'Tropical_Ruins': 'TropicalRuins_3k.hdr'
        };

        var cachedScenes = [];

        var currentSceneTexture = osg.Texture.createHDRFromURL( '../hdr/textures/Alexs_Apartment/Alexs_Apt_2k.hdr' );
        currentSceneTexture.addApplyTexImage2DCallback( function () {
            console.log( 'sceneTexture loaded' );
            lumTexture.dirtyMipmap();
        } );

        var lumTexture = new osg.Texture();
        lumTexture.setTextureSize( 1024, 1024 );
        lumTexture.setMinFilter( osg.Texture.LINEAR_MIPMAP_LINEAR );

        var methods = [ 'None', 'Reinhardt', 'Filmic' ];

        // HDR parameters uniform
        var gamma = osg.Uniform.createFloat1( 2.2, 'gamma' );
        var method = osg.Uniform.createInt1( 2, 'method' );
        var exposure = osg.Uniform.createFloat1( 1, 'exposure' );
        var brightness = osg.Uniform.createFloat( 0.0, 'brightness' );
        var contrast = osg.Uniform.createFloat( 0.0, 'contrast' );
        var saturation = osg.Uniform.createFloat( 1.0, 'saturation' );
        var middleGrey = osg.Uniform.createFloat1( 0.36, 'middleGrey' );
        var locality = osg.Uniform.createFloat1( 11.0, 'locality' );
        var whitePoint = osg.Uniform.createFloat1( 10, 'whitePoint' );

        var toneMappingFilter = new osgUtil.Composer.Filter.Custom(
            [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                'varying vec2 FragTexCoord0;',
                'uniform sampler2D input_texture;',
                'uniform sampler2D lum_texture;',

                'uniform int method;',
                'uniform float gamma;',
                'uniform float exposure;',
                'uniform float brightness;',
                'uniform float saturation;',
                'uniform float contrast;',

                'uniform float middleGrey;',
                'uniform float whitePoint;', // This can be computed from the scene as max lum value
                'uniform float locality;', // Mipmap level to fetch from the luminance texture

                // RGB / Yxy color spaces conversions from:
                // http://content.gpwiki.org/D3DBook:High-Dynamic_Range_Rendering#Luminance_Transform
                'vec3 RGB2Yxy(vec3 rgb) {',
                '    mat3 RGB2XYZ;',
                '    RGB2XYZ[0] = vec3(0.5141364, 0.3238786, 0.16036376);',
                '    RGB2XYZ[1] = vec3(0.265068, 0.67023428, 0.06409157);',
                '    RGB2XYZ[2] = vec3(0.0241188, 0.1228178, 0.84442666);',
                '    vec3 XYZ = RGB2XYZ * rgb; ',
                '    vec3 Yxy = XYZ;',
                '    Yxy.gb = XYZ.rg / dot(vec3(1.0), XYZ.rgb);',
                '    return Yxy;',
                '}',

                'vec3 Yxy2RGB(vec3 Yxy) {',
                '    vec3 XYZ;',
                '    XYZ.r = Yxy.r * Yxy.g / Yxy. b; ',
                '    XYZ.g = Yxy.r;',
                '    XYZ.b = Yxy.r * (1.0 - Yxy.g - Yxy.b) / Yxy.b;',
                '    mat3 XYZ2RGB;',
                '    XYZ2RGB[0] = vec3(2.5651,-1.1665,-0.3986);',
                '    XYZ2RGB[1] = vec3(-1.0217, 1.9777, 0.0439);',
                '    XYZ2RGB[2] = vec3(0.0753, -0.2543, 1.1892);',
                '    return XYZ2RGB * XYZ;',
                '}',

                // convert 8-bit RGB channels into floats using the common E exponent
                'vec3 decodeRGBE(vec4 rgbe) {',
                '   float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
                '   return rgbe.rgb * 255.0 * f;',
                '}',
                '/* Original Reinhard paper: http://www.cs.utah.edu/~reinhard/cdrom/tonemap.pdf',
                'First we "calibrate" the middle luminance of the scene by applying to all luminance values',
                'a ratio between a chosen middle luminance and the computed average luminance of the scene',
                'This luminance is then divided by (luminance + 1) in order to scale down only the high luminance values',
                'With this scaling, high luminances converge under 1.0, so we add another parameter "whitepoint"',
                'to allow high values to go above 1.0 and burn out',
                '*/',
                'float toneMapReinhardt(float lum, float avgLum) {',
                '   lum *= middleGrey / avgLum;',
                '   return (lum + ((lum * lum) / (whitePoint * whitePoint)) ) / (lum + 1.0);',
                '}',
                '// Filmic curve from: http://filmicgames.com/archives/75',
                'vec3 toneMapFilmic(vec3 texColor) {',
                '   vec3 x = max(vec3(0), texColor - 0.004);',
                '   return (x * (6.2 * x + 0.5) ) / ( x * (6.2 * x + 1.7) + 0.06);',
                '}',

                'void main() {',
                '   float avgLum = texture2D(lum_texture, FragTexCoord0, locality).r;',

                '   vec3 texel = decodeRGBE(texture2D(input_texture, FragTexCoord0));',
                '   // We do the tonemapping on the Yxy luminance to preserve colors',
                '   vec3 Yxy = RGB2Yxy(texel);',
                '',
                '   if (method == 1) {',
                '      texel *= exposure;',
                '      texel = pow(texel, vec3(1.0 / gamma));',
                '   }',
                '   else if (method == 2) {',
                '      Yxy.r = toneMapReinhardt(Yxy.r, avgLum);',
                '      texel = pow(Yxy2RGB(Yxy), vec3(1.0 / gamma));',
                '   }',
                '   else if (method == 3)',
                '       texel = toneMapFilmic(texel); // Gamma included in the curve',

                '   texel = clamp(texel, 0.0, 1.0);',
                '   float luminance = dot(texel * (1.0 + brightness), vec3(0.2126, 0.7152, 0.0722));',
                '   texel = mix(vec3(luminance), texel * (1.0 + brightness), vec3(saturation));',
                '   if (contrast > 0.0) {',
                '       texel.rgb = (texel.rgb - 0.5) / (1.0 - contrast) + 0.5;',
                '   } else {',
                '       texel.rgb = (texel.rgb - 0.5) * (1.0 + contrast) + 0.5;',
                '   }',

                '   gl_FragColor = vec4(texel, 1.0);',
                '    //gl_FragColor = vec4(vec3(avgLum), 1.0);',

                '}',
            ].join( '\n' ), {
                'input_texture': currentSceneTexture,
                'lum_texture': lumTexture,
                'method': method,
                'gamma': gamma,
                'exposure': exposure,
                'brightness': brightness,
                'contrast': contrast,
                'saturation': saturation,
                'locality': locality,
                'middleGrey': middleGrey,
                'whitePoint': whitePoint
            } );

        var luminanceComputeFilter = new osgUtil.Composer.Filter.Custom(
            [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                '#define USE_LINEAR_SPACE 1',

                'varying vec2 FragTexCoord0;',
                'uniform sampler2D input_texture;',

                // convert 8-bit RGB channels into floats using the common E exponent
                'vec3 decodeRGBE(vec4 rgbe) {',
                '   float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
                '   return rgbe.rgb * 255.0 * f;',
                '}',

                // Definition of luminance from http://en.wikipedia.org/wiki/Luma_%28video%29
                'float calcLuminance(vec3 pixel) {',
                '   #ifdef USE_LINEAR_SPACE',
                '      pixel = pow(pixel, vec3(2.2));',
                '      return pow(max(dot(pixel, vec3(0.2126, 0.7152, 0.0722)), 0.001), 1.0/2.2);',
                '   #else',
                '       return max(dot(pixel, vec3(0.2126, 0.7152, 0.0722)), 0.001);',
                '   #endif',
                '}',

                'void main() {',
                '   // TODO: Use log on luminance to decrease the influence of small bright spots',
                '   vec3 texel = decodeRGBE(texture2D(input_texture, FragTexCoord0));',
                '   gl_FragColor = vec4(vec3(calcLuminance(texel)), 1.0);',
                '}',

            ].join( '\n' ), {
                'input_texture': currentSceneTexture
            }
        );

        function setSceneTexture( sceneFile ) {

            // On met en cache lors du premier chargement
            if ( cachedScenes[ sceneFile ] === undefined ) {
                cachedScenes[ sceneFile ] = osg.Texture.createHDRFromURL( '../hdr/textures/' + sceneFile + '/' + scenes[ sceneFile ] );
                // On attends la fin du chargement de la texture pour générer la mipmap chain
                cachedScenes[ sceneFile ].addApplyTexImage2DCallback( function () {
                    lumTexture.dirtyMipmap();
                    console.log( 'sceneTexture loaded from cache' );
                } );
            } else {
                // On flag la lumTexture pour regénérer la mipmap chain
                lumTexture.dirtyMipmap();
                console.log( 'sceneTexture loaded' );
            }
            currentSceneTexture = cachedScenes[ sceneFile ];
            toneMappingFilter.getStateSet().setTextureAttributeAndModes( 0, currentSceneTexture );
            luminanceComputeFilter.getStateSet().setTextureAttributeAndModes( 0, currentSceneTexture );
        }

        var effect = {

            name: 'Tone Mapping',
            needCommonCube: false,

            buildComposer: function ( finalTexture ) {

                var composer = new osgUtil.Composer();
                composer.addPass( luminanceComputeFilter, lumTexture );
                composer.addPass( toneMappingFilter, finalTexture );
                composer.build();
                return composer;
            },

            buildGui: function ( mainGui ) {

                var folder = mainGui.addFolder( this.name );
                folder.open();
                var param = {
                    'scene': Object.keys( scenes )[ 0 ],
                    'tonemapping': methods[ method.getInternalArray()[ 0 ] - 1 ],
                    'gamma': gamma.getInternalArray()[ 0 ],
                    'exposure': exposure.getInternalArray()[ 0 ],
                    'brightness': brightness.getInternalArray()[ 0 ],
                    'contrast': contrast.getInternalArray()[ 0 ],
                    'saturation': saturation.getInternalArray()[ 0 ],
                    'locality': locality.getInternalArray()[ 0 ],
                    'middleGrey': middleGrey.getInternalArray()[ 0 ],
                    'whitePoint': whitePoint.getInternalArray()[ 0 ]
                };

                var sceneCtrl = folder.add( param, 'scene', Object.keys( scenes ) );
                sceneCtrl.onChange( function ( value ) {
                    setSceneTexture( value );
                } );

                var exposureCtrl = folder.add( param, 'exposure', 0.0, 2.0 );
                exposureCtrl.onChange( function ( value ) {
                    exposure.setFloat( value );
                } );

                var brightnessCtrl = folder.add( param, 'brightness', -2.0, 2.0 );
                brightnessCtrl.onChange( function ( value ) {
                    brightness.setFloat( value );
                } );

                var contrastCtrl = folder.add( param, 'contrast', -1.0, 1.0 );
                contrastCtrl.onChange( function ( value ) {
                    contrast.setFloat( value );
                } );

                var saturationCtrl = folder.add( param, 'saturation', 0.0, 5.0 );
                saturationCtrl.onChange( function ( value ) {
                    saturation.setFloat( value );
                } );

                var gammaCtrl = folder.add( param, 'gamma', 0, 3 );
                gammaCtrl.onChange( function ( value ) {
                    gamma.setFloat( value );
                } );

                var methodCtrl = folder.add( param, 'tonemapping', methods );
                methodCtrl.onChange( function ( value ) {
                    method.setFloat( methods.indexOf( value ) + 1 );
                } );

                var reinhardt = folder.addFolder( 'Reinhardt' );

                var middleGreyCtrl = reinhardt.add( param, 'middleGrey', 0.01, 1 );
                middleGreyCtrl.onChange( function ( value ) {
                    middleGrey.setFloat( value );
                } );

                var localityCtrl = reinhardt.add( param, 'locality', 0.0, 11.0 );
                localityCtrl.onChange( function ( value ) {
                    locality.setFloat( value );
                } );

                var whitePointCtrl = reinhardt.add( param, 'whitePoint', 0.01, 10 );
                whitePointCtrl.onChange( function ( value ) {
                    whitePoint.setFloat( value );
                } );

                mainGui.remember( param );
            }
        };

        return effect;
    };

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
            if ( matches != null ) {
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

    function readImageURL( url ) {
        var ext = url.split( '.' ).pop();
        if ( ext === 'hdr' )
            return osg.readHDRImage( url );

        return osgDB.readImageURL( url );
    }

    osg.Texture.createHDRFromURL = function ( imageSource, format ) {
        var texture = new osg.Texture();
        readImageURL( imageSource ).then( function ( img ) {
            texture.setImage( img, format );
            if ( img.data ) {
                texture.setTextureSize( img.width, img.height );
                texture.setImage( img.data, osg.Texture.RGBA );
            }
        } );
        return texture;
    };

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
        xhr.onload = function () {
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
                    for ( var i = 0; i < 4; i++ ) {
                        var offsetEnd = ( i + 1 ) * header.scanlineWidth;
                        var count;
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
} )();
