var notify = {};

// Range of notify levels from DEBUG through to FATAL
// ALWAYS is reserved for forcing the absorption of all messages.
// Must be uppercase and match loggers
notify.ALWAYS = 0;
notify.FATAL = notify.ERROR = 1;
notify.WARN = 2;
notify.NOTICE = notify.LOG = 3;
notify.INFO = 4;
notify.DEBUG = 5;

notify.currentNotifyLevel = notify.LOG;
notify.console = window.console;

/** logging with readability in mind.
 * @param { level } what severity is that log (gives text color too )
 * @param { str } actual log text
 * @param { fold  } sometimes you want to hide looooong text
 */
function logSub(intLevel, strLevel, str) {
    if (!notify.console || intLevel > notify.currentNotifyLevel) return;

    notify.console[strLevel](str);
    if (notify.traceLogCall && intLevel !== notify.ERROR) console.trace();
}

function logSubFold(intLevel, strLevel, title, str) {
    if (!notify.console || intLevel > notify.currentNotifyLevel) return;

    if (notify.console.groupCollapsed) notify.console.groupCollapsed(title);
    notify.console[strLevel](str);
    if (notify.traceLogCall && intLevel !== notify.ERROR) console.trace();

    if (notify.console.groupEnd) notify.console.groupEnd();
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
    if (intLevel > notify.currentNotifyLevel) return;

    if (notify.console.table) logSub('table', unFlattenMatrix(m, rowMajor));
}

function logMatrixFold(intLevel, title, m, rowMajor) {
    if (intLevel > notify.currentNotifyLevel) return;

    if (notify.console.table) logSubFold('table', title, unFlattenMatrix(m, rowMajor));
}

var levelEntries = ['error', 'warn', 'log', 'info', 'debug'];

for (var i = 0; i < levelEntries.length; ++i) {
    var level = levelEntries[i];
    var intLevel = notify[level.toUpperCase()];
    notify[level] = logSub.bind(notify, intLevel, level);
    notify[level + 'Fold'] = logSubFold.bind(notify, intLevel, level);
    notify[level + 'Matrix'] = logMatrix.bind(notify, intLevel);
    notify[level + 'MatrixFold'] = logMatrixFold.bind(notify, intLevel);
}

// alias
notify.notice = notify.log;
notify.noticeFold = notify.logFold;
notify.noticeMatrix = notify.logMatrix;
notify.noticeMatrixFold = notify.logMatrixFold;

notify.assert = function(test, str) {
    if (this.console !== undefined && !test) {
        this.console.assert(test, str);
    }
};

notify.setNotifyLevel = function(logLevel, trace) {
    notify.currentNotifyLevel = logLevel;
    if (trace !== undefined) notify.traceLogCall = trace;
};

notify.getNotifyLevel = function() {
    return notify.currentNotifyLevel;
};

notify.reportWebGLError = false;

notify.setConsole = function(replacement) {
    notify.console = replacement;
};

export default notify;
