define( [
    'osgShader/shaderNode/Node'
], function ( Node ) {

    var sprintf = function ( string, args ) {
        if ( !string || !args ) {
            return '';
        }

        var arg, reg;

        for ( var index in args ) {
            arg = args[ index ];

            if ( arg instanceof Node ) {
                arg = arg.getVariable();
            }

            if ( typeof arg === 'string' ) {
                reg = '%s';
            } else if ( typeof arg === 'number' && /\./.test( arg.toString() ) ) {
                //regexp check for float separator, the dot character '.'
                reg = '%f';
            } else if ( typeof arg === 'number' ) {
                reg = '%d';
            } else {
                continue;
            }
            string = string.replace( reg, arg );
        }
        return string;
    };

    return sprintf;
} );
