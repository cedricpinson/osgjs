'use strict';
var Stack = function () {
    this.globalDefault = undefined;
    this.lastApplied = undefined;
    this.changed = false;

    this.values = [];
    this.back = undefined;
};

Stack.prototype = {
    push: function ( value ) {
        this.values.push( value );
        this.back = value;
    },
    pop: function () {
        var values = this.values;
        var value = values.pop();
        this.back = values[ values.length - 1 ];
        return value;
    }
};

module.exports = Stack;
