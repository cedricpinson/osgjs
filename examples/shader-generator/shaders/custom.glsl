void ramp( const in vec3 colorInput, out vec3 colorOutput ) {

    // ramp 0.2
    if ( length(colorInput) < 0.2 ) {
        colorOutput = vec3( 0.1 );
        return;
    }

    if ( length(colorInput) < 0.5 ) {
        colorOutput = vec3( 0.3 );
        return;
    }

    if ( length(colorInput) < 0.9 ) {
        colorOutput = vec3( 0.7 );
        return;
    } else {
        colorOutput = vec3(1.0);
    }

}



void negatif( const in int enable, const in vec3 colorInput, out vec3 colorOutput ) {

    if ( enable == 1 )
        colorOutput = vec3(1.0) - colorInput;
    else
        colorOutput = colorInput;
}
