( function () {
    'use strict';

    var Viewer;
    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;


    function getShader() {
        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'attribute vec3 Vertex;',
            'attribute vec3 Normal;',
            'uniform mat4 uModelViewMatrix;',
            'uniform mat4 uProjectionMatrix;',
            'uniform mat3 uModelViewNormalMatrix;',

            'varying vec3 vViewNormal;',
            'varying vec3 vViewVertex;',

            'void main(void) {',
            '  vViewVertex = vec3(uModelViewMatrix * vec4(Vertex,1.0));',
            '  vViewNormal = uModelViewNormalMatrix * Normal;',
            '  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(Vertex,1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'uniform samplerCube Texture0;',
            'uniform mat4 CubemapTransform;',

            'varying vec3 vViewNormal;',
            'varying vec3 vViewVertex;',

            'vec3 cubemapReflectionVector(const in mat4 transform, const in vec3 view, const in vec3 normal)',
            '{',
            '  vec3 lv = reflect(view, normal);',
            '  lv = normalize(lv);',
            '  vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);',
            '  vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);',
            '  vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);',
            '  mat3 m = mat3(x,y,z);',
            '  return m*lv;',
            '}',

            'void main(void) {',
            '  vec3 normal = normalize(vViewNormal);',
            '  vec3 eye = -normalize(vViewVertex);',
            '  vec3 ray = cubemapReflectionVector(CubemapTransform, eye, normal);',
            '  gl_FragColor = textureCube(Texture0, normalize(ray));',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    }


    function getShaderBackground() {
        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'attribute vec3 Vertex;',
            'attribute vec3 Normal;',
            'attribute vec2 TexCoord0;',
            'uniform mat4 uModelViewMatrix;',
            'uniform mat4 uProjectionMatrix;',

            'varying vec3 vViewNormal;',
            'varying vec3 vLocalVertex;',

            'void main(void) {',
            '  vLocalVertex = Vertex;',
            '  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(Vertex,1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'uniform samplerCube Texture0;',
            'varying vec3 vLocalVertex;',

            'void main(void) {',
            '  vec3 eye = -normalize(vLocalVertex);',
            '  gl_FragColor = textureCube(Texture0, eye);',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    }

    var getModel = function () {
        var node = new osg.MatrixTransform();
        node.setMatrix( osg.mat4.fromRotation( osg.mat4.create(), 0, [ 1, 0, 0 ] ) );

        osgDB.readNodeURL( '../media/models/material-test/file.osgjs' ).then( function ( model ) {
            node.addChild( model );
            Viewer.getManipulator().computeHomePosition();
        } );

        return node;
    };

    function getCubeMap( size, scene ) {
        // create the environment sphere
        var geom = osg.createTexturedBoxGeometry( 0, 0, 0,
            size, size, size );
        geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
        geom.getOrCreateStateSet().setAttributeAndModes( getShaderBackground() );

        var cubemapTransform = osg.Uniform.createMatrix4( osg.mat4.create(), 'CubemapTransform' );

        var mt = new osg.MatrixTransform();
        mt.setMatrix( osg.mat4.fromRotation( osg.mat4.create(), -Math.PI / 2.0, [ 1, 0, 0 ] ) );
        mt.addChild( geom );

        var CullCallback = function () {
            this.cull = function ( node, nv ) {
                // overwrite matrix, remove translate so environment is always at camera origin
                osg.mat4.setTranslation( nv.getCurrentModelViewMatrix(), [ 0, 0, 0 ] );
                var m = nv.getCurrentModelViewMatrix();
                osg.mat4.copy( cubemapTransform.getInternalArray(), m );
                return true;
            };
        };
        mt.setCullCallback( new CullCallback() );
        scene.getOrCreateStateSet().addUniform( cubemapTransform );


        var cam = new osg.Camera();

        cam.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
        cam.addChild( mt );

        // the update callback get exactly the same view of the camera
        // but configure the projection matrix to always be in a short znear/zfar range to not vary depend on the scene size
        var UpdateCallback = function () {
            this.update = function ( /*node, nv*/) {
                var rootCam = Viewer.getCamera();
                var info = {};
                osg.mat4.getPerspective( info, rootCam.getProjectionMatrix() );
                var proj = [];
                osg.mat4.perspective( proj, Math.PI / 180 * info.fovy, info.aspectRatio, 1.0, 100.0 );

                cam.setProjectionMatrix( proj );
                cam.setViewMatrix( rootCam.getViewMatrix() );

                return true;
            };
        };

        cam.addUpdateCallback( new UpdateCallback() );

        scene.addChild( cam );

        return geom;
    }

    function createScene() {
        var group = new osg.Node();

        var size = 250;
        var background = getCubeMap( size, group );
        background.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
        background.getOrCreateStateSet().setAttributeAndModes( getShaderBackground() );

        var ground = getModel();

        ground.getOrCreateStateSet().setAttributeAndModes( getShader() );

        P.all( [
            osgDB.readImage( 'textures/posx.jpg' ),
            osgDB.readImage( 'textures/negx.jpg' ),

            osgDB.readImage( 'textures/posy.jpg' ),
            osgDB.readImage( 'textures/negy.jpg' ),

            osgDB.readImage( 'textures/posz.jpg' ),
            osgDB.readImage( 'textures/negz.jpg' )
        ] ).then( function ( images ) {

            var texture = new osg.TextureCubeMap();

            texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_X', images[ 0 ] );
            texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_X', images[ 1 ] );

            texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_Y', images[ 2 ] );
            texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_Y', images[ 3 ] );

            texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_Z', images[ 4 ] );
            texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_Z', images[ 5 ] );

            texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );

            ground.getOrCreateStateSet().setTextureAttributeAndModes( 0, texture );
            ground.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );

            background.getOrCreateStateSet().setTextureAttributeAndModes( 0, texture );
            background.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );
        } );

        group.addChild( ground );
        return group;
    }

    var main = function () {

        var canvas = document.getElementById( 'View' );

        var viewer = new osgViewer.Viewer( canvas, {
            antialias: true
        } );
        Viewer = viewer;
        viewer.init();
        var rotate = new osg.MatrixTransform();
        rotate.addChild( createScene() );
        viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
        viewer.setSceneData( rotate );
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();

        //viewer.getManipulator().setDistance(100.0);
        //viewer.getManipulator().setTarget([0,0,0]);

        viewer.run();

    };

    window.addEventListener( 'load', main, true );

} )();
