define( [
    'osg/Utils',
    'osgShader/shaderNode/Node',
    'osgShader/utils/sprintf'

], function ( MACROUTILS, Node, sprintf ) {
    'use strict';

    var Add = function () {
        Node.apply( this, arguments );
    };
    Add.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'Add',
        computeFragment: function () {
            var str = this.getOutput().getVariable() + ' = ' + this._inputs[ 0 ].getVariable();
            for ( var i = 1, l = this._inputs.length; i < l; i++ ) {
                str += ' + ' + this._inputs[ i ].getVariable();
            }
            str += ';';
            return str;
        }
    } );


    var Mult = function () {
        Node.apply( this, arguments );
    };
    Mult.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'Mult',
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


    // specialiazed inline code node for func calls.
    // ideally with debug caps
    // like type check against called func params
    // (need glsl ref for that...)
    var FunctionCall = function () {
        Node.apply( this, arguments );
    };


    FunctionCall.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'FunctionCall',
        //compose function call
        // second param null, it tries to infer params from node input
        // avoiding long (%s,%s,%s....%s) and associated typing err
        setCall: function ( functionName, params, comment ) {
            var txt = '//' + comment + '\n';
            txt += this.getOutput().getVariable();
            txt += ' = ';
            txt += functionName;
            if ( this._inputs.length !== 0 && ( params === undefined || ( params.length !== undefined && params.length === 0 ) ) ) {
                params = '(';
                var i = 0,
                    l = this._inputs.length;
                while ( true ) {
                    params += '%s';
                    // meanwhile type checking by printf...
                    //console.log( this._inputs[ i ] );

                    i++;

                    if ( i === l )
                        break;
                    params += ', ';
                }
                params += ');';
            }
            txt += sprintf( params, this._inputs );
            this._text = txt;
        },
        computeFragment: function () {
            return this._text;
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


    var Dot = function () {
        Node.apply( this, arguments );
    };
    Dot.prototype = MACROUTILS.objectInherit( Node.prototype, {
        computeFragment: function () {
            return this.getOutput().getVariable() + ' = dot(' + this._inputs[ 0 ].getVariable() + ',' + this._inputs[ 1 ].getVariable() + ');';
        }
    } );


    var PreMultAlpha = function ( color, alpha, output ) {
        if ( output === undefined ) {
            output = alpha;
        } else {
            this._alpha = alpha;
        }
        Node.call( this, color );

        if ( output !== undefined ) {
            this.connectOutput( output );
        }
    };
    PreMultAlpha.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'PreMultAlpha',
        computeFragment: function () {
            var srcAlpha = this._alpha !== undefined ? this._alpha.getVariable() : this._inputs[ 0 ].getVariable();

            var str = this.getOutput().getVariable() + '.rgb = ' + this._inputs[ 0 ].getVariable() + '.rgb * ' + srcAlpha + '.a;';
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
        'Mult': Mult,
        'Add': Add,
        'Dot': Dot,
        'InlineCode': InlineCode,
        'FunctionCall': FunctionCall,
        'SetAlpha': SetAlpha,
        'Vec3ToVec4': Vec3ToVec4,
        'Vec4ToVec3': Vec4ToVec3,
        'PreMultAlpha': PreMultAlpha,
        'FragColor': FragColor
    };

} );
