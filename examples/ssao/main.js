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

var Viewer;
var main = function() {
    osg.ReportWebGLError = true;

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

    viewer = new osgViewer.Viewer(canvas, {antialias : true });
    viewer.init();
    var rotate = new osg.MatrixTransform();
    Viewer = viewer;
    viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
    viewer.setSceneData(rotate);
    viewer.setupManipulator();
    viewer.getManipulator().computeHomePosition();
    rotate.addChild(createScene());
    viewer.run();

    var mousedown = function(ev) {
        ev.stopPropagation();
    };
    document.getElementById("explanation").addEventListener("mousedown", mousedown, false);

};


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
    var loadModel = function(url) {
        osg.log("loading " + url);
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onreadystatechange = function (aEvt) {
            if (req.readyState == 4) {
                var child;
                if(req.status == 200) {
                    osgDB.Promise.when(osgDB.parseSceneGraph(JSON.parse(req.responseText))).then(function(child) {
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


var getDepthShader = function() {

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
        "varying vec3 FragNormal;",
        "varying float FragDepth;",
        "void main(void) {",
        "  vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);",
        "  gl_Position = ProjectionMatrix * pos;",
        "  FragDepth = pos.z;",
        "  FragNormal = vec3(NormalMatrix * vec4(Normal,0.0));",
        "}",
        ""
    ].join('\n');

    var fragmentshader = [
        "",
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "uniform mat4 ProjectionMatrix;",
        "varying vec3 FragNormal;",
        "varying float FragDepth;",

        "void main(void) {",
        "  float znear = ProjectionMatrix[3][2] / (ProjectionMatrix[2][2]-1.0);",
        "  float zfar = ProjectionMatrix[3][2] / (ProjectionMatrix[2][2]+1.0);",
        "  float depth;",
        "  depth = (-FragDepth - znear)/(zfar-znear);",
        "  //depth = FragDepth; // - znear)/(zfar-znear);",
        "  gl_FragColor = vec4(normalize(FragNormal), depth);",

        "  // depth",
        "  //gl_FragColor = vec4(vec3(FragDepth),1.0);",

        "}",
        ""
    ].join('\n');

    var program = new osg.Program(
        new osg.Shader(gl.VERTEX_SHADER, vertexshader),
        new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
    return program;
};


var getPositionShader = function() {

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
        "varying vec3 FragPosition;",
        "void main(void) {",
        "  vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);",
        "  gl_Position = ProjectionMatrix * pos;",
        "  //FragPosition = vec3(vec3(ProjectionMatrix * pos));",
        "  FragPosition = vec3(pos);",
        "}",
        ""
    ].join('\n');

    var fragmentshader = [
        "",
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "varying vec3 FragPosition;",

        "void main(void) {",
        "  gl_FragColor = vec4(FragPosition, 1.0);",
        "}",
        ""
    ].join('\n');

    var program = new osg.Program(
        new osg.Shader(gl.VERTEX_SHADER, vertexshader),
        new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
    return program;
};

var getTextureShader = function() {

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

        "",
        "void main (void)",
        "{",
        "  vec2 uv = FragTexCoord0;",
        "  gl_FragColor = vec4(texture2D(Texture0, uv));",
        "}",
        ""
    ].join('\n');

    var program = new osg.Program(
        new osg.Shader(gl.VERTEX_SHADER, vertexshader),
        new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
    return program;
};


var getSSAOShader = function(stateSet) {
    
    var nbSamples = 16;
    var radius = 0.05;

    var kernel = new Array(nbSamples*4);
    (function(array) {
        for (var i = 0; i < nbSamples; i++) {
            var x,y,z;
            x = 2.0*(Math.random()-0.5);
            y = 2.0*(Math.random()-0.5);
            z = Math.random()+0.15;

            var v = osg.Vec3.normalize([x,y,z],[]);
            var scale = Math.random();
            //scale = i / nbSamples;
            //scale = 0.1*(1.0-scale) + 1.0*(scale * scale);
            
            array[i*3+0] = v[0];
            array[i*3+1] = v[1];
            array[i*3+2] = v[2];
            array[i*3+3] = scale;
        }
    })(kernel);

    var sizeNoise = 16;
    var noise = new Array(sizeNoise*3);
    (function(array) {
        for (var i = 0; i < sizeNoise*sizeNoise; i++) {
            var x,y,z;
            x = 2.0*(Math.random()-0.5);
            y = 2.0*(Math.random()-0.5);
            z = 0.0;

            var n = osg.Vec3.normalize([x,y,z],[]);
            array[i*3+0] = 255*(n[0]*0.5+0.5);
            array[i*3+1] = 255*(n[1]*0.5+0.5);
            array[i*3+2] = 255*(n[2]*0.5+0.5);
        }
    })(noise);

    var noiseTexture = new osg.Texture();
    noiseTexture.setWrapS('REPEAT');
    noiseTexture.setWrapT('REPEAT');
    noiseTexture.setTextureSize(sizeNoise,sizeNoise);
    noiseTexture.setImage(new Uint8Array(noise),'RGB');

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

    var kernelglsl = [];
    for (var i = 0; i < nbSamples; i++) {
        kernelglsl.push("kernel["+i+"] = vec4("+kernel[i*3]+"," + kernel[i*3+1] + ", " + kernel[i*3+2] +", " + kernel[i*3+3] + ");");
    }
    kernelglsl = kernelglsl.join('\n');

    var fragmentshader = [
        "",
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "varying vec2 FragTexCoord0;",
        "uniform sampler2D Texture0;",
        "uniform sampler2D Texture1;",
        "uniform sampler2D Texture2;",
        "uniform mat4 projection;",
        "uniform vec2 noiseSampling;",

        "#define NB_SAMPLES " + nbSamples,
        "#define Radius " + radius,
        "float depth;",
        "vec3 normal;",
        "vec3 position;",
        "vec4 kernel["+nbSamples+"];",
        "mat3 computeBasis()",
        "{",
        "  vec3 rvec = texture2D(Texture2, FragTexCoord0*noiseSampling).xyz*2.0-vec3(1.0);",
        "  vec3 tangent = normalize(rvec - normal * dot(rvec, normal));",
	"  vec3 bitangent = cross(normal, tangent);",
        "  mat3 tbn = mat3(tangent, bitangent, normal);",
        "  return tbn;",
        "}",

        "void main (void)",
        "{",
        kernelglsl,
        "  vec4 p = texture2D(Texture0, FragTexCoord0);",
        "  depth = p.w;",
        "  normal = vec3(p);",
        "  if (length(normal) == 0.0) {",
        "     discard;",
        "  }",
        "  position = texture2D(Texture1, FragTexCoord0).xyz;",
        "",
        " mat3 tbn = computeBasis();",
        " float occlusion = 0.0;",
        " for (int i = 0; i < NB_SAMPLES; i++) {",
        "    vec3 sample = tbn * vec3(kernel[i]);",
        "    vec3 dir = sample;",
        "    float w = dot(dir, normal);",
        "    float dist = 1.0-kernel[i].w;",
        "    w *= dist*dist;",
        "    sample = dir * float(Radius) + position;",
        
        "    vec4 offset = projection * vec4(sample,1.0);",
	"    offset.xy /= offset.w;",
	"    offset.xy = offset.xy * 0.5 + 0.5;",

	"    float sample_depth = texture2D(Texture1, offset.xy).z;",
	"    float range_check = abs(sample.z - sample_depth) < float(Radius) ? 1.0 : 0.0;",
	"    occlusion += (sample_depth > sample.z ? 1.0 : 0.0) * range_check*w;",

        " }",
        " occlusion = 1.0 - (occlusion / float(NB_SAMPLES));",
        " gl_FragColor = vec4(vec3(occlusion),1.0);",
        "}",
        ""
    ].join('\n');

    var program = new osg.Program(
        new osg.Shader(gl.VERTEX_SHADER, vertexshader),
        new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

        
    var array = [];
    var ratio = window.innerWidth/window.innerHeight;

    osg.Matrix.makePerspective(60, ratio, 1.0, 100.0, array);

    stateSet.addUniform(osg.Uniform.createMatrix4(array,'projection'));
    stateSet.addUniform(osg.Uniform.createInt1(2,'Texture2'));
    var sizex = stateSet.getTextureAttribute(0,'Texture').getWidth();
    var sizey = stateSet.getTextureAttribute(0,'Texture').getHeight();
    stateSet.addUniform(osg.Uniform.createFloat2([sizex/sizeNoise, sizey/sizeNoise],'noiseSampling'));
    stateSet.setAttributeAndModes(program);
    stateSet.setTextureAttributeAndModes(2,noiseTexture);
    return program;
};


var CullCallback = function(uniform) {
    this._uniform = uniform;
};
CullCallback.prototype = {
    cull: function(node, nv) {
        var matrix = nv.getCurrentProjectionMatrix();
        osg.Matrix.copy(matrix, this._uniform.get());
//        osg.log(matrix);
        var array = [];
        osg.Matrix.makePerspective(60, window.innerWidth/window.innerHeight, 1.0, 100.0, array);
//        osg.log(array);

        this._uniform.dirty();
        return true;
    }
};

var createCameraRtt = function(resultTexture, scene) {
    var w,h;
    w = resultTexture.getWidth();
    h = resultTexture.getHeight();
    var camera = new osg.Camera();
    camera.setName("rtt camera");
    camera.setViewport(new osg.Viewport(0,0,w,h));
    camera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    camera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, resultTexture, 0);
    camera.attachRenderBuffer(osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16);
    //camera.setComputeNearFar(false);

    camera.addChild(scene);
    return camera;
};

var createFinalCamera = function(w,h, scene) {
    var camera = new osg.Camera();
    camera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    camera.setViewport(new osg.Viewport(0,0,w,h));
    camera.setProjectionMatrix(osg.Matrix.makeOrtho(0,w,0,h,-5,5));
    camera.addChild(scene);
    return camera;
};


function createScene() 
{
    var root = new osg.Node();
    var group = new osg.Node();

    var size = 10;
    var ground = osg.createTexturedQuadGeometry(0-size/2,0-size/2.0, -2,
                                                size,0,0,
                                                0,size,0);
    ground.setName("plane geometry");
    group.addChild(ground);
    group.addChild(getModel());

    var w,h;
    w = window.innerWidth;
    h = window.innerHeight;

    var textureSize = [ w, h ];
    //Viewer.getCamera().setComputeNearFar(false);
    var extension = Viewer.getState().getGraphicContext().getExtension('OES_texture_float');
    var texture = new osg.Texture();
    if (extension) {
        osg.log(extension);
        texture.setType('FLOAT');
    }
    texture.setTextureSize(textureSize[0], textureSize[1]);
    texture.setMinFilter('LINEAR');
    texture.setMagFilter('LINEAR');

    var sceneRtt = createCameraRtt(texture, group);
    sceneRtt.getOrCreateStateSet().setAttributeAndModes(getDepthShader(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );

    var positionTexture = new osg.Texture();
    if (extension) {
        positionTexture.setType('FLOAT');
    }
    positionTexture.setTextureSize(textureSize[0], textureSize[1]);
    positionTexture.setMinFilter('LINEAR');
    positionTexture.setMagFilter('LINEAR');

    var positionRttCamera = createCameraRtt(positionTexture, group);
    positionRttCamera.getOrCreateStateSet().setAttributeAndModes(getPositionShader(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );


    var projection = osg.Uniform.createMat4(osg.Matrix.makeIdentity([]),'projection');
    var ucb = new CullCallback(projection);
    positionRttCamera.setCullCallback(ucb);


    var textureColor = new osg.Texture();
    textureColor.setTextureSize(textureSize[0], textureSize[1]);
    var sceneRttColor = createCameraRtt(textureColor, group);
    //sceneRtt.getOrCreateStateSet().setAttributeAndModes(getDepthShader(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );

//    root.addChild(group);
    root.addChild(sceneRtt);
    root.addChild(positionRttCamera);
    root.addChild(sceneRttColor);


    var quadSize = [ w, h ];

    // create a textured quad with the texture that will contain the
    // scene
    var quad = osg.createTexturedQuadGeometry(0, 0,0,
                                              quadSize[0], 0 ,0,
                                              0, quadSize[1],0);
    var stateSet = quad.getOrCreateStateSet();
    var noblend = new osg.BlendFunc('ONE', 'ZERO');
    stateSet.setAttributeAndModes(noblend, osg.StateAttribute.OVERRIDE);

    stateSet.addUniform(osg.Uniform.createInt1(0,'Texture0'));
    stateSet.addUniform(osg.Uniform.createInt1(1,'Texture1'));
    stateSet.setTextureAttributeAndModes(0, texture);
    stateSet.setTextureAttributeAndModes(1, positionTexture);
    getSSAOShader(stateSet);

    //stateSet.setAttributeAndModes(getTextureShader());

    var finalCamera = createFinalCamera(w,h, quad);
    //root.addChild(finalCamera);

    var composer = new osgUtil.Composer();
    root.addChild(composer);

    if (true) {
    composer.addPass(osgUtil.Composer.Filter.createSSAO( { normal: texture,
                                                           position: positionTexture,
                                                           radius: 0.1
                                                         }));
    var blurSize = 5;
    composer.getOrCreateStateSet().addUniform(projection, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
    composer.addPass(osgUtil.Composer.Filter.createVBlur(blurSize));
    composer.addPass(osgUtil.Composer.Filter.createHBlur(blurSize));
    composer.addPass(osgUtil.Composer.Filter.createBlendMultiply(textureColor));
    }

//    composer.addPass(osgUtil.Composer.Filter.createInputTexture(texture));

    composer.renderToScreen(w,h);
    composer.build();

    return root;
}



window.addEventListener("load", main ,true);
