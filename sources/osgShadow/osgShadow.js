import ShadowCastAttribute from 'osgShadow/ShadowCastAttribute';
import ShadowCastCompiler from 'osgShadow/ShadowCastCompiler';
import ShadowCastShaderGenerator from 'osgShadow/ShadowCastShaderGenerator';
import ShadowCasterVisitor from 'osgShadow/ShadowCasterVisitor';
import ShadowFrustumIntersection from 'osgShadow/ShadowFrustumIntersection';
import ShadowMap from 'osgShadow/ShadowMap';
import ShadowMapAtlas from 'osgShadow/ShadowMapAtlas';
import ShadowReceiveAttribute from 'osgShadow/ShadowReceiveAttribute';
import ShadowSettings from 'osgShadow/ShadowSettings';
import ShadowTechnique from 'osgShadow/ShadowTechnique';
import ShadowTexture from 'osgShadow/ShadowTexture';
import ShadowTextureAtlas from 'osgShadow/ShadowTextureAtlas';
import ShadowedScene from 'osgShadow/ShadowedScene';

var osgShadow = {};

osgShadow.ShadowCastAttribute = ShadowCastAttribute;
osgShadow.ShadowCastCompiler = ShadowCastCompiler;
osgShadow.ShadowReceiveAttribute = ShadowReceiveAttribute;
osgShadow.ShadowCasterVisitor = ShadowCasterVisitor;
osgShadow.ShadowFrustumIntersection = ShadowFrustumIntersection;
osgShadow.ShadowMap = ShadowMap;
osgShadow.ShadowMapAtlas = ShadowMapAtlas;
osgShadow.ShadowedScene = ShadowedScene;
osgShadow.ShadowSettings = ShadowSettings;
osgShadow.ShadowCastShaderGenerator = ShadowCastShaderGenerator;
osgShadow.ShadowTechnique = ShadowTechnique;
osgShadow.ShadowTexture = ShadowTexture;
osgShadow.ShadowTextureAtlas = ShadowTextureAtlas;

export default osgShadow;
