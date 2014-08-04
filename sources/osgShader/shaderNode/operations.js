define( [
    'osg/Utils',
    'osgShader/shaderNode/Node'

], function ( MACROUTILS, Node ) {
    'use strict';

    var Blend = function ( mode, val0, val1, t ) {
        Node.call( this, val0, val1, t );
        this._mode = mode;
    };
    Blend.prototype = MACROUTILS.objectInherit( Node.prototype, {
        computeFragment: function () {
            var mode = this._mode;
            if ( this[ mode ] === undefined ) {
                mode = 'MIX';
            }
            return this[ mode ]();
        },
        ADD: function () {
            return this.getOutput().getVariable() + ' = ' + this._inputs[ 0 ].getVariable() + ' + (' + this._inputs[ 1 ].getVariable() + ' * ' + this._inputs[ 2 ].getVariable() + ');';
        },
        MIX: function () {
            // result = val0*(1.0-t) + t*val1
            return this.getOutput().getVariable() + ' = mix(' + this._inputs[ 0 ].getVariable() + ', ' + this._inputs[ 1 ].getVariable() + ', ' + this._inputs[ 2 ].getVariable() + ');';

        },

        MULTIPLY: function () {
            return this.getOutput().getVariable() + ' = ' + this._inputs[ 0 ].getVariable() + ' * mix( ' + this._inputs[ 0 ].getType() + '(1.0), ' + this._inputs[ 1 ].getVariable() + ', ' + this._inputs[ 2 ].getVariable() + ');';
        }

    } );

    var AddVector = function () {
        Node.apply( this, arguments );
    };
    AddVector.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'AddVector',
        computeFragment: function () {
            var str = this.getOutput().getVariable() + ' = ' + this._inputs[ 0 ].getVariable();
            for ( var i = 1, l = this._inputs.length; i < l; i++ ) {
                str += ' + ' + this._inputs[ i ].getVariable();
            }
            str += ';';
            return str;
        }
    } );


    var InlineCode = function () {
        Node.apply( this, arguments );
    };
    InlineCode.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'InlineCode',
        setCode: function ( txt ) {
            this._text = txt;
        },
        computeFragment: function () {
            return this._text;
        }
    } );




    var ReflectionVector = function () {
        Node.apply( this, arguments );
    };
    ReflectionVector.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'ReflectionVector',
        computeFragment: function () {
            var str = '  reflection_spec(' + this._inputs[ 0 ].getVariable() + ', ' + this._inputs[ 1 ].getVariable() + ', ' + this.getOutput().getVariable() + ');';
            return str;
        }
    } );

    var SetAlpha = function ( color, alpha, output ) {
        Node.call( this, color, alpha );
        if ( output !== undefined ) {
            this.connectOutput( output );
        }
    };
    SetAlpha.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'SetAlpha',
        computeFragment: function () {
            var str = this.getOutput().getVariable() + ' = vec4(' + this._inputs[ 0 ].getVariable() + '.rgb, ' + this._inputs[ 1 ].getVariable() + ');';
            return str;
        }
    } );



    var PassValue = function ( input, output ) {
        Node.call( this, input );
        if ( output !== undefined ) {
            this.connectOutput( output );
        }
    };
    PassValue.prototype = MACROUTILS.objectInherit( Node.prototype, {
        computeFragment: function () {
            return this.getOutput().getVariable() + ' = ' + this._inputs[ 0 ].getVariable() + ';';
        }
    } );

    var Vec3ToVec4 = function ( input, value, output ) {
        Node.call( this, input );
        this._lastValue = value;
        this.connectOutput( output );
    };

    Vec3ToVec4.prototype = MACROUTILS.objectInherit( Node.prototype, {
        computeFragment: function () {
            return this.getOutput().getVariable() + ' = vec4(' + this._inputs[ 0 ].getVariable() + ',' + this._lastValue.toString() + ');';
        }
    } );

    var Vec4ToVec3 = function ( input, value, output ) {
        Node.call( this, input );
        this._lastValue = value;
        this.connectOutput( output );
    };

    Vec4ToVec3.prototype = MACROUTILS.objectInherit( Node.prototype, {
        computeFragment: function () {
            return this.getOutput().getVariable() + ' = ' + this._inputs[ 0 ].getVariable() + '.rgb;';
        }
    } );


    var DotVector = function () {
        Node.apply( this, arguments );
    };
    DotVector.prototype = MACROUTILS.objectInherit( Node.prototype, {
        computeFragment: function () {
            return this.getOutput().getVariable() + ' = dot(' + this._inputs[ 0 ].getVariable() + ',' + this._inputs[ 1 ].getVariable() + ');';
        }
    } );


    var PreMultAlpha = function ( color, output ) {
        Node.call( this, color );
        if ( output !== undefined ) {
            this.connectOutput( output );
        }
    };
    PreMultAlpha.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'PreMultAlpha',
        computeFragment: function () {
            var str = this.getOutput().getVariable() + '.rgb = ' + this._inputs[ 0 ].getVariable() + '.rgb * ' + this._inputs[ 0 ].getVariable() + '.a;';
            return str;
        }
    } );


    var MultVector = function () {
        Node.apply( this, arguments );
    };
    MultVector.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'MultVector',
        computeFragment: function () {
            var str = this.getOutput().getVariable() + ' = ' + this._inputs[ 0 ].getVariable();
            this._inputs.forEach( function ( element, index /*, array */ ) {
                if ( index === 0 ) {
                    return;
                }
                str += ' * ' + element.getVariable();
            } );
            str += ';\n';
            return str;
        }
    } );



    var FragColor = function () {
        Node.call( this );
        this._prefix = 'gl_FragColor';
    };
    FragColor.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'gl_FragColor',
        connectOutput: function () { /* do nothing for variable */ },
        getVariable: function () {
            return this._prefix;
        }
    } );

    return {
        'Blend': Blend,
        'MultVector': MultVector,
        'AddVector': AddVector,
        'InlineCode': InlineCode,
        'ReflectionVector': ReflectionVector,
        'SetAlpha': SetAlpha,
        'PassValue': PassValue,
        'Vec3ToVec4': Vec3ToVec4,
        'Vec4ToVec3': Vec4ToVec3,
        'DotVector': DotVector,
        'PreMultAlpha': PreMultAlpha,
        'FragColor': FragColor
    };

} );
