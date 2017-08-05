var WebGLRenderingContext = window.WebGLRenderingContext;
var WebGL2RenderingContext = window.WebGL2RenderingContext;

var contextList = [WebGLRenderingContext, WebGL2RenderingContext];

var glProxy = function(f, c) {
    return function() {
        c.apply(this, arguments);
        f.apply(this, arguments);
    };
};

var totalDrawArraysCalls = 0,
    totalDrawElementsCalls = 0,
    totalUseProgramCalls = 0,
    totalFaces = 0,
    totalVertices = 0,
    totalPoints = 0,
    totalBindTexures = 0;

for (var i = 0; i < contextList.length; i++) {
    var WebGLContext = contextList[i];
    if (!WebGLContext) continue;

    WebGLContext.prototype.drawArrays = glProxy(WebGLContext.prototype.drawArrays, function() {
        totalDrawArraysCalls++;
        if (arguments[0] === this.POINTS) totalPoints += arguments[2];
        else totalVertices += arguments[2];
    });
    WebGLContext.prototype.drawElements = glProxy(WebGLContext.prototype.drawElements, function() {
        totalDrawElementsCalls++;
        totalFaces += arguments[1] / 3;
        totalVertices += arguments[1];
    });

    WebGLContext.prototype.useProgram = glProxy(WebGLContext.prototype.useProgram, function() {
        totalUseProgramCalls++;
    });

    WebGLContext.prototype.bindTexture = glProxy(WebGLContext.prototype.bindTexture, function() {
        totalBindTexures++;
    });
}

var update = function(stats) {
    stats.getCounter('glDrawCalls').set(totalDrawElementsCalls + totalDrawArraysCalls);
    stats.getCounter('glDrawElements').set(totalDrawElementsCalls);
    stats.getCounter('glDrawArrays').set(totalDrawArraysCalls);
    stats.getCounter('glBindTexture').set(totalBindTexures);
    stats.getCounter('glUseProgram').set(totalUseProgramCalls);
    stats.getCounter('glFaces').set(totalFaces);
    stats.getCounter('glVertices').set(totalVertices);
    stats.getCounter('glPoints').set(totalPoints);

    totalDrawArraysCalls = 0;
    totalDrawElementsCalls = 0;
    totalUseProgramCalls = 0;
    totalFaces = 0;
    totalVertices = 0;
    totalPoints = 0;
    totalBindTexures = 0;
}.bind(this);

var config = {
    values: {
        glDrawCalls: {
            caption: 'drawCalls'
        },
        glDrawElements: {
            caption: 'drawElements'
        },
        glDrawArrays: {
            caption: 'drawArrays'
        },
        glBindTexture: {
            caption: 'bindTexture'
        },
        glUseProgram: {
            caption: 'useProgram'
        },
        glFaces: {
            caption: 'totalFaces'
        },
        glVertices: {
            caption: 'totalVertices'
        },
        glPoints: {
            caption: 'totalPoints'
        }
    },
    groups: [
        {
            name: 'webgl',
            caption: 'WebGL',
            values: [
                'glDrawCalls',
                'glDrawElements',
                'glDrawArrays',
                'glUseProgram',
                'glBindTexture',
                'glFaces',
                'glVertices',
                'glPoints'
            ]
        }
    ],
    update: update
};

module.exports = config;
