import notify from 'osg/notify';
import utils from 'osg/utils';
import Timer from 'osg/Timer';
import GLObject from 'osg/GLObject';

/**
 * Shader manage shader for vertex and fragment, you need both to create a glsl program.
 * @class Shader
 */
var Shader = function(type, text) {
    GLObject.call(this);
    var t = type;
    if (typeof type === 'string') {
        t = Shader[type];
    }
    this.type = t;
    this.setText(text);
};

Shader.VERTEX_SHADER = 0x8b31;
Shader.FRAGMENT_SHADER = 0x8b30;

// Debug Pink shader for when shader fails
var debugName = '\n#define SHADER_NAME FailSafe';
Shader.VS_DBG =
    '#define _DEBUG 1\n#ifdef _DEBUG\nattribute vec3 Vertex;uniform mat4 uModelViewMatrix;uniform mat4 uProjectionMatrix;void main(void) {  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(Vertex, 1.0);}\n';
Shader.FS_DBG =
    '#define _DEBUG 1\n#ifdef _DEBUG\n precision lowp float; void main(void) { gl_FragColor = vec4(1.0, 0.6, 0.6, 1.0);}\n';

// static cache of glShaders flagged for deletion, which will actually
// be deleted in the correct GL context.
Shader._sDeletedGLShaderCache = new window.Map();

// static method to delete Program
Shader.deleteGLShader = function(gl, shader) {
    if (!Shader._sDeletedGLShaderCache.has(gl)) Shader._sDeletedGLShaderCache.set(gl, []);
    Shader._sDeletedGLShaderCache.get(gl).push(shader);
};

// static method to flush all the cached glShaders which need to be deleted in the GL context specified
Shader.flushDeletedGLShaders = function(gl, availableTime) {
    // if no time available don't try to flush objects.
    if (availableTime <= 0.0) return availableTime;
    if (!Shader._sDeletedGLShaderCache.has(gl)) return availableTime;
    var elapsedTime = 0.0;
    var beginTime = Timer.instance().tick();
    var deleteList = Shader._sDeletedGLShaderCache.get(gl);
    var numShaders = deleteList.length;
    for (var i = numShaders - 1; i >= 0 && elapsedTime < availableTime; i--) {
        gl.deleteShader(deleteList[i]);
        deleteList.splice(i, 1);
        elapsedTime = Timer.instance().deltaS(beginTime, Timer.instance().tick());
    }
    return availableTime - elapsedTime;
};

Shader.flushAllDeletedGLShaders = function(gl) {
    if (!Shader._sDeletedGLShaderCache.has(gl)) return;
    var deleteList = Shader._sDeletedGLShaderCache.get(gl);
    var numShaders = deleteList.length;
    for (var i = numShaders - 1; i >= 0; i--) {
        gl.deleteShader(deleteList[i]);
        deleteList.splice(i, 1);
    }
    return;
};

Shader.onLostContext = function(gl) {
    if (!Shader._sDeletedGLShaderCache.has(gl)) return;
    var deleteList = Shader._sDeletedGLShaderCache.get(gl);
    deleteList.length = 0;
    return;
};

utils.createPrototypeObject(
    Shader,
    utils.objectInherit(GLObject.prototype, {
        setText: function(text) {
            this.text = text;
        },
        getText: function() {
            return this.text;
        },
        // this is where it creates a fail safe shader that should work everywhere
        failSafe: function(gl, shaderText) {
            this.shader = gl.createShader(this.type);

            // concat failsafe and broken shader under separate _DEBUG defines blocks
            var shaderName = shaderText.match(/#define[\s]+SHADER_NAME[\s]+([\S]+)(\n|$)/);
            shaderName = shaderName ? shaderName[1] : '';
            var debugShaderTxt = this.type === Shader.VERTEX_SHADER ? Shader.VS_DBG : Shader.FS_DBG;
            debugShaderTxt += debugName + shaderName + '\n#else\n' + shaderText + '\n#endif\n';
            gl.shaderSource(this.shader, debugShaderTxt);
            gl.compileShader(this.shader);
        },
        // webgl shader compiler error to source contextualization
        // for better console log messages
        processErrors: function(errors, source) {
            // regex to extract error message and line from webgl compiler reporting
            var r = /ERROR: [\d]+:([\d]+): (.+)/gim;
            // split sources in indexable per line array
            var lines = source.split('\n');
            var linesLength = lines.length;
            if (linesLength === 0) return;

            var i, m;

            // IE reporting is not the same
            if (r.exec(errors) === null) {
                r = /Shader compilation errors\n\((\d+)\, \d+\): (.+)/gim;
            }

            // we dont understand error try to print it instead of nothing
            if (r.exec(errors) === null) {
                notify.error(errors);
                return;
            }

            // reset index to start.
            r.lastIndex = 0;

            while ((m = r.exec(errors)) !== null) {
                if (m.index === r.lastIndex) {
                    // moving between errors
                    r.lastIndex++;
                }
                // get error line
                var line = parseInt(m[1], 10);

                if (line > linesLength) continue;
                // webgl error report.
                notify.error('ERROR ' + m[2] + ' in line ' + line);

                var minLine = Math.max(0, line - 7);
                var maxLine = Math.max(0, line - 2);
                // for context
                // log surrounding line priori to error with bof check
                for (i = minLine; i <= maxLine; i++) {
                    notify.warn(lines[i].replace(/^[ \t]+/g, ''));
                }

                // Warn adds a lovely /!\ icon in front of the culprit line
                maxLine = Math.max(0, line - 1);
                notify.error(lines[maxLine].replace(/^[ \t]+/g, ''));

                minLine = Math.min(linesLength, line);
                maxLine = Math.min(linesLength, line + 5);
                // for context
                // surrounding line posterior to error (with eof check)
                for (i = minLine; i < maxLine; i++) {
                    notify.warn(lines[i].replace(/^[ \t]+/g, ''));
                }
            }
        },

        compile: function(gl, errorCallback) {
            if (!this._gl) this.setGraphicContext(gl);
            this.shader = gl.createShader(this.type);

            var shaderText = this.text;
            gl.shaderSource(this.shader, shaderText);
            utils.timeStamp('osgjs.metrics:compileShader');
            gl.compileShader(this.shader);
            if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
                var err = gl.getShaderInfoLog(this.shader);


                this.processErrors(err, shaderText);

                var tmpText = shaderText;
                var splittedText = tmpText.split('\n');
                var newText = '\n';
                for (var i = 0, l = splittedText.length; i < l; ++i) {
                    newText += i + ' ' + splittedText[i] + '\n';
                }
                // still logging whole source but folded
                notify.errorFold("can't compile shader", newText);
                if (errorCallback) errorCallback(this.shaderText, newText, err);

                return false;
            }
            return true;
        },
        releaseGLObjects: function() {
            if (this._gl !== undefined) {
                Shader.deleteGLShader(this._gl, this.shader);
                GLObject.removeObject(this._gl, this);
            }
            this.invalidate();
        },
        invalidate: function() {
            this.shader = undefined;
        }
    }),
    'osg',
    'Shader'
);

export default Shader;
