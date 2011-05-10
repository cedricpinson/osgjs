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

// http://www.opengl.org/resources/code/samples/advanced/advanced97/notes/node100.html
function createShadowMatrix(ground, light, shadowMat)
{
    var dot;
    if (shadowMat === undefined) {
        shadowMat = [];
    }

    dot = ground[0] * light[0] +
          ground[1] * light[1] +
          ground[2] * light[2] +
          ground[3] * light[3];
    
    shadowMat[0] = dot - light[0] * ground[0];
    shadowMat[4] = 0.0 - light[0] * ground[1];
    shadowMat[8] = 0.0 - light[0] * ground[2];
    shadowMat[12] = 0.0 - light[0] * ground[3];
    
    shadowMat[1] = 0.0 - light[1] * ground[0];
    shadowMat[5] = dot - light[1] * ground[1];
    shadowMat[9] = 0.0 - light[1] * ground[2];
    shadowMat[13] = 0.0 - light[1] * ground[3];
    
    shadowMat[2] = 0.0 - light[2] * ground[0];
    shadowMat[6] = 0.0 - light[2] * ground[1];
    shadowMat[10] = dot - light[2] * ground[2];
    shadowMat[14] = 0.0 - light[2] * ground[3];
    
    shadowMat[3] = 0.0 - light[3] * ground[0];
    shadowMat[7] = 0.0 - light[3] * ground[1];
    shadowMat[11] = 0.0 - light[3] * ground[2];
    shadowMat[15] = dot - light[3] * ground[3];

    return shadowMat;
}

var LightUpdateCallback = function(matrix) { this.matrix = matrix;};
LightUpdateCallback.prototype = {
    update: function(node, nv) {
        var currentTime = nv.getFrameStamp().getSimulationTime();

        var x = 50 * Math.cos(currentTime);
        var y = 50 * Math.sin(currentTime);
        var h = 80;
        osg.Matrix.makeTranslate(x ,y,h, node.getMatrix());

        createShadowMatrix([0,0,1,5],
                           [x,y,h,1],
                           this.matrix);
        node.light.direction = [x,y,h];
        node.light.dirty();
        node.traverse(nv);
    }
};


var LightUpdateCallbackProjectedTexture = function(matrix, uniform, rtt) { this.matrix = matrix, this.uniform = uniform; this.camera = rtt};
LightUpdateCallbackProjectedTexture.prototype = {
    update: function(node, nv) {
        var currentTime = nv.getFrameStamp().getSimulationTime();

        var x = 50 * Math.cos(currentTime);
        var y = 50 * Math.sin(currentTime);
        var h = 80;
        osg.Matrix.makeTranslate(x ,y,h, node.getMatrix());

        osg.Matrix.makeLookAt([x,y,80],[0,0,-5],[0,-1,0], this.camera.getViewMatrix());

        var biasScale = osg.Matrix.preMult(osg.Matrix.makeTranslate(0.5 , 0.5, 0.5, []), osg.Matrix.makeScale(0.5 , 0.5, 0.5, []));
        var shadowView = this.camera.getViewMatrix();
        var shadowProj = osg.Matrix.copy(this.camera.getProjectionMatrix(), []);
        osg.Matrix.preMult(shadowProj, shadowView);
        osg.Matrix.postMult(biasScale, shadowProj);

        this.uniform.set(shadowProj);
        node.light.direction = [x,y,h];
        node.light.dirty();
        node.traverse(nv);
    }
};

function createProjectedShadowScene()
{
    var model = osgDB.parseSceneGraph(getOgre());
    var root = new osg.MatrixTransform();
    var shadowNode = new osg.MatrixTransform();
    shadowNode.addChild(model);
    var bs = model.getBound();

    var light = new osg.MatrixTransform();
    light.light = new osg.Light();
    light.setUpdateCallback(new LightUpdateCallback(shadowNode.getMatrix()));

    shadowNode.getOrCreateStateSet().setTextureAttributeAndMode(0, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE);
    shadowNode.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE);

    root.addChild(model);
    root.addChild(light);
    root.addChild(shadowNode);

    return root;
}


function getTextureProjectedShadowShader()
{
    var vertexshader = [
        "",
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "attribute vec3 Vertex;",
        "uniform mat4 ModelViewMatrix;",
        "uniform mat4 ProjectionMatrix;",
        "uniform vec4 fragColor;",
        "uniform mat4 WorldMatrix;",
        "uniform mat4 ProjectionShadow;",
        "varying vec4 ShadowUVProjected;",
        "void main(void) {",
        "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
        "  vec4 uv = (ProjectionShadow * WorldMatrix * vec4(Vertex,1.0));",
        "  //ShadowUVProjected = (uv/uv.w).xy;",
        "  ShadowUVProjected = uv;",
        "}",
        ""
    ].join('\n');

    var fragmentshader = [
        "",
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "uniform vec4 fragColor;",
        "uniform sampler2D Texture0;",
        "varying vec4 ShadowUVProjected;",
        "float shift = 1.0/512.0;",
        "float shadowed[9];",
        "float getSmoothTexelFilter(vec2 uv) {",
        "  vec4 c;",
        "  shadowed[0] = texture2D( Texture0,  uv).a;",
        "  shadowed[1] = texture2D( Texture0,  uv+vec2(0,shift)).a;",
        "  shadowed[2] = texture2D( Texture0, uv+vec2(shift,shift)).a;",
        "  shadowed[3] = texture2D( Texture0, uv+vec2(shift,0)).a;",
        "  shadowed[4] = texture2D( Texture0, uv+vec2(shift,-shift)).a;",
        "  shadowed[5] = texture2D( Texture0, uv+vec2(0,-shift)).a;",
        "  shadowed[6] = texture2D( Texture0, uv+vec2(-shift,-shift)).a;",
        "  shadowed[7] = texture2D( Texture0, uv+vec2(-shift,0)).a;",
        "  shadowed[8] = texture2D( Texture0, uv+vec2(-shift,shift)).a;",
        "  int nb = 0;",
        "  for (int i = 0; i < 9; i++) {",
        "    if (shadowed[i] > 0.5)",
        "       nb += 1;",
        "  }",
        "  return float(nb)/9.0;",
        "}",
        "vec4 getSmoothTexel(vec2 uv) {",
        "  vec4 c;",
        "  c = texture2D( Texture0,  uv);",
        "  c += texture2D( Texture0,  uv+vec2(0,shift));",
        "  c += texture2D( Texture0, uv+vec2(shift,shift));",
        "  c += texture2D( Texture0, uv+vec2(shift,0));",
        "  c += texture2D( Texture0, uv+vec2(shift,-shift));",
        "  c += texture2D( Texture0, uv+vec2(0,-shift));",
        "  c += texture2D( Texture0, uv+vec2(-shift,-shift));",
        "  c += texture2D( Texture0, uv+vec2(-shift,0));",
        "  c += texture2D( Texture0, uv+vec2(-shift,shift));",
        "  return c;",
        "}",
        "vec4 getSmoothTexel4(vec4 uv) {",
        "  vec4 c;",
        "  c = texture2DProj( Texture0,  uv+vec4(0,shift,0,0));",
        "  c += texture2DProj( Texture0, uv+vec4(shift,shift,0,0));",
        "  c += texture2DProj( Texture0, uv+vec4(shift,0,0,0));",
        "  c += texture2DProj( Texture0, uv+vec4(shift,-shift,0,0));",
        "  c += texture2DProj( Texture0, uv+vec4(0,-shift,0,0));",
        "  c += texture2DProj( Texture0, uv+vec4(-shift,-shift,0,0));",
        "  c += texture2DProj( Texture0, uv+vec4(-shift,0,0,0));",
        "  c += texture2DProj( Texture0, uv+vec4(-shift,shift,0,0));",
        "  return c;",
        "}",
        "void main(void) {",
        "//vec4 color = texture2DProj( Texture0, ShadowUVProjected);",
        "//color = (color + getSmoothTexel((ShadowUVProjected/ShadowUVProjected.w).xy)) / 9.0;",
        "//fragColor = vec4(0,0,0,);",
        "gl_FragColor = vec4(0,0,0, getSmoothTexelFilter((ShadowUVProjected/ShadowUVProjected.w).xy));",
        "}",
        ""
    ].join('\n');

    var program = osg.Program.create(
        osg.Shader.create(gl.VERTEX_SHADER, vertexshader),
        osg.Shader.create(gl.FRAGMENT_SHADER, fragmentshader));

    return program;
}

function createTextureProjectedShadowScene()
{
    var model = osgDB.parseSceneGraph(getOgre());
    var root = new osg.MatrixTransform();
    var shadowNode = new osg.MatrixTransform();
    shadowNode.addChild(model);
    var bs = model.getBound();

    var light = new osg.MatrixTransform();
    var rtt = new osg.Camera();
    rtt.setName("rtt_camera");
    rttSize = [512,512];
    
//    rtt.setProjectionMatrix(osg.Matrix.makeOrtho(0, rttSize[0], 0, rttSize[1], -5, 1000));
    rtt.setProjectionMatrix(osg.Matrix.makePerspective(15, 1, 1.0, 1000.0));
//    rtt.setProjectionMatrix(osg.Matrix.makeOrtho(-0.5, 0.5, -0.5, 0.5, 0, 1000.0));
    var lightMatrix = [];
    rtt.setViewMatrix(osg.Matrix.makeLookAt([0,0,80],[0,0,0],[0,1,0]));
    rtt.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    rtt.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    rtt.setViewport(new osg.Viewport(0,0,rttSize[0],rttSize[1]));
    rtt.setClearColor([0, 0, 0, 0.0]);

    var matDark = new osg.Material();
    var black = [0,0,0,1];
    matDark.ambient = black;
    matDark.diffuse = black;
    matDark.specular = black;
    shadowNode.getOrCreateStateSet().setAttributeAndMode(matDark, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    var rttTexture = new osg.Texture();
    rttTexture.setTextureSize(rttSize[0],rttSize[1]);
    rttTexture.setMinFilter('LINEAR');
    rttTexture.setMagFilter('LINEAR');
    rtt.attachTexture(gl.COLOR_ATTACHMENT0, rttTexture, 0);
    rtt.addChild(shadowNode);
    light.addChild(rtt);

    var shadowMatrix = [];
    light.light = new osg.Light();

    var q = osg.createTexturedQuad(-10,-10,-4.99,
                                  20, 0 ,0,
                                  0, 20 ,0);
    q.getOrCreateStateSet().setAttributeAndMode(new osg.Material(), osg.StateAttribute.OFF);
    q.getOrCreateStateSet().setAttributeAndMode(new osg.BlendFunc('ONE', 'ONE_MINUS_SRC_ALPHA'));
    q.getOrCreateStateSet().setTextureAttributeAndMode(0, rttTexture);
    q.getOrCreateStateSet().setAttributeAndMode(getTextureProjectedShadowShader());
    var uniform = new osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), "ProjectionShadow");
    q.getOrCreateStateSet().addUniform(uniform);
    var world = new osg.Uniform.createMatrix4(osg.Matrix.makeTranslate(0,0,0, []), "WorldMatrix");
    q.getOrCreateStateSet().addUniform(world);
    light.setUpdateCallback(new LightUpdateCallbackProjectedTexture(shadowMatrix, 
                                                                    uniform,
                                                                    rtt));

    root.addChild(model);
    root.addChild(light);
    root.addChild(q);

    return root;
}

function createScene() {
    var root = new osg.Camera();
    root.setComputeNearFar(false);

    var project = createProjectedShadowScene();
    project.setMatrix(osg.Matrix.makeTranslate(-10,0,0,[]));
    root.addChild(project);

    var texproject = createTextureProjectedShadowScene();
    texproject.setMatrix(osg.Matrix.makeTranslate(0,0,0,[]));
    root.addChild(texproject);


    return root;
}

function createSceneBox() {
    return osg.createTexturedBox(0,0,0,
                                 40, 60, 40);
}
