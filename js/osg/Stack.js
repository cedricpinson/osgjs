/*global define */

define( [
    'osg/osg'
], function ( osg ) {

    var Stack = function () {};
    Stack.create = function () {
        var a = [];
        a.globalDefault = undefined;
        a.lastApplied = undefined;
        a.back = function () {
            return this[ this.length - 1 ];
        };
        return a;
    };

    return Stack;
} );