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

var density = undefined;
function changeDensity(value)
{
    var dens = value/10000.0;
    document.getElementById('density').innerHTML = dens;
    osg.log("density " + dens);
    density.set([dens]);
}

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
        viewer.setupManipulator();
        var rotate = new osg.MatrixTransform();
        rotate.addChild(createScene());
        viewer.view.setClearColor([0.0, 0.0, 0.0, 0.0]);
        viewer.setScene(rotate);
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
        "uniform mat4 ModelViewMatrix;",
        "uniform mat4 ProjectionMatrix;",
        "uniform vec4 fragColor;",
        "varying vec4 position;",
        "void main(void) {",
        "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
        "  position = ModelViewMatrix * vec4(Vertex,1.0);",
        "}"
    ].join('\n');

    var fragmentshader = [
        "",
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "uniform vec4 fragColor;",
        "varying vec4 position;",
        "uniform vec4 MaterialAmbient;",
        "uniform float density;",
        "void main(void) {",
        "  float d = density; //0.001;",
        "  float f = gl_FragCoord.z/gl_FragCoord.w;",
        "  f = clamp(exp2(-d*d * f*f * 1.44), 0.0, 1.0);",
        "  gl_FragColor = f*MaterialAmbient;",
        "}",
        ""
    ].join('\n');

    var program = new osg.Program(
        new osg.Shader(gl.VERTEX_SHADER, vertexshader),
        new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

    program.trackAttributes = {};
    program.trackAttributes.attributeKeys = [];
    program.trackAttributes.attributeKeys.push('Material');

    return program;
}


function createScene() {
    var group = new osg.Node();

    var size = 5000;
    var ground = osg.createTexturedQuad(-size*0.5,-size*0.5,-50,
                                        size,0,0,
                                        0,size,0);

    var materialGround = new osg.Material();
    materialGround.setAmbient([1,0,0,1]);
    materialGround.setDiffuse([0,0,0,1]);
    ground.getOrCreateStateSet().setAttributeAndMode(materialGround);
    ground.getOrCreateStateSet().setAttributeAndMode(getShader());

    density = osg.Uniform.createFloat1(0.0, 'density');
    ground.getOrCreateStateSet().addUniform(density);

    group.addChild(ground);
    group.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));


    return group;
}



window.addEventListener("load", main ,true);


