import notify from 'osg/notify';
import shaderLib from 'osgShader/shaderLib';
import shadowShaderLib from 'osgShadow/shaderLib';
import WebglCaps from 'osg/WebGLCaps';

// webgl2 protected variable names : sample, texture

//     Shader as vert/frag/glsl files Using requirejs text plugin
//     Preprocess features like:    //
//     - Handle (recursive) include, avoiding code repeat and help code factorization
//     - Handle per shader and global define/precision

var ShaderProcessor = function(createInstance) {
    if (!createInstance) {
        if (ShaderProcessor.instance) {
            return ShaderProcessor.instance;
        }
        ShaderProcessor.instance = this;
    }

    this.addShaders(shaderLib);
    this.addShaders(shadowShaderLib);
    return this;
};

ShaderProcessor.prototype = {
    _shadersText: {},
    _shadersList: {},
    _globalDefaultprecision:
        '#ifdef GL_FRAGMENT_PRECISION_HIGH\n precision highp float;\n #else\n precision mediump float;\n#endif',
    _debugLines: false,
    _includeR: /#pragma include "([^"]+)"/g,
    _includeCondR: /#pragma include (["^+"]?["\ "[a-zA-Z_0-9](.*)"]*?)/g,
    _defineR: /\#define\s+([a-zA-Z_0-9]+)/,
    _precisionR: /precision\s+(high|low|medium)p\s+float/,

    // {
    //     'functions.glsl': textShaderFunctions,
    //     'lights.glsl': textShaderFunctions,
    //     'textures.glsl': textShaderFunctions
    // };
    addShaders: function(shaders) {
        for (var key in shaders) {
            this._shadersList[key] = key;
            this._shadersText[key] = shaders[key];
        }
    },

    instrumentShaderlines: function(content, sourceID) {
        // TODO instrumentShaderlines
        // http://immersedcode.org/2012/1/12/random-notes-on-webgl/
        // one ID per "file"
        // Each file has its line number starting at 0
        //   handle include, the do that numbering also in preprocess...
        // Then on shader error using sourceID and line you can point the correct line...
        // has to attach that info to osg.shader object.
        /*
          var allLines = content.split('\n');
          var i = 0;
          for (var k = 0; k _< allLines.length; k++) {
          if (!this._includeR.test(allLines[k])) {
          allLines[k] = "#line " + (i++) + " " + sourceID + '\n' + allLines[k] ;
          }
          }
          content = allLines.join('\n');
        */

        // seems just  prefixing first line seems ok to help renumbering error mesg
        return '\n#line ' + 0 + ' ' + sourceID + '\n' + content;
    },

    hasShader: function(shaderName) {
        // unlike getShaderTextPure, doesn't log an erreur if the shader doesn't exist
        return this._shadersText[shaderName] !== undefined;
    },

    getShaderTextPure: function(shaderName) {
        var preShader = this._shadersText[shaderName];

        if (!preShader) {
            notify.error('shader file/text: ' + shaderName + ' not registered');
            preShader = '';
        }

        return preShader;
    },

    getShader: function(shaderName, defines, extensions, type) {
        var shader = this.getShaderTextPure(shaderName);
        return this.processShader(shader, defines, extensions, type);
    },

    // recursively  handle #include external glsl
    // files (for now in the same folder.)
    preprocess: function(content, sourceID, includeList, inputsDefines /*, type */) {
        var self = this;
        return content.replace(
            this._includeCondR,
            function(_, strMatch) {
                var includeOpt = strMatch.split(' ');
                var includeName = includeOpt[0].replace(/"/g, '');

                // pure include is
                // \#pragma include "name";

                // conditionnal include is name included if _PCF defined
                // \#pragma include "name" "_PCF";
                if (includeOpt.length > 1 && inputsDefines) {
                    // some conditions here.
                    // if not defined we do not include
                    var found = false;
                    var defines = inputsDefines.map(function(defineString) {
                        // find '#define', remove duplicate whitespace, split on space and return the define Text
                        return (
                            self._defineR.test(defineString) &&
                            defineString.replace(/\s+/g, ' ').split(' ')[1]
                        );
                    });

                    for (var i = 1; i < includeOpt.length && !found; i++) {
                        var key = includeOpt[i].replace(/"/g, '');
                        for (var k = 0; k < defines.length && !found; k++) {
                            if (defines[k] !== false && defines[k] === key) {
                                found = true;
                                break;
                            }
                        }
                    }
                    if (!found) return '';
                }

                // already included
                if (includeList.indexOf(includeName) !== -1) return '';
                // avoid endless loop, not calling the impure
                var txt = this.getShaderTextPure(includeName);
                // make sure it's not included twice
                includeList.push(includeName);
                if (this._debugLines) {
                    txt = this.instrumentShaderlines(txt, sourceID);
                }
                sourceID++;
                // to the infinite and beyond !
                txt = this.preprocess(txt, sourceID, includeList, inputsDefines);
                return txt;
            }.bind(this)
        );
    },

    _getSortedUnique: (function() {
        var filterDuplicate = function(item, pos, self) {
            return !pos || item !== self[pos - 1];
        };

        return function(array) {
            return array && array.sort().filter(filterDuplicate);
        };
    })(),

    _convertExtensionsToWebGL2: (function() {
        var cbRenamer = function(match, extension) {
            return 'core_' + extension;
        };

        var cbDefiner = function(match, extension) {
            return '#define ' + extension;
        };

        var extensions =
            '(GL_EXT_shader_texture_lod|GL_OES_standard_derivatives|GL_EXT_draw_buffers|GL_EXT_frag_depth)';
        var definer = new RegExp('#\\s*extension\\s+' + extensions + '.*', 'g');
        var renamer = new RegExp(extensions, 'g');

        return function(strShader) {
            strShader = strShader.replace(definer, cbDefiner); // replace #extension by #define
            strShader = strShader.replace(renamer, cbRenamer); // rename extension
            return strShader;
        };
    })(),

    _convertToWebGL2: (function() {
        var frags = [];
        var replaceMRT = function(match, number) {
            var varName = 'glFragData_' + number;
            frags[number] = 'layout(location = ' + number + ') out vec4 ' + varName + ';';
            return varName;
        };

        return function(strShader, isFragment) {
            if (!strShader) return strShader;

            strShader = strShader.replace(/attribute\s+/g, 'in ');
            strShader = strShader.replace(/varying\s+/g, isFragment ? 'in ' : 'out ');
            strShader = strShader.replace(/(texture2D|textureCube)\s*\(/g, 'texture(');
            strShader = strShader.replace(/(textureCubeLodEXT)\s*\(/g, 'textureLod(');

            strShader = this._convertExtensionsToWebGL2(strShader);

            if (isFragment) {
                frags.length = 0;
                strShader = strShader.replace(/gl_FragData\s*\[\s*(\d+)\s*\]/g, replaceMRT);

                if (!frags.length) frags.push('out vec4 glFragColor_0;');
                strShader = strShader.replace(/gl_FragColor/g, 'glFragColor_0');
                strShader = strShader.replace(
                    /void\s+main\s*\(/g,
                    frags.join('\n') + '\nvoid main('
                );
            }

            return strShader;
        };
    })(),

    _hasVersion: function(shader) {
        // match first line starting with #
        var version = shader.match(/^#(.*)$/m);
        return version && version[0].indexOf('version') !== -1;
    },

    // process shader
    // - declare version, extensions, precision and defines
    // - resolve pragma include
    // - Convert webgl1 to webgl2 (glsl 100 to glsl 330 es)
    processShader: function(shader, defines, extensions, type) {
        // if the shader has #version statement we skip the shader processing
        if (this._hasVersion(shader)) {
            return shader;
        }

        var includeList = [];
        var preShader = shader;
        var sourceID = 0;
        if (this._debugLines) {
            preShader = this.instrumentShaderlines(preShader, sourceID);
            sourceID++;
        }

        // removes duplicates
        defines = this._getSortedUnique(defines);
        extensions = this._getSortedUnique(extensions);

        var strCore = this.preprocess(preShader, sourceID, includeList, defines, type);

        // avoid warning on unrecognized pragma
        strCore = strCore.replace(/#pragma DECLARE_FUNCTION/g, '//#pragma DECLARE_FUNCTION');

        var isFragment = strCore.indexOf('gl_Position') === -1;
        var convertToWebGL2 = WebglCaps.instance().isWebGL2();

        var strVersion = convertToWebGL2 ? '#version 300 es' : '#version 100';
        strVersion += '\n';

        var strExtensions = extensions ? extensions.join('\n') + '\n' : '';

        var strDefines = defines ? defines.join('\n') + '\n' : '';

        if (convertToWebGL2) {
            strExtensions = this._convertExtensionsToWebGL2(strExtensions);
            strDefines = this._convertToWebGL2(strDefines, isFragment);
            strCore = this._convertToWebGL2(strCore, isFragment);
        } else {
            // support multiline define
            strDefines = strDefines.replace(/\\\n/g, '');
            strCore = strCore.replace(/\\\n/g, '');
        }

        // vertex shader uses highp per default BUT if FS is using mediump then VS should too (conflict with varying/uniform otherwise)
        // also make sure precision is not already providen
        var strPrecision = '';
        if (this._globalDefaultprecision && !this._precisionR.test(strCore)) {
            strPrecision = this._globalDefaultprecision + '\n';
        }

        // order is important
        // See https://khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf (p14-15: extension before any non-processor token)
        return strVersion + strExtensions + strPrecision + strDefines + strCore;
    }
};
export default ShaderProcessor;
