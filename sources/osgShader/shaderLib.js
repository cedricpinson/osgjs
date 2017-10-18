import common from 'osgShader/node/common.glsl';
import functions from 'osgShader/node/functions.glsl';
import lightCommon from 'osgShader/node/lightCommon.glsl';
import lights from 'osgShader/node/lights.glsl';
import skinning from 'osgShader/node/skinning.glsl';
import morphing from 'osgShader/node/morphing.glsl';
import textures from 'osgShader/node/textures.glsl';
import colorEncode from 'osgShader/node/colorEncode.glsl';
import billboard from 'osgShader/node/billboard.glsl';

export default {
    'common.glsl': common,
    'functions.glsl': functions,
    'lightCommon.glsl': lightCommon,
    'lights.glsl': lights,
    'skinning.glsl': skinning,
    'morphing.glsl': morphing,
    'textures.glsl': textures,
    'colorEncode.glsl': colorEncode,
    'billboard.glsl': billboard
};
