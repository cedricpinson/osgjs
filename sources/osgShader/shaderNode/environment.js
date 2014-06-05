/*global define */

define ( [
    'osg/Utils',
    'osgShader/shaderNode/Node'

], function ( MACROUTILS, Node ) {


    var TextureSpheremap = function ( sampler, uv, output ) {
        Node.call( this, sampler, uv, output );
    };

    TextureSpheremap.prototype = MACROUTILS.objectInherit( Node.prototype, {

        type: 'TextureSpheremap',

        globalFunctionDeclaration: function () {
            return [
                '#pragma include "environment.glsl"'
            ].join( '\n' );
        },

        computeFragment: function() {
            return this.getOutput().getVariable() + ' = TextureSpheremap( ' + this._sampler.getVariable() + ' , ' + this._uv.getVariable() + '.xyz);';
        }

    } );


    var TextureSpheremapHdr = function ( sampler, uv, output ) {
        Node.call( this, sampler, uv, output );
    };

    TextureSpheremapHdr.prototype = MACROUTILS.objectInherit( Node.prototype, {

        type: 'TextureSpheremapHdr',

        globalFunctionDeclaration: function () {
            return [
                '#pragma include "environment.glsl"'
            ].join( '\n' );
        },

        computeFragment: function() {
            return this.getOutput().getVariable() + ' = TextureSpheremapHdr( ' + this._sampler.getVariable() + ' , ' + this._uv.getVariable() +'.xyz);';
        }

    } );


    return {
        'TextureSpheremap': TextureSpheremap,
        'TextureSpheremapHdr': TextureSpheremapHdr
    };
});
