import P from 'bluebird';

var requestFileFromURL = function(url, options) {
    return new P(function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.open('GET', url, true);

        var responseType =
            options && options.responseType ? options.responseType.toLowerCase() : undefined;

        // handle responseType
        if (responseType) req.responseType = responseType;

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
        var responseType =
            options && options.responseType ? options.responseType.toLowerCase() : undefined;
        var reader = new window.FileReader();
        reader.onload = function(data) {
            resolve(data.target.result);
        };
        // handle responseType
        if (responseType) {
            if (responseType === 'arraybuffer') reader.readAsArrayBuffer(file);
            else if (responseType === 'blob') resolve(file);
            else if (responseType === 'string') reader.readAsText(file);
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

export default requestFile;
