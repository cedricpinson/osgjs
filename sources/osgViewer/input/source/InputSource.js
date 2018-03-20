/**
 * Abstract InputSource
 * @param canvas
 * @constructor
 */
var InputSource = function(target) {
    this._target = target;
    this._supportedEvents = [];
};
InputSource.prototype = {
    supportsEvent: function(eventName) {
        for (var i = 0; i < this._supportedEvents.length; i++) {
            var event = this._supportedEvents[i];
            if (eventName.indexOf(event) === 0) {
                return true;
            }
        }
        return false;
    },

    setInputManager: function(inputManager) {
        this._inputManager = inputManager;
    }
};

export default InputSource;
