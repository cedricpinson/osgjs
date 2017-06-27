'use strict';

var applyFunctionArray = [];

var registerApplyFunction = function ( type, apply ) {
    applyFunctionArray[ type ] = apply;
};

var getApplyFunction = function ( type ) {
    return applyFunctionArray[ type ];
};


module.exports = {
    applyFunctionArray: applyFunctionArray,
    registerApplyFunction: registerApplyFunction,
    getApplyFunction: getApplyFunction
};
