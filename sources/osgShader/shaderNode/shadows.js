define ( [
    'osg/Utils',
    'osgShader/shaderNode/Node'

], function ( MACROUTILS, Node ) {
    'use strict';

    // TODO : use GLSL libraries shadow.glsl
    var ShadowNode = function ( material, shadow ) {
        Node.call( this );
        this._shadow = shadow;
        this._material = material;
    };

    ShadowNode.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'ShadowNode',

        _inputMaps: [ 'texture_size', 'bias' ],

        // TODO: generate auto matically getters/setter using above map.
        connect: function ( name, i ) {
            this._inputs[ this._inputMaps.indexOf( name ) ] = i;
        },
        getConnection: function ( name /*, i */ ) {
            return this._inputs[ this._inputMaps.indexOf( name ) ];
        },

        globalFunctionDeclaration: function () {
            return [
                ''
            ].join( '\n' );
        },

        computeVertex: function () {
            var str = [ '',
                        '' ].join( '\n' );
            return str;
        },

        computeFragment: function () {
            var str = [ '',
                        '' ].join( '\n' );
            return str;
        }
    } );

    return ShadowNode;
} );
