define( [], function ( ) {

    /**
     *  Target keep internal data of element to animate, and some function to merge them
     *  @class Target
     */
    var Target = function () {
        this._weight = 0;
        this._priorityWeight = 0;
        this._count = 0;
        this._lastPriority = 0;
        this._target = undefined;
    };

    Target.prototype = {
        reset: function () {
            this._weight = 0;
            this._priorityWeight = 0;
        },
        getValue: function () {
            return this._target;
        }
    };

    return Target;
} );
