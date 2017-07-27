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

Notify.currentNotifyLevel = Notify.LOG;
Notify.console = window.console;

/** logging with readability in mind.
 * @param { level } what severity is that log (gives text color too )
 * @param { str } actual log text
 * @param { fold  } sometimes you want to hide looooong text
 */
function logSub(intLevel, strLevel, str) {
    if (!Notify.console || intLevel > Notify.currentNotifyLevel) return;

    Notify.console[strLevel](str);
    if (Notify.traceLogCall && intLevel !== Notify.ERROR) console.trace();
}

function logSubFold(intLevel, strLevel, title, str) {
    if (!Notify.console || intLevel > Notify.currentNotifyLevel) return;

    if (Notify.console.groupCollapsed) Notify.console.groupCollapsed(title);
    Notify.console[strLevel](str);
    if (Notify.traceLogCall && intLevel !== Notify.ERROR) console.trace();

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

function logMatrix(intLevel, m, rowMajor) {
    if (intLevel > Notify.currentNotifyLevel) return;

    if (Notify.console.table) logSub('table', unFlattenMatrix(m, rowMajor));
}

function logMatrixFold(intLevel, title, m, rowMajor) {
    if (intLevel > Notify.currentNotifyLevel) return;

    if (Notify.console.table) logSubFold('table', title, unFlattenMatrix(m, rowMajor));
}

var levelEntries = ['error', 'warn', 'log', 'info', 'debug'];

for (var i = 0; i < levelEntries.length; ++i) {
    var level = levelEntries[i];
    var intLevel = Notify[level.toUpperCase()];
    Notify[level] = logSub.bind(Notify, intLevel, level);
    Notify[level + 'Fold'] = logSubFold.bind(Notify, intLevel, level);
    Notify[level + 'Matrix'] = logMatrix.bind(Notify, intLevel);
    Notify[level + 'MatrixFold'] = logMatrixFold.bind(Notify, intLevel);
}

// alias
Notify.notice = Notify.log;
Notify.noticeFold = Notify.logFold;
Notify.noticeMatrix = Notify.logMatrix;
Notify.noticeMatrixFold = Notify.logMatrixFold;

Notify.assert = function(test, str) {
    if (this.console !== undefined && !test) {
        this.console.assert(test, str);
    }
};

Notify.setNotifyLevel = function(logLevel, trace) {
    Notify.currentNotifyLevel = logLevel;
    if (trace !== undefined) Notify.traceLogCall = trace;
};

Notify.getNotifyLevel = function() {
    return Notify.currentNotifyLevel;
};

Notify.reportWebGLError = false;

Notify.setConsole = function(replacement) {
    Notify.console = replacement;
};

module.exports = Notify;
