define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Geometry',
    'osg/BufferArray',
    'osg/DrawArrays',
    'osg/PrimitiveSet',
    'osg/Program',
    'osg/Shader'
], function ( MACROUTILS, NodeVisitor, Geometry, BufferArray, DrawArrays, PrimitiveSet, Program, Shader ) {

    'use strict';

    var program;
    var getShader = function () {
        if ( program ) return program;
        var vertexshader = [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'attribute vec3 Vertex;',
            'attribute vec3 Color;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            '',
            'varying vec3 vColor;',
            '',
            'void main(void) {',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);',
            '  vColor = Color;',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'varying vec3 vColor;',
            'void main(void) {',
            '  gl_FragColor = vec4(vColor, 1.0);',
            '}'
        ].join( '\n' );
        program = new Program( new Shader( Shader.VERTEX_SHADER, vertexshader ), new Shader( Shader.FRAGMENT_SHADER, fragmentshader ) );
        return program;
    };

    var DisplayNormalVisitor = function ( scale, color, displayTangent ) {
        NodeVisitor.call( this );
        this.scale = scale || 1.0;
        this.displayTangent = displayTangent;
        this.color = color || ( displayTangent ? [ 0.0, 1.0, 0.0 ] : [ 1.0, 0.0, 0.0 ] );
    };
    DisplayNormalVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
        apply: function ( node ) {
            if ( node instanceof Geometry && !node._isVisitedNormalDebugDisplay ) {
                var dispVec = this.displayTangent ? node.getAttributes().Tangent : node.getAttributes().Normal;
                var vertices = node.getAttributes().Vertex;

                if ( dispVec && vertices ) {
                    var vSize = vertices.getItemSize();
                    var dSize = dispVec.getItemSize();
                    dispVec = dispVec.getElements();
                    vertices = vertices.getElements();

                    var cr = this.color[ 0 ];
                    var cg = this.color[ 1 ];
                    var cb = this.color[ 2 ];

                    var nbVertices = vertices.length / vSize;
                    var lineVertices = new Float32Array( nbVertices * 2 * 3 );
                    var lineColors = new Float32Array( nbVertices * 2 * 3 );
                    var scale = this.scale;
                    var i = 0;
                    for ( i = 0; i < nbVertices; ++i ) {
                        var idl = i * 6;
                        var idv = i * vSize;
                        var idd = i * dSize;

                        lineVertices[ idl ] = vertices[ idv ];
                        lineVertices[ idl + 1 ] = vertices[ idv + 1 ];
                        lineVertices[ idl + 2 ] = vertices[ idv + 2 ];
                        lineVertices[ idl + 3 ] = vertices[ idv ] + dispVec[ idd ] * scale;
                        lineVertices[ idl + 4 ] = vertices[ idv + 1 ] + dispVec[ idd + 1 ] * scale;
                        lineVertices[ idl + 5 ] = vertices[ idv + 2 ] + dispVec[ idd + 2 ] * scale;
                        lineColors[ idl ] = lineColors[ idl + 3 ] = cr;
                        lineColors[ idl + 1 ] = lineColors[ idl + 4 ] = cg;
                        lineColors[ idl + 2 ] = lineColors[ idl + 5 ] = cb;
                    }
                    var g = new Geometry();
                    g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, lineVertices, 3 );
                    g.getAttributes().Color = new BufferArray( BufferArray.ARRAY_BUFFER, lineColors, 3 );
                    var primitive = new DrawArrays( PrimitiveSet.LINES, 0, nbVertices * 2 );
                    g.getPrimitives().push( primitive );
                    g.getOrCreateStateSet().setAttributeAndModes( getShader() );
                    node.addChild( g );
                    g._isVisitedNormalDebugDisplay = true;
                }
            }
            this.traverse( node );
        }
    } );

    return DisplayNormalVisitor;
} );
