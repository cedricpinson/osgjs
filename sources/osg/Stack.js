define( [], function () {

    var Stack = function () {
        this.globalDefault = undefined;
        this.lastApplied = undefined;
        this.asChanged = false;

        this._values = [];
        this._back = undefined;
    };

    Stack.prototype = {
        values: function() {
            return this._values;
        },
        back: function() {
            return this._back;
        },
        push: function( value ) {
            this._values.push( value );
            this._back = value;
        },
        pop: function() {
            var value = this._values.pop();
            this._back = this._values[ this._values.length - 1 ];
            return value;
        }
    };

    return Stack;
} );
