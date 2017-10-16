var applyFunctionArray = [];

var registerApplyFunction = function(type, apply) {
    applyFunctionArray[type] = apply;
};

var getApplyFunction = function(type) {
    return applyFunctionArray[type];
};

export default {
    applyFunctionArray: applyFunctionArray,
    registerApplyFunction: registerApplyFunction,
    getApplyFunction: getApplyFunction
};
