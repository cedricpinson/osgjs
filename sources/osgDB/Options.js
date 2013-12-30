define( [
    'osg/Utils'
], function( utils ) {

    var defaultOptions = {

        // prefix to built url to load resource
        prefixURL: '',

        // callback used when loading data
        progressXHRCallback: undefined,

        // replacement of readImageURL to use your own code to load osg.Image
        // the function will be execute in the context of Input, see Input:readImageURL
        readImageURL: undefined,

        imageLoadingUsePromise: true, // use promise to load image instead of returning Image
        imageOnload: undefined, // use callback when loading an image
        imageCrossOrigin: undefined // use callback when loading an image
    };

    return defaultOptions;

});
