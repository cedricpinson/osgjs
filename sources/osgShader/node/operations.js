define( [
    'osg/Utils',
    'osgShader/node/Node',
    'osgShader/utils'

], function ( MACROUTILS, Node, utils ) {
    'use strict';

    var sprintf = utils.sprintf;

    // base operator contains helper for the constructor
    // it helps to do that:
    // arg0 = output
    // arg1 = input0 or [ inputs ]
    // arg2 = input1
    // ...
    var BaseOperator = function () {

        Node.apply( this );
        var out = arguments[ 0 ];

        this.connectOutput( out );

        var ins = arguments[ 1 ];

        // if second argument is not an array
        if ( !Array.isArray( arguments[ 1 ] ) ) {
            ins = Array.prototype.slice.call( arguments, 1 );
        }

        this.connectInputs( ins );
    };

    BaseOperator.prototype = Node.prototype;


    // Add support this syntax:
    // new Add( output, input0, input1, ... )
    // new Add( output, [ inputs ] )
    var Add = function () {
        BaseOperator.apply( this, arguments );
    };

    Add.prototype = MACROUTILS.objectInherit( BaseOperator.prototype, {
        type: 'Add',
        operator: '+',
        computeFragment: function () {
            var str = this.getOutput().getVariable() + ' = ' + this._inputs[ 0 ].getVariable();
            for ( var i = 1, l = this._inputs.length; i < l; i++ ) {
                str += this.operator + this._inputs[ i ].getVariable();
            }
            str += ';';
            return str;
        }
    } );


    // Mult works like Add
    var Mult = function () {
        Add.apply( this, arguments );
    };
    Mult.prototype = MACROUTILS.objectInherit( Add.prototype, {
        type: 'Mult',
        operator: '*'
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


    // output = vec4( color.rgb, alpha )
    var SetAlpha = function ( /*output, color, alpha*/) {
        BaseOperator.apply( this, arguments );
    };

    SetAlpha.prototype = MACROUTILS.objectInherit( BaseOperator.prototype, {
        type: 'SetAlpha',
        computeFragment: function () {
            return sprintf( '%s = vec4( %s.rgb, %s );', [
                this.getOutput().getVariable(),
                this._inputs[ 0 ].getVariable(),
                this._inputs[ 1 ].getVariable()
            ] );
        }
    } );



    // alpha is optional, if not provided the following operation is generated:
    // output.rgb = color.rgb * color.a;
    var PreMultAlpha = function ( output, color, alpha ) {

        this._alpha = alpha;
        BaseOperator.apply( this, arguments );

    };

    // TODO put the code in glsl
    PreMultAlpha.prototype = MACROUTILS.objectInherit( BaseOperator.prototype, {
        type: 'PreMultAlpha',
        computeFragment: function () {
            var variable = this._alpha !== undefined ? this._alpha : this._inputs[ 0 ];

            var srcAlpha;
            if ( variable.getType && variable.getType() !== 'float' )
                srcAlpha = variable.getVariable() + '.a';
            else
                srcAlpha = variable.getVariable();

            return sprintf( '%s.rgb = %s.rgb * %s;', [
                this.getOutput().getVariable(),
                this._inputs[ 0 ].getVariable(),
                srcAlpha
            ] );
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
        'InlineCode': InlineCode,
        'SetAlpha': SetAlpha,
        'PreMultAlpha': PreMultAlpha,
        'FragColor': FragColor
    };

} );
