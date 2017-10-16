import notify from 'osg/notify';

var memory = undefined;

var log1024 = Math.log(1024);
var size = function(v) {
    var precision = 100; //Math.pow(10, 2);
    var i = Math.floor(Math.log(v) / log1024);
    if (v === 0) i = 1;
    return Math.round(v * precision / Math.pow(1024, i)) / precision; // + ' ' + sizes[i];
};

var init = function() {
    if (window.performance && window.performance.memory) memory = window.performance.memory;
    if (!memory || memory.totalJSHeapSize === 0) {
        notify.warn('Stats will not report memory, not supported by your browse');
    }
    return !!memory;
};

var update = function(stats) {
    var usedJSHeapSize = 0;
    var totalJSHeapSize = 0;
    if (memory) {
        usedJSHeapSize = size(memory.usedJSHeapSize);
        totalJSHeapSize = size(memory.totalJSHeapSize);
    }
    stats.getCounter('browserMemory').set(usedJSHeapSize);
    stats.getCounter('browserMemoryTotal').set(totalJSHeapSize);
};

var config = {
    values: {
        browserMemory: {
            caption: 'Used Memory',
            average: true,
            avgMs: 1000
        },
        browserMemoryTotal: {
            caption: 'Total Memory'
        }
    },
    groups: [
        {
            name: 'browser',
            caption: 'Browser',
            values: ['browserMemory', 'browserMemoryTotal']
        }
    ],
    update: update,
    init: init
};

export default config;
