import ShaderGenerator from 'osgShader/ShaderGenerator';
import ShadowCompiler from 'osgShadow/ShadowCastCompiler';

var ShaderGeneratorShadowCast = function() {
    ShaderGenerator.apply(this, arguments);
    this.setShaderCompiler(ShadowCompiler);
};

ShaderGeneratorShadowCast.prototype = ShaderGenerator.prototype;

export default ShaderGeneratorShadowCast;
