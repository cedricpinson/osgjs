define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Geometry',
    'osg/Program',
    'osg/Uniform',
    'osg/Shader'
], function ( MACROUTILS, NodeVisitor, Geometry, Program, Uniform, Shader ) {

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
            '',
            'void main(void) {',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);',
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

    var GeometryColorDebugVisitor = function () {
        NodeVisitor.call( this );
        this.shader = getShader();
    };
    GeometryColorDebugVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
        apply: function ( node ) {
            if ( node instanceof Geometry && !node._isVisitedGeometryDebugDisplay ) {
                var st = node.getOrCreateStateSet();
                st.addUniform( Uniform.createFloat3( [ Math.random(), Math.random(), Math.random() ], 'uColorDebug' ) );
                st.setAttributeAndMode( this.shader );
                node._isVisitedGeometryDebugDisplay = true;
            }
            this.traverse( node );
        }
    } );

    return GeometryColorDebugVisitor;
} );
