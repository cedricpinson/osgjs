define( [
    'osg/Utils',
    'osg/Program',
    'osg/Shader',
    'osgShader/shaderGenerator/ShaderGenerator'

], function ( MACROUTILS, Program, Shader, ShaderGenerator ) {

    var ShaderGeneratorShadeless = function () {
        ShaderGenerator.call( this );
    };

    ShaderGeneratorShadeless.prototype = MACROUTILS.objectInherit( ShaderGenerator.prototype, {
        // filter all attribute that comes from osgShader namespace
        getActiveAttributeList: function ( state, list ) {
            var Light =  require(  'osg/Light' );
            var hash = '';
            var attributeMap = state.attributeMap;
            var attributeMapKeys = attributeMap.getKeys();

            for ( var j = 0, k = attributeMapKeys.length; j < k; j++ ) {
                var keya = attributeMapKeys[ j ];
                var attributeStack = attributeMap[ keya ];
                var attr = attributeStack.lastApplied;
                if ( attr.libraryName() !== 'osg' ) {
                    continue;
                }

                // if it's a light we filter it (as we're shadeless)
                if ( attr.typeID === Light.typeID  ) {
                    continue;
                }

                if ( attr.getHash ) {
                    hash += attr.getHash();
                } else {
                    hash += attr.getType();
                }
                list.push( attr );
            }
            return hash;
        }
    } );

    return ShaderGeneratorShadeless;
} );
