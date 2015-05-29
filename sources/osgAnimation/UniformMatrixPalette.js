define( [
    'osg/Utils',
    'osg/BufferArray',
    'osg/Notify',
    'osg/Object',
    'osg/Uniform'

], function ( MACROUTILS, BufferArray, Notify, ObjectBase, Uniform ) {

    'use strict';

    /**
     *   UniformMatrixPalette
     *
     *   Uniform array to store matrix. Matrix are stored with 3 vec4 so no scale are available in bone transform.
     */

    var UniformMatrixPalette = function () {
        this._unformPalette = undefined;
        this._bonePerVertex = undefined;
        this._palette = undefined;
        this._vertexIndexMatrixWeightList = undefined;
        this._boneWeightAttribArrays = undefined;
    };

    UniformMatrixPalette.prototype = {

        createVertexUniform: function () {
            var nbMatrix = this._palette.length;
            var matrix = new Float32Array( nbMatrix * 12 );
            for ( var i = 0; i < nbMatrix; i++ ) {
                var id = i * 12;
                matrix[ id ] = matrix[ id + 5 ] = matrix[ id + 10 ] = 1.0;
            }
            return new Uniform.createFloat4Array( matrix, 'uBones' );
        },

        // setUniformPalette: function ( stateSet ) {
        //     if ( this._ubonesUniform && stateSet )
        //         stateSet.addUniform( ubonesUniform );
        // },

        createVertexAttribList: ( function () {

            var compare = function ( a, b ) {
                return b.weight - a.weight;
            };

            return function () {

                var VertexIndexMatrixWeightList = this._vertexIndexMatrixWeightList;
                var keys = Object.keys( VertexIndexMatrixWeightList );
                var nbVerts = keys.length;
                var attributeBone = new Uint32Array( nbVerts * 4 );
                var attributeWeight = new Float32Array( nbVerts * 4 );

                for ( var i = 0; i < nbVerts; i++ ) {
                    var key = keys[ i ];
                    var bones = VertexIndexMatrixWeightList[ key ]; //take all bones

                    bones.sort( compare ); //sort it

                    // keep stronger bones
                    var sum = 0;
                    var j = 0;
                    for ( j = 0; j < 4 && bones[ j ]; j++ ) {
                        sum += bones[ j ].weight;
                    }
                    var mult = 1.0 / sum;
                    for ( var k = 0; k < j; k++ ) {
                        var id = i * 4 + k;
                        var bone = bones[ k ];
                        attributeBone[ id ] = bone.index;
                        attributeWeight[ id ] = bone.weight * mult;
                    }
                }

                return {
                    Bone: new BufferArray( BufferArray.ARRAY_BUFFER, attributeBone, 4 ),
                    Weight: new BufferArray( BufferArray.ARRAY_BUFFER, attributeWeight, 4 )
                };
            };

        } )(),

        createPalette: function ( boneMap, vertexIndexToBoneWeightMap ) {

            var maxBonePerVertex = 0;
            var boneNameCountMap = {};
            var vertexIndexWeigth = {};
            var bname2Palette = {};
            var palette = [];

            var indexWeigth = function ( _index, _weight ) {
                var entry = {
                    index: _index,
                    weight: _weight
                };
                return entry;
            };

            for ( var i = 0, l = vertexIndexToBoneWeightMap.length; i < l; i++ ) {

                var vertexIndex = i;
                var boneForThisVertex = 0;
                var boneWeightList = vertexIndexToBoneWeightMap[ i ];

                for ( var j = 0, k = boneWeightList.length; j < k; j++ ) {
                    var bw = boneWeightList[ j ];

                    if ( boneNameCountMap[ bw.name ] !== undefined ) {
                        boneNameCountMap[ bw.name ]++;
                        boneForThisVertex++;
                        if ( !vertexIndexWeigth[ vertexIndex ] ) vertexIndexWeigth[ vertexIndex ] = [];
                        vertexIndexWeigth[ vertexIndex ].push( indexWeigth( bname2Palette[ bw.name ], bw.weight ) );
                    } else if ( bw.weight > 1e-2 ) {
                        if ( boneMap[ bw.name ] === undefined ) {
                            Notify.info( 'RigTransformHardware.createPalette can t find bone ' + bw.name + ' skip this influence' );
                            continue;
                        }

                        boneNameCountMap[ bw.name ] = 1;
                        boneForThisVertex++;
                        palette.push( boneMap[ bw.name ] );
                        bname2Palette[ bw.name ] = palette.length - 1;
                        if ( !vertexIndexWeigth[ vertexIndex ] ) vertexIndexWeigth[ vertexIndex ] = [];
                        vertexIndexWeigth[ vertexIndex ].push( indexWeigth( bname2Palette[ bw.name ], bw.weight ) );
                    } else {
                        //Notify.warn( 'RigTransformHardware.createPalette Bone ' + bw.name + ' has a weight ' + bw.weight + ' for vertex ' + vertexIndex + ' this bone will not be in the palette' );
                    }

                }
                maxBonePerVertex = Math.max( maxBonePerVertex, boneForThisVertex );
            }

            Notify.info( 'RigTransformHardware.createPalette maximum number of bone per vertex is ' + maxBonePerVertex );
            Notify.info( 'RigTransformHardware.createPalette matrix palette has ' + boneNameCountMap.length + ' entries' );

            var keys = Object.keys( boneNameCountMap );
            for ( var p = 0, q = keys.length; p < q; p++ ) {
                var boneName = keys[ p ];
                var count = boneNameCountMap[ boneName ];

                Notify.info( 'RigTransformHardware::createPalette Bone ' + boneName + ' is used ' + count + ' times' );
            }

            this._bonePerVertex = maxBonePerVertex;
            this._palette = palette;
            this._vertexIndexMatrixWeightList = vertexIndexWeigth;
            this._unformPalette = this.createVertexUniform();
            this._boneWeightAttribArrays = this.createVertexAttribList();
            return true;
        },

        setElement: function ( index, matrix ) {

            if ( !this._unformPalette ) {
                Notify.log( 'UniformMatrixPalette.setElement() : Enable to set element ' + index );
                return false;
            }

            var uniformData = this._unformPalette.get();
            var mat = [ matrix[ 0 ], matrix[ 4 ], matrix[ 8 ], matrix[ 12 ],
                matrix[ 1 ], matrix[ 5 ], matrix[ 9 ], matrix[ 13 ],
                matrix[ 2 ], matrix[ 6 ], matrix[ 10 ], matrix[ 14 ]
            ];

            for ( var i = index * 12, l = ( index + 1 ) * 12, matI = 0; i < l; i++, matI++ ) {
                uniformData[ i ] = mat[ matI ];
            }
            this._unformPalette.set( uniformData );
            return true;
        }

    };

    return UniformMatrixPalette;

} );
