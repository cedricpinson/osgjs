osg.ShaderGeneratorType = {
    VertexInit: 0,
    VertexFunction: 1,
    VertexMain: 2,
    VertexEnd: 3,
    FragmentInit: 5,
    FragmentFunction: 6,
    FragmentMain: 7,
    FragmentEnd: 8
};

/** 
 * Shader manage shader for vertex and fragment, you need both to create a glsl program.
 * @class Shader
 */
osg.Shader = function(type, text) {
    this.type = type;
    this.setText(text);
};

osg.Shader.VERTEX_SHADER = 0x8B31;
osg.Shader.FRAGMENT_SHADER = 0x8B30;

/** @lends osg.Shader.prototype */
osg.Shader.prototype = {
    setText: function(text) { this.text = text; },
    getText: function() { return this.text; },
    compile: function() {
        this.shader = gl.createShader(this.type);
        gl.shaderSource(this.shader, this.text);
        gl.compileShader(this.shader);
        if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
            osg.log("can't compile shader:\n" + this.text + "\n");
            var tmpText = "\n" + this.text;
            var splittedText = tmpText.split("\n");
            var newText = "\n";
            for (var i = 0, l = splittedText.length; i < l; ++i ) {
                newText += i + " " + splittedText[i] + "\n";
            }
            osg.log(newText);
            osg.log(gl.getShaderInfoLog(this.shader));
        }
    }
};

osg.Shader.create = function( type, text )
{
    osg.log("osg.Shader.create is deprecated, use new osg.Shader with the same arguments instead");
    return new osg.Shader(type, text);
};
