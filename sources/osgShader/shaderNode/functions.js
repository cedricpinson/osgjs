define( [
    'osg/Utils',
    'osgShader/shaderNode/Node'

], function ( MACROUTILS, Node ) {
    'use strict';

    // TODO populate function.glsl replacement
    var NormalizeNormalAndEyeVector = function ( fnormal, fpos ) {
        Node.apply( this, arguments );
        this._normal = fnormal;
        this._position = fpos;
    };
    NormalizeNormalAndEyeVector.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'NormalizeNormalAndEyeVector',
        connectOutputNormal: function ( n ) {
            this._outputNormal = n;
            this.autoLink( this._outputNormal );
        },
        connectOutputEyeVector: function ( n ) {
            this._outputEyeVector = n;
            this.autoLink( this._outputEyeVector );
        },
        computeFragment: function () {
            var str = [ '',
                this._outputNormal.getVariable() + ' = normalize(' + this._normal.getVariable() + ');',
                this._outputEyeVector.getVariable() + ' = -normalize(' + this._position.getVariable() + ');'
            ].join( '\n' );
            return str;
        }
    } );

    var sRGB2Linear = function ( input, output ) {
        Node.call( this, input );
        this.connectOutput( output );
    };
    sRGB2Linear.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'sRGB2Linear',
        computeFragment: function () {
            var inputType = this._inputs[ 0 ].getType();
            return this.getOutput().getVariable() + ' = srgb2linearrgb_' + inputType + '(' + this._inputs[ 0 ].getVariable() + ');';
        },
        globalFunctionDeclaration: function () {
            var str = [
                '#pragma include "functions.glsl"',
                ''
            ].join( '\n' );
            return str;
        }
    } );

    var Linear2sRGB = function ( input, output, gamma ) {
        Node.call( this, input );
        this.connectOutput( output );
        this._gamma = gamma;
    };
    Linear2sRGB.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'Linear2sRGB',
        computeFragment: function () {
            return this.getOutput().getVariable() + ' = linearrgb2srgb_vec3(' + this._inputs[ 0 ].getVariable() + '.rgb, ' + this._gamma.getVariable() + ');';
        },
        globalFunctionDeclaration: function () {
            var str = [
                '#pragma include "functions.glsl"',
                '',
                ''
            ].join( '\n' );
            return str;
        }
    } );
    Linear2sRGB.defaultGamma = 2.4;


    var NormalTangentSpace = function ( tangent, normal, texNormal, output ) {
        Node.call( this, tangent, normal, texNormal );
        if ( output !== undefined ) {
            this.connectOutput( output );
        }
    };
    NormalTangentSpace.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'NormalTangentSpace',
        globalFunctionDeclaration: function () {
            // about the default normal to 0.0, 1.0, 0.0
            // http://www.opengl.org/discussion_boards/showthread.php/171971-GLSL-normalize-and-length-on-zero-vectors
            var str = [
                '#pragma include "functions.glsl"'
            ].join( '\n' );
            return str;
        },
        computeFragment: function () {
            return 'mtex_nspace_tangent(' + this._inputs[ 0 ].getVariable() + ', ' + this._inputs[ 1 ].getVariable() + ', ' + this._inputs[ 2 ].getVariable() + ', ' + this.getOutput().getVariable() + ');';
        }
    } );


    var EnvironmentTransform = function ( environmentTransform, direction, output ) {
        Node.call( this );
        this.connectInputs( environmentTransform, direction );
        this._direction = direction;
        this._environmentTransform = environmentTransform;

        if ( output !== undefined ) {
            this.connectOutput( output );
        }

        this._output = output;
    };
    EnvironmentTransform.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'EnvironmentTransform',

        computeFragment: function () {
            var str = [ '',
                this.getOutput().getVariable() + ' = environmentTransform(' + this._environmentTransform.getVariable() + ', ' + this._direction.getVariable() + ');'
            ].join( '\n' );
            return str;
        },

        globalFunctionDeclaration: function () {
            return [
                'vec3 environmentTransform(const in mat4 transform, const in vec3 direction)',
                '{',
                '  // it s done manually instead of mat3(transform) because of bug in some',
                '  // mobile driver',
                '  vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);',
                '  vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);',
                '  vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);',
                '  mat3 m = mat3(x,y,z);',
                '  return m*direction;',
                '  //return direction*mat3(transform);',
                '}',
                ''
            ].join( '\n' );
        }
    } );


    var Bumpmap = function ( tangent, normal, gradient, output ) {
        Node.call( this, tangent, normal, gradient );
        if ( output !== undefined ) {
            this.connectOutput( output );
        }
    };
    Bumpmap.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'Bumpmap',
        computeFragment: function () {
            return this.getOutput().getVariable() + ' = bump_map(' + this._inputs[ 0 ].getVariable() + ', ' + this._inputs[ 1 ].getVariable() + ', ' + this._inputs[ 2 ].getVariable() + ');';
        },
        globalFunctionDeclaration: function () {
            var str = [
                '',
                'vec3 bump_map(const in vec4 tangent, const in vec3 normal, const in vec2 gradient) {',
                'vec3 outnormal;',
                'if (length(tangent.xyz) != 0.0) {',
                '	vec3 tang =  normalize(tangent.xyz);',
                '	vec3 binormal = tangent.w * cross(normal, tang);',
                '	outnormal = normal + gradient.x * tang + gradient.y * binormal;',
                '}',
                'else{',
                '	outnormal = vec3(normal.x + gradient.x, normal.y + gradient.y, normal.z);',
                '}',
                'return normalize(outnormal);',
                '}'
            ].join( '\n' );
            return str;
        }
    } );


    return {
        'sRGBToLinear': sRGB2Linear,
        'LinearTosRGB': Linear2sRGB,
        'NormalTangentSpace': NormalTangentSpace,
        'EnvironmentTransform': EnvironmentTransform,
        'Bumpmap': Bumpmap,
        'NormalizeNormalAndEyeVector': NormalizeNormalAndEyeVector
    };

} );
