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

OSG.globalify();

var UpdateCallback = function() {
    this.update = function(node, nv) {
        var currentTime = nv.getFrameStamp().getSimulationTime();
        var x = Math.cos(currentTime);
        osg.Matrix.makeRotate(x, 0,0,1, node.getMatrix());
        node.traverse(nv);
    };
};


function createPostSceneScanline(texture, time)
{
    var getShader = function() {
        var vertexshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord0;",
            "varying vec2 FragTexCoord0;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "void main(void) {",
            "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
            "  FragTexCoord0 = TexCoord0;",
            "}",
            ""
        ].join('\n');

        var fragmentshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "varying vec2 FragTexCoord0;",
            "uniform sampler2D Texture0;",
            "uniform float time;", // 15.0

            "void main(void) {",
            "  vec2 q = FragTexCoord0.xy;",
            "  vec2 uv = 0.5 + (q-0.5)*(0.9 + 0.1*sin(0.2*time));",
            "  vec3 oricol = texture2D(Texture0,vec2(q.x,1.0-q.y)).xyz;",
            "  vec3 col;",

            "  col.r = texture2D(Texture0,vec2(uv.x+0.003,-uv.y)).x;",
            "  col.g = texture2D(Texture0,vec2(uv.x+0.000,-uv.y)).y;",
            "  col.b = texture2D(Texture0,vec2(uv.x-0.003,-uv.y)).z;",

            "  col = clamp(col*0.5+0.5*col*col*1.2,0.0,1.0);",
            "  // vignetting ",
            "  col *= 0.5 + 0.5*16.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y);",
            "  // teint",
            "  col *= vec3(0.8,1.0,0.7);",
            "  // trame",
            "  col *= 0.9+0.1*sin(10.0*time+uv.y*1000.0);",
            "  // flicking",
            "  col *= 0.97+0.05*sin(80.0*time);",

            "  col = mix( col, oricol, 0.5);",

            "  gl_FragColor = vec4(col,1.0);",
            "}",
            ""
        ].join('\n');

        var program = new osg.Program(
            new osg.Shader('VERTEX_SHADER', vertexshader),
            new osg.Shader('FRAGMENT_SHADER', fragmentshader));
        return program;
    };


    var quadSize = [ 16/9, 1 ];

    // add a node to animate the scene
    var root = new osg.MatrixTransform();

    // create a textured quad with the texture that will contain the
    // scene
    var quad = osg.createTexturedQuad(-quadSize[0]/2.0, 0 , -quadSize[1]/2.0,
                                      quadSize[0], 0 ,0,
                                      0, 0 ,quadSize[1]);
    var stateSet = quad.getOrCreateStateSet();
    // attach the texture to the quad
    stateSet.setTextureAttributeAndMode(0, texture);
    stateSet.setAttributeAndMode(getShader());

    // attach quad to root
    root.addChild(quad);
    return root;
}



var changePixelW = undefined;
var changePixelH = undefined;

function createPostScenePixel(texture)
{
    var getShader = function() {
        var vertexshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord0;",
            "varying vec2 FragTexCoord0;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "void main(void) {",
            "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
            "  FragTexCoord0 = TexCoord0;",
            "}",
            ""
        ].join('\n');

        var fragmentshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "varying vec2 FragTexCoord0;",
            "uniform sampler2D Texture0;",
            "uniform float pixel_w;", // 15.0
            "uniform float pixel_h;", // 10.0
            "uniform float tex_w;", // 15.0
            "uniform float tex_h;", // 10.0
            "void main(void) {",
            "  vec2 uv = FragTexCoord0;",
            "  vec3 tc = vec3(1.0, 0.0, 0.0);",
            "    float dx = pixel_w*(1./tex_w);",
            "    float dy = pixel_h*(1./tex_h);",
            "    vec2 coord = vec2(dx*floor(uv.x/dx),",
            "                      dy*floor(uv.y/dy));",
            "    tc = texture2D(Texture0, coord).rgb;",
            "	gl_FragColor = vec4(tc, 1.0);",
            "}",
            ""
        ].join('\n');

        var program = new osg.Program(
            new osg.Shader('VERTEX_SHADER', vertexshader),
            new osg.Shader('FRAGMENT_SHADER', fragmentshader));
        return program;
    };


    rttSize = [1024, 1024];

    var root = new osg.MatrixTransform();
    var quadSize = [ 16/9, 1 ];

    // create a textured quad with the texture that will contain the
    // scene
    var quad = osg.createTexturedQuad(-quadSize[0]/2.0, 0 , -quadSize[1]/2.0,
                                      quadSize[0], 0 ,0,
                                      0, 0 ,quadSize[1]);
    var stateSet = quad.getOrCreateStateSet();
    // attach the texture to the quad
    stateSet.setTextureAttributeAndMode(0, texture);
    stateSet.setAttributeAndMode(getShader());

    var pixel_w = osg.Uniform.createFloat1(4, "pixel_w");
    var pixel_h = osg.Uniform.createFloat1(4, "pixel_h");

    changePixelW = function(value) {
        pixel_w.get()[0] = value;
        pixel_w.dirty();
        document.getElementById("PixelW").innerHTML = value;
        osg.log("PixelX " + value);
    };
    changePixelH = function(value) {
        pixel_h.get()[0] = value;
        pixel_h.dirty();
        document.getElementById("PixelH").innerHTML = value;
        osg.log("PixelX " + value);
    };

    stateSet.addUniform(pixel_w);
    stateSet.addUniform(pixel_h);

    // attach quad to root
    root.addChild(quad);

    return root;
}



var changeVignetteX = undefined;
var changeVignetteY = undefined;

function createPostSceneVignette(texture)
{
    var getShader = function() {
        var vertexshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord0;",
            "varying vec2 FragTexCoord0;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "void main(void) {",
            "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
            "  FragTexCoord0 = TexCoord0;",
            "}",
            ""
        ].join('\n');

        var fragmentshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "varying vec2 FragTexCoord0;",
            "uniform sampler2D Texture0;",
            "uniform vec2 lensRadius;", // 0.45, 0.38

            "void main(void) {",
            "  vec4 color = texture2D( Texture0, FragTexCoord0);",
            "  float dist = distance(FragTexCoord0.xy, vec2(0.5,0.5));",
            "  color.rgb *= smoothstep(lensRadius.x, lensRadius.y, dist);",
            "  gl_FragColor = color;",
            "}",
            ""
        ].join('\n');

        var program = new osg.Program(
            new osg.Shader('VERTEX_SHADER', vertexshader),
            new osg.Shader('FRAGMENT_SHADER', fragmentshader));
        return program;
    };


    var root = new osg.MatrixTransform();
    var quadSize = [ 16/9, 1 ];
    // create a textured quad with the texture that will contain the
    // scene
    var quad = osg.createTexturedQuad(-quadSize[0]/2.0, 0 , -quadSize[1]/2.0,
                                      quadSize[0], 0 ,0,
                                      0, 0 ,quadSize[1]);
    var stateSet = quad.getOrCreateStateSet();
    // attach the texture to the quad
    stateSet.setTextureAttributeAndMode(0, texture);
    stateSet.setAttributeAndMode(getShader());

    lensRadius = osg.Uniform.createFloat2([0.77, 0.42], "lensRadius");

    changeVignetteY = function(value) {
        lensRadius.get()[1] = value;
        lensRadius.dirty();
        document.getElementById("VignetteY").innerHTML = value;
        osg.log("VignetteY " + value);
    };

    changeVignetteX = function(value) {
        lensRadius.get()[0] = value;
        lensRadius.dirty();
        document.getElementById("VignetteX").innerHTML = value;
        osg.log("VignetteX " + value);
    };

    stateSet.addUniform(lensRadius);

    // attach quad to root
    root.addChild(quad);

    return root;
}


var changeStitchingSize = undefined;
var changeInvertStitching = undefined;

function createPostSceneStitching(texture)
{
    var getShader = function() {
        var vertexshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord0;",
            "varying vec2 FragTexCoord0;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "void main(void) {",
            "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
            "  FragTexCoord0 = TexCoord0;",
            "}",
            ""
        ].join('\n');

        var fragmentshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "varying vec2 FragTexCoord0;",
            "uniform sampler2D Texture0;",
            "uniform float tex_w; // GeeXLab built-in",
            "uniform float tex_h; // GeeXLab built-in",
            "uniform float time;",
            "uniform float stitching_size;",
            "uniform int invert;",

            "vec4 PostFX(sampler2D tex, vec2 uv, float time)",
            "{",
            "  vec4 c = vec4(0.0);",
            "  float size = stitching_size;",
            "  vec2 cPos = uv * vec2(tex_w, tex_h);",
            "  vec2 tlPos = floor(cPos / vec2(size, size));",
            "  tlPos *= size;",
            "  int remX = int(mod(cPos.x, size));",
            "  int remY = int(mod(cPos.y, size));",
            "  if (remX == 0 && remY == 0)",
            "    tlPos = cPos;",
            "  vec2 blPos = tlPos;",
            "  blPos.y += (size - 1.0);",
            "  if ((remX == remY) ||",
            "     (((int(cPos.x) - int(blPos.x)) == (int(blPos.y) - int(cPos.y)))))",
            "  {",
            "    if (invert == 1)",
            "      c = vec4(0.2, 0.15, 0.05, 1.0);",
            "    else",
            "      c = texture2D(tex, tlPos * vec2(1.0/tex_w, 1.0/tex_h)) * 1.4;",
            "  }",
            "  else",
            "  {",
            "    if (invert == 1)",
            "      c = texture2D(tex, tlPos * vec2(1.0/tex_w, 1.0/tex_h)) * 1.4;",
            "    else",
            "      c = vec4(0.0, 0.0, 0.0, 1.0);",
            "  }",
            "  return c;",
            "}",
            "",
            "void main (void)",
            "{",
            "  vec2 uv = FragTexCoord0.st;",
            "  gl_FragColor = PostFX(Texture0, uv, time);",
            "}",
            ""
        ].join('\n');

        var program = new osg.Program(
            new osg.Shader('VERTEX_SHADER', vertexshader),
            new osg.Shader('FRAGMENT_SHADER', fragmentshader));
        return program;
    };

    var root = new osg.MatrixTransform();
    var quadSize = [ 16/9, 1 ];

    // create a textured quad with the texture that will contain the
    // scene
    var quad = osg.createTexturedQuad(-quadSize[0]/2.0, 0 , -quadSize[1]/2.0,
                                      quadSize[0], 0 ,0,
                                      0, 0 ,quadSize[1]);
    var stateSet = quad.getOrCreateStateSet();
    // attach the texture to the quad
    stateSet.setTextureAttributeAndMode(0, texture);
    stateSet.setAttributeAndMode(getShader());

    var stitching_size = osg.Uniform.createFloat1(6.0, "stitching_size");
    var invert = osg.Uniform.createInt1(0, "invert");
    stateSet.addUniform(invert);
    stateSet.addUniform(stitching_size);

    changeStitchingSize = function(value) {
        stitching_size.get()[0] = value;
        stitching_size.dirty();
        document.getElementById("StitchingSize").innerHTML = value;
    };

    changeInvertStitching = function(value) {
        invert.get()[0] = value;
        invert.dirty();
        document.getElementById("StitchingInvert").innerHTML = value;
    };

    // attach quad to root
    root.addChild(quad);

    return root;
}

var commonScene = function(rttSize) {

    var model = createSceneBox();

    var near = 0.1;
    var far = 100;
    var root = new osg.MatrixTransform();

    var quadSize = [ 16/9, 1 ];

    // add a node to animate the scene
    var rootModel = new osg.MatrixTransform();
    rootModel.addChild(model);
    rootModel.setUpdateCallback(new UpdateCallback());

    // create the camera that render the scene
    var camera = new osg.Camera();
    camera.setName("scene");
    camera.setProjectionMatrix(osg.Matrix.makePerspective(50, quadSize[0], near, far, []));
    camera.setViewMatrix(osg.Matrix.makeLookAt([ 0, -10, 0],
                                               [ 0,   0, 0],
                                               [ 0,   0, 1],
                                               []));
    camera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    camera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    camera.setViewport(new osg.Viewport(0,0,rttSize[0],rttSize[1]));
    camera.setClearColor([0.5, 0.5, 0.5, 1]);

    // texture attach to the camera to render the scene on
    var rttTexture = new osg.Texture();
    rttTexture.setTextureSize(rttSize[0],rttSize[1]);
    rttTexture.setMinFilter('LINEAR');
    rttTexture.setMagFilter('LINEAR');
    camera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, rttTexture, 0);
    camera.attachRenderBuffer(osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16);
    // add the scene to the camera
    camera.addChild(rootModel);

    // attach camera to root
    root.addChild(camera);
    return [root, rttTexture];
};

function createScene() {

    rttSize = [1024, 1024];

    result = commonScene(rttSize);
    var commonNode = result[0];
    var texture = result[1];

    var root = new osg.Node();

    var time = osg.Uniform.createFloat1(0.0, "time");
    var tex_w = osg.Uniform.createFloat1(rttSize[0], "tex_w");
    var tex_h = osg.Uniform.createFloat1(rttSize[1], "tex_h");

    var TimeUpdate = function(uniform) {
        this.update = function(node, nv) {
            var currentTime = nv.getFrameStamp().getSimulationTime();
            uniform.get()[0] = currentTime;
            uniform.dirty();
            node.traverse(nv);
        };
    };
    root.setUpdateCallback(new TimeUpdate(time));
    root.getOrCreateStateSet().addUniform(time);
    root.getOrCreateStateSet().addUniform(tex_w);
    root.getOrCreateStateSet().addUniform(tex_h);


    root.addChild(commonNode);
    var scene;

    if (true) {
        scene = createPostSceneVignette(texture);
        scene.setMatrix(osg.Matrix.makeTranslate(-2,0,0.0,[]));
        root.addChild(scene);
    }

    if (true) {
        scene = createPostScenePixel(texture);
        scene.setMatrix(osg.Matrix.makeTranslate(0,0,0.0,[]));
        root.addChild(scene);
    }

    if (true) {
        scene = createPostSceneScanline(texture);
        scene.setMatrix(osg.Matrix.makeTranslate(2,0,0.0,[]));
        root.addChild(scene);
    }

    if (true) {
        scene = createPostSceneStitching(texture);
        scene.setMatrix(osg.Matrix.makeTranslate(0,0,-1.0,[]));
        root.addChild(scene);
    }


    return root;
}

function createSceneBox() {
    return osg.createTexturedBox(0,0,0,
                                 2, 2, 2);
}



var start = function()
{
    var canvas = document.getElementById("3DView");
    canvas.style.width = window.innerWidth;
    canvas.style.height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var viewer;
    try {
        viewer = new osgViewer.Viewer(canvas, {antialias : true, premultipliedAlpha: true });
        viewer.init();
        viewer.setupManipulator();
        var rotate = new osg.MatrixTransform();
        rotate.addChild(createScene());
        viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
        viewer.setSceneData(rotate);
        viewer.getManipulator().computeHomePosition();
        viewer.run();

        var mousedown = function(ev) {
            ev.stopPropagation();
        };
        document.getElementById("explanation").addEventListener("mousedown", mousedown, false);

    } catch (er) {
        osg.log("exception in osgViewer " + er);
    }
};

window.addEventListener("load", start ,true);
