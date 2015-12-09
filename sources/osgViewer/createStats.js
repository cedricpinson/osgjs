'use strict';

var BrowserStats = window.BrowserStats;
var glStats = window.glStats;
var rStats = window.rStats;

var CanvasStats = function () {

    this.bS = new BrowserStats();
    this.glS = new glStats();

    this.rStats = new rStats( {
        values: {
            frame: {
                caption: 'Total frame time (ms)',
                over: 16,
                average: true
            },
            fps: {
                caption: 'Framerate (FPS)',
                below: 30
            },
            calls: {
                caption: 'Calls (three.js)',
                over: 3000
            },
            raf: {
                caption: 'Time since last rAF (ms)',
                average: true,
                avgMs: 500
            },
            rstats: {
                caption: 'rStats update (ms)',
                average: true,
                avgMs: 100
            },
            update: {
                caption: 'update',
                average: true
            },
            cull: {
                caption: 'cull',
                average: true
            },
            render: {
                caption: 'render',
                average: true
            },
            textureused: {
                caption: 'texture used'
            },
            texturereserved: {
                caption: 'texture reserved'
            },
            texturetotal: {
                caption: 'texture total'
            }
        },
        groups: [ {
            caption: 'Framerate',
            values: [ 'fps', 'raf' ]
        }, {
            caption: 'Frame Budget',
            values: [ 'frame', 'update', 'cull', 'render' ]
        }, {
            caption: 'Texture Memory',
            values: [ 'texturereserved', 'textureused', 'texturetotal' ]
        }],
        fractions: [ {
            base: 'frame',
            steps: [ 'update', 'cull', 'render' ]
        } ],
        plugins: [
            this.bS,
            this.glS
        ],
        colours: ['#cc9933', '#f20041', '#69818c', '#d90074', '#b6f2ee', '#660044', '#50664d', '#330022', '#f2eeb6', '#ee00ff', '#806460', '#1600a6', '#994d57', '#00004d', '#f279da', '#002933', '#395073', '#00eeff', '#79baf2', '#008066', '#79f2aa', '#00ff66', '#1a331d', '#004d14', '#8c6c46', '#388c00', '#602080', '#ff8800', '#6d3df2', '#995200', '#0d1233', '#402200', '#3d6df2', '#330e00', '#e6f23d', '#730000' ]
    } );

};

var createStats = function () {
    // in case the deps are not here
    if ( !rStats ) return undefined;

    return new CanvasStats();
};

module.exports = createStats;
