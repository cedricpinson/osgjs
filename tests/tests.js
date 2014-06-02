// polyfill for phantomjs
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () {},
            fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis
                                     ? this
                                     : oThis,
                                     aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}

requirejs.config( {
    baseUrl: '../sources',
    paths: {
        vr: '../sources/vendors/vr',
        Q: '../sources/vendors/Q',
        Hammer: '../sources/vendors/Hammer',
        Leap: '../sources/vendors/Leap',
        tests: '../tests/'
    }
} );




/*global QUnit,define,module,test,ok */
QUnit.config.testTimeout = 2000;

define( [
    'OSG',

    'tests/osg/osgTests',
    'tests/osgAnimation/osgAnimationTests',
    'tests/osgDB/osgDBTests',
    'tests/osgGA/osgGATests',
    'tests/osgUtil/osgUtilTests',
    'tests/osgViewer/osgViewerTests'
], function ( OSG, osg, osgAnimation, osgDB, osgGA, osgUtil, osgViewer ) {

    // hack because of osgPool
    OSG.osg.init();

    osg();
    osgDB();
    osgAnimation();
    osgGA();
    osgUtil();
    osgViewer();

    // start test when require finished its job
    QUnit.load();
    QUnit.start();


} );
