module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    files: [
        {pattern: 'examples/media/**/*', watched: false, included: false, served: true, nocache: false},
        {pattern: 'tests/mockup/*', watched: false, included: false, served: true, nocache: false},
        'examples/vendors/*js',
        'builds/dist/tests.js'
    ],
    reporters: ['progress'],
    port: 9001,  // karma web server port
    colors: true,
    logLevel: config.LOG_DEBUG,
    browsers: ['ChromeHeadless'],
    proxies: {
        '/examples/': '/base/examples/',
        '/mockup/': '/base/tests/mockup/'
    },
    /* In case we need webGL */
    //customLaunchers: {
    //    ChromeWebGL: {
    //        base: 'ChromeHeadless',
    //        flags: ['--disable-gpu']
    //    }
    //},
    client: {
      mocha: {
        ui: 'qunit'
      }
    },
    autoWatch: false,
    singleRun: true, // Karma captures browsers, runs the tests and exits
    concurrency: Infinity
  })
};

