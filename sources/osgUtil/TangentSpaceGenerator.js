define( [
    'osg/Utils',
    'osg/BufferArray',
    'osg/Geometry',
    'osg/NodeVisitor',
    'osg/PrimitiveSet',
    'osg/Vec3',

], function ( MACROUTILS, BufferArray, Geometry, NodeVisitor, PrimitiveSet, Vec3 ) {

    'use strict';

    var osg = MACROUTILS;

    var TangentSpaceGenerator = function () {
        NodeVisitor.call( this );
        this._T = undefined;
        this._B = undefined;
        this._N = undefined;
        this._texCoordUnit = 0;
    };

    TangentSpaceGenerator.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {

        apply: function ( node ) {

            if ( node.getTypeID() === Geometry.getTypeID() )
                this.generate( node, this._texCoordUnit );
            else
                this.traverse( node );

        },

        setTexCoordUnit: function ( texCoordUnit ) {
            this._texCoordUnit = texCoordUnit;
        },

        computePrimitiveSet: function ( geometry, primitiveSet ) {

            // no indices -> exit
            if ( !primitiveSet.getIndices )
                return;

            var numIndices = primitiveSet.getNumIndices();

            var vx = geometry.getAttributes().Vertex;
            var nx = geometry.getAttributes().Normal;
            var tx = geometry.getAttributes()[ 'TexCoord' + this._texCoordUnit ];

            var i;

            if ( primitiveSet.getMode() === PrimitiveSet.TRIANGLES ) {

                for ( i = 0; i < numIndices; i += 3 ) {
                    this.compute( primitiveSet, vx, nx, tx, i, i + 1, i + 2 );
                }

            } else if ( primitiveSet.getMode() === PrimitiveSet.TRIANGLE_STRIP ) {

                for ( i = 0; i < numIndices - 2; ++i ) {
                    if ( ( i % 2 ) === 0 ) {
                        this.compute( primitiveSet, vx, nx, tx, i, i + 1, i + 2 );
                    } else {
                        this.compute( primitiveSet, vx, nx, tx, i + 1, i, i + 2 );
                    }
                }
            }

        },

        generate: function ( geometry, texCoordUnit ) {

            this._texCoordUnit = texCoordUnit;

            if ( this._texCoordUnit === undefined )
                this._texCoordUnit = 0;

            var size = geometry.getAttributes().Vertex.getElements().length;
            this._T = new osg.Float32Array( size );
            this._B = new osg.Float32Array( size );
            this._N = new osg.Float32Array( size );

            geometry.getPrimitiveSetList().forEach( function ( primitiveSet ) {

                this.computePrimitiveSet( geometry, primitiveSet );

            }, this );

            var nbElements = size / 3;
            var tangents = new osg.Float32Array( nbElements * 4 );

            var tmp0 = Vec3.create();
            var tmp1 = Vec3.create();
            var t3 = Vec3.create();

            for ( var i = 0; i < nbElements; i++ ) {
                var t = this._T.subarray( i * 3, i * 3 + 3 );
                var n = this._N.subarray( i * 3, i * 3 + 3 );
                var b = this._B.subarray( i * 3, i * 3 + 3 );

                Vec3.normalize( n, n );

                // Gram-Schmidt orthogonalize
                // Vec3 t3 = (t - n * (n * t));
                // t3.normalize();
                // finalTangent = Vec4(t3, 0.0);
                // Calculate handedness
                // finalTangent[3] = (((n ^ t) * b) < 0.0) ? -1.0 : 1.0;
                // The bitangent vector B is then given by B = (N × T) · Tw

                var nt = Vec3.dot( n, t );
                Vec3.mult( n, nt, tmp1 );
                Vec3.sub( t, tmp1, tmp0 );
                Vec3.normalize( tmp0, t3 );

                Vec3.cross( n, t, tmp0 );
                var sign = Vec3.dot( tmp0, b );
                sign = sign < 0.0 ? -1.0 : 0.0;

                // TODO perf : cache index var id = i * 4;
                tangents[ i * 4 ] = t3[ 0 ];
                tangents[ i * 4 + 1 ] = t3[ 1 ];
                tangents[ i * 4 + 2 ] = t3[ 2 ];
                tangents[ i * 4 + 3 ] = sign;
            }

            geometry.getAttributes().Normal.setElements( this._N );
            geometry.getAttributes().Tangent = new BufferArray( 'ARRAY_BUFFER', tangents, 4 );

        },

        compute: function ( primitiveSet, vx, nx, tx, ia, ib, ic ) {

            var i0 = primitiveSet.index( ia );
            var i1 = primitiveSet.index( ib );
            var i2 = primitiveSet.index( ic );

            // TODO perf : cache xx.getElements() but more importantly
            // subarray call have very high overhead, it's super useful
            // when you call it a few times for big array chunk, but for
            // small array extraction (each vertex) it's better to use a temporary
            // pre allocated array and simply fill it
            // then, you'll have to write in the big arrays at the end
            var P1 = vx.getElements().subarray( i0 * 3, i0 * 3 + 3 );
            var P2 = vx.getElements().subarray( i1 * 3, i1 * 3 + 3 );
            var P3 = vx.getElements().subarray( i2 * 3, i2 * 3 + 3 );

            var N1 = nx.getElements().subarray( i0 * 3, i0 * 3 + 3 );
            var N2 = nx.getElements().subarray( i1 * 3, i1 * 3 + 3 );
            var N3 = nx.getElements().subarray( i2 * 3, i2 * 3 + 3 );

            var uv1 = tx.getElements().subarray( i0 * 2, i0 * 2 + 2 );
            var uv2 = tx.getElements().subarray( i1 * 2, i1 * 2 + 2 );
            var uv3 = tx.getElements().subarray( i2 * 2, i2 * 2 + 2 );

            var vz, vy;
            // TODO perf : use temporary vec
            var V = Vec3.create();

            var B1 = Vec3.create();
            var B2 = Vec3.create();
            var B3 = Vec3.create();

            var T1 = Vec3.create();
            var T2 = Vec3.create();
            var T3 = Vec3.create();

            var v1 = Vec3.create();
            var v2 = Vec3.create();


            Vec3.set( P2[ 0 ] - P1[ 0 ], uv2[ 0 ] - uv1[ 0 ], uv2[ 1 ] - uv1[ 1 ], v1 );
            Vec3.set( P3[ 0 ] - P1[ 0 ], uv3[ 0 ] - uv1[ 0 ], uv3[ 1 ] - uv1[ 1 ], v2 );

            Vec3.cross( v1, v2, V );

            if ( V[ 0 ] !== 0.0 ) {
                Vec3.normalize( V, V );
                vy = -V[ 1 ] / V[ 0 ];
                vz = -V[ 2 ] / V[ 0 ];
                T1[ 0 ] += vy;
                B1[ 0 ] += vz;
                T2[ 0 ] += vy;
                B2[ 0 ] += vz;
                T3[ 0 ] += vy;
                B3[ 0 ] += vz;
            }


            Vec3.set( P2[ 1 ] - P1[ 1 ], uv2[ 0 ] - uv1[ 0 ], uv2[ 1 ] - uv1[ 1 ], v1 );
            Vec3.set( P3[ 1 ] - P1[ 1 ], uv3[ 0 ] - uv1[ 0 ], uv3[ 1 ] - uv1[ 1 ], v2 );

            Vec3.cross( v1, v2, V );

            if ( V[ 0 ] !== 0.0 ) {
                Vec3.normalize( V, V );
                vy = -V[ 1 ] / V[ 0 ];
                vz = -V[ 2 ] / V[ 0 ];
                T1[ 1 ] += vy;
                B1[ 1 ] += vz;
                T2[ 1 ] += vy;
                B2[ 1 ] += vz;
                T3[ 1 ] += vy;
                B3[ 1 ] += vz;
            }


            Vec3.set( P2[ 2 ] - P1[ 2 ], uv2[ 0 ] - uv1[ 0 ], uv2[ 1 ] - uv1[ 1 ], v1 );
            Vec3.set( P3[ 2 ] - P1[ 2 ], uv3[ 0 ] - uv1[ 0 ], uv3[ 1 ] - uv1[ 1 ], v2 );

            Vec3.cross( v1, v2, V );

            if ( V[ 0 ] !== 0.0 ) {
                Vec3.normalize( V, V );
                vy = -V[ 1 ] / V[ 0 ];
                vz = -V[ 2 ] / V[ 0 ];
                T1[ 2 ] += vy;
                B1[ 2 ] += vz;
                T2[ 2 ] += vy;
                B2[ 2 ] += vz;
                T3[ 2 ] += vy;
                B3[ 2 ] += vz;
            }

            var tempVec = Vec3.create();
            var tempVec2 = Vec3.create();

            var Tdst, Bdst, Ndst;

            Vec3.cross( N1, T1, tempVec );
            Vec3.cross( tempVec, N1, tempVec2 );
            Tdst = this._T.subarray( i0 * 3, i0 * 3 + 3 );
            Vec3.add( tempVec2, Tdst, Tdst );

            Vec3.cross( B1, N1, tempVec );
            Vec3.cross( N1, tempVec, tempVec2 );
            Bdst = this._B.subarray( i0 * 3, i0 * 3 + 3 );
            Vec3.add( tempVec2, Bdst, Bdst );


            Vec3.cross( N2, T2, tempVec );
            Vec3.cross( tempVec, N2, tempVec2 );
            Tdst = this._T.subarray( i1 * 3, i1 * 3 + 3 );
            Vec3.add( tempVec2, Tdst, Tdst );

            Vec3.cross( B2, N2, tempVec );
            Vec3.cross( N2, tempVec, tempVec2 );
            Bdst = this._B.subarray( i1 * 3, i1 * 3 + 3 );
            Vec3.add( tempVec2, Bdst, Bdst );


            Vec3.cross( N3, T3, tempVec );
            Vec3.cross( tempVec, N3, tempVec2 );
            Tdst = this._T.subarray( i2 * 3, i2 * 3 + 3 );
            Vec3.add( tempVec2, Tdst, Tdst );

            Vec3.cross( B3, N3, tempVec );
            Vec3.cross( N3, tempVec, tempVec2 );
            Bdst = this._B.subarray( i2 * 3, i2 * 3 + 3 );
            Vec3.add( tempVec2, Bdst, Bdst );


            Ndst = this._N.subarray( i0 * 3, i0 * 3 + 3 );
            Vec3.add( N1, Ndst, Ndst );

            Ndst = this._N.subarray( i1 * 3, i1 * 3 + 3 );
            Vec3.add( N2, Ndst, Ndst );

            Ndst = this._N.subarray( i2 * 3, i2 * 3 + 3 );
            Vec3.add( N3, Ndst, Ndst );
        }

    } );

    return TangentSpaceGenerator;
} );
