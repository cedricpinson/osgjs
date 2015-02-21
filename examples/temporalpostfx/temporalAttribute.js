'use strict';

var TemporalAttribute;
var TemporalNode;

( function () {

    var osgShader = window.OSG.osgShader;
    var osg = window.OSG.osg;
    var shaderNode = osgShader.node;
    var factory = osgShader.nodeFactory;

    TemporalAttribute = function () {
        osg.StateAttribute.call( this );
        this._attributeEnable = false;
    };
    TemporalAttribute.prototype = osg.objectLibraryClass( osg.objectInherit( osg.StateAttribute.prototype, {
        attributeType: 'Temporal',

        cloneType: function () {
            return new TemporalAttribute();
        },

        // uniforms list are per ClassType
        getOrCreateUniforms: function () {
            var obj = TemporalAttribute;
            if ( obj.uniforms ) return obj.uniforms;

            obj.uniforms = new osg.Map( {
                'enable': osg.Uniform.createInt1( 0, 'temporalEnable' )
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

    } ), 'osg', 'Temporal' );



    // this node will call a function temporal in the shader
    TemporalNode = function () {
        shaderNode.BaseOperator.apply( this, arguments );
    };

    TemporalNode.prototype = osg.objectInherit( shaderNode.BaseOperator.prototype, {

        type: 'Temporal',
        validInputs: [ 'enable', 'color' ],
        validOutputs: [ 'color' ],

        // it's a global declaration
        // you can make your include here or your global variable
        globalFunctionDeclaration: function () {
            return '#pragma include "ssaa_node"';
        },

        // call the glsl function with input/output of the node
        computeFragment: function () {
            return osgShader.utils.callFunction( 'temporal', undefined, [
                this._inputs.enable,
                this._inputs.color,
                this._outputs.color
            ] );
        }

    } );

    factory.registerNode( 'Temporal', TemporalNode );

} )();
