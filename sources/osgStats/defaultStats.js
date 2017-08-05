var values = {
    frame: {
        caption: 'Total frame time',
        over: 16,
        average: true
    },
    stats: {
        caption: 'stats',
        below: 30
    },
    fps: {
        caption: 'Framerate (FPS)',
        below: 30,
        average: true
    },
    raf: {
        caption: 'Time since last rAF',
        average: true,
        avgMs: 500
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
    glframe: {
        caption: 'glframe',
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
    },

    pushstateset: {
        caption: 'num pushStateSet'
    },
    applyStateSet: {
        caption: 'num applyStateSet'
    },
    updatecallback: {
        caption: 'num updateCallback'
    },

    cullcamera: {
        caption: 'camera'
    },
    cullmatrixtransform: {
        caption: 'matrixTransform'
    },
    cullprojection: {
        caption: 'projection'
    },
    cullnode: {
        caption: 'node'
    },
    culllightsource: {
        caption: 'lightSource'
    },
    cullgeometry: {
        caption: 'geometry'
    }
};

var groups = [
    {
        name: 'framerate',
        caption: 'Framerate',
        values: ['fps', 'raf']
    },
    {
        name: 'frameBudget',
        caption: 'Frame Budget',
        values: ['frame', 'update', 'cull', 'render', 'glframe', 'stats']
    },
    {
        name: 'sceneGraph',
        caption: 'Scene Graph ',
        values: ['pushstateset', 'updatecallback', 'applyStateSet']
    },
    {
        name: 'cullVisitor',
        caption: 'Cull',
        values: [
            'cullnode',
            'cullmatrixtransform',
            'cullcamera',
            'culllighsource',
            'cullprojection',
            'cullgeometry'
        ]
    },
    {
        name: 'texture',
        caption: 'Texture Memory',
        values: ['texturereserved', 'textureused', 'texturetotal']
    }
];

var config = {
    values: values,
    groups: groups
};

module.exports = config;
