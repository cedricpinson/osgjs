/*global define */

define( [
    'osg/Notify',
    'osg/StateAttribute',
    'osg/Vec3',
    'osg/Uniform',
    'osg/BufferArray',
    'osg/Geometry',
    'osg/PrimitiveSet',
    'osg/DrawArrays',
    'osg/DrawElements',
    'osg/Program',
    'osg/Shader'
], function ( Notify, StateAttribute, Vec3, Uniform, BufferArray, Geometry, PrimitiveSet, DrawArrays, DrawElements, Program, Shader ) {

    /**
     * Create a Textured Box on the given center with given size
     * @name createTexturedBox
     */
    var createTexturedBoxGeometry = function ( centerx, centery, centerz,
        sizex, sizey, sizez ) {

        var g = new Geometry();
        var dx, dy, dz;
        dx = sizex / 2.0;
        dy = sizey / 2.0;
        dz = sizez / 2.0;

        var vertexes = [];
        var uv = [];
        var normal = [];

        // -ve y plane
        vertexes[ 0 ] = centerx - dx;
        vertexes[ 1 ] = centery - dy;
        vertexes[ 2 ] = centerz + dz;
        normal[ 0 ] = 0;
        normal[ 1 ] = -1;
        normal[ 2 ] = 0;
        uv[ 0 ] = 0;
        uv[ 1 ] = 1;

        vertexes[ 3 ] = centerx - dx;
        vertexes[ 4 ] = centery - dy;
        vertexes[ 5 ] = centerz - dz;
        normal[ 3 ] = 0;
        normal[ 4 ] = -1;
        normal[ 5 ] = 0;
        uv[ 2 ] = 0;
        uv[ 3 ] = 0;

        vertexes[ 6 ] = centerx + dx;
        vertexes[ 7 ] = centery - dy;
        vertexes[ 8 ] = centerz - dz;
        normal[ 6 ] = 0;
        normal[ 7 ] = -1;
        normal[ 8 ] = 0;
        uv[ 4 ] = 1;
        uv[ 5 ] = 0;

        vertexes[ 9 ] = centerx + dx;
        vertexes[ 10 ] = centery - dy;
        vertexes[ 11 ] = centerz + dz;
        normal[ 9 ] = 0;
        normal[ 10 ] = -1;
        normal[ 11 ] = 0;
        uv[ 6 ] = 1;
        uv[ 7 ] = 1;


        // +ve y plane
        vertexes[ 12 ] = centerx + dx;
        vertexes[ 13 ] = centery + dy;
        vertexes[ 14 ] = centerz + dz;
        normal[ 12 ] = 0;
        normal[ 13 ] = 1;
        normal[ 14 ] = 0;
        uv[ 8 ] = 0;
        uv[ 9 ] = 1;

        vertexes[ 15 ] = centerx + dx;
        vertexes[ 16 ] = centery + dy;
        vertexes[ 17 ] = centerz - dz;
        normal[ 15 ] = 0;
        normal[ 16 ] = 1;
        normal[ 17 ] = 0;
        uv[ 10 ] = 0;
        uv[ 11 ] = 0;

        vertexes[ 18 ] = centerx - dx;
        vertexes[ 19 ] = centery + dy;
        vertexes[ 20 ] = centerz - dz;
        normal[ 18 ] = 0;
        normal[ 19 ] = 1;
        normal[ 20 ] = 0;
        uv[ 12 ] = 1;
        uv[ 13 ] = 0;

        vertexes[ 21 ] = centerx - dx;
        vertexes[ 22 ] = centery + dy;
        vertexes[ 23 ] = centerz + dz;
        normal[ 21 ] = 0;
        normal[ 22 ] = 1;
        normal[ 23 ] = 0;
        uv[ 14 ] = 1;
        uv[ 15 ] = 1;


        // +ve x plane
        vertexes[ 24 ] = centerx + dx;
        vertexes[ 25 ] = centery - dy;
        vertexes[ 26 ] = centerz + dz;
        normal[ 24 ] = 1;
        normal[ 25 ] = 0;
        normal[ 26 ] = 0;
        uv[ 16 ] = 0;
        uv[ 17 ] = 1;

        vertexes[ 27 ] = centerx + dx;
        vertexes[ 28 ] = centery - dy;
        vertexes[ 29 ] = centerz - dz;
        normal[ 27 ] = 1;
        normal[ 28 ] = 0;
        normal[ 29 ] = 0;
        uv[ 18 ] = 0;
        uv[ 19 ] = 0;

        vertexes[ 30 ] = centerx + dx;
        vertexes[ 31 ] = centery + dy;
        vertexes[ 32 ] = centerz - dz;
        normal[ 30 ] = 1;
        normal[ 31 ] = 0;
        normal[ 32 ] = 0;
        uv[ 20 ] = 1;
        uv[ 21 ] = 0;

        vertexes[ 33 ] = centerx + dx;
        vertexes[ 34 ] = centery + dy;
        vertexes[ 35 ] = centerz + dz;
        normal[ 33 ] = 1;
        normal[ 34 ] = 0;
        normal[ 35 ] = 0;
        uv[ 22 ] = 1;
        uv[ 23 ] = 1;

        // -ve x plane
        vertexes[ 36 ] = centerx - dx;
        vertexes[ 37 ] = centery + dy;
        vertexes[ 38 ] = centerz + dz;
        normal[ 36 ] = -1;
        normal[ 37 ] = 0;
        normal[ 38 ] = 0;
        uv[ 24 ] = 0;
        uv[ 25 ] = 1;

        vertexes[ 39 ] = centerx - dx;
        vertexes[ 40 ] = centery + dy;
        vertexes[ 41 ] = centerz - dz;
        normal[ 39 ] = -1;
        normal[ 40 ] = 0;
        normal[ 41 ] = 0;
        uv[ 26 ] = 0;
        uv[ 27 ] = 0;

        vertexes[ 42 ] = centerx - dx;
        vertexes[ 43 ] = centery - dy;
        vertexes[ 44 ] = centerz - dz;
        normal[ 42 ] = -1;
        normal[ 43 ] = 0;
        normal[ 44 ] = 0;
        uv[ 28 ] = 1;
        uv[ 29 ] = 0;

        vertexes[ 45 ] = centerx - dx;
        vertexes[ 46 ] = centery - dy;
        vertexes[ 47 ] = centerz + dz;
        normal[ 45 ] = -1;
        normal[ 46 ] = 0;
        normal[ 47 ] = 0;
        uv[ 30 ] = 1;
        uv[ 31 ] = 1;

        // top
        // +ve z plane
        vertexes[ 48 ] = centerx - dx;
        vertexes[ 49 ] = centery + dy;
        vertexes[ 50 ] = centerz + dz;
        normal[ 48 ] = 0;
        normal[ 49 ] = 0;
        normal[ 50 ] = 1;
        uv[ 32 ] = 0;
        uv[ 33 ] = 1;

        vertexes[ 51 ] = centerx - dx;
        vertexes[ 52 ] = centery - dy;
        vertexes[ 53 ] = centerz + dz;
        normal[ 51 ] = 0;
        normal[ 52 ] = 0;
        normal[ 53 ] = 1;
        uv[ 34 ] = 0;
        uv[ 35 ] = 0;

        vertexes[ 54 ] = centerx + dx;
        vertexes[ 55 ] = centery - dy;
        vertexes[ 56 ] = centerz + dz;
        normal[ 54 ] = 0;
        normal[ 55 ] = 0;
        normal[ 56 ] = 1;
        uv[ 36 ] = 1;
        uv[ 37 ] = 0;

        vertexes[ 57 ] = centerx + dx;
        vertexes[ 58 ] = centery + dy;
        vertexes[ 59 ] = centerz + dz;
        normal[ 57 ] = 0;
        normal[ 58 ] = 0;
        normal[ 59 ] = 1;
        uv[ 38 ] = 1;
        uv[ 39 ] = 1;

        // bottom
        // -ve z plane
        vertexes[ 60 ] = centerx + dx;
        vertexes[ 61 ] = centery + dy;
        vertexes[ 62 ] = centerz - dz;
        normal[ 60 ] = 0;
        normal[ 61 ] = 0;
        normal[ 62 ] = -1;
        uv[ 40 ] = 0;
        uv[ 41 ] = 1;

        vertexes[ 63 ] = centerx + dx;
        vertexes[ 64 ] = centery - dy;
        vertexes[ 65 ] = centerz - dz;
        normal[ 63 ] = 0;
        normal[ 64 ] = 0;
        normal[ 65 ] = -1;
        uv[ 42 ] = 0;
        uv[ 43 ] = 0;

        vertexes[ 66 ] = centerx - dx;
        vertexes[ 67 ] = centery - dy;
        vertexes[ 68 ] = centerz - dz;
        normal[ 66 ] = 0;
        normal[ 67 ] = 0;
        normal[ 68 ] = -1;
        uv[ 44 ] = 1;
        uv[ 45 ] = 0;

        vertexes[ 69 ] = centerx - dx;
        vertexes[ 70 ] = centery + dy;
        vertexes[ 71 ] = centerz - dz;
        normal[ 69 ] = 0;
        normal[ 70 ] = 0;
        normal[ 71 ] = -1;
        uv[ 46 ] = 1;
        uv[ 47 ] = 1;

        var indexes = [];
        indexes[ 0 ] = 0;
        indexes[ 1 ] = 1;
        indexes[ 2 ] = 2;
        indexes[ 3 ] = 0;
        indexes[ 4 ] = 2;
        indexes[ 5 ] = 3;

        indexes[ 6 ] = 4;
        indexes[ 7 ] = 5;
        indexes[ 8 ] = 6;
        indexes[ 9 ] = 4;
        indexes[ 10 ] = 6;
        indexes[ 11 ] = 7;

        indexes[ 12 ] = 8;
        indexes[ 13 ] = 9;
        indexes[ 14 ] = 10;
        indexes[ 15 ] = 8;
        indexes[ 16 ] = 10;
        indexes[ 17 ] = 11;

        indexes[ 18 ] = 12;
        indexes[ 19 ] = 13;
        indexes[ 20 ] = 14;
        indexes[ 21 ] = 12;
        indexes[ 22 ] = 14;
        indexes[ 23 ] = 15;

        indexes[ 24 ] = 16;
        indexes[ 25 ] = 17;
        indexes[ 26 ] = 18;
        indexes[ 27 ] = 16;
        indexes[ 28 ] = 18;
        indexes[ 29 ] = 19;

        indexes[ 30 ] = 20;
        indexes[ 31 ] = 21;
        indexes[ 32 ] = 22;
        indexes[ 33 ] = 20;
        indexes[ 34 ] = 22;
        indexes[ 35 ] = 23;

        g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertexes, 3 );
        g.getAttributes().Normal = new BufferArray( BufferArray.ARRAY_BUFFER, normal, 3 );
        g.getAttributes().TexCoord0 = new BufferArray( BufferArray.ARRAY_BUFFER, uv, 2 );

        var primitive = new DrawElements( PrimitiveSet.TRIANGLES, new BufferArray( BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ) );
        g.getPrimitives().push( primitive );
        return g;
    };

    var createTexturedQuadGeometry = function ( cornerx, cornery, cornerz,
        wx, wy, wz,
        hx, hy, hz,
        l, b, r, t ) {

        if ( r === undefined && t === undefined ) {
            r = l;
            t = b;
            l = 0;
            b = 0;
        }

        var g = new Geometry();

        var vertexes = [];
        vertexes[ 0 ] = cornerx + hx;
        vertexes[ 1 ] = cornery + hy;
        vertexes[ 2 ] = cornerz + hz;

        vertexes[ 3 ] = cornerx;
        vertexes[ 4 ] = cornery;
        vertexes[ 5 ] = cornerz;

        vertexes[ 6 ] = cornerx + wx;
        vertexes[ 7 ] = cornery + wy;
        vertexes[ 8 ] = cornerz + wz;

        vertexes[ 9 ] = cornerx + wx + hx;
        vertexes[ 10 ] = cornery + wy + hy;
        vertexes[ 11 ] = cornerz + wz + hz;

        if ( r === undefined ) {
            r = 1.0;
        }
        if ( t === undefined ) {
            t = 1.0;
        }

        var uvs = [];
        uvs[ 0 ] = l;
        uvs[ 1 ] = t;

        uvs[ 2 ] = l;
        uvs[ 3 ] = b;

        uvs[ 4 ] = r;
        uvs[ 5 ] = b;

        uvs[ 6 ] = r;
        uvs[ 7 ] = t;

        var n = Vec3.cross( [ wx, wy, wz ], [ hx, hy, hz ], [] );
        var normal = [];
        normal[ 0 ] = n[ 0 ];
        normal[ 1 ] = n[ 1 ];
        normal[ 2 ] = n[ 2 ];

        normal[ 3 ] = n[ 0 ];
        normal[ 4 ] = n[ 1 ];
        normal[ 5 ] = n[ 2 ];

        normal[ 6 ] = n[ 0 ];
        normal[ 7 ] = n[ 1 ];
        normal[ 8 ] = n[ 2 ];

        normal[ 9 ] = n[ 0 ];
        normal[ 10 ] = n[ 1 ];
        normal[ 11 ] = n[ 2 ];


        var indexes = [];
        indexes[ 0 ] = 0;
        indexes[ 1 ] = 1;
        indexes[ 2 ] = 2;
        indexes[ 3 ] = 0;
        indexes[ 4 ] = 2;
        indexes[ 5 ] = 3;

        g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertexes, 3 );
        g.getAttributes().Normal = new BufferArray( BufferArray.ARRAY_BUFFER, normal, 3 );
        g.getAttributes().TexCoord0 = new BufferArray( BufferArray.ARRAY_BUFFER, uvs, 2 );

        var primitive = new DrawElements( PrimitiveSet.TRIANGLES, new BufferArray( BufferArray.ELEMENT_ARRAY_BUFFER, indexes, 1 ) );
        g.getPrimitives().push( primitive );
        return g;
    };

    var createTexturedBox = function ( centerx, centery, centerz,
        sizex, sizey, sizez ) {
        Notify.log( 'createTexturedBox is deprecated use instead createTexturedBoxGeometry' );
        return createTexturedBoxGeometry( centerx, centery, centerz,
            sizex, sizey, sizez );
    };

    var createTexturedQuad = function ( cornerx, cornery, cornerz,
        wx, wy, wz,
        hx, hy, hz,
        l, b, r, t ) {
        Notify.log( 'createTexturedQuad is deprecated use instead createTexturedQuadGeometry' );
        return createTexturedQuadGeometry( cornerx, cornery, cornerz,
            wx, wy, wz,
            hx, hy, hz,
            l, b, r, t );
    };

    var createAxisGeometry = function ( size ) {
        if ( size === undefined ) {
            size = 5.0;
        }
        if ( createAxisGeometry.getShader === undefined ) {
            createAxisGeometry.getShader = function () {
                if ( createAxisGeometry.getShader.program === undefined ) {
                    var vertexshader = [
                        '#ifdef GL_ES',
                        'precision highp float;',
                        '#endif',
                        'attribute vec3 Vertex;',
                        'attribute vec4 Color;',
                        'uniform mat4 ModelViewMatrix;',
                        'uniform mat4 ProjectionMatrix;',
                        '',
                        'varying vec4 FragColor;',
                        '',
                        'vec4 ftransform() {',
                        'return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);',
                        '}',
                        '',
                        'void main(void) {',
                        'gl_Position = ftransform();',
                        'FragColor = Color;',
                        '}'
                    ].join( '\n' );

                    var fragmentshader = [
                        '#ifdef GL_ES',
                        'precision highp float;',
                        '#endif',
                        'varying vec4 FragColor;',

                        'void main(void) {',
                        'gl_FragColor = FragColor;',
                        '}'
                    ].join( '\n' );

                    var program = new Program( new Shader( 'VERTEX_SHADER', vertexshader ),
                        new Shader( 'FRAGMENT_SHADER', fragmentshader ) );
                    createAxisGeometry.getShader.program = program;
                }
                return createAxisGeometry.getShader.program;
            };
        }

        var g = new Geometry();

        var vertexes = [];
        vertexes.push( 0, 0, 0 );
        vertexes.push( size, 0, 0 );

        vertexes.push( 0, 0, 0 );
        vertexes.push( 0, size, 0 );

        vertexes.push( 0, 0, 0 );
        vertexes.push( 0, 0, size );

        var colors = [];
        colors.push( 1, 0, 0, 1.0 );
        colors.push( 1, 0, 0, 1.0 );

        colors.push( 0, 1, 0, 1.0 );
        colors.push( 0, 1, 0, 1.0 );

        colors.push( 0, 0, 1, 1.0 );
        colors.push( 0, 0, 1, 1.0 );

        g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, vertexes, 3 );
        g.getAttributes().Color = new BufferArray( BufferArray.ARRAY_BUFFER, colors, 4 );

        var primitive = new DrawArrays( PrimitiveSet.LINES, 0, 6 );
        g.getPrimitives().push( primitive );
        g.getOrCreateStateSet().setAttributeAndMode( createAxisGeometry.getShader() );

        return g;
    };

    /**
     * Create a Textured Sphere on the given center with given radius
     * @name createTexturedSphere
     * @author Darrell Esau
     */
    var createTexturedSphere = function ( radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength ) {
        radius = radius || 50;

        phiStart = phiStart !== undefined ? phiStart : 0;
        phiLength = phiLength !== undefined ? phiLength : Math.PI * 2;

        thetaStart = thetaStart !== undefined ? thetaStart : 0;
        thetaLength = thetaLength !== undefined ? thetaLength : Math.PI;

        var segmentsX = Math.max( 3, Math.floor( widthSegments ) || 8 );
        var segmentsY = Math.max( 2, Math.floor( heightSegments ) || 6 );

        var x, y, vertices = [],
            uvs = [],
            allVertices = [];

        for ( y = 0; y <= segmentsY; y++ ) {
            var verticesRow = [];
            var uvsRow = [];

            for ( x = 0; x <= segmentsX; x++ ) {
                var u = x / segmentsX;
                var v = y / segmentsY;

                var vertex = {};
                vertex.x = -radius * Math.cos( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );
                vertex.y = radius * Math.cos( thetaStart + v * thetaLength );
                vertex.z = radius * Math.sin( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );

                allVertices.push( vertex );

                verticesRow.push( allVertices.length - 1 );
                uvsRow.push( {
                    u: u,
                    v: 1 - v
                } );

            }

            vertices.push( verticesRow );
            uvs.push( uvsRow );
        }

        var fullVerticesList = [];
        var fullNormalsList = [];
        var fullUVList = [];
        var indexes = [];
        var vtxCount = 0;
        // #FIXME quick fix to enable bigger mesh
        // however we should check if the OES_element_index_uint
        // has been enabled
        var useDrawArrays = ( allVertices.length / 3 ) >= 65536;

        for ( y = 0; y < segmentsY; y++ ) {
            for ( x = 0; x < segmentsX; x++ ) {

                var v1 = vertices[ y ][ x + 1 ];
                var v2 = vertices[ y ][ x ];
                var v3 = vertices[ y + 1 ][ x ];
                var v4 = vertices[ y + 1 ][ x + 1 ];

                var vtx1 = allVertices[ v1 ];
                var vtx2 = allVertices[ v2 ];
                var vtx3 = allVertices[ v3 ];
                var vtx4 = allVertices[ v4 ];

                var n1 = Vec3.normalize( [ vtx1.x, vtx1.y, vtx1.z ], [] );
                var n2 = Vec3.normalize( [ vtx2.x, vtx2.y, vtx2.z ], [] );
                var n3 = Vec3.normalize( [ vtx3.x, vtx3.y, vtx3.z ], [] );
                var n4 = Vec3.normalize( [ vtx4.x, vtx4.y, vtx4.z ], [] );

                var uv1 = uvs[ y ][ x + 1 ];
                var uv2 = uvs[ y ][ x ];
                var uv3 = uvs[ y + 1 ][ x ];
                var uv4 = uvs[ y + 1 ][ x + 1 ];

                fullVerticesList.push( vtx1.x, vtx1.y, vtx1.z );
                fullVerticesList.push( vtx2.x, vtx2.y, vtx2.z );
                fullVerticesList.push( vtx3.x, vtx3.y, vtx3.z );

                fullNormalsList.push( n1[ 0 ], n1[ 1 ], n1[ 2 ] );
                fullNormalsList.push( n2[ 0 ], n2[ 1 ], n2[ 2 ] );
                fullNormalsList.push( n3[ 0 ], n3[ 1 ], n3[ 2 ] );

                fullUVList.push( uv1.u, uv1.v );
                fullUVList.push( uv2.u, uv2.v );
                fullUVList.push( uv3.u, uv3.v );

                if ( useDrawArrays ) {
                    fullVerticesList.push( vtx1.x, vtx1.y, vtx1.z );
                    fullVerticesList.push( vtx3.x, vtx3.y, vtx3.z );
                    fullVerticesList.push( vtx4.x, vtx4.y, vtx4.z );

                    fullNormalsList.push( n1[ 0 ], n1[ 1 ], n1[ 2 ] );
                    fullNormalsList.push( n3[ 0 ], n3[ 1 ], n3[ 2 ] );
                    fullNormalsList.push( n4[ 0 ], n4[ 1 ], n4[ 2 ] );

                    fullUVList.push( uv1.u, uv1.v );
                    fullUVList.push( uv3.u, uv3.v );
                    fullUVList.push( uv4.u, uv4.v );
                } else {
                    fullVerticesList.push( vtx4.x, vtx4.y, vtx4.z );
                    fullNormalsList.push( n4[ 0 ], n4[ 1 ], n4[ 2 ] );
                    fullUVList.push( uv4.u, uv4.v );

                    vtxCount += 4;
                    var tristart = vtxCount - 4;
                    indexes.push( tristart );
                    indexes.push( tristart + 1 );
                    indexes.push( tristart + 2 );
                    indexes.push( tristart );
                    indexes.push( tristart + 2 );
                    indexes.push( tristart + 3 );
                }
            }
        }

        var g = new Geometry();
        g.getAttributes().Vertex = new BufferArray( 'ARRAY_BUFFER', fullVerticesList, 3 );
        g.getAttributes().Normal = new BufferArray( 'ARRAY_BUFFER', fullNormalsList, 3 );
        g.getAttributes().TexCoord0 = new BufferArray( 'ARRAY_BUFFER', fullUVList, 2 );

        if ( useDrawArrays )
            g.getPrimitives().push( new DrawArrays( PrimitiveSet.TRIANGLES, 0, fullVerticesList.length / 3 ) );
        else
            g.getPrimitives().push( new DrawElements( PrimitiveSet.TRIANGLES, new BufferArray( 'ELEMENT_ARRAY_BUFFER', indexes, 1 ) ) );
        return g;
    };

    return {
        createTexturedBoxGeometry: createTexturedBoxGeometry,
        createTexturedQuadGeometry: createTexturedQuadGeometry,
        createTexturedBox: createTexturedBox,
        createTexturedQuad: createTexturedQuad,
        createAxisGeometry: createAxisGeometry,
        createTexturedSphere: createTexturedSphere
    };
} );