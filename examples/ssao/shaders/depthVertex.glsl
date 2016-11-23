#ifdef GL_ES
precision highp float;
#endif

attribute vec3 Vertex;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec4 vViewVertex;

void main( void ) {
      gl_Position = uProjectionMatrix * (uModelViewMatrix * vec4( Vertex, 1.0 ));
      vViewVertex = uModelViewMatrix * vec4( Vertex, 1.0 );
}