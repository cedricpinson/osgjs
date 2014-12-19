define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Geometry',
    'osg/BufferArray',
    'osg/DrawArrays',
    'osg/PrimitiveSet',
    'osg/Program',
    'osg/Shader',
    'osg/StateSet',
    'osg/Uniform',
    'osg/Depth'
], function ( MACROUTILS, NodeVisitor, Geometry, BufferArray, DrawArrays, PrimitiveSet, Program, Shader, StateSet, Uniform, Depth ) {

    'use strict';

    var program;
    var getShader = function () {
        if ( program ) return program;
        var vertexshader = [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'attribute vec3 Vertex;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'void main(void) {',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'uniform vec3 uColor;',
            'void main(void) {',
            '  gl_FragColor = vec4(uColor, 1.0);',
            '}'
        ].join( '\n' );
        program = new Program( new Shader( Shader.VERTEX_SHADER, vertexshader ), new Shader( Shader.FRAGMENT_SHADER, fragmentshader ) );
        return program;
    };

    var DisplayNormalVisitor = function ( scale ) {
        NodeVisitor.call( this );

        this.scale = scale || 1.0;

        this.normalStateSet = new StateSet();
        this.normalStateSet.setAttribute( getShader() );
        this.normalStateSet.addUniform( Uniform.createFloat3( [ 1.0, 0.0, 0.0 ], 'uColor' ) );
        this.normalStateSet.setAttribute( new Depth( Depth.NEVER ) );

        this.tangentStateSet = new StateSet();
        this.tangentStateSet.setAttribute( getShader() );
        this.tangentStateSet.addUniform( Uniform.createFloat3( [ 0.0, 1.0, 0.0 ], 'uColor' ) );
        this.tangentStateSet.setAttribute( new Depth( Depth.NEVER ) );
    };
    DisplayNormalVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
        setTangentVisibility: function ( bool ) {
            this.tangentStateSet.setAttribute( new Depth( bool ? Depth.LESS : Depth.NEVER ) );
        },
        setNormalVisibility: function ( bool ) {
            this.normalStateSet.setAttribute( new Depth( bool ? Depth.LESS : Depth.NEVER ) );
        },
        apply: function ( node ) {
            if ( node instanceof Geometry === false ) {
                this.traverse( node );
                return;
            }
            var vertices = node.getAttributes().Vertex;
            if ( !vertices || node._debugVisited )
                return;
            node._debugVisited = true;
            var norm = this.createDebugGeom( node.getAttributes().Normal, vertices );
            if ( norm ) {
                norm.setStateSet( this.normalStateSet );
                node.addChild( norm );
            }

            var tang = this.createDebugGeom( node.getAttributes().Tangent, vertices );
            if ( tang ) {
                tang.setStateSet( this.tangentStateSet );
                node.addChild( tang );
            }
        },
        createDebugGeom: function ( dispVec, vertices ) {
            if ( !dispVec )
                return;
            var vSize = vertices.getItemSize();
            var dSize = dispVec.getItemSize();
            dispVec = dispVec.getElements();
            vertices = vertices.getElements();

            var nbVertices = vertices.length / vSize;
            var lineVertices = new Float32Array( nbVertices * 2 * 3 );
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
            }
            var g = new Geometry();
            g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, lineVertices, 3 );
            var primitive = new DrawArrays( PrimitiveSet.LINES, 0, nbVertices * 2 );
            g.getPrimitives().push( primitive );
            return g;
        }
    } );

    return DisplayNormalVisitor;
} );
