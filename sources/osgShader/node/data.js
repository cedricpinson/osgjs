define( [
    'osg/Utils',
    'osgShader/utils',
    'osgShader/node/Node'

], function ( MACROUTILS, utils, Node ) {
    'use strict';

    var sprintf = utils.sprintf;

    // TODO: Add constant, so that we can do setFromNode(constantVar)
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

    var Constant = function ( type, prefix ) {
        Variable.call( this, type, prefix );
    };
    Constant.prototype = MACROUTILS.objectInherit( Variable.prototype, {

        declare: function () {
            return sprintf( 'const %s %s = %s;', [ this._type, this.getVariable(), this._value ] );
        }
    } );

    var Uniform = function ( type, prefix, size ) {
        Variable.call( this, type, prefix );
        this._size = size;
    };

    Uniform.prototype = MACROUTILS.objectInherit( Variable.prototype, {

        declare: function () {
            return undefined;
        },

        globalDeclaration: function () {
            if ( this._size ) {
                return sprintf( 'uniform %s %s[%s];', [ this._type, this.getVariable(), this._size ] );
            } else {
                return sprintf( 'uniform %s %s;', [ this._type, this.getVariable() ] );
            }
        }

    } );

    var Attribute = function ( type, prefix ) {
        Variable.call( this, type, prefix );
    };

    Attribute.prototype = MACROUTILS.objectInherit( Variable.prototype, {

        declare: function () {
            return undefined;
        },

        globalDeclaration: function () {
            return sprintf( 'attribute %s %s;', [ this._type, this.getVariable() ] );
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
        },

        // bewteen vertex shader and fragmetn shader
        // we keep varying but not associated
        reset: function () {
            this._inputs = [];
            this._outputs = null;
            this._text = undefined;
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

    // Graph Root Nodes
    var glFragColor = function () {
        Variable.call( this, 'vec4', 'gl_FragColor' );
    };
    glFragColor.prototype = MACROUTILS.objectInherit( Variable.prototype, {

        outputs: function () { /* do nothing for variable */
            return this;
        },
        getVariable: function () {
            return this._prefix;
        }
    } );

    var glPosition = function () {
        Variable.call( this, 'vec4', 'gl_Position' );
    };
    glPosition.prototype = MACROUTILS.objectInherit( Variable.prototype, {

        outputs: function () { /* do nothing for variable */
            return this;
        },
        getVariable: function () {
            return this._prefix;
        }
    } );


    var glPointSize = function () {
        Variable.call( this, 'vec4', 'gl_PointSize' );
    };
    glPointSize.prototype = MACROUTILS.objectInherit( Variable.prototype, {

        outputs: function () { /* do nothing for variable */
            return this;
        },
        getVariable: function () {
            return this._prefix;
        }
    } );

    return {
        glPointSize: glPointSize,
        glPosition: glPosition,
        glFragColor: glFragColor,
        Sampler: Sampler,
        Variable: Variable,
        Constant: Constant,
        Attribute: Attribute,
        Varying: Varying,
        Uniform: Uniform
    };

} );
