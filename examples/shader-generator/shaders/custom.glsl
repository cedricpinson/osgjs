void ramp( const in vec4 colorInput, out vec4 colorOutput ) {

    // ramp 0.2
    if ( length(colorInput.rgb) < 0.2 ) {
        colorOutput = vec4( 0.1 );
        return;
    }

    if ( length(colorInput.rgb) < 0.5 ) {
        colorOutput = vec4( 0.3 );
        return;
    }

    if ( length(colorInput.rgb) < 0.9 ) {
        colorOutput = vec4( 0.7 );
        return;
    } else {
        colorOutput = vec4(1.0);
    }

}



void negatif( const in int enable, const in vec4 colorInput, out vec4 colorOutput ) {

    if ( enable == 1 )
        colorOutput = vec4(1.0) - colorInput;
    else
        colorOutput = colorInput;
}
