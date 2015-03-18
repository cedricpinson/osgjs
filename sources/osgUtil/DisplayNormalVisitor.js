define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Geometry',
    'osg/BufferArray',
    'osg/DrawArrays',
    'osg/PrimitiveSet',
    'osg/StateSet',
    'osg/Uniform',
    'osg/Depth',
    'osg/Program',
    'osg/Shader'
], function ( MACROUTILS, NodeVisitor, Geometry, BufferArray, DrawArrays, PrimitiveSet, StateSet, Uniform, Depth, Program, Shader ) {

    'use strict';

    var program;

    var DisplayNormalVisitor = function () {
        NodeVisitor.call( this );

        this._unifScale = Uniform.createFloat( 1.0, 'uScale' );

        var ns = this._normalStateSet = new StateSet();
        ns.setAttribute( DisplayNormalVisitor.getShader() );
        ns.addUniform( Uniform.createFloat3( [ 1.0, 0.0, 0.0 ], 'uColorDebug' ) );
        ns.addUniform( this._unifScale );
        ns.setAttribute( new Depth( Depth.NEVER ) );

        var ts = this._tangentStateSet = new StateSet();
        ts.setAttribute( DisplayNormalVisitor.getShader() );
        ts.addUniform( Uniform.createFloat3( [ 0.0, 1.0, 0.0 ], 'uColorDebug' ) );
        ts.addUniform( this._unifScale );
        ts.setAttribute( new Depth( Depth.NEVER ) );
    };

    DisplayNormalVisitor.getShader = function () {
        if ( program ) return program;
        var vertexshader = [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'attribute vec3 Vertex;',
            'attribute vec3 Normal;',
            'uniform float uScale;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'void main(void) {',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex + Normal * uScale, 1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'uniform vec3 uColorDebug;',
            'void main(void) {',
            '  gl_FragColor = vec4(uColorDebug, 1.0);',
            '}'
        ].join( '\n' );
        program = new Program( new Shader( Shader.VERTEX_SHADER, vertexshader ), new Shader( Shader.FRAGMENT_SHADER, fragmentshader ) );
        return program;
    };

    DisplayNormalVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
        setScale: function ( scale ) {
            this._unifScale.set( scale );
        },
        setTangentVisibility: function ( bool ) {
            this._tangentStateSet.setAttribute( new Depth( bool ? Depth.LESS : Depth.NEVER ) );
        },
        setNormalVisibility: function ( bool ) {
            this._normalStateSet.setAttribute( new Depth( bool ? Depth.LESS : Depth.NEVER ) );
        },
        apply: function ( node ) {
            if ( node instanceof Geometry === false ) {
                this.traverse( node );
                return;
            }
            var vertices = node.getAttributes().Vertex;
            if ( !vertices || node._isVisitedNormalDebug )
                return;
            node._isVisitedNormalDebug = true;
            var norm = this.createDebugGeom( node.getAttributes().Normal, vertices );
            if ( norm ) {
                norm.setStateSet( this._normalStateSet );
                node.addChild( norm );
            }

            var tang = this.createDebugGeom( node.getAttributes().Tangent, vertices );
            if ( tang ) {
                tang.setStateSet( this._tangentStateSet );
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
            var lineNormals = new Float32Array( nbVertices * 2 * 3 );
            for ( var i = 0; i < nbVertices; ++i ) {
                var idl = i * 6;
                var idv = i * vSize;
                var idd = i * dSize;

                lineVertices[ idl ] = lineVertices[ idl + 3 ] = vertices[ idv ];
                lineVertices[ idl + 1 ] = lineVertices[ idl + 4 ] = vertices[ idv + 1 ];
                lineVertices[ idl + 2 ] = lineVertices[ idl + 5 ] = vertices[ idv + 2 ];
                lineNormals[ idl + 3 ] = dispVec[ idd ];
                lineNormals[ idl + 4 ] = dispVec[ idd + 1 ];
                lineNormals[ idl + 5 ] = dispVec[ idd + 2 ];
            }
            var g = new Geometry();
            g._isNormalDebug = true;
            g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, lineVertices, 3 );
            g.getAttributes().Normal = new BufferArray( BufferArray.ARRAY_BUFFER, lineNormals, 3 );
            var primitive = new DrawArrays( PrimitiveSet.LINES, 0, nbVertices * 2 );
            g.getPrimitives().push( primitive );
            return g;
        }
    } );

    return DisplayNormalVisitor;
} );
