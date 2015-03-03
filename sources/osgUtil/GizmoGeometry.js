define( [
    'osg/BufferArray',
    'osg/Geometry',
    'osg/PrimitiveSet',
    'osg/DrawArrays',
    'osg/DrawElements',
    'osg/Program',
    'osg/Shader'
], function ( BufferArray, Geometry, PrimitiveSet, DrawArrays, DrawElements, Program, Shader ) {

    'use strict';

    var glPrecision = [ '#ifdef GL_ES',
        'precision highp float;',
        '#endif'
    ].join( '\n' );

    var program;
    var getOrCreateShader = function () {
        if ( program )
            return program;
        var vertexshader = [
            glPrecision,
            'attribute vec3 Vertex;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            '',
            'void main(void) {',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            glPrecision,
            'uniform vec4 uColor;',
            '',
            'void main(void) {',
            '  gl_FragColor = uColor;',
            '}'
        ].join( '\n' );

        program = new Program( new Shader( Shader.VERTEX_SHADER, vertexshader ),
            new Shader( Shader.FRAGMENT_SHADER, fragmentshader ) );
        return program;
    };

    var program2D;
    var getOrCreateShader2D = function () {
        if ( program2D )
            return program2D;
        var vertexshader = [
            glPrecision,
            'attribute vec2 Vertex;',
            '',
            'void main(void) {',
            '  gl_Position = vec4(Vertex, 0.0, 1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            glPrecision,
            'void main(void) {',
            '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);',
            '}'
        ].join( '\n' );

        program2D = new Program( new Shader( Shader.VERTEX_SHADER, vertexshader ),
            new Shader( Shader.FRAGMENT_SHADER, fragmentshader ) );
        return program2D;
    };

    var programQC;
    var getOrCreateShaderQuadCircle = function () {
        if ( programQC )
            return programQC;
        var vertexshader = [
            glPrecision,
            'attribute vec3 Vertex;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'varying vec3 vVertex;',
            '',
            'void main(void) {',
            '  vVertex = Vertex;',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            glPrecision,
            'uniform float uAngle;',
            'uniform vec3 uBase;',
            'varying vec3 vVertex;',
            'const float PI = 3.14159265358979323846264;',
            'const float PI2 = PI * 2.0;',
            '',
            'void main(void) {',
            '  if(length(vVertex) > 0.5)',
            '    discard;',
            '  vec3 vn = normalize(vVertex);',
            '  float angle = atan(uBase.y * vn.x - uBase.x * vn.y, dot(uBase, vn));',
            '  if(angle > 0.0) {',
            '    if(uAngle >= 0.0 && angle > uAngle) discard;',
            '    if(uAngle < -PI && angle < uAngle + PI2) discard;',
            '    if(uAngle < 0.0 && uAngle > -PI) discard;',
            '  }',
            '  if(angle < 0.0) {',
            '    if(uAngle <= 0.0 && angle < uAngle) discard;',
            '    if(uAngle > PI && angle > uAngle - PI2) discard;',
            '    if(uAngle > 0.0 && uAngle < PI) discard;',
            '  }',
            '  gl_FragColor = vec4(1.0, 1.0, 0.0, 0.5);',
            '}'
        ].join( '\n' );

        programQC = new Program( new Shader( Shader.VERTEX_SHADER, vertexshader ),
            new Shader( Shader.FRAGMENT_SHADER, fragmentshader ) );
        return programQC;
    };

    var createDebugLineGeometry = function () {
        var g = new Geometry();
        g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, new Float32Array( 4 ), 2 );
        var primitive = new DrawArrays( PrimitiveSet.LINES, 0, 2 );
        g.getPrimitives().push( primitive );
        g.getOrCreateStateSet().setAttributeAndModes( getOrCreateShader2D() );
        return g;
    };

    var createTorusGeometry = function ( radiusOut, radiusWidth, nbRadial, nbTubular, arc ) {
        radiusOut = radiusOut !== undefined ? radiusOut : 1.0;
        radiusWidth = radiusWidth !== undefined ? radiusWidth : 0.2;
        nbRadial = nbRadial !== undefined ? nbRadial : 6;
        nbTubular = nbTubular !== undefined ? nbTubular : 64;
        arc = arc !== undefined ? arc : Math.PI * 2;

        var nbVertices = ( nbRadial + 1 ) * ( nbTubular + 1 );
        var nbTriangles = nbRadial * nbTubular * 2;
        var g = new Geometry();
        var vertices = new Float32Array( nbVertices * 3 );
        var indices = new Uint16Array( nbTriangles * 3 );
        arc = arc || Math.PI * 2;
        var id = 0;
        var k = 0;
        var i = 0;
        var j = 0;
        for ( j = 0; j <= nbRadial; ++j ) {
            for ( i = 0; i <= nbTubular; ++i ) {
                var u = i / nbTubular * arc;
                var v = j / nbRadial * Math.PI * 2;
                k = id * 3;
                vertices[ k ] = ( radiusOut + radiusWidth * Math.cos( v ) ) * Math.cos( u );
                vertices[ k + 1 ] = ( radiusOut + radiusWidth * Math.cos( v ) ) * Math.sin( u );
                vertices[ k + 2 ] = radiusWidth * Math.sin( v );
                id++;
            }
        }
        id = 0;
        for ( j = 1; j <= nbRadial; ++j ) {
            for ( i = 1; i <= nbTubular; ++i ) {
                k = id * 6;
                indices[ k ] = ( nbTubular + 1 ) * j + i - 1;
                indices[ k + 1 ] = indices[ k + 3 ] = ( nbTubular + 1 ) * ( j - 1 ) + i - 1;
                indices[ k + 2 ] = indices[ k + 5 ] = ( nbTubular + 1 ) * j + i;
                indices[ k + 4 ] = ( nbTubular + 1 ) * ( j - 1 ) + i;
                id++;
            }
        }
        g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertices, 3 );
        g.getOrCreateStateSet().setAttributeAndModes( getOrCreateShader() );
        g.getPrimitives().push( new DrawElements( PrimitiveSet.TRIANGLES, new BufferArray( BufferArray.ELEMENT_ARRAY_BUFFER, indices, 1 ) ) );
        return g;
    };

    var createCylinderGeometry = function ( radiusTop, radiusBottom, height, radialSegments, heightSegments, topCap, lowCap ) {
        radiusTop = radiusTop !== undefined ? radiusTop : 1.0;
        radiusBottom = radiusBottom !== undefined ? radiusBottom : 1.0;
        height = height !== undefined ? height : 5.0;
        radialSegments = radialSegments !== undefined ? radialSegments : 32;
        heightSegments = heightSegments !== undefined ? heightSegments : 1;
        topCap = topCap !== undefined ? topCap : true;
        lowCap = lowCap !== undefined ? lowCap : true;

        topCap = topCap && radiusTop > 0.0;
        lowCap = lowCap && radiusBottom > 0.0;
        var heightHalf = height * 0.5;

        var nbVertices = ( heightSegments + 1 ) * ( radialSegments + 1 );
        var nbTriangles = heightSegments * radialSegments * 2;
        if ( topCap ) {
            nbVertices += 1;
            nbTriangles += radialSegments;
        }
        if ( lowCap ) {
            nbVertices += 1;
            nbTriangles += radialSegments;
        }
        var g = new Geometry();
        var vertices = new Float32Array( nbVertices * 3 );
        var indices = new Uint16Array( nbTriangles * 3 );

        var id = 0;
        var k = 0;
        var i = 0;
        var j = 0;
        for ( i = 0; i <= heightSegments; i++ ) {
            var v = i / heightSegments;
            var radius = v * ( radiusBottom - radiusTop ) + radiusTop;
            for ( j = 0; j <= radialSegments; j++ ) {
                var u = j / radialSegments;
                k = id * 3;
                vertices[ k ] = radius * Math.sin( u * Math.PI * 2 );
                vertices[ k + 1 ] = radius * Math.cos( u * Math.PI * 2 );
                vertices[ k + 2 ] = -v * height + heightHalf;
                id++;
            }
        }

        id = 0;
        for ( j = 0; j < radialSegments; j++ ) {
            for ( i = 0; i < heightSegments; i++ ) {
                k = id * 6;
                indices[ k ] = ( radialSegments + 1 ) * i + j;
                indices[ k + 1 ] = indices[ k + 3 ] = ( radialSegments + 1 ) * ( i + 1 ) + j;
                indices[ k + 2 ] = indices[ k + 5 ] = ( radialSegments + 1 ) * i + j + 1;
                indices[ k + 4 ] = ( radialSegments + 1 ) * ( i + 1 ) + j + 1;
                id++;
            }
        }
        id *= 2;
        var last;
        if ( topCap ) {
            last = ( lowCap ? vertices.length - 6 : vertices.length - 3 ) / 3;
            vertices[ last * 3 + 2 ] = heightHalf;
            for ( j = 0; j < radialSegments; j++ ) {
                k = id * 3;
                indices[ k ] = j;
                indices[ k + 1 ] = j + 1;
                indices[ k + 2 ] = last;
                id++;
            }
        }

        if ( lowCap ) {
            last = ( vertices.length - 3 ) / 3;
            vertices[ last * 3 + 2 ] = -heightHalf;
            var end = ( radialSegments + 1 ) * i;
            for ( j = 0; j < radialSegments; j++ ) {
                k = id * 3;
                indices[ k ] = end + j + 1;
                indices[ k + 1 ] = end + j;
                indices[ k + 2 ] = last;
                id++;
            }
        }

        g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertices, 3 );
        g.getOrCreateStateSet().setAttributeAndModes( getOrCreateShader() );
        g.getPrimitives().push( new DrawElements( PrimitiveSet.TRIANGLES, new BufferArray( BufferArray.ELEMENT_ARRAY_BUFFER, indices, 1 ) ) );
        return g;
    };

    var createCircleGeometry = function ( nbVertices, radius, arc ) {
        var g = new Geometry();
        var vertices = new Float32Array( nbVertices * 3 );
        arc = arc || Math.PI * 2;
        for ( var i = 0; i < nbVertices; ++i ) {
            var j = i * 3;
            var segment = ( arc * i ) / nbVertices;
            vertices[ j ] = Math.cos( segment ) * radius;
            vertices[ j + 1 ] = Math.sin( segment ) * radius;
        }
        g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertices, 3 );
        var primitive = new DrawArrays( PrimitiveSet.LINE_STRIP, 0, nbVertices );
        g.getOrCreateStateSet().setAttributeAndModes( getOrCreateShader() );
        g.getPrimitives().push( primitive );
        return g;
    };

    var createPlaneGeometry = function ( width, height ) {
        var offx = width ? width * 0.5 : 0.5;
        var offy = height ? height * 0.5 : 0.5;

        var g = new Geometry();
        var vertices = new Float32Array( 12 );
        vertices[ 0 ] = -offx;
        vertices[ 1 ] = -offy;

        vertices[ 3 ] = offx;
        vertices[ 4 ] = -offy;

        vertices[ 6 ] = -offx;
        vertices[ 7 ] = offy;

        vertices[ 9 ] = offx;
        vertices[ 10 ] = offy;

        g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertices, 3 );
        var primitive = new DrawArrays( PrimitiveSet.TRIANGLE_STRIP, 0, 4 );
        g.getOrCreateStateSet().setAttributeAndModes( getOrCreateShader() );
        g.getPrimitives().push( primitive );
        return g;
    };

    var createQuadCircleGeometry = function () {
        var g = createPlaneGeometry();
        g.getOrCreateStateSet().setAttributeAndModes( getOrCreateShaderQuadCircle() );
        return g;
    };

    var GizmoGeometry = {};
    GizmoGeometry.createCircleGeometry = createCircleGeometry;
    GizmoGeometry.createCylinderGeometry = createCylinderGeometry;
    GizmoGeometry.createTorusGeometry = createTorusGeometry;
    GizmoGeometry.createDebugLineGeometry = createDebugLineGeometry;
    GizmoGeometry.createPlaneGeometry = createPlaneGeometry;
    GizmoGeometry.createQuadCircleGeometry = createQuadCircleGeometry;

    return GizmoGeometry;
} );
