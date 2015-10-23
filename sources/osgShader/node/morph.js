define( [
    'osg/Utils',
    'osg/Texture',
    'osgShader/utils',
    'osgShader/node/Node'
], function ( MACROUTILS, Texture, ShaderUtils, Node ) {
    'use strict';

    var Morph = function () {
        Node.apply( this );
    };

    var getVec3 = function ( vec ) {
        return vec.getType() === 'vec4' ? vec.getVariable() + '.rgb' : vec;
    };

    Morph.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'Morph',
        validInputs: [ 'doMorph', 'weights', 'vertex', 'target0', /*'target1','target2','target3'*/ ],
        validOutputs: [ 'out' ],

        globalFunctionDeclaration: function () {

            //vec3 morphTransform( const in vec4 weights,  const in vec3 vertex, const in vec3 target0, const in vec3 target1, const in vec3 target2 ) {
            //  if( length( weights ) == 0.0 ) return vertex;
            //  return vertex * (1.0 - ( + weights[0] + weights[1] + weights[2])) + target0 * weights[0] + target1 * weights[1] + target2 * weights[2];
            //}
            var nbTargets = Object.keys( this._inputs ).length - 3;
            var i = 0;

            // TODO: this should be rewrote with sprintf
            ////// Signature
            var str = 'vec3 morphTransform( const in vec4 weights,  const in vec3 vertex, const in vec3 target0';
            for ( i = 1; i < nbTargets; ++i )
                str += ', const in vec3 target' + i;
            str += ' ) { \n';

            ////// Morphing
            if ( nbTargets === 1 ) {

                str += 'return mix(vertex, target0, weights[0])';

            } else {

                str += '\tvec3 vecOut = vertex * (1.0 - ( weights[0]';
                for ( i = 1; i < nbTargets; ++i )
                    str += ' + weights[' + i + ']';
                str += '));\n';

                for ( i = 0; i < nbTargets; ++i )
                    str += '\tvecOut += target' + i + ' * weights[' + i + '];\n';

                str += '\treturn vecOut';
            }

            str += ';\n}\n';
            return str;
        },

        computeShader: function () {

            var inps = this._inputs;
            var inputs = [ inps.weights, getVec3( inps.vertex ) ];

            for ( var i = 0; i < 4; i++ ) {

                if ( !inps[ 'target' + i ] ) break;
                inputs.push( getVec3( inps[ 'target' + i ] ) );

            }

            ////// Check length
            var str = 'if( doMorph == false ){\n';
            str += this._outputs.out.getVariable() + ' =  ' + inps.vertex.getVariable() + '.rgb;\n';
            str += '} else {\n';
            str += ShaderUtils.callFunction( 'morphTransform', this._outputs.out, inputs );
            str += '}\n';

            return str;

        }
    } );

    return {
        Morph: Morph
    };

} );
