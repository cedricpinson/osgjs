define( [
    'require'

], function ( require ) {
    'use strict';

    var instance = 0;
    var Node = function () {
        this._name = 'AbstractNode';
        this._inputs = [];
        this._outputs = [];
        this._id = instance++;
        this._text = undefined;

        this.connectInputs.apply( this, arguments );
    };

    Node.prototype = {

        toString: function () {
            return this._name + ' : { input: ' + this._inputs.toString() + ' }, output: { ' + this._output.toString() + ' } ';
        },

        getOutput: function () {
            return this._outputs[ 0 ];
        },

        getInputs: function () {
            return this._inputs;
        },

        getOutputs: function () {
            return this._outputs;
        },

        // accept   inputs0, inputs1, ... or
        //          [inputs]
        connectInputs: function () {

            // circular denpendency
            var data = require( 'osgShader/node/data' );
            var InlineConstant = data.InlineConstant;

            for ( var i = 0, l = arguments.length; i < l; i++ ) {

                var input = arguments[ i ];
                if ( input === undefined ) {
                    break;
                }

                // make it possible to use inline constant for input
                if ( typeof input === 'string' ) {
                    input = new InlineConstant( input );

                } else if ( input instanceof Array ) {
                    this.connectInputs.apply( this, input );
                    continue;
                }

                this._inputs.push( input );
            }
        },

        connectOutput: function ( i ) {
            this._outputs.push( i );
            this.autoLink( i );
        },

        autoLink: function ( output ) {
            if ( output === undefined ) {
                return;
            }
            output.connectInputs( this );
        },

        connectUniforms: function ( context, attribute ) {

            var uniformMap = attribute.getOrCreateUniforms();
            var uniformMapKeys = uniformMap.getKeys();

            for ( var m = 0, ml = uniformMapKeys.length; m < ml; m++ ) {

                var kk = uniformMapKeys[ m ];

                var kkey = uniformMap[ kk ];
                // check if uniform is already declared

                var uniform = context.getVariable( kkey.name );
                if ( uniform === undefined ) {
                    uniform = context.Uniform( kkey.type, kkey.name );
                }
                // connect uniform to this node
                this.connectInputs( uniform );
            }
        },

        computeFragment: function () {
            return this._text;
        },

        computeVertex: function () {
            return undefined;
        },

        comment: function ( txt ) {
            this._comment = '//' + txt;
        },

        getComment: function () {
            return this._comment;
        }
    };


    return Node;
} );
