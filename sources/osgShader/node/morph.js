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

    Morph.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'Morph',
        validInputs: [ 'weights', 'vertex', 'target1', /*'target2','target3','target4'*/ ],
        validOutputs: [ 'out' ],

        globalFunctionDeclaration: function () {
            //vec3 morphTransform( const in vec4 weightsTarget,  const in vec3 vertex, const in vec3 target0, const in vec3 target1, const in vec3 target2 ) {
            //  if( length( weightsTarget ) == 0.0 ) return vertex;
            //  vec4 weight = normalize( weightsTarget );
            //  return vertex * (1.0 - ( + weight[0] + weight[1] + weight[2])) +  + target0 * weight[0] + target1 * weight[1] + target2 * weight[2];
            //}
            var nbTargets = Object.keys( this._inputs ).length - 2;
            var i = 0;

            var str = 'vec3 morphTransform( const in vec4 weightsTarget,  const in vec3 vertex, ';

            str += 'const in vec3 ' + 'target' + i;
            for ( i = 1; i < nbTargets; ++i )
                str += ', const in vec3 ' + 'target' + i;
            str += ' ) { \n';

            str += '\tif( length( weightsTarget ) == 0.0 ) return vertex;\n';
            if ( nbTargets > 1 )
                str += '\tvec4 weight = normalize( weightsTarget );\n';
            var weightVar = nbTargets > 1 ? 'weight' : 'weightsTarget';

            str += '\treturn vertex * (1.0 - (';
            for ( i = 0; i < nbTargets; ++i )
                str += ' + ' + weightVar + '[' + i + ']';

            str += ')) + ';
            for ( i = 0; i < nbTargets; ++i )
                str += ' + target' + i + ' * ' + weightVar + '[' + i + ']';

            return str += ';' + '\n}\n';
        },

        computeShader: function () {
            var inputs = [ this._inputs.weights, this._inputs.vertex ];
            for ( var i = 1; i <= 4; i++ ) {
                if ( !this._inputs[ 'target' + i ] ) break;
                inputs.push( this._inputs[ 'target' + i ] );
            }

            return ShaderUtils.callFunction( 'morphTransform', this._outputs.out, inputs );
        }
    } );

    return {
        Morph: Morph
    };

} );
