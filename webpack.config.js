var ROOT_PATH = __dirname;
var SOURCES_PATH = ROOT_PATH + '/sources/';
var VENDORS_PATH = SOURCES_PATH + 'vendors/';


module.exports = {
    entry: {
        OSG: [ './sources/OSG.js' ],
        tests: [ './tests/tests.js' ]
    },
    output: {
        path: './builds/dist',
        filename: '[name].js',
        libraryTarget: 'var',
        library: 'OSG'
    },
    externals: {
        // Provide QUnit as an external, because it's loaded separately in as script tag
        // but accessed in our tests modules
        'qunit': 'QUnit'
    },
    resolve: {
        root: [
            SOURCES_PATH,
            VENDORS_PATH,
            ROOT_PATH
        ]
    },
    module: {
        loaders: [ {
            // shaders
            test: /\.(frag|vert|glsl)$/,
            loader: 'raw-loader'
        } ]
    }
};
