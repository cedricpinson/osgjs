define( [
    'osg/Notify',
    'osg/Utils'
], function ( Notify, Utils ) {

    /**
     * Shader manage shader for vertex and fragment, you need both to create a glsl program.
     * @class Shader
     */
    var Shader = function ( type, text ) {

        var t = type;
        if ( typeof ( type ) === 'string' ) {
            t = Shader[ type ];
        }
        this.type = t;
        this.setText( text );
    };

    Shader.VERTEX_SHADER = 0x8B31;
    Shader.FRAGMENT_SHADER = 0x8B30;

    /** @lends Shader.prototype */
    Shader.prototype = {
        setText: function ( text ) {
            this.text = text;
        },
        getText: function () {
            return this.text;
        },
        compile: function ( gl ) {
            this.shader = gl.createShader( this.type );
            gl.shaderSource( this.shader, this.text );
            Utils.timeStamp( 'osgjs.metrics:compileShader' );
            gl.compileShader( this.shader );
            if ( !gl.getShaderParameter( this.shader, gl.COMPILE_STATUS ) && !gl.isContextLost() ) {
                Notify.log( 'can\'t compile shader:\n' + this.text + '\n' );
                var tmpText = '\n' + this.text;
                var splittedText = tmpText.split( '\n' );
                var newText = '\n';
                for ( var i = 0, l = splittedText.length; i < l; ++i ) {
                    newText += i + ' ' + splittedText[ i ] + '\n';
                }
                Notify.log( newText );
                Notify.log( gl.getShaderInfoLog( this.shader ) );
            }
        }
    };

    Shader.create = function ( type, text ) {
        Notify.log( 'Shader.create is deprecated, use new Shader with the same arguments instead' );
        return new Shader( type, text );
    };

    return Shader;
} );
