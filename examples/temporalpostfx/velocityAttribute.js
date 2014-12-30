'use strict';

var VelocityAttribute;
var VelocityNode;

( function () {

    var osgShader = window.OSG.osgShader;
    var osg = window.OSG.osg;
    var shaderNode = osgShader.node;
    var factory = osgShader.nodeFactory;

    VelocityAttribute = function () {
        osg.StateAttribute.call( this );
        this._attributeEnable = false;
    };
    VelocityAttribute.prototype = osg.objectLibraryClass( osg.objectInherit( osg.StateAttribute.prototype, {
        attributeType: 'Velocity',

        cloneType: function () {
            return new VelocityAttribute();
        },

        // uniforms list are per ClassType
        getOrCreateUniforms: function () {
            var obj = VelocityAttribute;
            if ( obj.uniforms ) return obj.uniforms;

            obj.uniforms = new osg.Map( {
                'enable': osg.Uniform.createInt1( 0, 'velocityEnable' )
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

    } ), 'osg', 'Velocity' );



    // this node will call a function velocity in the shader
    VelocityNode = function () {
        shaderNode.BaseOperator.apply( this, arguments );
    };

    VelocityNode.prototype = osg.objectInherit( shaderNode.BaseOperator.prototype, {

        type: 'Velocity',
        validInputs: [ 'enable' ],
        validOutputs: [ 'color' ],

        // it's a global declaration
        // you can make your include here or your global variable
        globalFunctionDeclaration: function () {
            return '#pragma include "velocity_node"';
        },

        // call the glsl function with input/output of the node
        computeFragment: function () {
            return osgShader.utils.callFunction( 'velocity', undefined, [
                this._inputs.enable,
                this._outputs.color
            ] );
        }

    } );

    factory.registerNode( 'Velocity', VelocityNode );

} )();