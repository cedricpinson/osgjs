'use strict';

function getShader() {
    var vertexshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',

        'attribute vec3 Vertex;',
        'attribute vec3 Normal;',

        'uniform vec3 uCenterPicking;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'uniform mat4 NormalMatrix;',

        'varying vec3 vVertex;',
        'varying vec3 vNormal;',
        'varying vec3 vInter;',

        'void main( void ) {',
        '  vInter = vec3( ModelViewMatrix * vec4( uCenterPicking, 1.0 ) );',
        '  vNormal = normalize(vec3( NormalMatrix * vec4( Normal, 1.0 )) );',
        '  vVertex = vec3( ModelViewMatrix * vec4( Vertex, 1.0 ) );',
        '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4( Vertex, 1.0 );',
        '}'
    ].join( '\n' );

    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',

        'uniform float uTime;',
        'uniform float uRadiusSquared;',

        'varying vec3 vVertex;',
        'varying vec3 vNormal;',
        'varying vec3 vInter;',

        'const vec3 vecLight = vec3( 0.06189, 0.12379, 0.99037 );',
        'const vec3 colorBackface = vec3( 0.45, 0.21, 0.13 );',
        'const float shininess = 500.0;',

        'void main( void ) {',
        '  vec3 fragColor;',
        '  vec3 normal;',
        '  if(gl_FrontFacing)',
        '  {',
        '    normal = vNormal;',
        '    fragColor = vNormal * 0.5 + 0.5;',
        '  }',
        '  else',
        '  {',
        '    normal = -vNormal;',
        '    fragColor = colorBackface;',
        '  }',

        '  float dotLN = dot( normal, vecLight );',
        '  vec3 vecR = normalize( 2.0 * dotLN * normal - vecLight );',
        '  float dotRVpow = pow( dot( vecR, vecLight ), shininess );',
        '  vec3 ambiant = fragColor * 0.5;',
        '  vec3 diffuse = fragColor * 0.5 * max( 0.0, dotLN );',
        '  vec3 specular = fragColor * 0.8 * max( 0.0, dotRVpow );',
        '  fragColor = ambiant + diffuse + specular;',

        '  float t = mod( uTime * 0.5, 1000.0 ) / 1000.0;', // time [0..1]
        '  t = t > 0.5 ? 1.0 - t : t;', // [0->0.5] , [0.5->0]
        '  vec3 vecDistance = ( vVertex - vInter );',
        '  float dotSquared = dot( vecDistance, vecDistance );',
        '  if ( dotSquared < uRadiusSquared * 1.1 && dotSquared > uRadiusSquared*0.90 )',
        '    gl_FragColor = vec4( 0.75-t, 0.25+t, 0.0, 1.0 );',
        '  else if ( dotSquared < uRadiusSquared )',
        '    discard;',
        '  else',
        '    gl_FragColor = vec4( fragColor, 1.0 );',
        '}'
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( osg.Shader.VERTEX_SHADER, vertexshader ),
        new osg.Shader( osg.Shader.FRAGMENT_SHADER, fragmentshader ) );

    return program;
};

function loadUrl( url, viewer, node, unifs ) {
    osg.log( 'loading ' + url );
    var req = new XMLHttpRequest();
    req.open( 'GET', url, true );
    req.onload = function( aEvt ) {
        loadModel( JSON.parse( req.responseText ), viewer, node, unifs );
        osg.log( 'success ' + url );
    };
    req.onerror = function( aEvt ) {
        osg.log( 'error ' + url );
    };
    req.send( null );
};

function loadModel( data, viewer, node, unifs ) {
    var promise = osgDB.parseSceneGraph( data );
    // var promise = osg.createTexturedSphere( 1.0, 500, 500 );

    Q.when( promise ).then( function( child ) {
        node.addChild( child );
        viewer.getManipulator().computeHomePosition();

        child.getOrCreateStateSet().setAttributeAndMode( getShader() );
        child.getOrCreateStateSet().addUniform( unifs.center );
        child.getOrCreateStateSet().addUniform( unifs.radius2 );
        child.getOrCreateStateSet().addUniform( unifs.time );
        unifs.radius2.set( child.getBound().radius2() * 0.02 );

        // console.time( 'build' );
        var treeBuilder = new osg.KdTreeBuilder( {
            _numVerticesProcessed: 0,
            _targetNumTrianglesPerLeaf: 50,
            _maxNumLevels: 20
        } );
        treeBuilder.apply( node );
        // console.timeEnd( 'build' );
    } );
};

function createScene( viewer, unifs ) {

    var root = new osg.Node();

    loadUrl( '../ssao/raceship.osgjs', viewer, root, unifs );
    root.getOrCreateStateSet().setAttributeAndMode( new osg.CullFace( osg.CullFace.DISABLE ) );

    var UpdateCallback = function( base ) {
        this.baseTime_ = ( new Date ).getTime();
        this.update = function( node, nv ) {
            unifs.time.set( ( new Date ).getTime() - this.baseTime_ );
            return true;
        };
    };

    root.setUpdateCallback( new UpdateCallback() );

    return root;
};

function projectToScreen( cam, hit ) {
    var mat = osg.Matrix.create();
    osg.Matrix.preMult( mat, cam.getViewport() ? cam.getViewport().computeWindowMatrix() : osg.Matrix.create() );
    osg.Matrix.preMult( mat, cam.getProjectionMatrix() );
    osg.Matrix.preMult( mat, cam.getViewMatrix() );
    osg.Matrix.preMult( mat, osg.computeLocalToWorld( hit.nodepath ) );

    var pt = [ 0.0, 0.0, 0.0 ];
    osg.Matrix.transformVec3( mat, hit.point, pt );
    return pt;
};

window.addEventListener( 'load',
    function() {
        OSG.globalify();

        var canvas = document.getElementById( 'View' );

        var unifs = {
            center: osg.Uniform.createFloat3( new Float32Array( 3 ), 'uCenterPicking' ),
            radius2: osg.Uniform.createFloat1( 0.1, 'uRadiusSquared' ),
            time: osg.Uniform.createFloat1( 0.1, 'uTime' )
        };

        var viewer = new osgViewer.Viewer( canvas );
        viewer.init();
        viewer.setSceneData( createScene( viewer, unifs ) );
        viewer.setupManipulator();
        viewer.run();

        canvas.addEventListener( 'mousemove', function( ev ) {
            // TODO maybe doing some benchmark with a lot of geometry,
            // since there's one kdtree per geometry ...
            // console.time( 'pick' );

            // take care of retina display canvas size
            var ratioX = canvas.width / canvas.clientWidth;
            var ratioY = canvas.height / canvas.clientHeight;

            var hits = viewer.computeIntersections( ev.clientX * ratioX, (canvas.clientHeight - ev.clientY) * ratioY );
            // console.timeEnd( 'pick' );
            // console.log( hits.length );

            hits.sort( function( a, b ) {
                return a.ratio - b.ratio;
            } );

            if ( hits.length > 0 ) {
                var point = hits[ 0 ].point;
                var ptFixed = [ point[ 0 ].toFixed( 2 ), point[ 1 ].toFixed( 2 ), point[ 2 ].toFixed( 2 ) ];

                //update shader uniform
                unifs.center.set( new Float32Array( point ) );

                var pt = projectToScreen( viewer.getCamera(), hits[ 0 ] );

                var ptx = parseInt( pt[ 0 ], 10 ) / ratioX;
                var pty = parseInt( canvas.height - pt[ 1 ], 10 ) / ratioY;
                var d = document.getElementById( 'picking' );
                d.innerText = 'x: ' + ptx + ' ' + 'y: ' + pty + '\n' + ptFixed;
                d.style.webkitTransform = 'translate3d(' + ptx + 'px,' + pty + 'px,0)';
            }

        }, true );
    }, true );
