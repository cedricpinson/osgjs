var values = {
    frame: {
        caption: 'Total frame time',
        over: 16,
        average: true,
        graph: true,
        max: 4
    },
    stats: {
        caption: 'stats',
        over: 1,
        graph: true
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
        average: true,
        graph: true
    },
    cull: {
        caption: 'cull',
        average: true,
        graph: true,
        max: 16
    },
    render: {
        caption: 'render',
        average: true,
        graph: true
    },
    glframe: {
        caption: 'glframe',
        average: true,
        graph: true
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
        base: 'frame',
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

export default config;
