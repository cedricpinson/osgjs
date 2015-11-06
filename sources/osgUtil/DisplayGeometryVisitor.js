'use strict';
var MACROUTILS = require( 'osg/Utils' );
var NodeVisitor = require( 'osg/NodeVisitor' );
var Geometry = require( 'osg/Geometry' );
var Uniform = require( 'osg/Uniform' );
var StateSet = require( 'osg/StateSet' );
var Vec3 = require( 'osg/Vec3' );
var ShaderGenerator = require( 'osgShader/ShaderGenerator' );
var Compiler = require( 'osgShader/Compiler' );


////////////////////////
// COMPILER DEBUG GEOMETRY
////////////////////////
var CompilerColorGeometry = function () {
    Compiler.apply( this, arguments );
    this._isVertexColored = false;
};

CompilerColorGeometry.prototype = MACROUTILS.objectInherit( Compiler.prototype, {
    getFragmentShaderName: function () {
        return 'CompilerDebugGeometry';
    },
    initTextureAttributes: function () {},
    createFragmentShaderGraph: function () {
        var frag = this.getNode( 'glFragColor' );

        this.getNode( 'SetAlpha' ).inputs( {
            color: this.getOrCreateUniform( 'vec3', 'uColorDebug' ),
            alpha: this.createVariable( 'float' ).setValue( '1.0' )
        } ).outputs( {
            color: frag
        } );

        return [ frag ];
    },
    declareVertexTransforms: Compiler.prototype.declareVertexTransformShadeless
} );

var ShaderGeneratorCompilerColorGeometry = function () {
    ShaderGenerator.apply( this, arguments );
    this.setShaderCompiler( CompilerColorGeometry );
};
ShaderGeneratorCompilerColorGeometry.prototype = ShaderGenerator.prototype;


///////////////////////////
// DISPLAY GEOMETRY VISITOR
///////////////////////////

var GeometryColorDebugVisitor = function () {
    NodeVisitor.call( this );
    this._customShader = true;
};

GeometryColorDebugVisitor.CompilerColorGeometry = CompilerColorGeometry;
GeometryColorDebugVisitor.ShaderGeneratorCompilerColorGeometry = ShaderGeneratorCompilerColorGeometry;

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
                st.addUniform( Uniform.createFloat3( Vec3.createAndSet( Math.random(), Math.random(), Math.random() ), 'uColorDebug' ) );
                st.setShaderGeneratorName( 'debugGeometry' );
            } else {
                node.setStateSet( node._originalStateSet );
            }
        }

        this.traverse( node );
    }
} );

module.exports = GeometryColorDebugVisitor;
