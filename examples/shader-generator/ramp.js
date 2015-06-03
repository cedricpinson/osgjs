( function () {
    'use strict';

    var osgShader = window.OSG.osgShader;
    var osg = window.OSG.osg;
    var shaderNode = osgShader.node;
    var factory = osgShader.nodeFactory;

    var RampAttribute = window.RampAttribute = function () {
        osg.StateAttribute.call( this );

        this._attributeEnable = false;
    };
    RampAttribute.prototype = osg.objectLibraryClass( osg.objectInherit( osg.StateAttribute.prototype, {
        attributeType: 'Ramp',

        cloneType: function () {
            return new RampAttribute();
        },

        setAttributeEnable: function ( state ) {
            this._attributeEnable = state;
        },

        getAttributeEnable: function () {
            return this._attributeEnable;
        },

        // getHash is used to know if an StateAttribute changed
        // if yes it will trigger a shader rebuild. You can for example
        // trigger a change if we enable or not the attribute. It's really
        // up to how you want to handle your shaders
        // if you dont want to trigger rebuild of shader then instead you an use a
        // uniform and keep always the same hash
        getHash: function () {
            return this.getType() + this._attributeEnable.toString();
        }

    } ), 'osg', 'Ramp' );



    // this node will call a function ramp in the shader
    // it will do a very basic operation like ramping the lighting
    var RampNode = window.RampNode = function () {
        shaderNode.BaseOperator.apply( this, arguments );
    };

    RampNode.prototype = osg.objectInherit( shaderNode.BaseOperator.prototype, {
        type: 'Ramp',
        validInputs: [ 'color' ],
        validOutputs: [ 'color' ],

        // it's a global declaration
        // you can make your include here or your global variable
        globalFunctionDeclaration: function () {
            return '#pragma include "custom.glsl"';
        },

        // call the glsl function with input/output of the node
        computeShader: function () {
            return osgShader.utils.callFunction( 'ramp', undefined, [
                this._inputs.color,
                this._outputs.color
            ] );
        }
    } );

    factory.registerNode( 'Ramp', RampNode );
} )();
