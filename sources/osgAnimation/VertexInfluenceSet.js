define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Notify'

], function ( MACROUTILS, NodeVisitor, Notify ) {

    'use strict';

    /**
     *   VertexInfluenceSet
     */
    var VertexInfluenceSet = function () {
        this._bone2Vertexes = [];
        this._vertex2Bones = [];
    };

    VertexInfluenceSet.prototype = {

        addVertexInfluence: function ( v ) {
            this._bone2Vertexes.push( v );
        },

        buildVertex2BoneList: function () {

            this._vertex2Bones.length = 0;

            // Build _vertex2Bones
            var i, j, l, m;

            for ( i = 0, l = this._bone2Vertexes.length; i < l; i++ ) {
                var vi = this._bone2Vertexes[ i ];
                var viw = vi._map;

                var keys = Object.keys( viw );
                for ( j = 0, m = keys.length; j < m; j++ ) {
                    var index = keys[ j ];
                    var weight = viw[ index ];

                    var bw = {
                        name: vi._name,
                        weight: weight
                    };
                    if ( !this._vertex2Bones[ index ] )
                        this._vertex2Bones[ index ] = [];
                    this._vertex2Bones[ index ].push( bw );
                }
            }

            // normalize weight per vertex
            for ( i = 0, l = this._vertex2Bones.length; i < l; i++ ) {
                var bones = this._vertex2Bones[ i ];

                var sum = 0;
                for ( j = 0, m = bones.length; j < m; j++ ) {
                    var bone = bones[ j ];
                    sum += bone.weight;
                }

                if ( sum < 1e-4 ) {
                    Notify.warn( 'VertexInfluenceSet.buildVertex2BoneList warning the vertex ' + bones[ i ].name + ' seems to have 0 weight, skip normalize for this vertex' );

                } else {

                    var mult = 1.0 / sum;
                    for ( var k = 0, n = bones.length; k < n; k++ )
                        bones[ k ].weight = bones[ k ].weight * mult;
                }
            }
        },

        getVertexToBoneList: function () {
            return this._vertex2Bones;
        },

        clear: function () {
            this._bone2Vertexes.length = 0;
            this._vertex2Bones.length = 0;
        }
    };

    return VertexInfluenceSet;

} );
