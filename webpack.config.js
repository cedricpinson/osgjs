'use strict';
/*eslint-env node*/

var webpack = require('webpack');

var path = require('path');
var ROOT_PATH = __dirname;
var SOURCES_PATH = path.join(ROOT_PATH, 'sources');
var VENDORS_PATH = path.join(ROOT_PATH, '/examples/vendors');
var NODE_PATH = path.join(ROOT_PATH, 'node_modules');
var BUILD_PATH = path.join(ROOT_PATH, 'builds/dist/');
var BUILD_TESTS_PATH = path.join(ROOT_PATH, 'builds/tests/');

var resolve = {
    modules: [SOURCES_PATH, VENDORS_PATH, ROOT_PATH, NODE_PATH]
};

var externals = [
    {
        zlib: {
            root: 'Zlib',
            commonjs2: 'zlib',
            commonjs: 'zlib',
            amd: 'zlib'
        }
    },
    {
        bluebird: {
            root: 'P',
            commonjs2: 'bluebird',
            commonjs: 'bluebird',
            amd: 'bluebird'
        }
    },
    {
        hammer: {
            root: 'Hammer',
            commonjs2: 'hammerjs',
            commonjs: 'hammerjs',
            amd: 'hammer'
        }
    },
    {
        leap: {
            root: 'Leap',
            commonjs2: 'leapjs',
            commonjs: 'leapjs',
            amd: 'leap'
        }
    },
    {
        jquery: {
            root: '$',
            commonjs2: 'jquery',
            commonjs: 'jquery',
            amd: 'jquery'
        }
    }
];

var mainlibConfig = {
    entry: {
        OSG: ['./sources/OSG.js']
    },
    output: {
        path: BUILD_PATH,
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'OSG'
    },
    externals: externals,
    resolve: resolve,
    module: {
        loaders: [
            {
                test: /\.(frag|vert|glsl)$/,
                loader: 'raw-loader'
            }
        ]
    },
    devtool: 'eval',
    plugins: [
        new webpack.BannerPlugin(
            ['OSGJS', 'Cedric Pinson <trigrou@trigrou.com> (http://cedricpinson.com)'].join('\n')
        )
    ]
};

var testconfig = {
    entry: {
        tests: ['./tests/tests.js'],
        benchmarks: ['./benchmarks/benchmarks.js']
    },
    output: {
        path: BUILD_TESTS_PATH,
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'OSG'
    },
    node: {
        fs: 'empty'
    },
    target: 'node',
    externals: externals,
    resolve: resolve,
    module: {
        loaders: [
            {
                // shaders
                test: /\.(frag|vert|glsl)$/,
                loader: 'raw-loader'
            }
        ]
    },
    devtool: 'eval',
    plugins: [
        new webpack.BannerPlugin(
            ['OSGJS', 'Cedric Pinson <trigrou@trigrou.com> (http://cedricpinson.com)'].join('\n')
        )
    ]
};

module.exports = [mainlibConfig, testconfig];
