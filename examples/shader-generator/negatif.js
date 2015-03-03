'use strict';
var NegatifAttribute;
var NegatifNode;

( function () {

    var osgShader = window.OSG.osgShader;
    var osg = window.OSG.osg;
    var shaderNode = osgShader.node;
    var factory = osgShader.nodeFactory;

    NegatifAttribute = function () {
        osg.StateAttribute.call( this );
        this._attributeEnable = false;
    };
    NegatifAttribute.prototype = osg.objectLibraryClass( osg.objectInherit( osg.StateAttribute.prototype, {
        attributeType: 'Negatif',

        cloneType: function () {
            return new NegatifAttribute();
        },

        // uniforms list are per ClassType
        getOrCreateUniforms: function () {
            var obj = NegatifAttribute;
            if ( obj.uniforms ) return obj.uniforms;

            obj.uniforms = new osg.Map( {
                'enable': osg.Uniform.createInt1( 0, 'negatifEnable' )
            } );

            return obj.uniforms;
        },

        setAttributeEnable: function ( state ) {
            this._attributeEnable = state;
            this.dirty();
        },

        getAttributeEnable: function () {
            return this._attributeEnable;
        },

        apply: function ( /*state*/) {
            var uniforms = this.getOrCreateUniforms();
            var value = this._attributeEnable ? 1 : 0;
            uniforms.enable.set( value );

            this.setDirty( false );
        }


    } ), 'osg', 'Negatif' );



    // this node will call a function negatif in the shader
    NegatifNode = function () {
        shaderNode.BaseOperator.apply( this, arguments );
    };

    NegatifNode.prototype = osg.objectInherit( shaderNode.BaseOperator.prototype, {
        type: 'Negatif',
        validInputs: [ 'enable', 'color' ],
        validOutputs: [ 'color' ],

        // it's a global declaration
        // you can make your include here or your global variable
        globalFunctionDeclaration: function () {
            return '#pragma include "custom.glsl"';
        },

        // call the glsl function with input/output of the node
        computeFragment: function () {
            return osgShader.utils.callFunction( 'negatif', undefined, [
                this._inputs.enable,
                this._inputs.color,
                this._outputs.color
            ] );
        }
    } );

    factory.registerNode( 'Negatif', NegatifNode );


} )();
