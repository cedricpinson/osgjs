var P = require('bluebird');

var requestFileFromURL = function(url, options) {
    var defer = P.defer();

    var req = new XMLHttpRequest();
    req.open('GET', url, true);

    // handle responseType
    if (options && options.responseType) req.responseType = options.responseType;

    if (options && options.progress) {
        req.addEventListener('progress', options.progress, false);
    }

    req.addEventListener(
        'error',
        function() {
            defer.reject();
        },
        false
    );

    req.addEventListener('load', function() {
        if (req.responseType === 'arraybuffer' || req.responseType === 'blob')
            defer.resolve(req.response);
        else defer.resolve(req.responseText);
    });

    req.send(null);
    return defer.promise;
};

var requestFileFromReader = function(file, options) {
    var defer = Promise.defer();
    var reader = new window.FileReader();
    reader.onload = function(data) {
        if (options.responseType === 'blob') {
            var img = new window.Image();
            img.src = data.target.result;
            defer.resolve(img);
        } else {
            defer.resolve(data.target.result);
        }
    };
    // handle responseType
    if (options && options.responseType) {
        if (options.responseType === 'arraybuffer') reader.readAsArrayBuffer(file);
        else if (options.responseType === 'string') reader.readAsText(file);
        else reader.readAsDataURL(file);
    } else {
        reader.readAsText(file);
    }
    return defer.promise;
};

var requestFile = function(urlOrFile, options) {
    if (typeof urlOrFile === 'string') {
        return requestFileFromURL(urlOrFile, options);
    } else {
        return requestFileFromReader(urlOrFile, options);
    }
};

module.exports = requestFile;
