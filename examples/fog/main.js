( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;

    function getShader() {
        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'attribute vec3 Vertex;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'varying vec4 position;',
            'void main(void) {',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '  position = ModelViewMatrix * vec4(Vertex,1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'varying vec4 position;',
            'uniform vec4 MaterialAmbient;',
            'uniform float density;',
            'void main(void) {',
            '  float d = density; //0.001;',
            '  float f = gl_FragCoord.z/gl_FragCoord.w;',
            '  f = clamp(exp2(-d*d * f*f * 1.44), 0.0, 1.0);',
            '  gl_FragColor = f*MaterialAmbient;',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        program.trackAttributes = {};
        program.trackAttributes.attributeKeys = [];
        program.trackAttributes.attributeKeys.push( 'Material' );

        return program;
    }


    function createScene() {
        var group = new osg.Node();

        var size = 500;
        var ground = osg.createTexturedQuadGeometry( -size * 0.5, -size * 0.5, -50,
            size, 0, 0,
            0, size, 0 );

        var materialGround = new osg.Material();
        materialGround.setAmbient( [ 1, 0, 0, 1 ] );
        materialGround.setDiffuse( [ 0, 0, 0, 1 ] );
        ground.getOrCreateStateSet().setAttributeAndModes( materialGround );
        ground.getOrCreateStateSet().setAttributeAndModes( getShader() );

        var density = osg.Uniform.createFloat1( 0.002, 'density' );

        var gui = new window.dat.GUI();

        var param = {
            'density': density.get()[ 0 ],
        };

        gui.add( param, 'density', 0, 0.006 ).onChange( function ( value ) {
            density.set( value );
        } );

        ground.getOrCreateStateSet().addUniform( density );

        group.addChild( ground );
        group.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

        return group;
    }

    var main = function () {
        var canvas = document.getElementById( 'View' );

        var viewer;
        // try {
        viewer = new osgViewer.Viewer( canvas, {
            antialias: true,
            alpha: true
        } );
        viewer.init();
        viewer.setupManipulator();
        var rotate = new osg.MatrixTransform();
        rotate.addChild( createScene() );
        viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
        viewer.setSceneData( rotate );
        viewer.getManipulator().computeHomePosition();

        //viewer.getManipulator().setDistance(100.0);
        //viewer.getManipulator().setTarget([0,0,0]);

        viewer.run();

        // } catch (er) {
        //     osg.log('exception in osgViewer ' + er);
        // }
    };

    window.addEventListener( 'load', main, true );
} )();
