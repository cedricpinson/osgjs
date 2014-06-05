/*global define */
define ( [
    'osg/Utils',
    'osgShader/shaderNode/Node'

], function ( MACROUTILS, Node ) {



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
                return this._type + ' ' + this.getVariable() + ' = ' + this._value + ';';
            }
            else {
                return this._type + ' ' + this.getVariable() + ';';
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

    var VariableRange = function ( type, prefix ) {
        Node.call( this );
        this._name = 'VariableRange';
        this._prefix = prefix;
        this._type = type;
        this._min = 0;
        this._max = 1;
        this._step = 0.01;
        this._defaultValue = 10;
        this._disabledValue = 0;
        this._value = undefined;
    };
    VariableRange.prototype = MACROUTILS.objectInherit( Node.prototype, {
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
                return this._type + ' ' + this.getVariable() + ' = ' + this._value + ';';
            }
            else {
                return this._type + ' ' + this.getVariable() + ';';
            }
        }
    } );

    var VariableSet = function ( type, prefix, values ) {
        Node.call( this );
        this._name = 'VariableSet';
        this._prefix = prefix;
        this._type = type;
        this._values = values; //ie ['true', 'false'];
        this._value = undefined;
    };
    VariableSet.prototype = MACROUTILS.objectInherit( Node.prototype, {
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
                return this._type + ' ' + this.getVariable() + ' = ' + this._value + ';';
            }
            else {
                return this._type + ' ' + this.getVariable() + ';';
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
            return 'uniform ' + this._type + ' ' + this.getVariable() + ';';
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
            return 'varying ' + this._type + ' ' + this.getVariable() + ';';
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
            return 'uniform ' + this._type + ' ' + this.getVariable() + ';';
        }
    } );

    return {
        'Sampler': Sampler,
        'Variable': Variable,
        'Varying': Varying,
        'Uniform': Uniform,
        'VariableSet': VariableSet,
        'VariableRange': VariableRange,
        'InlineConstant': InlineConstant
    };

} );
