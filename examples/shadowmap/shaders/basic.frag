#ifdef GL_ES
precision highp float;
#endif

uniform vec4 fragColor;

void main(void) {

  gl_FragColor = fragColor;
}
