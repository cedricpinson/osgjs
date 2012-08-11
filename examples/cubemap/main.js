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
        Viewer = viewer;

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
        "uniform samplerCube Texture0;",
        "varying vec3 osg_FragNormal;",
        "varying vec3 osg_FragEye;",

        "void main(void) {",
        "  vec3 normal = normalize(osg_FragNormal);",
        "  vec3 eye = normalize(osg_FragEye);",
        "  vec3 ray = reflect(eye, normal);",
        "  gl_FragColor = textureCube(Texture0, ray);",
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
        "uniform samplerCube Texture0;",
        "varying vec3 osg_FragNormal;",
        "varying vec3 osg_FragEye;",
        "varying vec3 osg_FragVertex;",
        "varying vec2 osg_TexCoord0;",

        "void main(void) {",
        "  vec3 eye = normalize(-osg_FragVertex);",
        "  gl_FragColor = textureCube(Texture0, eye);",
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

function createScene() 
{
    var group = new osg.Node();

    var size = 250;
    var background = osg.createTexturedBoxGeometry(0,0,0,
                                                   size,size,size);
    background.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace('DISABLE'));
    background.getOrCreateStateSet().setAttributeAndModes(getShaderBackground());

    var ground = getModel();

    ground.getOrCreateStateSet().setAttributeAndMode(getShader());

    osgDB.Promise.all([
        osgDB.readImage('textures/posx.jpg'),
        osgDB.readImage('textures/negx.jpg'),

        osgDB.readImage('textures/posy.jpg'),
        osgDB.readImage('textures/negy.jpg'),

        osgDB.readImage('textures/posz.jpg'),
        osgDB.readImage('textures/negz.jpg')]).then(function ( images) {

            var texture = new osg.TextureCubeMap();

            texture.setImage('TEXTURE_CUBE_MAP_POSITIVE_X', images[0]);
            texture.setImage('TEXTURE_CUBE_MAP_NEGATIVE_X', images[1]);

            texture.setImage('TEXTURE_CUBE_MAP_POSITIVE_Y', images[3]);
            texture.setImage('TEXTURE_CUBE_MAP_NEGATIVE_Y', images[2]);

            texture.setImage('TEXTURE_CUBE_MAP_POSITIVE_Z', images[4]);
            texture.setImage('TEXTURE_CUBE_MAP_NEGATIVE_Z', images[5]);

            texture.setMinFilter('LINEAR_MIPMAP_LINEAR');

            ground.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
            ground.getOrCreateStateSet().addUniform(osg.Uniform.createInt1(0,'Texture0'));

            background.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
            background.getOrCreateStateSet().addUniform(osg.Uniform.createInt1(0,'Texture0'));
        });

    ground.addChild(background);
    group.addChild(ground);
    return group;
}



window.addEventListener("load", main ,true);
