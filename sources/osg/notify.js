'use strict';

var Notify = {};

// Range of notify levels from DEBUG through to FATAL
// ALWAYS is reserved for forcing the absorption of all messages.
// Must be uppercase and match loggers
Notify.ALWAYS = 0;
Notify.FATAL = Notify.ERROR = 1;
Notify.WARN = 2;
Notify.NOTICE = Notify.LOG = 3;
Notify.INFO = 4;
Notify.DEBUG = 5;

Notify.console = window.console;

/** logging with readability in mind.
 * @param { level } what severity is that log (gives text color too )
 * @param { str } actual log text
 * @param { fold  } sometimes you want to hide looooong text
 */
function logSub(level, str) {
    if (!Notify.console) return;

    Notify.console[level](str);
    if (Notify.traceLogCall && level !== 'error') console.trace();
}

function logSubFold(level, title, str) {
    if (!Notify.console) return;

    if (Notify.console.groupCollapsed) Notify.console.groupCollapsed(title);
    Notify.console[level](str);
    if (Notify.traceLogCall && level !== 'error') console.trace();

    if (Notify.console.groupEnd) Notify.console.groupEnd();
}

function unFlattenMatrix(m, rowMajor) {
    if (rowMajor) {
        return [m.slice(0, 4), m.slice(4, 8), m.slice(8, 12), m.slice(12, 16)];
    }

    return [
        [m[0], m[4], m[8], m[12]],
        [m[1], m[5], m[9], m[13]],
        [m[2], m[6], m[10], m[14]],
        [m[3], m[7], m[11], m[15]]
    ];
}

function logMatrix(m, rowMajor) {
    if (Notify.console.table) logSub('table', unFlattenMatrix(m, rowMajor));
}

function logMatrixFold(title, m, rowMajor) {
    if (Notify.console.table) logSubFold('table', title, unFlattenMatrix(m, rowMajor));
}

var levelEntries = ['error', 'warn', 'log', 'info', 'debug'];
var loggers = {};

(function() {
    for (var i = 0; i < levelEntries.length; ++i) {
        var level = levelEntries[i];
        loggers[level] = logSub.bind(Notify, level);
        loggers[level + 'Fold'] = logSubFold.bind(Notify, level);
        loggers[level + 'Matrix'] = logMatrix.bind(Notify);
        loggers[level + 'MatrixFold'] = logMatrixFold.bind(Notify);
    }
})();

var assert = function(test, str) {
    if (this.console !== undefined && !test) {
        this.console.assert(test, str);
    }
};
Notify.assert = assert;

Notify.setNotifyLevel = function(logLevel) {
    var dummy = function() {};

    for (var i = 0; i < levelEntries.length; ++i) {
        var level = levelEntries[i];
        var doDummy = logLevel < Notify[level.toUpperCase()];
        Notify[level] = doDummy ? dummy : loggers[level];
        Notify[level + 'Fold'] = doDummy ? dummy : loggers[level + 'Fold'];
        Notify[level + 'Matrix'] = doDummy ? dummy : loggers[level + 'Matrix'];
        Notify[level + 'MatrixFold'] = doDummy ? dummy : loggers[level + 'MatrixFold'];
    }

    // alias
    Notify.notice = Notify.log;
    Notify.noticeFold = Notify.logFold;
    Notify.noticeMatrix = Notify.logMatrix;
    Notify.noticeMatrixFold = Notify.logMatrixFold;
    // We need to store the current level
    Notify.currentNotifyLevel = logLevel;
};

Notify.setNotifyLevel(Notify.NOTICE);

Notify.getNotifyLevel = function() {
    return Notify.currentNotifyLevel;
};

Notify.reportWebGLError = false;

Notify.setConsole = function(replacement) {
    Notify.console = replacement;
};

module.exports = Notify;
