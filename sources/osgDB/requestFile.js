var P = require('bluebird');

var requestFileFromURL = function(url, options) {
    return new P(function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.open('GET', url, true);

        // handle responseType
        if (options && options.responseType) req.responseType = options.responseType;

        if (options && options.progress) {
            req.addEventListener('progress', options.progress, false);
        }

        req.addEventListener('error', reject, false);

        req.addEventListener('load', function() {
            if (req.responseType === 'arraybuffer' || req.responseType === 'blob')
                resolve(req.response);
            else resolve(req.responseText);
        });

        req.send(null);
    });
};

var requestFileFromReader = function(file, options) {
    return new P(function(resolve) {
        var reader = new window.FileReader();
        reader.onload = function(data) {
            if (options.responseType === 'blob') {
                var img = new window.Image();
                img.src = data.target.result;
                resolve(img);
            } else {
                resolve(data.target.result);
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
    });
};

var requestFile = function(urlOrFile, options) {
    if (typeof urlOrFile === 'string') {
        return requestFileFromURL(urlOrFile, options);
    } else {
        return requestFileFromReader(urlOrFile, options);
    }
};

module.exports = requestFile;
