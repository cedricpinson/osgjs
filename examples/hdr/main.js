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

    var defer = osgDB.Promise.defer();
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

            img.data = data;
            img.width = header.width;
            img.height = header.height;
            defer.resolve(img);
        }
    }

    xhr.send(null);

    return defer.promise;
}

var Viewer;
var main = function() {
    //osg.ReportWebGLError = true;

    var canvas = document.getElementById("3DView");
    var w = window.innerWidth;
    var h = window.innerHeight;
    osg.log("size " + w + " x " + h );
    canvas.style.width = w;
    canvas.style.height = h;
    canvas.width = w;
    canvas.height = h;

    var stats = document.getElementById("Stats");

    var viewer;
    try {
        viewer = new osgViewer.Viewer(canvas, {antialias : true });
        Viewer = viewer;
        viewer.init();
        var rotate = new osg.MatrixTransform();
        rotate.addChild(createScene());
        viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
        viewer.setSceneData(rotate);
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();

        //viewer.getManipulator().setDistance(100.0);
        //viewer.getManipulator().setTarget([0,0,0]);
            
        viewer.run();


        var mousedown = function(ev) {
            ev.stopPropagation();
        };
        document.getElementById("explanation").addEventListener("mousedown", mousedown, false);

    } catch (er) {
        osg.log("exception in osgViewer " + er);
    }
};

function getShader()
{
    var vertexshader = [
        "",
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "attribute vec3 Vertex;",
        "attribute vec3 Normal;",
        "uniform mat4 ModelViewMatrix;",
        "uniform mat4 ProjectionMatrix;",
        "uniform mat4 NormalMatrix;",

        "varying vec3 osg_FragNormal;",
        "varying vec3 osg_FragEye;",
        
        "void main(void) {",
        "  osg_FragEye = vec3(ModelViewMatrix * vec4(Vertex,1.0));",
        "  osg_FragNormal = vec3(NormalMatrix * vec4(Normal, 1.0));",
        "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
        "}"
    ].join('\n');

    var fragmentshader = [
        "",
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "#define PI 3.14159",
        "uniform sampler2D Texture0;",
        "uniform float hdrExposure;",
        "uniform float hdrWidth;",
        "varying vec3 osg_FragNormal;",
        "varying vec3 osg_FragEye;",

        "vec3 decodeRGBE(vec4 rgbe) {",
        "  float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));",
        "  return rgbe.rgb * 255.0 * f;",
        "}",

        "void main(void) {",
        "  vec3 normal = normalize(osg_FragNormal);",
        "  vec3 eye = normalize(osg_FragEye);",
        "  vec3 r = reflect(eye, normal);",
        "  float m = 2.0 * sqrt(r.x * r.x + r.y * r.y + (r.z + 1.0) * (r.z + 1.0));",
        "  vec2 texCoord = vec2(r.x / m + 0.5, r.y / m + 0.5);",
        "  vec3 c = decodeRGBE(texture2D(Texture0, texCoord));",
        "  float fact = hdrExposure * (hdrExposure / hdrWidth + 1.0) / (hdrExposure + 1.0);",
        "  gl_FragColor = vec4(c * fact, 1.0);",
        "}",
        ""
    ].join('\n');

    var program = new osg.Program(
        new osg.Shader(gl.VERTEX_SHADER, vertexshader),
        new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

    return program;
}


function getShaderBackground()
{
    var vertexshader = [
        "",
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "attribute vec3 Vertex;",
        "attribute vec3 Normal;",
        "attribute vec2 TexCoord0;",
        "uniform mat4 ModelViewMatrix;",
        "uniform mat4 ProjectionMatrix;",
        "uniform mat4 NormalMatrix;",

        "varying vec3 osg_FragNormal;",
        "varying vec3 osg_FragEye;",
        "varying vec3 osg_FragVertex;",
        "varying vec2 osg_TexCoord0;",
        
        "void main(void) {",
        "  osg_FragVertex = Vertex;",
        "  osg_TexCoord0 = TexCoord0;",
        "  osg_FragEye = vec3(ModelViewMatrix * vec4(Vertex,1.0));",
        "  osg_FragNormal = vec3(NormalMatrix * vec4(Normal, 1.0));",
        "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
        "}"
    ].join('\n');

    var fragmentshader = [
        "",
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "uniform sampler2D Texture0;",
        "uniform float hdrExposure;",
        "uniform float hdrWidth;",
        "varying vec3 osg_FragNormal;",
        "varying vec3 osg_FragEye;",
        "varying vec3 osg_FragVertex;",
        "varying vec2 osg_TexCoord0;",
        "varying vec2 vSphereCoord;",

        "vec3 decodeRGBE(vec4 rgbe) {",
        "  float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));",
        "  return rgbe.rgb * 255.0 * f;",
        "}",

        "void main(void) {",
        "  vec3 c = decodeRGBE(texture2D(Texture0, osg_TexCoord0));",
        "  float fact = hdrExposure * (hdrExposure / hdrWidth + 1.0) / (hdrExposure + 1.0);",
        "  gl_FragColor = vec4(c * fact, 1.0);",
        "}",
        ""
    ].join('\n');

    var program = new osg.Program(
        new osg.Shader(gl.VERTEX_SHADER, vertexshader),
        new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

    return program;
}

var nbLoading = 0;
var loaded = [];
var removeLoading = function(node, child) {
    nbLoading -=1;
    loaded.push(child);
    if (nbLoading === 0) {
        document.getElementById("loading").style.display = 'None';
        Viewer.getManipulator().computeHomePosition();
    }
};
var addLoading = function() {
    nbLoading+=1;
    document.getElementById("loading").style.display = 'Block';
};

var getModel = function(func) {
    var node = new osg.MatrixTransform();
    node.setMatrix(osg.Matrix.makeRotate(-Math.PI/2, 1,0,0, []));

    var loadModel = function(url, cbfunc) {
        osg.log("loading " + url);
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onreadystatechange = function (aEvt) {
            if (req.readyState == 4) {
                if(req.status == 200) {
                    osgDB.Promise.when(osgDB.parseSceneGraph(JSON.parse(req.responseText))).then(function(child) {
                            if (cbfunc) {
                                cbfunc(child);
                            }
                        node.addChild(child);
                        removeLoading(node, child);
                        osg.log("success " + url);
                    });
                } else{
                    removeLoading(node, child);
                    osg.log("error " + url);
                }
            }
        };
        req.send(null);
        addLoading();
    };
    
    loadModel('monkey.osgjs');
    return node;
};


// change the environment maps (reflective included)
function setEnvironment(name, background, ground) {
    var textures = {
        'Alexs_Apartment': ['Alexs_Apt_2k.hdr', 'Alexs_Apt_Env.hdr'],
        'Arches_E_PineTree': ['Arches_E_PineTree_3k.hdr', 'Arches_E_PineTree_Env.hdr'],
        'GrandCanyon_C_YumaPoint': ['GCanyon_C_YumaPoint_3k.hdr', 'GCanyon_C_YumaPoint_Env.hdr'],
        'Walk_Of_Fame': ['Mans_Outside_2k.hdr', 'Mans_Outside_Env.hdr']
    };
    var urls = textures[name];

    osgDB.Promise.all([
            osg.readHDRImage('textures/' + name + '/' + urls[0]),
            osg.readHDRImage('textures/' + name + '/' + urls[1])]).then(function(images) {
            var texture = new osg.Texture();
            texture.setTextureSize(images[0].width, images[0].height);
            texture.setImage(images[0].data, osg.Texture.RGBA);
            background.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
            background.getOrCreateStateSet().addUniform(osg.Uniform.createInt1(0,'Texture0'));

            var texture = new osg.Texture();
            texture.setTextureSize(images[1].width, images[1].height);
            texture.setImage(images[1].data, osg.Texture.RGBA);
            ground.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
            ground.getOrCreateStateSet().addUniform(osg.Uniform.createInt1(0,'Texture0'));
            });
}

function createScene() 
{
    var group = new osg.Node();

    var uniformCenter = osg.Uniform.createFloat1(1, 'hdrExposure');
    var uniformWidth = osg.Uniform.createFloat1(0.5, 'hdrWidth');

    var background = osg.createTexturedSphere(500, 32, 32);
    background.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace('DISABLE'));
    background.getOrCreateStateSet().setAttributeAndModes(getShaderBackground());
    background.getOrCreateStateSet().addUniform(uniformCenter);
    background.getOrCreateStateSet().addUniform(uniformWidth);

    var ground = getModel();
    ground.getOrCreateStateSet().setAttributeAndMode(getShader());
    ground.getOrCreateStateSet().addUniform(uniformCenter);
    ground.getOrCreateStateSet().addUniform(uniformWidth);

    // gui
    document.getElementById('rangeExposure').onchange = function() {
	    uniformCenter.set(parseFloat(this.value));
    }
    document.getElementById('rangeWidth').onchange = function() {
	    uniformWidth.set(parseFloat(this.value));
    }
    document.getElementById('texture').onchange = function() {
	    setEnvironment(this.value, background, ground);
    }


    setEnvironment('Alexs_Apartment', background, ground);

    ground.addChild(background);
    group.addChild(ground);
    return group;
}



window.addEventListener("load", main ,true);
