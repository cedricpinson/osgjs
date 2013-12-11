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
 *
 */



var main = function() {
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
        viewer = new osgViewer.Viewer(canvas, {antialias : true, alpha: true });
        viewer.init();
        var rotate = new osg.MatrixTransform();
        rotate.addChild(createScene());
        viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
        viewer.setSceneData(rotate);
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();

        viewer.run();

        var mousedown = function(ev) {
            ev.stopPropagation();
        };
        document.getElementById("explanation").addEventListener("mousedown", mousedown, false);

    } catch (er) {
        osg.log("exception in osgViewer " + er);
        alert("exception in osgViewer " + er);
    }
};

var getNoiseFunction = function() {
    var noise = [
        "//",
        "// Description : Array and textureless GLSL 2D/3D/4D simplex ",
        "//               noise functions.",
        "//      Author : Ian McEwan, Ashima Arts.",
        "//  Maintainer : ijm",
        "//     Lastmod : 20110822 (ijm)",
        "//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.",
        "//               Distributed under the MIT License. See LICENSE file.",
        "//               https://github.com/ashima/webgl-noise",
        "// ",
        "",
        "vec3 mod289(vec3 x) {",
        "  return x - floor(x * (1.0 / 289.0)) * 289.0;",
        "}",
        "",
        "vec4 mod289(vec4 x) {",
        "  return x - floor(x * (1.0 / 289.0)) * 289.0;",
        "}",
        "",
        "vec4 permute(vec4 x) {",
        "     return mod289(((x*34.0)+1.0)*x);",
        "}",
        "",
        "vec4 taylorInvSqrt(vec4 r)",
        "{",
        "  return 1.79284291400159 - 0.85373472095314 * r;",
        "}",
        "",
        "float snoise(vec3 v)",
        "  { ",
        "  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;",
        "  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);",
        "",
        "// First corner",
        "  vec3 i  = floor(v + dot(v, C.yyy) );",
        "  vec3 x0 =   v - i + dot(i, C.xxx) ;",
        "",
        "// Other corners",
        "  vec3 g = step(x0.yzx, x0.xyz);",
        "  vec3 l = 1.0 - g;",
        "  vec3 i1 = min( g.xyz, l.zxy );",
        "  vec3 i2 = max( g.xyz, l.zxy );",
        "",
        "  //   x0 = x0 - 0.0 + 0.0 * C.xxx;",
        "  //   x1 = x0 - i1  + 1.0 * C.xxx;",
        "  //   x2 = x0 - i2  + 2.0 * C.xxx;",
        "  //   x3 = x0 - 1.0 + 3.0 * C.xxx;",
        "  vec3 x1 = x0 - i1 + C.xxx;",
        "  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y",
        "  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y",
        "",
        "// Permutations",
        "  i = mod289(i); ",
        "  vec4 p = permute( permute( permute( ",
        "             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))",
        "           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) ",
        "           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));",
        "",
        "// Gradients: 7x7 points over a square, mapped onto an octahedron.",
        "// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)",
        "  float n_ = 0.142857142857; // 1.0/7.0",
        "  vec3  ns = n_ * D.wyz - D.xzx;",
        "",
        "  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)",
        "",
        "  vec4 x_ = floor(j * ns.z);",
        "  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)",
        "",
        "  vec4 x = x_ *ns.x + ns.yyyy;",
        "  vec4 y = y_ *ns.x + ns.yyyy;",
        "  vec4 h = 1.0 - abs(x) - abs(y);",
        "",
        "  vec4 b0 = vec4( x.xy, y.xy );",
        "  vec4 b1 = vec4( x.zw, y.zw );",
        "",
        "  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;",
        "  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;",
        "  vec4 s0 = floor(b0)*2.0 + 1.0;",
        "  vec4 s1 = floor(b1)*2.0 + 1.0;",
        "  vec4 sh = -step(h, vec4(0.0));",
        "",
        "  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;",
        "  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;",
        "",
        "  vec3 p0 = vec3(a0.xy,h.x);",
        "  vec3 p1 = vec3(a0.zw,h.y);",
        "  vec3 p2 = vec3(a1.xy,h.z);",
        "  vec3 p3 = vec3(a1.zw,h.w);",
        "",
        "//Normalise gradients",
        "  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));",
        "  p0 *= norm.x;",
        "  p1 *= norm.y;",
        "  p2 *= norm.z;",
        "  p3 *= norm.w;",
        "",
        "// Mix final noise value",
        "  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);",
        "  m = m * m;",
        "  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), ",
        "                                dot(p2,x2), dot(p3,x3) ) );",
        "  }",

        "float turbulence(vec3 pnt) {",
        "  vec3 p = pnt;",
        "  float f = snoise(p);",
        "  f += snoise(p*2.0)/2.0;",
        "  f += snoise(p*4.0)/4.0;",
        "  f += snoise(p*8.0)/8.0;",
        "  return f;",
        "  return 0.5+0.5*f;",
        "}" ].join('\n');
    return noise;
};





var createHudCamera = function(size3d, shader) {

    var size = [size3d[0]*size3d[2], size3d[1]];

    var hudCamera = new osg.Camera();
    hudCamera.setProjectionMatrix(osg.Matrix.makeOrtho(0, size[0], 0, size[1], -5, 5));
    hudCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    hudCamera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    hudCamera.setViewport(new osg.Viewport(0,0,size[0],size[1]));
    hudCamera.setClearColor([0.0, 0.0, 0.0, 0.0]);

    // texture attach to the camera to render the scene on
    var rttTexture = new osg.Texture();
    rttTexture.setTextureSize(size[0],size[1]);
    rttTexture.setMinFilter('LINEAR');
    rttTexture.setMagFilter('LINEAR');
    hudCamera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, rttTexture, 0);

    var quad = osg.createTexturedQuad(0,0,0,
                                      size[0], 0 ,0,
                                      0, size[1] ,0 );
    quad.getOrCreateStateSet().setAttributeAndMode(shader);


    var uniform = osg.Uniform.createFloat2([1.0/size[0], 1.0/size[1] ], "pixelSize");
    quad.getOrCreateStateSet().addUniform(uniform);
    quad.getOrCreateStateSet().addUniform(osg.Uniform.createFloat3(size3d, "size"));


    hudCamera.addChild(quad);
    hudCamera.renderedTexture = rttTexture;
    return hudCamera;
};


var generateTexture = function(size) {
    var getShader = function() {

        var vertexshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "void main(void) {",
            "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
            "}"
        ].join('\n');

        var fragmentshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",

            "uniform vec3 size;",
            "uniform vec3 offset;",
            "uniform vec3 scaleVertex;",
            "uniform float limitBorder;",
            "uniform float discardLimit;",
            "uniform float density;",
            "uniform float turbulenceExponent;",

            "NOISE",

            "void checkDiscard(float value) {",
            "  if (value < discardLimit) {",
            "    discard;",
            "    return;",
            "  }",
            "}",
            "float evaluate(vec3 pos) {",
            "  float l = length(pos);",
            "  l = min(1.0, l);",
            "  l = 1.0-l;",
            "  l = l * l;",
            "  float attenuate = l*limitBorder;",
            "  //checkDiscard(attenuate);",
            "  float v = pow(1.0+turbulence((pos + offset)*scaleVertex)*density, turbulenceExponent) * attenuate;",
            "  //float v = turbulence((pos + offset)*scaleVertex)*attenuate;",
            "  //checkDiscard(v);",
            "  return v;",
            "}",

            "void main(void) {",
            "  // normalized coord [0 : 1]",
            "  float x = mod(gl_FragCoord.x, size[0])/size[0];",
            "  float y = gl_FragCoord.y/ size[1];",
            "  float z = floor(gl_FragCoord.x/size[0])/size[2];",
            "  vec3 positionNormalized = vec3(x,y,z);",
            "  // normalized coord [-1 : 1]",
            "  vec3 position = (vec3(x,y,z) - vec3(0.5))*2.0;",
            "  gl_FragColor = vec4(vec3(evaluate(position)), 1.0);",
            "}",
            ""
        ].join('\n');

        var frag = fragmentshader;
        frag = frag.replace('NOISE', getNoiseFunction());
        var program = new osg.Program(
            new osg.Shader(gl.VERTEX_SHADER, vertexshader),
            new osg.Shader(gl.FRAGMENT_SHADER, frag));

        return program;
    };

    var generator = createHudCamera(size, getShader());
    return generator;
};


var NodeVolume = function() {
    osg.Node.call(this);
};

NodeVolume.prototype = osg.objectInehrit(osg.Node.prototype, {
});

function createScene() {
    var root = new osg.Node();
    var group = new osg.MatrixTransform();

    var maxPlan = 10;

    var size = 2.0;
    for (var i = 0, l = maxPlan; i < l; i++) {
        var plan = osg.createTexturedQuad(-size*0.5, size/2 - i*size/maxPlan, -size*0.5,
                                            size,0,0,
                                            0,0,size);
        group.addChild(plan);
    }

    var getShader = function()
    {

        var vertexshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "varying vec3 FragVertex;",
            "void main(void) {",
            "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
            "  FragVertex = vec3(vec4(Vertex,1.0));",
            "}"
        ].join('\n');

        var fragmentshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",

            "varying vec3 FragVertex;",

            "uniform vec3 offset;",
            "uniform vec3 scaleVertex;",
            "uniform float limitBorder;",
            "uniform float discardLimit;",
            "uniform float density;",
            "uniform float turbulenceExponent;",


            "NOISE",

            "void checkDiscard(float value) {",
            "  if (value < discardLimit) {",
            "    discard;",
            "    return;",
            "  }",
            "}",
            "void main(void) {",
            "  float l = length(FragVertex);",
            "  l = min(1.0, l);",
            "  l = 1.0-l;",
            "  l = l * l;",
            "  float attenuate = l*limitBorder;",
            "  checkDiscard(attenuate);",
            "  float v = pow(1.0+turbulence((FragVertex + offset)*scaleVertex)*density, turbulenceExponent) * attenuate;",
            "  //float v = turbulence((FragVertex + offset)*scaleVertex)*attenuate;",
            "  checkDiscard(v);",
            "  gl_FragColor = vec4(v);",
            "}",
            ""
        ].join('\n');

        var frag = fragmentshader;
        frag = frag.replace('NOISE', getNoiseFunction());
        var program = new osg.Program(
            new osg.Shader(gl.VERTEX_SHADER, vertexshader),
            new osg.Shader(gl.FRAGMENT_SHADER, frag));

        return program;
    };


    root.addChild(group);

    group.getOrCreateStateSet().setAttributeAndMode(getShader());
    group.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));
    group.getOrCreateStateSet().setAttributeAndMode(new osg.BlendFunc('SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA'));

    var visitor = new osgUtil.ShaderParameterVisitor();
    visitor.setTargetHTML(document.getElementById("Parameters"));

    root.getOrCreateStateSet().addUniform(osg.Uniform.createFloat3([0,0,0], "offset"));
    root.getOrCreateStateSet().addUniform(osg.Uniform.createFloat3([1,1,1], "scaleVertex"));
    root.getOrCreateStateSet().addUniform(osg.Uniform.createFloat1([1], "limitBorder"));
    root.getOrCreateStateSet().addUniform(osg.Uniform.createFloat1([0], "discardLimit"));
    root.getOrCreateStateSet().addUniform(osg.Uniform.createFloat1([1], "density"));
    root.getOrCreateStateSet().addUniform(osg.Uniform.createFloat1([2], "turbulenceExponent"));

    visitor.types.vec3.params['scale'] = {
        min: 0.1,
        max: 5.0,
        step: 0.01,
        value: function() { return [1.0, 1.0, 1.0]; }
    };

    visitor.types.vec3.params['offset'] = {
        min: -2.5,
        max: 2.5,
        step: 0.01,
        value: function() { return [0.0, 0.0, 0.0]; }
    };

    visitor.types.float.params['turbulenceExponent'] = {
        min: 0.0,
        max: 5.0,
        step: 0.001,
        value: function() { return [0.002]; }
    };

    group.accept(visitor);
    group.setMatrix(osg.Matrix.makeScale(1,2,1, [] ));


    var size = [ 64, 64, 128 ];
    var generator = generateTexture(size);
    var texture = generator.renderedTexture;
    var qsize = [texture.getWidth()/10, texture.getHeight()/10];
    var generatorQuad = osg.createTexturedQuad(-qsize[0]*0.5, 0, -qsize[1]*0.5,
                                            qsize[0],0,0,
                                            0,0,qsize[1]);
    var mt = new osg.MatrixTransform();
    generatorQuad.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
    mt.addChild(generatorQuad);
    mt.setMatrix(osg.Matrix.makeTranslate(0,0,-4, []));

    root.addChild(generator);
    root.addChild(mt);

    return root;
}



window.addEventListener("load", main ,true);
