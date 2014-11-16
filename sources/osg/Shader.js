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

    // Debug Pink shader for when shader fails
    Shader.VS_DBG = 'attribute vec3 Vertex;uniform mat4 ModelViewMatrix;uniform mat4 ProjectionMatrix;void main(void) {  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);}';
    Shader.FS_DBG = 'precision lowp float; void main(void) { gl_FragColor = vec4(1.0, 0.6, 0.6, 1.0);}';

    /** @lends Shader.prototype */
    Shader.prototype = {
        setText: function ( text ) {
            this.text = text;
        },
        getText: function () {
            return this.text;
        },
        // this is where it creates a fail safe shader that should work everywhere
        failSafe: function ( gl ) {
            this.shader = gl.createShader( this.type );
            gl.shaderSource( this.shader, this.type === Shader.VERTEX_SHADER ? Shader.VS_DBG : Shader.FS_DBG );
            gl.compileShader( this.shader );
        },
        // webgl shader compiler error to source contextualization
        // for better console log messages
        processErrors: function ( errors, source ) {
            // regex to extract error message and line from webgl compiler reporting
            var r = /ERROR: [\d]+:([\d]+): (.+)/gmi;
            // split sources in indexable per line array
            var lines = source.split( '\n' );
            var i, m;

            while ( ( m = r.exec( errors ) ) != null ) {
                if ( m.index === r.lastIndex ) {
                    r.lastIndex++; // moving between errors
                }
                // get error line
                var line = parseInt( m[ 1 ] );

                // webgl error report.
                Notify.error( 'ERROR ' + m[ 2 ] + ' in line ' + line, false, true );

                // for context
                // log surrounding line priori to error with bof check
                for ( i = 2; i < 7 && ( 0 < line - i ); i++ ) {
                    Notify.log( lines[ line - i ].replace( /^[ \t]+/g, '' ), false, true );
                }

                // Warn adds a lovely /!\ icon in front of the culprit line
                Notify.warn( lines[ line - 1 ].replace( /^[ \t]+/g, '' ), false, true );

                // for context
                // surrounding line posterior to error (with eof check)
                for ( i = 0; i < 5 && ( lines.length > line + i ); i++ ) {
                    Notify.log( lines[ line + i ].replace( /^[ \t]+/g, '' ), false, true );
                }
            }
        },
        compile: function ( gl ) {
            this.shader = gl.createShader( this.type );
            gl.shaderSource( this.shader, this.text );
            Utils.timeStamp( 'osgjs.metrics:compileShader' );
            gl.compileShader( this.shader );
            if ( !gl.getShaderParameter( this.shader, gl.COMPILE_STATUS ) && !gl.isContextLost() ) {

                var err = gl.getShaderInfoLog( this.shader );
                this.processErrors( err, this.text );


                var tmpText = '\n' + this.text;
                var splittedText = tmpText.split( '\n' );
                var newText = '\n';
                for ( var i = 0, l = splittedText.length; i < l; ++i ) {
                    newText += i + ' ' + splittedText[ i ] + '\n';
                }
                // still logging whole source but folded
                Notify.log( 'can\'t compile shader:\n' + newText, true );

                return false;
            }
            return true;
        }
    };

    Shader.create = function ( type, text ) {
        Notify.log( 'Shader.create is deprecated, use new Shader with the same arguments instead' );
        return new Shader( type, text );
    };

    return Shader;
} );