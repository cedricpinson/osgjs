( function () {
    'use strict';

    var getOgre = window.getOgre;
    var P = window.P;
    var OSG = window.OSG;
    OSG.globalify();
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgViewer = OSG.osgViewer;

    // http://www.opengl.org/resources/code/samples/advanced/advanced97/notes/node100.html
    function createShadowMatrix( ground, light, shadowMat ) {
        var dot;
        if ( shadowMat === undefined ) {
            shadowMat = [];
        }

        dot = ground[ 0 ] * light[ 0 ] +
            ground[ 1 ] * light[ 1 ] +
            ground[ 2 ] * light[ 2 ] +
            ground[ 3 ] * light[ 3 ];

        shadowMat[ 0 ] = dot - light[ 0 ] * ground[ 0 ];
        shadowMat[ 4 ] = 0.0 - light[ 0 ] * ground[ 1 ];
        shadowMat[ 8 ] = 0.0 - light[ 0 ] * ground[ 2 ];
        shadowMat[ 12 ] = 0.0 - light[ 0 ] * ground[ 3 ];

        shadowMat[ 1 ] = 0.0 - light[ 1 ] * ground[ 0 ];
        shadowMat[ 5 ] = dot - light[ 1 ] * ground[ 1 ];
        shadowMat[ 9 ] = 0.0 - light[ 1 ] * ground[ 2 ];
        shadowMat[ 13 ] = 0.0 - light[ 1 ] * ground[ 3 ];

        shadowMat[ 2 ] = 0.0 - light[ 2 ] * ground[ 0 ];
        shadowMat[ 6 ] = 0.0 - light[ 2 ] * ground[ 1 ];
        shadowMat[ 10 ] = dot - light[ 2 ] * ground[ 2 ];
        shadowMat[ 14 ] = 0.0 - light[ 2 ] * ground[ 3 ];

        shadowMat[ 3 ] = 0.0 - light[ 3 ] * ground[ 0 ];
        shadowMat[ 7 ] = 0.0 - light[ 3 ] * ground[ 1 ];
        shadowMat[ 11 ] = 0.0 - light[ 3 ] * ground[ 2 ];
        shadowMat[ 15 ] = dot - light[ 3 ] * ground[ 3 ];

        return shadowMat;
    }

    var LightUpdateCallback = function ( matrix ) {
        this.matrix = matrix;
    };
    LightUpdateCallback.prototype = {
        update: function ( node, nv ) {
            var currentTime = nv.getFrameStamp().getSimulationTime();

            var x = 50 * Math.cos( currentTime );
            var y = 50 * Math.sin( currentTime );
            var h = 80;

            createShadowMatrix( [ 0, 0, 1, 5 ], [ x, y, h, 1 ],
                this.matrix );
            node.lightShadow.setPosition( [ x, y, h, 0 ] );
            node.traverse( nv );
        }
    };


    function createProjectedShadowScene( model ) {
        var root = new osg.MatrixTransform();
        var shadowNode = new osg.MatrixTransform();
        shadowNode.addChild( model );

        var light = new osg.MatrixTransform();
        light.lightShadow = new osg.Light();
        light.setUpdateCallback( new LightUpdateCallback( shadowNode.getMatrix() ) );
        light.getOrCreateStateSet().setAttributeAndModes( light.lightShadow );

        shadowNode.getOrCreateStateSet().setTextureAttributeAndModes( 0, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE );
        shadowNode.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE );
        var materialDisabled = new osg.Material();
        materialDisabled.setEmission( [ 0, 0, 0, 1 ] );
        materialDisabled.setAmbient( [ 0, 0, 0, 1 ] );
        materialDisabled.setDiffuse( [ 0, 0, 0, 1 ] );
        materialDisabled.setSpecular( [ 0, 0, 0, 1 ] );
        shadowNode.getOrCreateStateSet().setAttributeAndModes( materialDisabled, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

        light.addChild( model );
        root.addChild( light );
        root.addChild( shadowNode );

        return root;
    }


    function getTextureProjectedShadowShader() {
        var vertexshader = [
            '',
            'attribute vec3 Vertex;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'uniform vec4 fragColor;',
            'uniform mat4 ModelViewShadow;',
            'uniform mat4 ProjectionShadow;',
            'varying vec4 ShadowUVProjected;',
            'void main(void) {',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '  vec4 uv = (ProjectionShadow * ModelViewShadow * vec4(Vertex,1.0));',
            '  ShadowUVProjected = uv;',
            '}',
            ''
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'uniform vec4 fragColor;',
            'uniform sampler2D Texture0;',
            'varying vec4 ShadowUVProjected;',
            'void main(void) {',
            '  gl_FragColor = texture2DProj( Texture0, ShadowUVProjected);',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    }

    function getBlurrShader() {
        var vertexshader = [
            '',
            'attribute vec3 Vertex;',
            'attribute vec2 TexCoord0;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'varying vec2 uv0;',
            'void main(void) {',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '  uv0 = TexCoord0;',
            '}',
            ''
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'uniform sampler2D Texture0;',
            'varying vec2 uv0;',
            'const float shift = 1.0/512.0;',
            'vec4 getSmoothTexelFilter(vec2 uv) {',
            '  vec4 c = texture2D( Texture0,  uv);',
            '  c += texture2D( Texture0, uv+vec2(0,shift));',
            '  c += texture2D( Texture0, uv+vec2(shift,shift));',
            '  c += texture2D( Texture0, uv+vec2(shift,0));',
            '  c += texture2D( Texture0, uv+vec2(shift,-shift));',
            '  c += texture2D( Texture0, uv+vec2(0,-shift));',
            '  c += texture2D( Texture0, uv+vec2(-shift,-shift));',
            '  c += texture2D( Texture0, uv+vec2(-shift,0));',
            '  c += texture2D( Texture0, uv+vec2(-shift,shift));',
            '  return c/9.0;',
            '}',
            'void main(void) {',
            '   gl_FragColor = getSmoothTexelFilter( uv0);',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    }


    var LightUpdateCallbackProjectedTexture = function ( options ) {
        this.projectionShadow = options.projectionShadow;
        this.modelviewShadow = options.modelViewShadow;
        this.shadowScene = options.shadowScene;
        this.camera = options.camera;
    };
    LightUpdateCallbackProjectedTexture.prototype = {
        update: function ( node, nv ) {
            var currentTime = nv.getFrameStamp().getSimulationTime();

            var x = 50 * Math.cos( currentTime );
            var y = 50 * Math.sin( currentTime );
            var h = 80;
            //osg.Matrix.makeTranslate(x ,y,h, node.getMatrix());

            var matrixList = node.parents[ 0 ].getWorldMatrices();
            var worldMatrix = matrixList[ 0 ];

            var worldCameraPosition = osg.Matrix.transformVec3( worldMatrix, [ x, y, 80 ], [] );
            var worldCameraTarget = osg.Matrix.transformVec3( worldMatrix, [ 0, 0, -5 ], [] );

            osg.Matrix.makeLookAt( worldCameraPosition, worldCameraTarget, [ 0, -1, 0 ], this.camera.getViewMatrix() );

            var biasScale = osg.Matrix.preMult( osg.Matrix.makeTranslate( 0.5, 0.5, 0.5, [] ), osg.Matrix.makeScale( 0.5, 0.5, 0.5, [] ) );
            var shadowProj = osg.Matrix.copy( this.camera.getProjectionMatrix(), [] );
            osg.Matrix.postMult( biasScale, shadowProj );

            this.shadowScene.setMatrix( worldMatrix );
            var shadowView = osg.Matrix.mult( this.camera.getViewMatrix(), worldMatrix, [] );

            this.projectionShadow.setMatrix4( shadowProj );
            this.modelviewShadow.setMatrix4( shadowView );
            node.lightShadow.setPosition( [ x, y, h, 0 ] );
            node.traverse( nv );
        }
    };

    function createTextureProjectedShadowScene( model ) {
        var root = new osg.MatrixTransform();
        var shadowNode = new osg.MatrixTransform();
        shadowNode.addChild( model );

        var light = new osg.MatrixTransform();
        var rtt = new osg.Camera();
        rtt.setName( 'rtt_camera' );
        var rttSize = [ 512, 512 ];

        osg.Matrix.makePerspective( 15, 1, 1.0, 1000.0, rtt.getProjectionMatrix() );
        osg.Matrix.makeLookAt( [ 0, 0, 80 ], [ 0, 0, 0 ], [ 0, 1, 0 ], rtt.getViewMatrix() );
        rtt.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
        rtt.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
        rtt.setViewport( new osg.Viewport( 0, 0, rttSize[ 0 ], rttSize[ 1 ] ) );
        rtt.setClearColor( [ 0, 0, 0, 0 ] );

        var matDark = new osg.Material();
        var black = [ 0, 0, 0, 1 ];
        matDark.setEmission( black );
        matDark.setAmbient( black );
        matDark.setDiffuse( black );
        matDark.setSpecular( black );
        shadowNode.getOrCreateStateSet().setAttributeAndModes( matDark, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

        var rttTexture = new osg.Texture();
        rttTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
        rttTexture.setMinFilter( 'LINEAR' );
        rttTexture.setMagFilter( 'LINEAR' );
        rtt.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, rttTexture, 0 );
        rtt.addChild( shadowNode );
        light.addChild( rtt );

        light.lightShadow = new osg.Light();
        light.getOrCreateStateSet().setAttributeAndModes( light.lightShadow );

        var q = osg.createTexturedQuadGeometry( -10, -10, -5.0,
            20, 0, 0,
            0, 20, 0 );
        q.getOrCreateStateSet().setAttributeAndModes( new osg.BlendFunc( 'ONE', 'ONE_MINUS_SRC_ALPHA' ) );
        q.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'LESS', 0.0, 1.0, false ) );

        q.getOrCreateStateSet().setTextureAttributeAndModes( 0, rttTexture );
        q.getOrCreateStateSet().setAttributeAndModes( getTextureProjectedShadowShader() );
        var projectionShadow = new osg.Uniform.createMatrix4( osg.Matrix.create(), 'ProjectionShadow' );
        var modelViewShadow = new osg.Uniform.createMatrix4( osg.Matrix.create(), 'ModelViewShadow' );
        q.getOrCreateStateSet().addUniform( projectionShadow );

        q.getOrCreateStateSet().addUniform( modelViewShadow );
        light.setUpdateCallback( new LightUpdateCallbackProjectedTexture( {
            'projectionShadow': projectionShadow,
            'modelViewShadow': modelViewShadow,
            'camera': rtt,
            'shadowScene': shadowNode
        } ) );


        var blurr = new osg.Camera();
        osg.Matrix.makeOrtho( 0, rttSize[ 0 ], 0, rttSize[ 1 ], -5, 5, blurr.getProjectionMatrix() );
        blurr.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
        blurr.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
        blurr.setViewport( new osg.Viewport( 0, 0, rttSize[ 0 ], rttSize[ 1 ] ) );
        var quad = osg.createTexturedQuadGeometry( 0, 0, 0,
            rttSize[ 0 ], 0, 0,
            0, rttSize[ 1 ], 0 );
        quad.getOrCreateStateSet().setTextureAttributeAndModes( 0, rttTexture );
        quad.getOrCreateStateSet().setAttributeAndModes( getBlurrShader() );
        var blurredTexture = new osg.Texture();
        blurredTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
        blurredTexture.setMinFilter( 'LINEAR' );
        blurredTexture.setMagFilter( 'LINEAR' );
        blurr.setClearColor( [ 0, 0, 0, 0 ] );
        blurr.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, blurredTexture, 0 );
        blurr.addChild( quad );

        // the one used for the final
        q.getOrCreateStateSet().setTextureAttributeAndModes( 0, blurredTexture );

        //root.addChild(model);
        root.addChild( light );
        light.addChild( model );
        root.addChild( blurr );
        root.addChild( q );

        return root;
    }



    function getShadowMapShaderLight() {
        var vertexshader = [
            '',
            'attribute vec3 Vertex;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'varying float z;',
            'void main(void) {',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '  z = (ModelViewMatrix * vec4(Vertex,1.0)).z;',
            '}',
            ''
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'varying float z;',
            'uniform float nearShadow;',
            'uniform float farShadow;',
            'vec4 pack2(float value) {',
            '  return vec4(floor(value * 256.0)/255.0, floor(fract(value * 256.0) * 256.0)/255.0 , floor(fract(value * 65536.0) * 256.0)/255.0, 0.0);',
            '}',
            'vec4 pack(float value){',
            '    float depth = value;',
            '    float depth1 = depth*255.0*255.0;',
            '    float depth2 = (depth*depth)*255.0*255.0;',
            '    return vec4(',
            '        mod(depth1, 255.0)/255.0,',
            '        floor(depth1/255.0)/255.0,',
            '        mod(depth2, 255.0)/255.0,',
            '        floor(depth2/255.0)/255.0',
            '    );',
            '}',
            'void main(void) {',
            '  //gl_FragColor = pack(((-z) - nearShadow)/ (farShadow-nearShadow));',
            '  gl_FragColor = pack2(((-z) - nearShadow)/ (farShadow-nearShadow));',
            '  //gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    }

    function getOgreShadowMapShader() {
        var vertexshader = [
            'attribute vec3 Vertex;',
            'attribute vec3 Normal;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'uniform mat4 NormalMatrix;',
            'uniform vec4 MaterialAmbient;',
            'uniform vec4 MaterialDiffuse;',
            'uniform vec4 MaterialSpecular;',
            'uniform vec4 MaterialEmission;',
            'uniform float MaterialShininess;',
            'vec4 Ambient;',
            'vec4 Diffuse;',
            'vec4 Specular;',
            '',
            'attribute vec2 TexCoord0;',
            'varying vec2 FragTexCoord0;',
            'varying vec4 LightColor;',
            'vec3 EyeVector;',
            'vec3 NormalComputed;',
            '',
            '',
            'uniform bool Light0_enabled;',
            'uniform vec4 Light0_uniform_ambient;',
            'uniform vec4 Light0_uniform_diffuse;',
            'uniform vec4 Light0_uniform_specular;',
            'uniform vec4 Light0_uniform_position;',
            'uniform float Light0_uniform_constantAttenuation;',
            'uniform float Light0_uniform_linearAttenuation;',
            'uniform float Light0_uniform_quadraticAttenuation;',
            '',
            '',
            '// shadow stuff',
            'uniform mat4 ProjectionShadow;',
            'uniform mat4 ModelViewShadow;',
            'uniform float nearShadow;',
            'uniform float farShadow;',
            'varying vec4 shadowVertexProjected;',
            'varying float shadowZ;',
            '',
            'vec4 ftransform() {',
            'return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);',
            '}',
            'vec3 computeNormal() {',
            'return vec3(NormalMatrix * vec4(Normal, 0.0));',
            '}',
            '',
            'vec3 computeEyeDirection() {',
            'return vec3(ModelViewMatrix * vec4(Vertex,1.0));',
            '}',
            '',
            'void directionalLight(in vec3 lightDirection, in vec3 lightHalfVector, in float constantAttenuation, in float linearAttenuation, in float quadraticAttenuation, in vec4 ambient, in vec4 diffuse,in vec4 specular, in vec3 normal)',
            '{',
            'float nDotVP;         // normal . light direction',
            'float nDotHV;         // normal . light half vector',
            'float pf;             // power factor',
            '',
            'nDotVP = max(0.0, dot(normal, normalize(lightDirection)));',
            'nDotHV = max(0.0, dot(normal, lightHalfVector));',
            '',
            'if (nDotHV == 0.0)',
            '{',
            'pf = 0.0;',
            '}',
            'else',
            '{',
            'pf = pow(nDotHV, MaterialShininess);',
            '}',
            'Ambient  += ambient;',
            'Diffuse  += diffuse * nDotVP;',
            'Specular += specular * pf;',
            '}',
            '',
            'void flight(in vec3 lightDirection, in float constantAttenuation, in float linearAttenuation, in float quadraticAttenuation, in vec4 ambient, in vec4 diffuse, in vec4 specular, in vec3 normal)',
            '{',
            'vec4 localColor;',
            'vec3 lightHalfVector = normalize(EyeVector-lightDirection);',
            '// Clear the light intensity accumulators',
            'Ambient  = vec4 (0.0);',
            'Diffuse  = vec4 (0.0);',
            'Specular = vec4 (0.0);',
            '',
            'directionalLight(lightDirection, lightHalfVector, constantAttenuation, linearAttenuation, quadraticAttenuation, ambient, diffuse, specular, normal);',
            '',
            'vec4 sceneColor = vec4(0,0,0,0);',
            'localColor = sceneColor +',
            'MaterialEmission +',
            'Ambient  * MaterialAmbient +',
            'Diffuse  * MaterialDiffuse;',
            '//Specular * MaterialSpecular;',
            'localColor = clamp( localColor, 0.0, 1.0 );',
            'LightColor += localColor;',
            '}',
            '',
            'void computeShadowElements() {',
            'vec4 shadowPosition = ModelViewShadow * vec4(Vertex,1.0);',
            'shadowVertexProjected = ProjectionShadow * shadowPosition;',
            'shadowZ = (-shadowPosition.z - nearShadow)/(farShadow-nearShadow);',
            '}',
            '',
            'void main(void) {',
            'gl_Position = ftransform();',
            '',
            'EyeVector = computeEyeDirection();',
            'NormalComputed = computeNormal();',
            'LightColor = vec4(0,0,0,0);',
            '',
            '//if (Light0_enabled) {',
            'if (true) {',
            'vec3 Light0_directionNormalized = normalize(vec3(Light0_uniform_position));',
            'float Light0_NdotL = max(dot(Normal, Light0_directionNormalized), 0.0);',
            'flight(Light0_directionNormalized, Light0_uniform_constantAttenuation, Light0_uniform_linearAttenuation, Light0_uniform_quadraticAttenuation, Light0_uniform_ambient, Light0_uniform_diffuse, Light0_uniform_specular, NormalComputed );',
            '}',
            '',
            'FragTexCoord0 = TexCoord0;',
            'computeShadowElements();',
            '}',
        ].join( '\n' );

        var fragmentshader = [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'vec4 fragColor;',
            'varying vec4 LightColor;',
            'uniform int ground;',
            'uniform sampler2D Texture0;',
            'uniform sampler2D Texture1;',
            'varying vec4 shadowVertexProjected;',
            'varying float shadowZ;',
            'varying vec2 FragTexCoord0;',
            '',
            'float unpack2(vec4 depth) {',
            'return depth[0] * 255.0 / 256.0 + depth[1] * 255.0 / (256.0 * 256.0) + depth[2] * 255.0 / (256.0 * 256.0 * 256.0);',
            '}',
            '',
            'float getShadowedTerm(vec2 uv) {',
            '   float d = shadowZ - unpack2(texture2D(Texture1, uv ));',
            '   return (d >= 0.01 ) ? (1.0) : (0.0);',
            '}',
            'float computeShadowTerm() {',
            'vec4 uv = shadowVertexProjected;',
            'vec2 shadowUV = (uv.xy/uv.w).xy;',
            'float shadowed = 0.0;',
            '#if 1',
            'vec2 fetch[16];',
            'fetch[0] = shadowUV.xy + vec2(-1.5, -1.5)/vec2(510.0, 510.0);',
            'fetch[1] = shadowUV.xy + vec2(-0.5, -1.5)/vec2(510.0, 510.0);',
            'fetch[2] = shadowUV.xy + vec2(0.5, -1.5)/vec2(510.0, 510.0);',
            'fetch[3] = shadowUV.xy + vec2(1.5, -1.5)/vec2(510.0, 510.0);',
            'fetch[4] = shadowUV.xy + vec2(-1.5, -0.5)/vec2(510.0, 510.0);',
            'fetch[5] = shadowUV.xy + vec2(-0.5, -0.5)/vec2(510.0, 510.0);',
            'fetch[6] = shadowUV.xy + vec2(0.5, -0.5)/vec2(510.0, 510.0);',
            'fetch[7] = shadowUV.xy + vec2(1.5, -0.5)/vec2(510.0, 510.0);',
            'fetch[8] = shadowUV.xy + vec2(-1.5, 0.5)/vec2(510.0, 510.0);',
            'fetch[9] = shadowUV.xy + vec2(-0.5, 0.5)/vec2(510.0, 510.0);',
            'fetch[10] = shadowUV.xy + vec2(0.5, 0.5)/vec2(510.0, 510.0);',
            'fetch[11] = shadowUV.xy + vec2(1.5, 0.5)/vec2(510.0, 510.0);',
            'fetch[12] = shadowUV.xy + vec2(-1.5, 1.5)/vec2(510.0, 510.0);',
            'fetch[13] = shadowUV.xy + vec2(-0.5, 1.5)/vec2(510.0, 510.0);',
            'fetch[14] = shadowUV.xy + vec2(0.5, 1.5)/vec2(510.0, 510.0);',
            'fetch[15] = shadowUV.xy + vec2(1.5, 1.5)/vec2(510.0, 510.0);',
            '#if 1 // inline',
            'shadowed += getShadowedTerm(fetch[0]);',
            'shadowed += getShadowedTerm(fetch[1]);',
            'shadowed += getShadowedTerm(fetch[2]);',
            'shadowed += getShadowedTerm(fetch[3]);',
            'shadowed += getShadowedTerm(fetch[4]);',
            'shadowed += getShadowedTerm(fetch[5]);',
            'shadowed += getShadowedTerm(fetch[6]);',
            'shadowed += getShadowedTerm(fetch[7]);',
            'shadowed += getShadowedTerm(fetch[8]);',
            'shadowed += getShadowedTerm(fetch[9]);',
            'shadowed += getShadowedTerm(fetch[10]);',
            'shadowed += getShadowedTerm(fetch[11]);',
            'shadowed += getShadowedTerm(fetch[12]);',
            'shadowed += getShadowedTerm(fetch[13]);',
            'shadowed += getShadowedTerm(fetch[14]);',
            'shadowed += getShadowedTerm(fetch[15]);',
            'shadowed /= 16.0;',
            '#else',
            'for (int i = 0; i < 16; i++)',
            '   shadowed += getShadowedTerm(fetch[i]);',
            '#endif',
            '#else',
            '       // only one fetch to debug',
            '       shadowed += getShadowedTerm(shadowUV.xy);',
            '#endif',

            'return shadowed;',
            '}',
            '',
            'void main(void) {',
            'fragColor = texture2D( Texture0, FragTexCoord0.xy );',
            '',
            'fragColor *= LightColor;',
            '//fragColor = vec4(1,1,1,1);',
            'float dark = computeShadowTerm();',
            'fragColor.xyz *= 0.5 + (0.5* (1.0-dark));',
            'fragColor.w = 1.0;',
            ' if (ground == 1) {',
            'fragColor.w = dark;',
            '}',
            '//fragColor = vec4(unpack2(texture2D(Texture1, FragTexCoord0 )));',
            '//gl_FragColor = vec4(1.0,0.0,1.0,1.0); //fragColor;',
            'gl_FragColor = fragColor;',
            '}',
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    }


    var LightUpdateCallbackShadowMap = function ( options ) {
        this.projectionShadow = options.projectionShadow;
        this.modelviewShadow = options.modelViewShadow;
        this.shadowScene = options.shadowScene;
        this.camera = options.camera;
    };
    LightUpdateCallbackShadowMap.prototype = {
        update: function ( node, nv ) {
            var currentTime = nv.getFrameStamp().getSimulationTime();

            var x = 50 * Math.cos( currentTime );
            var y = 50 * Math.sin( currentTime );
            var h = 80;
            osg.Matrix.makeTranslate( x, y, h, node.getMatrix() );

            var matrixList = node.parents[ 0 ].getWorldMatrices();
            var worldMatrix = matrixList[ 0 ];

            var worldCameraPosition = osg.Matrix.transformVec3( worldMatrix, [ x, y, 80 ], [] );
            var worldCameraTarget = osg.Matrix.transformVec3( worldMatrix, [ 0, 0, -5 ], [] );

            osg.Matrix.makeLookAt( worldCameraPosition, worldCameraTarget, [ 0, -1, 0 ], this.camera.getViewMatrix() );

            var biasScale = osg.Matrix.preMult( osg.Matrix.makeTranslate( 0.5, 0.5, 0.5, [] ), osg.Matrix.makeScale( 0.5, 0.5, 0.5, [] ) );
            var shadowProj = osg.Matrix.copy( this.camera.getProjectionMatrix(), [] );
            osg.Matrix.postMult( biasScale, shadowProj );

            this.shadowScene.setMatrix( worldMatrix );
            var shadowView = osg.Matrix.mult( this.camera.getViewMatrix(), worldMatrix, [] );

            this.projectionShadow.setMatrix4( shadowProj );
            this.modelviewShadow.setMatrix4( shadowView );
            node.lightShadow.setPosition( [ x, y, h, 0 ] );
            node.traverse( nv );
        }
    };

    function createShadowMapScene( model ) {
        var root = new osg.MatrixTransform();

        var models = new osg.Node();
        models.addChild( model );
        var scene = new osg.Node();
        scene.addChild( models );

        var shadowScene = new osg.MatrixTransform();
        shadowScene.addChild( models );


        var light = new osg.MatrixTransform();

        var rtt = new osg.Camera();
        rtt.setName( 'rtt_camera' );
        var rttSize = [ 512, 512 ];

        scene.getOrCreateStateSet().setAttributeAndModes( new osg.BlendFunc( 'ONE', 'ONE_MINUS_SRC_ALPHA' ) );

        // important because we use linear zbuffer
        var near = 70.0;
        var far = 110.0;

        var nearShadow = new osg.Uniform.createFloat1( near, 'nearShadow' );
        var farShadow = new osg.Uniform.createFloat1( far, 'farShadow' );

        var projectionShadow = new osg.Uniform.createMatrix4( osg.Matrix.create(), 'ProjectionShadow' );
        var modelViewShadow = new osg.Uniform.createMatrix4( osg.Matrix.create(), 'ModelViewShadow' );

        osg.Matrix.makePerspective( 15, 1, near, far, rtt.getProjectionMatrix() );
        rtt.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
        rtt.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
        rtt.setViewport( new osg.Viewport( 0, 0, rttSize[ 0 ], rttSize[ 1 ] ) );
        rtt.setClearColor( [ 1, 1, 1, 0.0 ] );

        shadowScene.getOrCreateStateSet().setAttributeAndModes( getShadowMapShaderLight(), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
        shadowScene.getOrCreateStateSet().addUniform( nearShadow );
        shadowScene.getOrCreateStateSet().addUniform( farShadow );

        var rttTexture = new osg.Texture();
        rttTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
        rttTexture.setMinFilter( 'NEAREST' );
        rttTexture.setMagFilter( 'NEAREST' );
        rtt.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, rttTexture, 0 );
        rtt.attachRenderBuffer( osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16 );
        rtt.addChild( shadowScene );
        light.addChild( rtt );

        light.lightShadow = new osg.Light();
        light.getOrCreateStateSet().setAttributeAndModes( light.lightShadow );

        var q = osg.createTexturedQuadGeometry( -10, -10, -5.0,
            20, 0, 0,
            0, 20, 0 );
        var stateSet = new osg.StateSet();
        var prg = getOgreShadowMapShader();
        stateSet.setAttributeAndModes( prg, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
        stateSet.setTextureAttributeAndModes( 1, rttTexture, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

        // tracking should be automatic
        stateSet.addUniform( osg.Uniform.createInt1( 1, 'Texture1' ) );
        stateSet.addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );
        prg.trackAttributes = {};
        prg.trackAttributes.attributeKeys = [];
        prg.trackAttributes.attributeKeys.push( 'Material' );
        prg.trackAttributes.attributeKeys.push( 'Light0' );

        stateSet.addUniform( projectionShadow );
        stateSet.addUniform( modelViewShadow );
        stateSet.addUniform( nearShadow );
        stateSet.addUniform( farShadow );

        var ungroundUniform = osg.Uniform.createInt1( 0, 'ground' );
        stateSet.addUniform( ungroundUniform );

        var groundUniform = osg.Uniform.createInt1( 1, 'ground' );
        q.getOrCreateStateSet().addUniform( groundUniform );
        //    q.getOrCreateStateSet().setAttributeAndModes(new osg.Depth('LESS', 0.0, 1.0, false));
        q.getOrCreateStateSet().setAttributeAndModes( new osg.BlendFunc( 'ONE', 'ONE_MINUS_SRC_ALPHA' ) );
        scene.setStateSet( stateSet );


        light.setUpdateCallback( new LightUpdateCallbackShadowMap( {
            'projectionShadow': projectionShadow,
            'modelViewShadow': modelViewShadow,
            'camera': rtt,
            'shadowScene': shadowScene
        } ) );

        models.addChild( q );

        root.getOrCreateStateSet().setAttributeAndModes( light.lightShadow );

        root.addChild( light );
        root.addChild( scene );

        return root;
    }

    function createScene() {
        var root = new osg.Camera();
        root.setComputeNearFar( false );

        if ( true ) {
            P.resolve( osgDB.parseSceneGraph( getOgre() ) ).then( function ( model ) {
                var project = createProjectedShadowScene( model );
                project.setMatrix( osg.Matrix.makeTranslate( -10, 0, 0.0, [] ) );
                root.addChild( project );
            } );
        }

        if ( true ) {
            P.resolve( osgDB.parseSceneGraph( getOgre() ) ).then( function ( model ) {
                var texproject = createTextureProjectedShadowScene( model );
                texproject.setMatrix( osg.Matrix.makeTranslate( 0, 0, 0.0, [] ) );
                root.addChild( texproject );
            } );
        }

        if ( true ) {
            P.resolve( osgDB.parseSceneGraph( getOgre() ) ).then( function ( model ) {
                var shadowmap = createShadowMapScene( model );
                shadowmap.setMatrix( osg.Matrix.makeTranslate( 10, 0, 0.0, [] ) );
                root.addChild( shadowmap );
            } );
        }

        return root;
    }

    var startViewer = function () {

        var canvas = document.getElementById( 'View' );

        var viewer;
        try {
            viewer = new osgViewer.Viewer( canvas, {
                antialias: true,
                premultipliedAlpha: true
            } );
            viewer.init();
            viewer.setupManipulator();
            var rotate = new osg.MatrixTransform();
            rotate.addChild( createScene() );
            viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
            viewer.setSceneData( rotate );
            viewer.getManipulator().computeHomePosition();
            viewer.run();

        } catch ( er ) {
            osg.log( 'exception in osgViewer ' + er );
        }
    };

    window.addEventListener( 'load', startViewer, true );
} )();
