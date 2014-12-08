define( [
    'osg/Utils',
    'osgShader/utils',
    'osgShader/node/Node'

], function ( MACROUTILS, utils, Node ) {
    'use strict';

    var sprintf = utils.sprintf;

    var Variable = function ( type, prefix ) {
        Node.apply( this );
        this._name = 'Variable';
        this._prefix = prefix;
        this._type = type;
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
            return this;
        },

        declare: function () {
            if ( this._value !== undefined ) {
                return sprintf( '%s %s = %s;', [ this._type, this.getVariable(), this._value ] );
            } else {
                return sprintf( '%s %s;', [ this._type, this.getVariable() ] );
            }
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


    var FragColor = function () {
        Variable.call( this, 'vec4', 'gl_FragColor' );
    };
    FragColor.prototype = MACROUTILS.objectInherit( Variable.prototype, {

        outputs: function () { /* do nothing for variable */
            return this;
        },
        getVariable: function () {
            return this._prefix;
        }
    } );



    return {
        FragColor: FragColor,
        Sampler: Sampler,
        Variable: Variable,
        Varying: Varying,
        Uniform: Uniform
    };

} );
