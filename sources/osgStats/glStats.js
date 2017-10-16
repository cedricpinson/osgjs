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
var statsVertices = 0,
    statsFaces = 0,
    statsLines = 0;

var init = function() {
    var hasContext = false;
    for (var i = 0; i < contextList.length; i++) {
        var WebGLContext = contextList[i];
        if (!WebGLContext) continue;

        hasContext = true;
        WebGLContext.prototype.drawArrays = glProxy(WebGLContext.prototype.drawArrays, function() {
            totalDrawArraysCalls++;
            if (arguments[0] === this.POINTS) totalPoints += arguments[2];
            else totalVertices += arguments[2];
        });
        WebGLContext.prototype.drawElements = glProxy(
            WebGLContext.prototype.drawElements,
            function() {
                totalDrawElementsCalls++;
                totalFaces += arguments[1] / 3;
                totalVertices += arguments[1];
            }
        );

        WebGLContext.prototype.useProgram = glProxy(WebGLContext.prototype.useProgram, function() {
            totalUseProgramCalls++;
        });

        WebGLContext.prototype.bindTexture = glProxy(
            WebGLContext.prototype.bindTexture,
            function() {
                totalBindTexures++;
            }
        );
    }
    return hasContext;
};

var update = function(stats) {
    var bufferStats = stats.getBufferStats();
    var nbVertexes = bufferStats.getNbVertexes();
    var drawElements = bufferStats.getCharacterPrimitive();
    var drawArrays = bufferStats.getGraphPrimitive();

    // substracts stats from regular gl stats
    totalDrawElementsCalls -= 1; // one drawcall for characters
    if (drawArrays.getCount()) totalDrawArraysCalls -= 1; // one draw array for graph
    totalBindTexures -= 2;
    totalUseProgramCalls -= 1;
    totalVertices -= drawElements.getCount() + drawArrays.getCount();
    totalFaces -= drawElements.getCount() / 3;

    statsVertices = nbVertexes;
    statsFaces = drawElements.getCount() / 3;
    statsLines = drawArrays.getCount() / 2;

    stats.getCounter('glDrawCalls').set(totalDrawElementsCalls + totalDrawArraysCalls);
    stats.getCounter('glDrawElements').set(totalDrawElementsCalls);
    stats.getCounter('glDrawArrays').set(totalDrawArraysCalls);
    stats.getCounter('glBindTexture').set(totalBindTexures);
    stats.getCounter('glUseProgram').set(totalUseProgramCalls);
    stats.getCounter('glFaces').set(totalFaces);
    stats.getCounter('glVertices').set(totalVertices);
    stats.getCounter('glPoints').set(totalPoints);

    stats.getCounter('statsVertices').set(statsVertices);
    stats.getCounter('statsFaces').set(statsFaces);
    stats.getCounter('statsLines').set(statsLines);

    statsVertices = 0;
    statsFaces = 0;
    statsLines = 0;
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
        },
        statsFaces: {
            caption: 'statsFaces'
        },
        statsVertices: {
            caption: 'statsVertices'
        },
        statsLines: {
            caption: 'statsLines'
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
                'glPoints',
                'statsVertices',
                'statsFaces',
                'statsLines'
            ]
        }
    ],
    update: update,
    init: init
};

export default config;
