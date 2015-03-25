var webpack = require( 'webpack' );

var ROOT_PATH = __dirname;
var SOURCES_PATH = ROOT_PATH + '/sources/';
var VENDORS_PATH = SOURCES_PATH + 'vendors/';
var NODE_PATH = ROOT_PATH + '/vendors/';


module.exports = {
    entry: {
        OSG: [ './sources/OSG.js' ],
        tests: [ './tests/tests.js' ]
    },
    output: {
        path: './builds/dist',
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'OSG'
    },
    externals: {
        'qunit': 'QUnit',
        'q': 'Q',
        'hammer': 'Hammer',
        'leap': 'Leap',
        'jquery': '$'
    },
    resolve: {
        root: [
            SOURCES_PATH,
            VENDORS_PATH,
            ROOT_PATH,
            NODE_PATH
        ]
    },
    module: {
        loaders: [ {
            // shaders
            test: /\.(frag|vert|glsl)$/,
            loader: 'raw-loader'
        } ]
    },
    plugins: [
        new webpack.BannerPlugin( [
            'OSGJS',
            'Cedric Pinson <trigrou@gmail.com> (http://cedricpinson.com)'
        ].join('\n') )
    ]
};
