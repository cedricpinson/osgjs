define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Geometry',
    'osg/Program',
    'osg/Uniform',
    'osg/Shader',
    'osg/StateSet'
], function ( MACROUTILS, NodeVisitor, Geometry, Program, Uniform, Shader, StateSet ) {

    'use strict';

    var program;

    var GeometryColorDebugVisitor = function () {
        NodeVisitor.call( this );
        this._customShader = true;
    };
    GeometryColorDebugVisitor.getShader = function () {
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
            'uniform vec3 uColorDebug;',
            'void main(void) {',
            '  gl_FragColor = vec4(uColorDebug, 1.0);',
            '}'
        ].join( '\n' );
        program = new Program( new Shader( Shader.VERTEX_SHADER, vertexshader ), new Shader( Shader.FRAGMENT_SHADER, fragmentshader ) );
        return program;
    };
    GeometryColorDebugVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
        setCustomShader: function ( node, bool ) {
            this._customShader = bool;
            this.apply( node );
        },
        apply: function ( node ) {
            if ( node._isNormalDebug )
                return;
            if ( node instanceof Geometry ) {
                if ( this._customShader ) {
                    var st = new StateSet();
                    node._originalStateSet = node.getStateSet();
                    node.setStateSet( st );
                    st.addUniform( Uniform.createFloat3( [ Math.random(), Math.random(), Math.random() ], 'uColorDebug' ) );
                    st.setAttributeAndModes( GeometryColorDebugVisitor.getShader() );
                } else {
                    node.setStateSet( node._originalStateSet );
                }
            }
            this.traverse( node );
        }
    } );

    return GeometryColorDebugVisitor;
} );
