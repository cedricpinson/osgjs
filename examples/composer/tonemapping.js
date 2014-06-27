//-------------------------------------------------------

/** -*- compile-command: "jslint-cli main.js" -*-
 *
 *  Copyright (C) 2010-2011 Cedric Pinson
 *
 *                  GNU LESSER GENERAL PUBLIC LICENSE
 *                      Version 3, 29 June 2007
 *
 * Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>
 * Everyone is permitted to copy and distribute verbatim copies
 * of this license document, but changing it is not allowed.
 *
 * This version of the GNU Lesser General Public License incorporates
 * the terms and conditions of version 3 of the GNU General Public
 * License
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *  Clément Léger <clement.leger@haxx.es>
 *
 */

function getPostSceneToneMapping() {

    var scenes = {
        'Alexs_Apartment': 'Alexs_Apt_2k.hdr',
        'Arches_E_PineTree': 'Arches_E_PineTree_3k.hdr',
        'GrandCanyon_C_YumaPoint': 'GCanyon_C_YumaPoint_3k.hdr',
        'Milkyway': 'Milkyway_small.hdr',
        'Walk_Of_Fame': 'Mans_Outside_2k.hdr'
    };

    var cachedScenes = [];

    var currentSceneTexture = osg.Texture.createHDRFromURL('../hdr/textures/Alexs_Apartment/Alexs_Apt_2k.hdr');

    var methods = ['Simple', 'Reinhardt', 'Filmic'];

    // HDR parameters uniform
    var gamma = osg.Uniform.createFloat1(2.2, 'gamma');
    var method = osg.Uniform.createInt1(2, 'method');
    var exposure = osg.Uniform.createFloat1(1, 'exposure');
    var middleGrey = osg.Uniform.createFloat1(0.36, 'middleGrey');
    var avgLogLum = osg.Uniform.createFloat1(0.54, 'avgLogLum');
    var whitePoint = osg.Uniform.createFloat1(3, 'whitePoint');

    var toneMappingFilter = new osgUtil.Composer.Filter.Custom(
        [
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',

        'varying vec2 FragTexCoord0;',
        'uniform sampler2D input_texture;',

        'uniform int method;',
        'uniform float gamma;',

        'uniform float exposure;',

        'uniform float middleGrey;',
        'uniform float avgLogLum;', // This should really be computed from the scene
        'uniform float whitePoint;', // This can be computed from the scene as max lum value

        // convert 8-bit RGB channels into floats using the common E exponent
        "vec3 decodeRGBE(vec4 rgbe) {",
        "  float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));",
        "  return rgbe.rgb * 255.0 * f;",
        "}",

        'vec3 toneMapReinhardt(vec3 lum) {',
          
            'lum *= avgLogLum / middleGrey;',
            'return lum *  (1.0 / ( lum + 1.0)) * ( 1.0 + (lum / whitePoint)) ;',
        '}',
        'vec3 toneMapFilmic(vec3 texColor)',
        '{',
            'vec3 x = max(vec3(0), texColor - 0.004);',
            'return (x * (6.2 * x + 0.5) ) / ( x * (6.2 * x + 1.7) + 0.06);',
        '}',

        // Color spaces conversions from
        // http://www.chilliant.com/rgb2hsv.html
        'vec3 HUEtoRGB(in float H)',
        '{',
           ' float R = abs(H * 6.0 - 3.0) - 1.0;',
            'float G = 2.0 - abs(H * 6.0 - 2.0);',
            'float B = 2.0 - abs(H * 6.0 - 4.0);',
           ' return clamp(vec3(R,G,B), 0.0, 1.0);',
        '}',
        'vec3 HSLtoRGB(in vec3 HSL)',
        '{',
            'vec3 RGB = HUEtoRGB(HSL.x);',
            'float C = (1.0 - abs(2.0 * HSL.z - 1.0)) * HSL.y;',
            'return (RGB - 0.5) * C + HSL.z;',
        '}',
        'float Epsilon = 1e-10;',
        'vec3 RGBtoHCV(in vec3 RGB)',
        '{',
            // Based on work by Sam Hocevar and Emil Persson
            'vec4 P = (RGB.g < RGB.b) ? vec4(RGB.bg, -1.0, 2.0/3.0) : vec4(RGB.gb, 0.0, -1.0/3.0);',
            'vec4 Q = (RGB.r < P.x) ? vec4(P.xyw, RGB.r) : vec4(RGB.r, P.yzx);',
            'float C = Q.x - min(Q.w, Q.y);',
            'float H = abs((Q.w - Q.y) / (6.0 * C + Epsilon) + Q.z);',
            'return vec3(H, C, Q.x);',
        '}',
        'vec3 RGBtoHSL(in vec3 RGB)',
        '{',
            'vec3 HCV = RGBtoHCV(RGB);',
            'float L = HCV.z - HCV.y * 0.5;',
            'float S = HCV.y / (1.0 - abs(L * 2.0 - 1.0) + Epsilon);',
            'return vec3(HCV.x, S, L);',
        '}',
        'void main() {',

            'vec3 texel = decodeRGBE(texture2D(input_texture, FragTexCoord0));',
            // 'texel = RGBtoHSL(texel);',
            // 'float lum = texel.z;',
            'if (method == 1)',
            '{',
                'texel *= exposure;',
                'texel = pow(texel, vec3(1.0 / gamma));',
            '}',
            'else if (method == 2)',
            '{',
                'texel = toneMapReinhardt(texel);',
                'texel = pow(texel, vec3(1.0 / gamma));',
            '}',
            'else if (method == 3)',
                'texel = toneMapFilmic(texel);',
            // 'texel.z = lum;',
            // 'texel = HSLtoRGB(texel);',


            'gl_FragColor = vec4(texel, 1.0);',
            
        '}',
        ].join('\n'),
        {
            'input_texture': currentSceneTexture,
            'method': method,
            'gamma': gamma,
            'exposure': exposure,
            'middleGrey': middleGrey,
            'avgLogLum': avgLogLum,
            'whitePoint': whitePoint
        });

    function setSceneTexture(scene_file) {

        // On met en cache lors du premier chargement
        if (cachedScenes[scene_file] === undefined)
            cachedScenes[scene_file] = osg.Texture.createHDRFromURL('../hdr/textures/' + scene_file + '/' + scenes[scene_file]);

        currentSceneTexture = cachedScenes[scene_file];
        toneMappingFilter.getStateSet().setTextureAttributeAndMode(0, currentSceneTexture);
    };

    var effect = {

        name: 'Tone Mapping',

        buildComposer: function(finalTexture) {

            var composer = new osgUtil.Composer();
            composer.addPass(toneMappingFilter, finalTexture);
            return composer;
        },

        buildGui: function(mainGui) {

            var folder = mainGui.addFolder(this.name);

            var param = {
                'scene': Object.keys(scenes)[0],
                'method': methods[method.get()[0]-1],
                'gamma': gamma.get()[0],
                'exposure': exposure.get()[0],
                'middleGrey': middleGrey.get()[0],
                'avgLogLum': avgLogLum.get()[0],
                'whitePoint': whitePoint.get()[0],
            };

            var sceneCtrl = folder.add(param, 'scene', Object.keys(scenes));
            sceneCtrl.onChange(function (value) {
                setSceneTexture(value);
            } );

            var methodCtrl = folder.add(param, 'method', methods);
            methodCtrl.onChange(function (value) {
                method.set(methods.indexOf(value) + 1);
            } );
      
            var gammaCtrl = folder.add(param, 'gamma', 0, 3);
            gammaCtrl.onChange(function (value) { gamma.set(value) } );
            
            var simple = folder.addFolder('Simple');
            var reinhardt = folder.addFolder('Reinhardt');

            var exposureCtrl = simple.add(param, 'exposure', 0, 2);
            exposureCtrl.onChange(function (value) { exposure.set(value) } );
           
            var middleGreyCtrl = reinhardt.add(param, 'middleGrey', 0.01, 1);
            middleGreyCtrl.onChange(function (value) { middleGrey.set(value) } );
         
            var avgLogLumCtrl = reinhardt.add(param, 'avgLogLum', 0, 1);
            avgLogLumCtrl.onChange(function (value) { avgLogLum.set(value) } );
                 
            var whitePointCtrl = reinhardt.add(param, 'whitePoint', 0.01, 10);
            whitePointCtrl.onChange(function (value) { whitePoint.set(value) } );
        
        }
    };

    return effect;
}

function decodeHDRHeader(buf) {
    var info = {exposure: 1.0};

    // find header size
    var size = -1, size2 = -1;
    for (var i = 0; i < buf.length - 1; i++) {
        if (buf[i] == 10 && buf[i + 1] == 10) {
            size = i;
            break;
        }
    }
    for (var i = size + 2; i < buf.length - 1; i++) {
        if (buf[i] == 10) {
            size2 = i;
            break;
        }
    }

    // convert header from binary to text lines
    var header = String.fromCharCode.apply(null, new Uint8Array(buf.subarray(0, size))); // header is in text format
    var lines = header.split("\n");
    if (lines[0] != "#?RADIANCE") {
        console.error("Invalid HDR image.");
        return false;
    }
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var matches = line.match(/(\w+)=(.*)/i);
        if (matches != null) {
            var key = matches[1],
                value = matches[2];

            if (key == "FORMAT")
                info.format = value;
            else if (key == "EXPOSURE")
                info.exposure = parseFloat(value);
        }
    }

    // fill image resolution
    var line = String.fromCharCode.apply(null, new Uint8Array(buf.subarray(size + 2, size2)));
    var matches = line.match(/-Y (\d+) \+X (\d+)/);
    info.width = parseInt(matches[2]);
    info.height = parseInt(matches[1]);
    info.scanline_width = parseInt(matches[2]);
    info.num_scanlines = parseInt(matches[1]);

    info.size = size2 + 1;
    return info;
}

osg.Texture.createHDRFromURL = function ( imageSource, format ) {
    var texture = new osg.Texture();
    Q( readImageURL( imageSource ) ).then(
        function ( img ) {
            texture.setImage( img, format );
            if(img.data) {
                texture.setTextureSize(img.width, img.height);
                texture.setImage(img.data, osg.Texture.RGBA);
            }
        }
    );
    return texture;
};

// Read a radiance .hdr file (http://radsite.lbl.gov/radiance/refer/filefmts.pdf)
// Ported from http://www.graphics.cornell.edu/~bjw/rgbe.html
osg.readHDRImage = function(url, options) {
    if (options === undefined) {
        options = {};
    }

    var img = {
        'data': null,
        'width': 0,
        'height': 0
    };

    // download .hdr file
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = "arraybuffer";

    var defer = Q.defer();
    xhr.onload = function (ev) {
        if (xhr.response) {
            var bytes = new Uint8Array(xhr.response);

            var header = decodeHDRHeader(bytes);
            if (header == false)
                return;

            // initialize output buffer
            var data = new Uint8Array(header.width * header.height * 4);
            var img_offset = 0;

            if ((header.scanline_width < 8)||(header.scanline_width > 0x7fff)) {
                console.error('not rle compressed .hdr file');
                return;
            }

            // read in each successive scanline
            var scanline_buffer = new Uint8Array(4 * header.scanline_width);
            var read_offset = header.size;
            var num_scanlines = header.num_scanlines;
            while (num_scanlines > 0) {
                var offset = 0;
                var rgbe = [bytes[read_offset++], bytes[read_offset++], bytes[read_offset++], bytes[read_offset++]];
                var buf = [0, 0];

                if ((rgbe[0] != 2) || (rgbe[1] != 2) || (rgbe[2] & 0x80)) {
                    console.error('this file is not run length encoded');
                    return;
                }

                if (((rgbe[2]) << 8 | rgbe[3]) != header.scanline_width) {
                    console.error('wrong scanline width');
                    return;
                }

                // read each of the four channels for the scanline into the buffer
                for (var i=0;i<4;i++) {
                    var offset_end = (i + 1) * header.scanline_width;
                    while (offset < offset_end) {
                        buf[0] = bytes[read_offset++];
                        buf[1] = bytes[read_offset++];

                        if (buf[0] > 128) {
                            // a run of the same value
                            count = buf[0] - 128;
                            if ((count == 0) || (count > offset_end - offset)) {
                                console.error('bad scanline data');
                                return;
                            }
                            while (count-- > 0)
                                scanline_buffer[offset++] = buf[1];
                        } else {
                            // a non-run
                            count = buf[0];
                            if ((count == 0) || (count > offset_end - offset)) {
                                console.error('bad scanline data');
                                return;
                            }
                            scanline_buffer[offset++] = buf[1];

                            if (--count > 0) {
                                while (count-- > 0) {
                                    scanline_buffer[offset++] = bytes[read_offset++];
                                }
                            }
                        }
                    }
                }

                // fill the image array
                for (var i = 0; i < header.scanline_width; i++) {
                    data[img_offset++] = scanline_buffer[i];
                    data[img_offset++] = scanline_buffer[i + header.scanline_width];
                    data[img_offset++] = scanline_buffer[i + 2 * header.scanline_width];
                    data[img_offset++] = scanline_buffer[i + 3 * header.scanline_width];
                }

                num_scanlines--;
            }

            // send deferred info
            img.data = data;
            img.width = header.width;
            img.height = header.height;
            defer.resolve(img);
        }
    }

    // async/defer
    xhr.send(null);
    return defer.promise;
}

function readImageURL(url) {
    var ext = url.split('.').pop();
    if(ext == "hdr")
        return osg.readHDRImage(url);

    return osgDB.readImageURL(url);
}
