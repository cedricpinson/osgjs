define( [
    'osg/Notify',
    'osg/Utils',
    'osgShader/node/Node',
    'osgShader/utils'

], function ( Notify, MACROUTILS, Node, utils ) {
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
    };

    BaseOperator.prototype = Node.prototype;


    // Add support this syntax:
    // new Add( output, input0, input1, ... )
    // new Add( output, [ inputs ] )
    var Add = function () {
        BaseOperator.apply( this );
    };

    Add.prototype = MACROUTILS.objectInherit( BaseOperator.prototype, {

        type: 'Add',

        operator: '+',

        computeFragment: function () {
            // force inputs type to be all the same from the output
            var outputType = this._outputs.getType();
            var addType = '';
            if ( outputType === 'vec4' )
                addType = '.rgba';
            else if ( outputType === 'vec3' )
                addType = '.rgb';
            else if ( outputType === 'vec2' )
                addType = '.rg';

            var str = this._outputs.getVariable() + ' = ' + this._inputs[ 0 ].getVariable() + addType;
            for ( var i = 1, l = this._inputs.length; i < l; i++ ) {
                var input = this._inputs[ i ];
                str += this.operator + input.getVariable();
                if ( input.getType() !== 'float' )
                    str += addType;
            }
            str += ';';
            return str;
        }
    } );

    // Mult works like Add
    var Mult = function () {
        Add.apply( this );
    };

    Mult.prototype = MACROUTILS.objectInherit( Add.prototype, {
        type: 'Mult',
        operator: '*'
    } );



    var InlineCode = function () {
        Node.apply( this );
    };

    InlineCode.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'InlineCode',
        code: function ( txt ) {
            this._text = txt;
            return this;
        },
        computeFragment: function () {

            // merge inputs and outputs dict to search in both
            var replaceVariables = MACROUTILS.objectMix( {}, this._inputs );
            replaceVariables = MACROUTILS.objectMix( replaceVariables, this._outputs );

            // find all %string
            var r = new RegExp( '%[A-Za-z0-9_]+', 'gm' );
            var text = this._text;
            var result = this._text.match( r );

            var done = new Set(); // keep trace of replaced string

            for ( var i = 0; i < result.length; i++ ) {

                var str = result[ i ].substr( 1 );
                if ( !done.has( str ) ) {
                    if ( !replaceVariables[ str ] ) {
                        Notify.error( 'error with inline code\n' + this._text );
                        Notify.error( 'input ' + str + ' not provided for ' + result[ i ] );
                    }
                    var reg = new RegExp( result[ i ].toString(), 'gm' );
                    text = text.replace( reg, replaceVariables[ str ].getVariable() );
                    done.add( str );
                }
            }

            return text;
        }
    } );


    // output = vec4( color.rgb, alpha )
    var SetAlpha = function () {
        BaseOperator.apply( this );
    };

    SetAlpha.prototype = MACROUTILS.objectInherit( BaseOperator.prototype, {
        type: 'SetAlpha',
        validInputs: [ 'color', 'alpha' ],
        validOuputs: [ 'color' ],
        computeFragment: function () {
            return sprintf( '%s = vec4( %s.rgb, %s );', [
                this._outputs.color.getVariable(),
                this._inputs.color.getVariable(),
                this._inputs.alpha.getVariable()
            ] );
        }
    } );



    // alpha is optional, if not provided the following operation is generated:
    // output.rgb = color.rgb * color.a;
    var PreMultAlpha = function () {
        BaseOperator.apply( this );
    };

    // TODO put the code in glsl
    PreMultAlpha.prototype = MACROUTILS.objectInherit( BaseOperator.prototype, {

        type: 'PreMultAlpha',
        validInputs: [ 'color' /*,'alpha'*/ ],
        validOuputs: [ 'color' ],

        computeFragment: function () {
            var variable = this._inputs.alpha !== undefined ? this._inputs.alpha : this._inputs.color;

            var srcAlpha;
            if ( variable.getType() !== 'float' )
                srcAlpha = variable.getVariable() + '.a';
            else
                srcAlpha = variable.getVariable();

            return sprintf( '%s.rgb = %s.rgb * %s;', [
                this._outputs.color.getVariable(),
                this._inputs.color.getVariable(),
                srcAlpha
            ] );
        }
    } );

    return {
        BaseOperator: BaseOperator,
        Mult: Mult,
        Add: Add,
        InlineCode: InlineCode,
        SetAlpha: SetAlpha,
        PreMultAlpha: PreMultAlpha
    };

} );
