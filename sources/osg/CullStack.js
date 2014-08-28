define( [], function () {

    var CullStack = function () {
        this._modelviewMatrixStack = [];
        this._viewMatrixStack = [];
        this._modelWorldMatrixStack = [];
        this._projectionMatrixStack = [];
        this._viewportStack = [];
        this._bbCornerFar = 0;
        this._bbCornerNear = 0;
    };

    CullStack.prototype = {
        getProjectionMatrixStack: function () {
            return this._projectionMatrixStack;
        },
        getModelviewMatrixStack: function () {
            return this._modelviewMatrixStack;
        },
        getViewMatrixStack: function () {
            return this._viewMatrixStack;
        },
        getModelWorldMatrixStack: function () {
            return this._modelWorldMatrixStack;
        },
        getCurrentProjectionMatrix: function () {
            return this._projectionMatrixStack[ this._projectionMatrixStack.length - 1 ];
        },
        getCurrentModelviewMatrix: function () {
            return this._modelviewMatrixStack[ this._modelviewMatrixStack.length - 1 ];
        },
        getCurrentModelWorldMatrix: function () {
            return this._modelWorldMatrixStack[ this._modelWorldMatrixStack.length - 1 ];
        },
        getCurrentViewMatrix: function () {
            return this._viewMatrixStack[ this._viewMatrixStack.length - 1 ];
        },
        getViewport: function () {
            if ( this._viewportStack.length === 0 ) {
                return undefined;
            }
            return this._viewportStack[ this._viewportStack.length - 1 ];
        },
        getLookVectorLocal: function () {
            //var m = this._modelviewMatrixStack[ this._modelviewMatrixStack.length - 1 ];
            var m = this.getCurrentViewMatrix();
            return [ -m[ 2 ], -m[ 6 ], -m[ 10 ] ];
        },
        pushViewport: function ( vp ) {
            this._viewportStack.push( vp );
        },
        popViewport: function () {
            this._viewportStack.pop();
        },
        pushModelviewMatrix: function ( matrix ) {
            this._modelviewMatrixStack.push( matrix );

            // var lookVector = this.getLookVectorLocal();

            // /*jshint bitwise: false */
            // this._bbCornerFar = ( lookVector[ 0 ] >= 0 ? 1 : 0 ) | ( lookVector[ 1 ] >= 0 ? 2 : 0 ) | ( lookVector[ 2 ] >= 0 ? 4 : 0 );
            //this._bbCornerNear = ( ~this._bbCornerFar ) & 7;
            /*jshint bitwise: true */

        },
        popModelviewMatrix: function () {

            this._modelviewMatrixStack.pop();
            // var lookVector;
            // if ( this._modelviewMatrixStack.length !== 0 ) {
            //     lookVector = this.getLookVectorLocal();
            // } else {
            //     lookVector = [ 0, 0, -1 ];
            // }

            // /*jshint bitwise: false */
            // this._bbCornerFar = ( lookVector[ 0 ] >= 0 ? 1 : 0 ) | ( lookVector[ 1 ] >= 0 ? 2 : 0 ) | ( lookVector[ 2 ] >= 0 ? 4 : 0 );
            // this._bbCornerNear = ( ~this._bbCornerFar ) & 7;
            /*jshint bitwise: true */


        },
        pushModelWorldMatrix: function ( matrix ) {
            this._modelWorldMatrixStack.push( matrix );
        },
        popModelWorldMatrix: function () {
            this._modelWorldMatrixStack.pop();
        },
        pushViewMatrix: function ( matrix ) {
            this._viewMatrixStack.push( matrix );

            var lookVector = this.getLookVectorLocal();

            /*jshint bitwise: false */
            this._bbCornerFar = ( lookVector[ 0 ] >= 0 ? 1 : 0 ) | ( lookVector[ 1 ] >= 0 ? 2 : 0 ) | ( lookVector[ 2 ] >= 0 ? 4 : 0 );
            this._bbCornerNear = ( ~this._bbCornerFar ) & 7;
            /*jshint bitwise: true */
        },
        popViewMatrix: function () {

            this._viewMatrixStack.pop();

            var lookVector;
            if ( this._viewMatrixStack.length !== 0 ) {
                lookVector = this.getLookVectorLocal();
            } else {
                lookVector = [ 0, 0, -1 ];
            }

            /*jshint bitwise: false */
            this._bbCornerFar = ( lookVector[ 0 ] >= 0 ? 1 : 0 ) | ( lookVector[ 1 ] >= 0 ? 2 : 0 ) | ( lookVector[ 2 ] >= 0 ? 4 : 0 );
            this._bbCornerNear = ( ~this._bbCornerFar ) & 7;
            /*jshint bitwise: true */

        },
        pushProjectionMatrix: function ( matrix ) {
            this._projectionMatrixStack.push( matrix );
        },
        popProjectionMatrix: function () {
            this._projectionMatrixStack.pop();
        }
    };

    return CullStack;
} );
