'use strict';

var webpack = require( 'webpack' );

var path = require( 'path' );
var ROOT_PATH = __dirname;
var SOURCES_PATH = path.join( ROOT_PATH, 'sources' );
var VENDORS_PATH = path.join( ROOT_PATH, '/examples/vendors' );
var NODE_PATH = path.join( ROOT_PATH, 'node_modules' );
var BUILD_PATH = path.join( ROOT_PATH, 'builds/dist/' );

module.exports = {
    entry: {
        OSG: [ './sources/OSG.js' ],
        tests: [ './tests/tests.js' ],
        benchmarks: [ './benchmarks/benchmarks.js' ]
    },
    output: {
        path: BUILD_PATH,
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'OSG'
    },
    externals: [ {
        'qunit': {
            root: 'QUnit',
            commonjs2: 'qunit',
            commonjs: 'qunit',
            amd: 'qunit'
        }
    }, {
        'zlib': {
            root: 'Zlib',
            commonjs2: 'zlib',
            commonjs: 'zlib',
            amd: 'zlib'
        }
    }, {
        'bluebird': {
            root: 'P',
            commonjs2: 'bluebird',
            commonjs: 'bluebird',
            amd: 'bluebird'
        }
    }, {
        'rstats': {
            root: 'rStats',
            commonjs2: 'rstats',
            commonjs: 'rstats',
            amd: 'rstats'
        }
    }, {
        'hammer': {
            root: 'Hammer',
            commonjs2: 'hammerjs',
            commonjs: 'hammerjs',
            amd: 'hammer'
        }
    }, {
        'leap': {
            root: 'Leap',
            commonjs2: 'leapjs',
            commonjs: 'leapjs',
            amd: 'leap'
        }
    }, {
        'jquery': {
            root: '$',
            commonjs2: 'jquery',
            commonjs: 'jquery',
            amd: 'jquery'
        }
    } ],
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
        }
                 ]
    },
    devtool: 'source-map',
    plugins: [
        new webpack.BannerPlugin( [
            'OSGJS',
            'Cedric Pinson <trigrou@trigrou.com> (http://cedricpinson.com)'
        ].join( '\n' ) )
    ]

};
