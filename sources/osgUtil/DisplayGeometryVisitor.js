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


////////////////////////
// COMPILER SKINNING DEBUG
////////////////////////
var CompilerColorSkinning = function () {
    Compiler.apply( this, arguments );
    this._isVertexColored = false;
};

CompilerColorSkinning.prototype = MACROUTILS.objectInherit( Compiler.prototype, {
    getFragmentShaderName: function () {
        return 'CompilerDebugSkinning';
    },
    initTextureAttributes: function () {},
    createFragmentShaderGraph: function () {
        var frag = this.getNode( 'glFragColor' );

        this.getNode( 'SetAlpha' ).inputs( {
            color: this.getOrCreateVarying( 'vec3', 'vColorBone' ),
            alpha: this.createVariable( 'float' ).setValue( '1.0' )
        } ).outputs( {
            color: frag
        } );

        return [ frag ];
    },
    declareVertexTransforms: function ( glPosition ) {

        var color = this.getOrCreateVarying( 'vec3', 'vColorBone' );

        this.getNode( 'InlineCode' ).code( [
            '#define RAND_F(id) fract(sin(id * 45.233) * 43758.5453)',
            '#define GEN_COLOR(id) vec3(RAND_F(id+2.16), RAND_F(id*57.27), RAND_F(id*0.874))',
            '%color = %weights.x*GEN_COLOR(%bones.x+%rand);',
            '%color += %weights.y*GEN_COLOR(%bones.y+%rand);',
            '%color += %weights.z*GEN_COLOR(%bones.z+%rand);',
            '%color += %weights.a*GEN_COLOR(%bones.a+%rand);'
        ].join( '\n' ) ).inputs( {
            bones: this.getOrCreateAttribute( 'vec4', 'Bones' ),
            weights: this.getOrCreateAttribute( 'vec4', 'Weights' ),
            rand: this.getOrCreateUniform( 'float', 'uDebugRandom' )
        } ).outputs( {
            color: color
        } );

        return Compiler.prototype.declareVertexTransformShadeless.call( this, glPosition );
    }
} );

var ShaderGeneratorCompilerColorSkinning = function () {
    ShaderGenerator.apply( this, arguments );
    this.setShaderCompiler( CompilerColorSkinning );
};
ShaderGeneratorCompilerColorSkinning.prototype = ShaderGenerator.prototype;


///////////////////////////
// DISPLAY GEOMETRY VISITOR
///////////////////////////

var GeometryColorDebugVisitor = function () {
    NodeVisitor.call( this );
    this._debugColor = true;
    this._debugSkinning = false;
};

GeometryColorDebugVisitor.CompilerColorGeometry = CompilerColorGeometry;
GeometryColorDebugVisitor.ShaderGeneratorCompilerColorGeometry = ShaderGeneratorCompilerColorGeometry;

GeometryColorDebugVisitor.CompilerSkinningGeometry = CompilerColorSkinning;
GeometryColorDebugVisitor.ShaderGeneratorCompilerColorSkinning = ShaderGeneratorCompilerColorSkinning;

GeometryColorDebugVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
    setGeometryDebug: function ( node ) {
        this._debugColor = true;
        this._debugSkinning = false;
        this.apply( node );
    },
    setSkinningDebug: function ( node ) {
        this._debugColor = false;
        this._debugSkinning = true;
        this.apply( node );
    },
    disableDebug: function ( node ) {
        this._debugColor = false;
        this._debugSkinning = false;
        this.apply( node );
    },
    apply: function ( node ) {
        if ( node._isNormalDebug )
            return;

        if ( node instanceof Geometry ) {

            if ( this._debugColor || this._debugSkinning ) {

                if ( node._originalStateSet === undefined )
                    node._originalStateSet = node.getStateSet() || null;

                var st = new StateSet();
                node.setStateSet( st );

                if ( this._debugSkinning ) {
                    st.addUniform( Uniform.createFloat1( Math.random(), 'uDebugRandom' ) );
                    st.setShaderGeneratorName( 'debugSkinning' );
                } else {
                    st.addUniform( Uniform.createFloat3( Vec3.createAndSet( Math.random(), Math.random(), Math.random() ), 'uColorDebug' ) );
                    st.setShaderGeneratorName( 'debugGeometry' );
                }

            } else if ( node._originalStateSet ) {
                node.setStateSet( node._originalStateSet );
            }

        }

        this.traverse( node );
    }
} );

module.exports = GeometryColorDebugVisitor;
