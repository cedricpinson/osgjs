/** -*- compile-command: 'jslint-cli main.js' -*-
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

window.OSG.globalify();

var osg = window.osg;
var osgViewer = window.osgViewer;
var osgDB = window.osgDB;
var osgUtil = window.osgUtil;
var Q = window.Q;

var Viewer;

var main = function () {
    osg.ReportWebGLError = true;

    var canvas = document.getElementById( 'View' );

    var stats = document.getElementById( 'Stats' );

    var viewer;

    viewer = new osgViewer.Viewer( canvas );
    viewer.init();
    var rotate = new osg.MatrixTransform();
    Viewer = viewer;
    viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
    viewer.setSceneData( rotate );
    viewer.setupManipulator();
    viewer.getManipulator().computeHomePosition();
    rotate.addChild( createScene( canvas.width, canvas.height ) );
    viewer.run();

};


var nbLoading = 0;
var loaded = [];
var removeLoading = function ( node, child ) {
    nbLoading -= 1;
    loaded.push( child );
    if ( nbLoading === 0 ) {
        document.getElementById( 'loading' ).style.display = 'None';
    }
};
var addLoading = function () {
    nbLoading += 1;
    document.getElementById( 'loading' ).style.display = 'Block';
};

var getModel = function ( func ) {
    var defer = Q.defer();
    var node = new osg.MatrixTransform();
    //node.setMatrix(osg.Matrix.makeRotate(-Math.PI/2, 1,0,0, []));
    var loadModel = function ( url ) {
        osg.log( 'loading ' + url );
        var req = new XMLHttpRequest();
        req.open( 'GET', url, true );
        req.onreadystatechange = function ( aEvt ) {
            if ( req.readyState === 4 ) {
                var child;
                if ( req.status === 200 ) {
                    Q.when( osgDB.parseSceneGraph( JSON.parse( req.responseText ) ) ).then( function ( child ) {
                        node.addChild( child );
                        removeLoading( node, child );
                        defer.resolve( node );
                        osg.log( 'success ' + url );
                    } );
                } else {
                    removeLoading( node, child );
                    osg.log( 'error ' + url );
                }
            }
        };
        req.send( null );
        addLoading();
    };

    //loadModel('monkey.osgjs');
    //loadModel('sponza.osgjs');
    loadModel( 'raceship.osgjs' );
    return defer.promise;
};


var pack = [

    'vec4 packFloatTo4x8(in float v) {',
    'vec4 enc = vec4(1.0, 255.0, 65025.0, 160581375.0) * v;',
    'enc = fract(enc);',
    'enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);',
    'return enc;',
    '}',

    ' ',
    'vec4 pack2FloatTo4x8(in vec2 val) {',
    ' const vec2 bitSh = vec2(256.0, 1.0);',
    ' const vec2 bitMsk = vec2(0.0, 1.0/256.0);',
    ' vec2 res1 = fract(val.x * bitSh);',
    ' res1 -= res1.xx * bitMsk;',
    ' vec2 res2 = fract(val.y * bitSh);',
    ' res2 -= res2.xx * bitMsk;',
    ' return vec4(res1.x,res1.y,res2.x,res2.y);',
    '}',
    ' ',
    'float unpack4x8ToFloat( vec4 rgba ) {',
    ' return dot( rgba, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/160581375.0) );',
    '}',
    ' ',
    'vec2 unpack4x8To2Float(in vec4 val) {',
    ' const vec2 unshift = vec2(1.0/256.0, 1.0);',
    ' return vec2(dot(val.xy, unshift), dot(val.zw, unshift));',
    '}'
].join( '\n' );



var normalEncoding = [
    'vec2 encodeNormal (vec3 n)',
    '{',
    '    float f = sqrt(8.0*n.z+8.0);',
    '    return n.xy / f + 0.5;',
    '}',
    'vec3 decodeNormal (vec2 enc)',
    '{',
    '    vec2 fenc = enc*4.0-2.0;',
    '    float f = dot(fenc,fenc);',
    '    float g = sqrt(1.0-f/4.0);',
    '    vec3 n;',
    '    n.xy = fenc*g;',
    '    n.z = 1.0-f/2.0;',
    '    return n;',
    '}'
].join( '\n' );


var getNormalShader = function () {

    var vertexshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'attribute vec3 Vertex;',
        'attribute vec3 Normal;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'uniform mat4 NormalMatrix;',
        'varying vec3 FragNormal;',
        'varying float FragDepth;',
        'void main(void) {',
        '  vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);',
        '  gl_Position = ProjectionMatrix * pos;',
        '  FragDepth = pos.z;',
        '  FragNormal = vec3(NormalMatrix * vec4(Normal,0.0));',
        '}',
        ''
    ].join( '\n' );

    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'uniform mat4 ProjectionMatrix;',
        'varying vec3 FragNormal;',
        'varying float FragDepth;',

        'void main(void) {',
        '  float znear = ProjectionMatrix[3][2] / (ProjectionMatrix[2][2]-1.0);',
        '  float zfar = ProjectionMatrix[3][2] / (ProjectionMatrix[2][2]+1.0);',
        '  float depth;',
        '  depth = (-FragDepth - znear)/(zfar-znear);',
        '  //depth = FragDepth; // - znear)/(zfar-znear);',
        '  gl_FragColor = vec4(normalize(FragNormal), depth);',

        '  // depth',
        '  //gl_FragColor = vec4(vec3(FragDepth),1.0);',

        '}',
        ''
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( 'VERTEX_SHADER', vertexshader ),
        new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );
    return program;
};


var getDepthShader8 = function () {

    var vertexshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'attribute vec3 Vertex;',
        'attribute vec3 Normal;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'uniform mat4 NormalMatrix;',
        'varying vec3 FragNormal;',
        'varying float FragDepth;',


        'void main(void) {',
        '  vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);',
        '  gl_Position = ProjectionMatrix * pos;',
        '  FragDepth = pos.z;',
        '}',
        ''
    ].join( '\n' );

    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'uniform mat4 ProjectionMatrix;',
        'varying float FragDepth;',

        pack,

        'void main(void) {',
        '  float znear = ProjectionMatrix[3][2] / (ProjectionMatrix[2][2]-1.0);',
        '  float zfar = ProjectionMatrix[3][2] / (ProjectionMatrix[2][2]+1.0);',
        '  float depth;',
        '  depth = (-FragDepth - znear)/(zfar-znear);',
        '  //gl_FragColor = packFloatTo4x8(-FragDepth/zfar);',
        '  //if (depth > 0.49 &&  depth < 0.51) depth = 0.0;',
        '  gl_FragColor = packFloatTo4x8(depth);',
        '}',
        ''
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( 'VERTEX_SHADER', vertexshader ),
        new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );
    return program;
};


var getPositionShader = function () {

    var vertexshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'attribute vec3 Vertex;',
        'attribute vec3 Normal;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'uniform mat4 NormalMatrix;',
        'varying vec3 FragPosition;',
        'void main(void) {',
        '  vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);',
        '  gl_Position = ProjectionMatrix * pos;',
        '  //FragPosition = vec3(vec3(ProjectionMatrix * pos));',
        '  FragPosition = vec3(pos);',
        '}',
        ''
    ].join( '\n' );

    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'varying vec3 FragPosition;',

        'void main(void) {',
        '  gl_FragColor = vec4(FragPosition, 1.0);',
        '}',
        ''
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( 'VERTEX_SHADER', vertexshader ),
        new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );
    return program;
};


var getNormalShaderSphereMapTransform = function () {

    var vertexshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'attribute vec3 Vertex;',
        'attribute vec3 Normal;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'uniform mat4 NormalMatrix;',
        'varying vec3 FragPosition;',
        'varying vec3 FragNormal;',
        'void main(void) {',
        '  vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);',
        '  gl_Position = ProjectionMatrix * pos;',
        '  FragNormal = vec3(NormalMatrix * vec4(Normal,0.0));',
        '  FragPosition = vec3(pos);',
        '}',
        ''
    ].join( '\n' );

    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'varying vec3 FragPosition;',
        'varying vec3 FragNormal;',

        pack,
        normalEncoding,

        'void main(void) {',
        '  vec2 normal = encodeNormal(normalize(FragNormal));',
        '  //vec2 normal = encodeNormal(vec3(0.5));',
        '  gl_FragColor = pack2FloatTo4x8(normal);',
        '}',
        ''
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( 'VERTEX_SHADER', vertexshader ),
        new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );
    return program;
};

var getTextureShader = function () {

    var vertexshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'attribute vec3 Vertex;',
        'attribute vec2 TexCoord0;',
        'varying vec2 FragTexCoord0;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'void main(void) {',
        '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
        '  FragTexCoord0 = TexCoord0;',
        '}',
        ''
    ].join( '\n' );

    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'varying vec2 FragTexCoord0;',
        'uniform sampler2D Texture0;',

        '',
        'void main (void)',
        '{',
        '  vec2 uv = FragTexCoord0;',
        '  gl_FragColor = vec4(texture2D(Texture0, uv));',
        '}',
        ''
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( 'VERTEX_SHADER', vertexshader ),
        new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );
    return program;
};


var getSSAOShader = function ( stateSet ) {

    var nbSamples = 16;
    var radius = 0.05;

    var kernel = new Array( nbSamples * 4 );
    ( function ( array ) {
        for ( var i = 0; i < nbSamples; i++ ) {
            var x, y, z;
            x = 2.0 * ( Math.random() - 0.5 );
            y = 2.0 * ( Math.random() - 0.5 );
            z = Math.random() + 0.15;

            var v = osg.Vec3.normalize( [ x, y, z ], [] );
            var scale = Math.random();
            //scale = i / nbSamples;
            //scale = 0.1*(1.0-scale) + 1.0*(scale * scale);

            array[ i * 3 + 0 ] = v[ 0 ];
            array[ i * 3 + 1 ] = v[ 1 ];
            array[ i * 3 + 2 ] = v[ 2 ];
            array[ i * 3 + 3 ] = scale;
        }
    } )( kernel );

    var sizeNoise = 16;
    var noise = new Array( sizeNoise * 3 );
    ( function ( array ) {
        for ( var i = 0; i < sizeNoise * sizeNoise; i++ ) {
            var x, y, z;
            x = 2.0 * ( Math.random() - 0.5 );
            y = 2.0 * ( Math.random() - 0.5 );
            z = 0.0;

            var n = osg.Vec3.normalize( [ x, y, z ], [] );
            array[ i * 3 + 0 ] = 255 * ( n[ 0 ] * 0.5 + 0.5 );
            array[ i * 3 + 1 ] = 255 * ( n[ 1 ] * 0.5 + 0.5 );
            array[ i * 3 + 2 ] = 255 * ( n[ 2 ] * 0.5 + 0.5 );
        }
    } )( noise );

    var noiseTexture = new osg.Texture();
    noiseTexture.setWrapS( 'REPEAT' );
    noiseTexture.setWrapT( 'REPEAT' );
    noiseTexture.setTextureSize( sizeNoise, sizeNoise );
    noiseTexture.setImage( new Uint8Array( noise ), 'RGB' );

    var vertexshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'attribute vec3 Vertex;',
        'attribute vec2 TexCoord0;',
        'varying vec2 FragTexCoord0;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'void main(void) {',
        '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
        '  FragTexCoord0 = TexCoord0;',
        '}',
        ''
    ].join( '\n' );

    var kernelglsl = [];
    for ( var i = 0; i < nbSamples; i++ ) {
        kernelglsl.push( 'kernel[' + i + '] = vec4(' + kernel[ i * 3 ] + ',' + kernel[ i * 3 + 1 ] + ', ' + kernel[ i * 3 + 2 ] + ', ' + kernel[ i * 3 + 3 ] + ');' );
    }
    kernelglsl = kernelglsl.join( '\n' );

    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'varying vec2 FragTexCoord0;',
        'uniform sampler2D Texture0;',
        'uniform sampler2D Texture1;',
        'uniform sampler2D Texture2;',
        'uniform mat4 projection;',
        'uniform vec2 noiseSampling;',

        '#define NB_SAMPLES ' + nbSamples,
        '#define Radius ' + radius,
        'float depth;',
        'vec3 normal;',
        'vec3 position;',
        'vec4 kernel[' + nbSamples + '];',
        'mat3 computeBasis()',
        '{',
        '  vec3 rvec = texture2D(Texture2, FragTexCoord0*noiseSampling).xyz*2.0-vec3(1.0);',
        '  vec3 tangent = normalize(rvec - normal * dot(rvec, normal));',
        '  vec3 bitangent = cross(normal, tangent);',
        '  mat3 tbn = mat3(tangent, bitangent, normal);',
        '  return tbn;',
        '}',

        'void main (void)',
        '{',
        kernelglsl,
        '  vec4 p = texture2D(Texture0, FragTexCoord0);',
        '  depth = p.w;',
        '  normal = vec3(p);',
        '  if (length(normal) == 0.0) {',
        '     discard;',
        '  }',
        '  position = texture2D(Texture1, FragTexCoord0).xyz;',
        '',
        ' mat3 tbn = computeBasis();',
        ' float occlusion = 0.0;',
        ' for (int i = 0; i < NB_SAMPLES; i++) {',
        '    vec3 sample = tbn * vec3(kernel[i]);',
        '    vec3 dir = sample;',
        '    float w = dot(dir, normal);',
        '    float dist = 1.0-kernel[i].w;',
        '    w *= dist*dist;',
        '    sample = dir * float(Radius) + position;',

        '    vec4 offset = projection * vec4(sample,1.0);',
        '    offset.xy /= offset.w;',
        '    offset.xy = offset.xy * 0.5 + 0.5;',

        '    float sample_depth = texture2D(Texture1, offset.xy).z;',
        '    float range_check = abs(sample.z - sample_depth) < float(Radius) ? 1.0 : 0.0;',
        '    occlusion += (sample_depth > sample.z ? 1.0 : 0.0) * range_check*w;',

        ' }',
        ' occlusion = 1.0 - (occlusion / float(NB_SAMPLES));',
        ' gl_FragColor = vec4(vec3(occlusion),1.0);',
        '}',
        ''
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( 'VERTEX_SHADER', vertexshader ),
        new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );


    var array = [];
    var ratio = window.innerWidth / window.innerHeight;

    osg.Matrix.makePerspective( 60, ratio, 1.0, 100.0, array );

    stateSet.addUniform( osg.Uniform.createMatrix4( array, 'projection' ) );
    stateSet.addUniform( osg.Uniform.createInt1( 2, 'Texture2' ) );
    var sizex = stateSet.getTextureAttribute( 0, 'Texture' ).getWidth();
    var sizey = stateSet.getTextureAttribute( 0, 'Texture' ).getHeight();
    stateSet.addUniform( osg.Uniform.createFloat2( [ sizex / sizeNoise, sizey / sizeNoise ], 'noiseSampling' ) );
    stateSet.setAttributeAndModes( program );
    stateSet.setTextureAttributeAndModes( 2, noiseTexture );
    return program;
};


var CullCallback = function () {
    this._projection = undefined;
    this._modelview = undefined;
};
CullCallback.prototype = {
    cull: function ( node, nv ) {
        //osg.log('cull');
        var matrix = nv.getCurrentProjectionMatrix();
        this._projection = matrix;
        matrix._projection = 'me';
        matrix = nv.getCurrentModelViewMatrix();
        this._modelview = matrix;
        return true;
    }
};

var createCameraRtt = function ( resultTexture, scene ) {
    var w, h;
    w = resultTexture.getWidth();
    h = resultTexture.getHeight();
    var camera = new osg.Camera();
    camera.setName( 'rtt camera' );
    camera.setViewport( new osg.Viewport( 0, 0, w, h ) );
    camera.setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
    camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
    camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, resultTexture, 0 );
    camera.attachRenderBuffer( osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16 );

    camera.addChild( scene );
    return camera;
};

function createSceneReal() {
    var root = new osg.Node();

    Q.when( getModel() ).then( function ( model ) {

        var group = new osg.Node();

        var size = 10;
        var ground = osg.createTexturedQuadGeometry( 0 - size / 2, 0 - size / 2.0, -2,
            size, 0, 0,
            0, size, 0 );
        ground.setName( 'plane geometry' );
        group.addChild( model );

        var w, h;
        w = window.innerWidth;
        h = window.innerHeight;

        var textureSize = [ w, h ];
        //Viewer.getCamera().setComputeNearFar(false);
        var extension = Viewer.getState().getGraphicContext().getExtension( 'OES_texture_float' );
        var texture = new osg.Texture();
        if ( extension ) {
            osg.log( extension );
            texture.setInternalFormatType( 'FLOAT' );
        }
        texture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
        texture.setMinFilter( 'LINEAR' );
        texture.setMagFilter( 'LINEAR' );

        var sceneRtt = createCameraRtt( texture, group );
        sceneRtt.getOrCreateStateSet().setAttributeAndModes( getNormalShader(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );

        var positionTexture = new osg.Texture();
        if ( extension ) {
            positionTexture.setInternalFormatType( 'FLOAT' );
        }
        positionTexture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
        positionTexture.setMinFilter( 'LINEAR' );
        positionTexture.setMagFilter( 'LINEAR' );

        var positionRttCamera = createCameraRtt( positionTexture, group );
        positionRttCamera.getOrCreateStateSet().setAttributeAndModes( getPositionShader(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );

        var projection = osg.Uniform.createMat4( osg.Matrix.create(), 'projection' );
        var ucb = new CullCallback( projection );
        positionRttCamera.setCullCallback( ucb );


        var textureColor = new osg.Texture();
        textureColor.setTextureSize( w, h );
        var sceneRttColor = createCameraRtt( textureColor, group );
        //sceneRtt.getOrCreateStateSet().setAttributeAndModes(getDepthShader(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );

        //    root.addChild(group);
        root.addChild( sceneRtt );
        root.addChild( positionRttCamera );
        root.addChild( sceneRttColor );


        var composer = new osgUtil.Composer();
        root.addChild( composer );


        var w2, h2;
        w2 = textureSize[ 0 ];
        h2 = textureSize[ 1 ];
        //        w2 = w;
        //        h2 = h;
        var ssao = new osgUtil.Composer.Filter.SSAO( {
            normal: texture,
            position: positionTexture,
            radius: 0.1
        } );

        ssao.setSceneRadius( model.getBound().radius() );
        var blurSize = 5;
        var blurV = new osgUtil.Composer.Filter.AverageVBlur( blurSize );
        var blurH = new osgUtil.Composer.Filter.AverageHBlur( blurSize );


        osgUtil.ParameterVisitor.createSlider( {
            min: 4,
            max: 64,
            step: 2,
            value: 16,
            name: 'ssaoSamples',
            object: ssao,
            field: '_nbSamples',
            onchange: function () {
                ssao.dirty();
            },
            html: document.getElementById( 'parameters' )
        } );

        osgUtil.ParameterVisitor.createSlider( {
            min: 1,
            max: 10,
            step: 1,
            value: 2,
            name: 'ssaoNoise',
            object: ssao,
            field: '_noiseTextureSize',
            onchange: function ( value ) {
                // fix to a power of two
                ssao._noiseTextureSize = Math.pow( 2, value );
                ssao._noiseTextureSize = Math.min( ssao._noiseTextureSize, 512 );
                ssao.dirty();
            },
            html: document.getElementById( 'parameters' )
        } );


        osgUtil.ParameterVisitor.createSlider( {
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.0,
            name: 'ssaoAngleLimit',
            object: ssao,
            field: '_angleLimit',
            onchange: function () {
                ssao.dirty();
            },
            html: document.getElementById( 'parameters' )
        } );

        osgUtil.ParameterVisitor.createSlider( {
            min: 1,
            max: 15,
            step: 1,
            value: 3,
            name: 'blurSize',
            object: blurH,
            field: '_nbSamples',
            onchange: function ( value ) {
                blurV.setBlurSize( value );
                blurH.setBlurSize( value );
            },
            html: document.getElementById( 'parameters' )
        } );

        osgUtil.ParameterVisitor.createSlider( {
            min: 1,
            max: 8,
            step: 0.5,
            value: 1,
            name: 'blurSizeDist',
            object: blurH,
            field: '_pixelSize',
            onchange: function ( value ) {
                blurV.setPixelSize( value );
                blurH.setPixelSize( value );
            },
            html: document.getElementById( 'parameters' )
        } );

        composer.addPass( ssao, w2, h2 );
        composer.getOrCreateStateSet().addUniform( projection, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );


        composer.addPass( blurV, w2, h2 );
        composer.addPass( blurH, w2, h2 );
        composer.addPass( new osgUtil.Composer.Filter.BlendMultiply( textureColor ), w, h );

        //    composer.addPass(osgUtil.Composer.Filter.createInputTexture(texture));

        composer.renderToScreen( w, h );
        composer.build();
        var params = new osgUtil.ParameterVisitor();
        params.setTargetHTML( document.getElementById( 'parameters' ) );
        composer.accept( params );


        model.dirtyBound();
        Viewer.getManipulator().computeHomePosition();

    } );
    return root;
}



function createScene2() {
    var root = new osg.Node();

    Q.when( getModel() ).then( function ( model ) {

        var group = new osg.Node();

        var size = 10;
        var ground = osg.createTexturedQuadGeometry( 0 - size / 2, 0 - size / 2.0, -2,
            size, 0, 0,
            0, size, 0 );
        ground.setName( 'plane geometry' );
        group.addChild( model );

        var w, h;
        w = window.innerWidth;
        h = window.innerHeight;

        var textureSize = [ w, h ];
        var texture = new osg.Texture();
        texture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
        texture.setMinFilter( 'LINEAR' );
        texture.setMagFilter( 'LINEAR' );

        var sceneRtt = createCameraRtt( texture, group );
        sceneRtt.getOrCreateStateSet().setAttributeAndModes( getNormalShaderSphereMapTransform(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );

        var depthTexture = new osg.Texture();
        depthTexture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
        depthTexture.setMinFilter( 'LINEAR' );
        depthTexture.setMagFilter( 'LINEAR' );

        var positionRttCamera = createCameraRtt( depthTexture, group );
        positionRttCamera.getOrCreateStateSet().setAttributeAndModes( getDepthShader8(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );


        var projection = osg.Uniform.createMat4( osg.Matrix.create(), 'projection' );
        var ucb = new CullCallback( projection );
        positionRttCamera.setCullCallback( ucb );


        var textureColor = new osg.Texture();
        textureColor.setTextureSize( w, h );
        var sceneRttColor = createCameraRtt( textureColor, group );
        //sceneRtt.getOrCreateStateSet().setAttributeAndModes(getDepthShader(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );

        //    root.addChild(group);
        root.addChild( sceneRtt );
        root.addChild( positionRttCamera );
        root.addChild( sceneRttColor );


        var composer = new osgUtil.Composer();
        root.addChild( composer );


        var w2, h2;
        w2 = textureSize[ 0 ];
        h2 = textureSize[ 1 ];
        //        w2 = w;
        //        h2 = h;
        var ssao = new osgUtil.Composer.Filter.SSAO( {
            normal: texture,
            position: positionTexture,
            radius: 0.1
        } );

        ssao.setSceneRadius( model.getBound().radius() );
        var blurSize = 5;
        var blurV = new osgUtil.Composer.Filter.AverageVBlur( blurSize );
        var blurH = new osgUtil.Composer.Filter.AverageHBlur( blurSize );

        if ( false ) {
            osgUtil.ParameterVisitor.createSlider( {
                min: 4,
                max: 64,
                step: 2,
                value: 16,
                name: 'nbSamples',
                object: ssao,
                field: '_nbSamples',
                onchange: function () {
                    ssao.dirty();
                },
                html: document.getElementById( 'parameters' )
            } );
        }

        if ( false ) {
            osgUtil.ParameterVisitor.createSlider( {
                min: 1,
                max: 10,
                step: 1,
                value: 3,
                name: 'ssaoNoise',
                object: ssao,
                field: '_noiseTextureSize',
                onchange: function ( value ) {
                    // fix to a power of two
                    ssao._noiseTextureSize = Math.pow( 2, value );
                    ssao._noiseTextureSize = Math.min( ssao._noiseTextureSize, 512 );
                    ssao.dirty();
                },
                html: document.getElementById( 'parameters' )
            } );
        }

        if ( false ) {
            osgUtil.ParameterVisitor.createSlider( {
                min: 0.0,
                max: 1.0,
                step: 0.01,
                value: 0.0,
                name: 'ssaoAngleLimit',
                object: ssao,
                field: '_angleLimit',
                onchange: function () {
                    ssao.dirty();
                },
                html: document.getElementById( 'parameters' )
            } );
        }

        if ( false ) {
            osgUtil.ParameterVisitor.createSlider( {
                min: 1,
                max: 15,
                step: 1,
                value: 3,
                name: 'blurSize',
                object: blurH,
                field: '_nbSamples',
                onchange: function ( value ) {
                    blurV.setBlurSize( value );
                    blurH.setBlurSize( value );
                },
                html: document.getElementById( 'parameters' )
            } );
        }

        if ( false ) {
            osgUtil.ParameterVisitor.createSlider( {
                min: 1,
                max: 8,
                step: 0.5,
                value: 1,
                name: 'blurSizeDist',
                object: blurH,
                field: '_pixelSize',
                onchange: function ( value ) {
                    blurV.setPixelSize( value );
                    blurH.setPixelSize( value );
                },
                html: document.getElementById( 'parameters' )
            } );
        }

        composer.addPass( ssao, w2, h2 );
        composer.getOrCreateStateSet().addUniform( projection, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );


        composer.addPass( blurV, w2, h2 );
        composer.addPass( blurH, w2, h2 );
        composer.addPass( new osgUtil.Composer.Filter.BlendMultiply( textureColor ), w, h );

        //    composer.addPass(osgUtil.Composer.Filter.createInputTexture(texture));

        composer.renderToScreen( w, h );
        composer.build();
        var params = new osgUtil.ParameterVisitor();
        params.setTargetHTML( document.getElementById( 'parameters' ) );
        composer.accept( params );


        model.dirtyBound();
        Viewer.getManipulator().computeHomePosition();

    } );
    return root;
}

function createSceneTestDepth() {
    var root = new osg.Node();

    Q.when( getModel() ).then( function ( model ) {

        var group = new osg.Node();

        var size = 10;
        var ground = osg.createTexturedQuadGeometry( 0 - size / 2, 0 - size / 2.0, -2,
            size, 0, 0,
            0, size, 0 );
        ground.setName( 'plane geometry' );
        group.addChild( model );

        var w, h;
        w = window.innerWidth;
        h = window.innerHeight;
        var textureSize = [ w, h ];

        var depthTexture = new osg.Texture();
        depthTexture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
        depthTexture.setMinFilter( 'NEAREST' );
        depthTexture.setMagFilter( 'NEAREST' );

        var positionRttCamera = createCameraRtt( depthTexture, group );
        positionRttCamera.getOrCreateStateSet().setAttributeAndModes( getDepthShader8(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );


        var projection = osg.Uniform.createMat4( osg.Matrix.create(), 'projection' );
        var ucb = new CullCallback( projection );
        positionRttCamera.setCullCallback( ucb );


        root.addChild( positionRttCamera );

        var composer = new osgUtil.Composer();
        root.addChild( composer );


        var w2, h2;
        w2 = textureSize[ 0 ];
        h2 = textureSize[ 1 ];
        //        w2 = w;
        //        h2 = h;

        var checkDepth = new osgUtil.Composer.Filter.Custom( [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'uniform sampler2D depthTexture;',
            'uniform float depthFactor;',
            'uniform vec4 depthColor;',
            'varying vec2 FragTexCoord0;',
            pack,
            'void main() {',
            '  float decode = unpack4x8ToFloat(texture2D(depthTexture, FragTexCoord0));',
            '  gl_FragColor = vec4(vec3(decode),1.0)*depthColor;',
            '}',
            ''
        ].join( '\n' ), {
            'depthTexture': depthTexture,
            'depthFactor': 0.01,
            'depthColor': [ 1, 1, 1, 1 ],
            'projection': projection
        } );

        composer.getOrCreateStateSet().addUniform( projection, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

        composer.addPass( checkDepth );
        composer.renderToScreen( w, h );
        composer.build();

        model.dirtyBound();
        Viewer.getManipulator().computeHomePosition();

    }, function ( reject ) {
        osg.log( 'Fails' );
    } );
    return root;
}


function createSceneTestNormal() {
    var root = new osg.Node();

    Q.when( getModel() ).then( function ( model ) {

        var group = new osg.Node();

        var size = 10;
        var ground = osg.createTexturedQuadGeometry( 0 - size / 2, 0 - size / 2.0, -2,
            size, 0, 0,
            0, size, 0 );
        ground.setName( 'plane geometry' );
        group.addChild( model );

        var w, h;
        w = window.innerWidth;
        h = window.innerHeight;
        var textureSize = [ w, h ];

        var normalTexture = new osg.Texture();
        normalTexture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
        normalTexture.setMinFilter( 'NEAREST' );
        normalTexture.setMagFilter( 'NEAREST' );

        var positionRttCamera = createCameraRtt( normalTexture, group );
        positionRttCamera.getOrCreateStateSet().setAttributeAndModes( getNormalShaderSphereMapTransform(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );


        var normalTextureFloat = undefined;
        ( function () {
            var extension = Viewer.getState().getGraphicContext().getExtension( 'OES_texture_float' );
            var texture = new osg.Texture();
            if ( extension ) {
                osg.log( extension );
                texture.setInternalFormatType( 'FLOAT' );
            }
            texture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
            texture.setMinFilter( 'NEAREST' );
            texture.setMagFilter( 'NEAREST' );

            var sceneRtt = createCameraRtt( texture, group );
            sceneRtt.getOrCreateStateSet().setAttributeAndModes( getNormalShader(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );

            normalTextureFloat = texture;
            root.addChild( sceneRtt );
        } )();


        var projection = osg.Uniform.createMat4( osg.Matrix.create(), 'projection' );
        var ucb = new CullCallback( projection );
        //positionRttCamera.setCullCallback(ucb);


        root.addChild( positionRttCamera );

        var composer = new osgUtil.Composer();
        root.addChild( composer );


        var w2, h2;
        w2 = textureSize[ 0 ];
        h2 = textureSize[ 1 ];
        //        w2 = w;
        //        h2 = h;

        var checkDepth = new osgUtil.Composer.Filter.Custom( [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'uniform sampler2D normalTexture;',
            'uniform sampler2D normalTextureFloat;',
            'varying vec2 FragTexCoord0;',
            pack,
            normalEncoding,
            'void main() {',
            '  vec2 texel = unpack4x8To2Float(texture2D(normalTexture, FragTexCoord0));',
            '  vec3 normal = decodeNormal(texel);',
            '  //vec3 normal = vec3(texel[0], 0.0,texel[1]);',
            '  //normal = normalize(normal);',
            '  vec3 normalFloat = texture2D(normalTextureFloat, FragTexCoord0).rgb;',
            '  normalFloat = normalize(normalFloat);',
            '  vec3 error = abs(normalFloat-normal);',
            '  gl_FragColor = vec4(normalFloat,1.0);',
            '  //gl_FragColor = vec4(normal,1.0);',
            '  //gl_FragColor = vec4(error,1.0);',
            '}',
            ''
        ].join( '\n' ), {
            'normalTexture': normalTexture,
            'normalTextureFloat': normalTextureFloat,
            'projection': projection
        } );

        composer.getOrCreateStateSet().addUniform( projection, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

        composer.addPass( checkDepth );
        composer.renderToScreen( w, h );
        composer.build();

        model.dirtyBound();
        Viewer.getManipulator().computeHomePosition();

    }, function ( reject ) {
        osg.log( 'Fails' );
    } );
    return root;
}

function createSceneTestReconstructPosition() {
    var root = new osg.Node();

    Q.when( getModel() ).then( function ( model ) {

        var group = new osg.Node();

        var size = 10;
        var ground = osg.createTexturedQuadGeometry( 0 - size / 2, 0 - size / 2.0, -2,
            size, 0, 0,
            0, size, 0 );
        ground.setName( 'plane geometry' );
        group.addChild( ground );

        var w, h;
        w = window.innerWidth;
        h = window.innerHeight;
        var textureSize = [ w, h ];

        var projection = osg.Uniform.createMat4( osg.Matrix.create(), 'projection' );
        var modelview = osg.Uniform.createMat4( osg.Matrix.create(), 'camera' );


        var ucb = new CullCallback();
        var positionTextureFloat;
        ( function () {
            var positionTexture = new osg.Texture();
            var extension = Viewer.getState().getGraphicContext().getExtension( 'OES_texture_float' );
            if ( extension ) {
                positionTexture.setInternalFormatType( 'FLOAT' );
            }
            positionTexture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
            positionTexture.setMinFilter( 'NEAREST' );
            positionTexture.setMagFilter( 'NEAREST' );

            var positionRttCamera = createCameraRtt( positionTexture, group );
            positionRttCamera.getOrCreateStateSet().setAttributeAndModes( getPositionShader(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );

            var projection = osg.Uniform.createMat4( osg.Matrix.create(), 'projection' );
            positionRttCamera.setCullCallback( ucb );
            root.addChild( positionRttCamera );
            positionTextureFloat = positionTexture;
        } )();


        var depthTexture = new osg.Texture();
        ( function () {
            depthTexture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
            depthTexture.setMinFilter( 'NEAREST' );
            depthTexture.setMagFilter( 'NEAREST' );

            var positionRttCamera = createCameraRtt( depthTexture, group );
            positionRttCamera.getOrCreateStateSet().setAttributeAndModes( getDepthShader8(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );

            positionRttCamera.setName( 'MyCameraRTT' );

            root.addChild( positionRttCamera );
        } )();


        var textureResult = undefined;
        // reconstruction texture
        ( function () {

            var vtx = [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                'attribute vec3 Vertex;',
                'attribute vec2 TexCoord0;',
                'attribute vec3 TexCoord1;',
                'varying vec2 FragTexCoord0;',
                'varying vec3 FragTexCoord1;',
                'uniform mat4 ModelViewMatrix;',
                'uniform mat4 ProjectionMatrix;',
                'uniform mat4 projection;',
                'uniform mat4 camera;',
                'void main(void) {',
                '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
                '  FragTexCoord0 = TexCoord0;',
                '  FragTexCoord1 = TexCoord1;',
                '}',
                ''
            ].join( '\n' );

            var frg = [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                'varying vec2 FragTexCoord0;',
                'varying vec3 FragTexCoord1;',
                'uniform vec2 RenderSize;',
                'uniform sampler2D Texture0;',
                'uniform sampler2D Texture1;',
                'uniform mat4 projection;',
                'uniform mat4 camera;',

                pack,
                'void main() {',
                '  vec3 realPosition = texture2D(Texture1, FragTexCoord0).rgb;',

                '  float znear = projection[3][2] / (projection[2][2]-1.0);',
                '  float zfar = projection[3][2] / (projection[2][2]+1.0);',
                '  float zrange = zfar-znear;',

                '  vec3 cameraPosition = vec3(camera[3][0], camera[3][1], camera[3][2]);',
                '  //cameraPosition = vec3(camera[0][3], camera[1][3], camera[2][3]);',

                '  float decode = unpack4x8ToFloat(texture2D(Texture0, FragTexCoord0));',
                '  vec3 computedPos = FragTexCoord1*(decode*zrange+znear);//*zfar; //(decode*zrange + znear);',
                '  computedPos.z = -computedPos.z;',

                '  float zpos = ((-realPosition.z)-znear)/zrange;',

                '  //gl_FragColor = vec4(vec3(computedPos.z), 1.0);',
                '  //gl_FragColor = vec4(vec3(computedPos.z), 1.0);',
                '  //return;',

                '  //gl_FragColor = vec4(vec3(abs(decode - (-realPosition.z/zfar)))*100.0, 1.0);',
                '  gl_FragColor = vec4(vec3(abs(length(realPosition-(computedPos)))*100.0), 1.0);',
                '  //gl_FragColor = vec4(vec3(zpos), 1.0);',
                '  //gl_FragColor = vec4(vec3(abs(computedDist-realDist)*10.0/zrange), 1.0);',
                '  //gl_FragColor = vec4(vec3(decode), 1.0);',

                '  //vec3 dir = normalize(FragTexCoord1);',
                '  //dir[0] = 0.0;',
                '  //dir[1] = 20.0;',
                '  //dir[2] = 0.0;',
                '  //dir = normalize(dir);',
                '  //gl_FragColor = vec4(dir,1.0);',
                '  //gl_FragColor = packFloatTo4x8(realz/zfar);',
                '  //gl_FragColor = texture2D(Texture0, FragTexCoord0);',
                '  //gl_FragColor = vec4(0.0,0.0,0.0,1.0);',
                '}',
                ''
            ].join( '\n' );


            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vtx ),
                new osg.Shader( 'FRAGMENT_SHADER', frg ) );

            var EndCullCallback = function ( ucb,
                projection,
                modelview,
                geom ) {
                this._ucb = ucb;
                this._projection = projection;
                this._geom = geom;
                this._matrix = modelview;
            };
            EndCullCallback.prototype = {
                cull: function ( node, nv ) {

                    var matrix = this._ucb._projection;
                    var znear = matrix[ 12 + 2 ] / ( matrix[ 8 + 2 ] - 1.0 );
                    var zfar = matrix[ 12 + 2 ] / ( matrix[ 8 + 2 ] + 1.0 );
                    //osg.log('znear ' + znear + ' zfar ' + zfar);


                    osg.Matrix.copy( this._ucb._projection, this._projection.get() );
                    osg.Matrix.copy( this._ucb._modelview, this._matrix.get() );
                    this._projection.dirty();
                    this._matrix.dirty();

                    var coord = this._geom.getAttributes().TexCoord1.getElements();
                    var vectorsTmp = [];
                    osg.Matrix.computeFrustumCornersVectors( this._projection.get(), vectorsTmp );
                    var vectors = [];
                    vectors[ 0 ] = vectorsTmp[ 0 ];
                    vectors[ 1 ] = vectorsTmp[ 1 ];
                    vectors[ 2 ] = vectorsTmp[ 2 ];
                    vectors[ 3 ] = vectorsTmp[ 3 ];

                    for ( var i = 0; i < 4; i++ ) {
                        var vec = osg.Matrix.transform3x3( this._matrix.get(), vectors[ i ], [] );
                        // disable the rotation
                        vec = vectors[ i ];
                        coord[ i * 3 + 0 ] = vec[ 0 ];
                        coord[ i * 3 + 1 ] = vec[ 1 ];
                        coord[ i * 3 + 2 ] = vec[ 2 ];
                    }
                    //this._geom.dirty();
                    return true;
                }
            };

            var w, h;
            w = textureSize[ 0 ];
            h = textureSize[ 1 ];
            var quad = osg.createTexturedQuadGeometry( -w / 2, -h / 2, 0,
                w, 0, 0,
                0, h, 0 );
            quad.getAttributes().TexCoord1 = new osg.BufferArray( 'ARRAY_BUFFER', [ 0, 0, 0,
                0, 0, 0,
                0, 0, 0,
                0, 0, 0
            ], 3 );
            //quad.setCullCallback(new cullCallback(projection,ucb._modelview, quad));
            quad.getOrCreateStateSet().setAttributeAndModes( program );
            quad.getOrCreateStateSet().addUniform( modelview );
            quad.getOrCreateStateSet().addUniform( projection );
            quad.getOrCreateStateSet().setTextureAttributeAndModes( 0, depthTexture );
            quad.getOrCreateStateSet().setTextureAttributeAndModes( 1, positionTextureFloat );
            var camera = new osg.Camera();
            //camera.setStateSet(element.filter.getStateSet());

            var vp = new osg.Viewport( 0, 0, w, h );

            camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
            camera.setViewport( vp );
            osg.Matrix.makeOrtho( -w / 2, w / 2, -h / 2, h / 2, -5, 5, camera.getProjectionMatrix() );

            var texture = new osg.Texture();
            texture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
            texture.setMinFilter( 'NEAREST' );
            texture.setMagFilter( 'NEAREST' );

            camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
            camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, texture, 0 );
            camera.addChild( quad );

            root.addChild( camera );

            textureResult = texture;

            quad.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );
            quad.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'Texture1' ) );

            var cb = new EndCullCallback( ucb, projection, modelview, quad );

            var draw = Viewer.draw;
            var newdraw = function () {
                cb.cull();
                draw.call( this );
            };
            Viewer.draw = newdraw;


        } )();
        var composer = new osgUtil.Composer();
        root.addChild( composer );


        var w2, h2;
        w2 = textureSize[ 0 ];
        h2 = textureSize[ 1 ];

        var checkDepth = new osgUtil.Composer.Filter.Custom( [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'uniform sampler2D depthTexture;',
            'varying vec2 FragTexCoord0;',
            pack,
            'void main() {',
            '  gl_FragColor = texture2D(depthTexture, FragTexCoord0);',
            '}',
            ''
        ].join( '\n' ), {
            'depthTexture': textureResult,
        } );

        composer.getOrCreateStateSet().addUniform( projection, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

        composer.addPass( checkDepth );
        composer.renderToScreen( w, h );
        composer.build();

        model.dirtyBound();
        Viewer.getManipulator().computeHomePosition();


    }, function ( reject ) {
        osg.log( 'Fails' );
    } );
    return root;
}


function createSceneOptimized( width, height ) {
    var root = new osg.Node();

    Q.when( getModel() ).then( function ( model ) {

        var group = new osg.Node();

        var size = 10;
        var ground = osg.createTexturedQuadGeometry( 0 - size / 2, 0 - size / 2.0, -2,
            size, 0, 0,
            0, size, 0 );
        ground.setName( 'plane geometry' );
        group.addChild( model );

        var w, h;
        w = width;
        h = height;
        var textureSize = [ w, h ];


        var projection = osg.Uniform.createMat4( osg.Matrix.create(), 'projection' );
        var modelview = osg.Uniform.createMat4( osg.Matrix.create(), 'camera' );
        var ucb = new CullCallback( projection, modelview );

        group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );
        group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'Texture1' ) );

        // generate depth
        var textureDepth;
        ( function () {

            var texture = new osg.Texture();
            texture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
            texture.setMinFilter( 'NEAREST' );
            texture.setMagFilter( 'NEAREST' );

            var rtt = createCameraRtt( texture, group );
            rtt.getOrCreateStateSet().setAttributeAndModes( getDepthShader8(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );

            rtt.setName( 'generateDepth' );
            rtt.setCullCallback( ucb ); // get camera information

            root.addChild( rtt );
            textureDepth = texture;
        } )();


        // generate normals
        var textureNormal;
        ( function () {

            var texture = new osg.Texture();
            texture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
            texture.setMinFilter( 'NEAREST' );
            texture.setMagFilter( 'NEAREST' );

            var rtt = createCameraRtt( texture, group );
            rtt.getOrCreateStateSet().setAttributeAndModes( getNormalShaderSphereMapTransform(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );

            rtt.setName( 'generateNormal' );
            root.addChild( rtt );

            textureNormal = texture;
        } )();


        var textureColor = new osg.Texture();
        ( function () {
            textureColor.setTextureSize( w, h );
            textureColor.setMinFilter( 'LINEAR' );
            textureColor.setMagFilter( 'LINEAR' );

            var sceneRttColor = createCameraRtt( textureColor, group );
            root.addChild( sceneRttColor );
        } )();

        var composer = new osgUtil.Composer();
        root.addChild( composer );

        var ssao = new osgUtil.Composer.Filter.SSAO8( {
            normal: textureNormal,
            position: textureDepth,
            radius: 0.1
        } );
        composer.getOrCreateStateSet().addUniform( projection, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
        composer.getOrCreateStateSet().addUniform( modelview, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
        ssao._texCoord1 = new osg.BufferArray( 'ARRAY_BUFFER', [ 0, 0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0
        ], 3 );


        var w2, h2;
        w2 = textureSize[ 0 ];
        h2 = textureSize[ 1 ];

        var blurSize = 5;
        var blurV = new osgUtil.Composer.Filter.BilateralVBlur( {
            'nbSamples': blurSize,
            'depthTexture': textureDepth,
            'radius': 0.1
        } );

        var blurH = new osgUtil.Composer.Filter.BilateralHBlur( {
            'nbSamples': blurSize,
            'depthTexture': textureDepth,
            'radius': 0.1
        } );

        composer.addPass( ssao );
        composer.addPass( blurV, w2, h2 );
        composer.addPass( blurH, w2, h2 );

        composer.addPass( new osgUtil.Composer.Filter.BlendMultiply( textureColor ), w, h );
        composer.renderToScreen( w, h );
        composer.build();

        if ( false ) {

            osgUtil.ParameterVisitor.createSlider( {
                min: 4,
                max: 64,
                step: 2,
                value: 16,
                name: 'nbSamples',
                object: ssao,
                field: '_nbSamples',
                onchange: function () {
                    ssao.dirty();
                },
                html: document.getElementById( 'parameters' )
            } );
        }


        if ( false ) {
            osgUtil.ParameterVisitor.createSlider( {
                min: 1,
                max: 10,
                step: 1,
                value: 2,
                name: 'ssaoNoise',
                object: ssao,
                field: '_noiseTextureSize',
                onchange: function ( value ) {
                    // fix to a power of two
                    ssao._noiseTextureSize = Math.pow( 2, value );
                    ssao._noiseTextureSize = Math.min( ssao._noiseTextureSize, 512 );
                    ssao.dirty();
                },
                html: document.getElementById( 'parameters' )
            } );
        }
        if ( false ) {

            osgUtil.ParameterVisitor.createSlider( {
                min: 0.0,
                max: 1.0,
                step: 0.01,
                value: 0.0,
                name: 'angleThreshold',
                object: ssao,
                field: '_angleLimit',
                onchange: function () {
                    ssao.dirty();
                },
                html: document.getElementById( 'parameters' )
            } );
        }

        if ( false ) {

            osgUtil.ParameterVisitor.createSlider( {
                min: 1,
                max: 15,
                step: 1,
                value: 3,
                name: 'blurNbSamples',
                object: blurH,
                field: '_nbSamples',
                onchange: function ( value ) {
                    blurV.setBlurSize( value );
                    blurH.setBlurSize( value );
                },
                html: document.getElementById( 'parameters' )
            } );
        }

        if ( false ) {

            osgUtil.ParameterVisitor.createSlider( {
                min: 1,
                max: 8,
                step: 0.5,
                value: 1,
                name: 'blurPixelDistance',
                object: blurH,
                field: '_pixelSize',
                onchange: function ( value ) {
                    blurV.setPixelSize( value );
                    blurH.setPixelSize( value );
                },
                html: document.getElementById( 'parameters' )
            } );
        }

        var radiusDepth = {
            radius: 0.1
        };
        var minRadius = parseFloat( ( model.getBound().radius() * 0.005 ).toFixed( 5 ) );
        var maxRadius = parseFloat( ( model.getBound().radius() * 0.05 ).toFixed( 5 ) );
        if ( false ) {
            osgUtil.ParameterVisitor.createSlider( {
                min: minRadius,
                max: maxRadius,
                step: 0.002,
                value: minRadius,
                object: radiusDepth,
                field: 'radius',
                name: 'radius',
                onchange: function ( value ) {
                    ssao.setRadius( value );
                    ssao.dirty();

                    blurV.setRadius( value );
                    blurH.setRadius( value );
                },
                html: document.getElementById( 'parameters' )
            } );
        }

        if ( false ) {
            osgUtil.ParameterVisitor.createSlider( {
                min: 0.1,
                max: 16.0,
                step: 0.1,
                value: 1.0,
                name: 'power',
                onchange: function ( value ) {
                    ssao.setPower( value );
                },
                html: document.getElementById( 'parameters' )
            } );
        }


        var params = new osgUtil.ParameterVisitor();
        params.setTargetHTML( document.getElementById( 'parameters' ) );
        composer.accept( params );

        var EndCullCallback = function ( ucb,
            projection,
            modelview,
            array ) {
            this._ucb = ucb;
            this._projection = projection;
            this._array = array;
            this._matrix = modelview;
        };
        EndCullCallback.prototype = {
            cull: function ( node, nv ) {

                var matrix = this._ucb._projection;
                var znear = matrix[ 12 + 2 ] / ( matrix[ 8 + 2 ] - 1.0 );
                var zfar = matrix[ 12 + 2 ] / ( matrix[ 8 + 2 ] + 1.0 );
                //osg.log('znear ' + znear + ' zfar ' + zfar);

                osg.Matrix.copy( this._ucb._projection, this._projection.get() );
                osg.Matrix.copy( this._ucb._modelview, this._matrix.get() );
                this._projection.dirty();
                this._matrix.dirty();

                var coord = this._array.getElements();
                var vectorsTmp = [];
                osg.Matrix.computeFrustumCornersVectors( this._projection.get(), vectorsTmp );
                var vectors = [];
                vectors[ 0 ] = vectorsTmp[ 0 ];
                vectors[ 1 ] = vectorsTmp[ 1 ];
                vectors[ 2 ] = vectorsTmp[ 2 ];
                vectors[ 3 ] = vectorsTmp[ 3 ];

                for ( var i = 0; i < 4; i++ ) {
                    var vec = osg.Matrix.transform3x3( this._matrix.get(), vectors[ i ], [] );
                    vec = vectors[ i ];
                    coord[ i * 3 + 0 ] = vec[ 0 ];
                    coord[ i * 3 + 1 ] = vec[ 1 ];
                    coord[ i * 3 + 2 ] = vec[ 2 ];
                }
                //this._geom.dirty();
                return true;
            }
        };

        var cb = new EndCullCallback( ucb, projection, modelview, ssao._texCoord1 );

        var draw = Viewer.draw;
        var newdraw = function () {
            cb.cull();
            draw.call( this );
        };
        Viewer.draw = newdraw;

        model.dirtyBound();
        Viewer.getManipulator().computeHomePosition();


    }, function ( reject ) {
        osg.log( 'Fails' );
    } );
    return root;
}

var createScene = createSceneOptimized; //createSceneTestReconstructPosition; //createSceneTestDepth;
window.addEventListener( 'load', main, true );
