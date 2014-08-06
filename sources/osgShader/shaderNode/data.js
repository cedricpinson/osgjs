define( [
    'osg/Utils',
    'osgShader/shaderNode/Node',
    'osgShader/utils/sprintf'

], function ( MACROUTILS, Node, sprintf ) {
    'use strict';

    var Variable = function ( type, prefix ) {
        Node.call( this );
        this._name = 'Variable';
        this._prefix = prefix;
        this._type = type;
        this._defaultValue = 10;
        this._disabledValue = 0;
        this._value = undefined;
    };

    Variable.prototype = MACROUTILS.objectInherit( Node.prototype, {

        getType: function () {
            return this._type;
        },

        getVariable: function () {
            return this._prefix;
        },

        setValue: function ( value ) {
            this._value = value;
        },

        declare: function () {

            if ( this._value !== undefined ) {
                return sprintf( '%s %s = %s;', [ this._type, this.getVariable(), this._value ] );
            } else {
                return sprintf( '%s %s;', [ this._type, this.getVariable() ] );
            }
        }
    } );


    var InlineConstant = function ( content ) {
        Node.call( this );
        this._value = content;
    };

    InlineConstant.prototype = MACROUTILS.objectInherit( Node.prototype, {

        getVariable: function () {
            return this._value;
        },

        setValue: function ( value ) {
            this._value = value;
        }

    } );

    var Uniform = function ( type, prefix ) {
        Variable.call( this, type, prefix );
    };

    Uniform.prototype = MACROUTILS.objectInherit( Variable.prototype, {

        declare: function () {
            return undefined;
        },

        globalDeclaration: function () {
            return sprintf( 'uniform %s %s;', [ this._type, this.getVariable() ] );
        }

    } );



    var Varying = function ( type, prefix ) {
        Variable.call( this, type, prefix );
    };

    Varying.prototype = MACROUTILS.objectInherit( Variable.prototype, {

        declare: function () {
            return undefined;
        },

        globalDeclaration: function () {
            return sprintf( 'varying %s %s;', [ this._type, this.getVariable() ] );
        }

    } );




    var Sampler = function ( type, prefix ) {
        Variable.call( this, type, prefix );
    };

    Sampler.prototype = MACROUTILS.objectInherit( Variable.prototype, {

        declare: function () {
            return undefined;
        },

        globalDeclaration: function () {
            return sprintf( 'uniform %s %s;', [ this._type, this.getVariable() ] );
        }

    } );


    return {
        'Sampler': Sampler,
        'Variable': Variable,
        'Varying': Varying,
        'Uniform': Uniform,
        'InlineConstant': InlineConstant
    };

} );
