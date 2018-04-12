import notify from 'osg/notify';

var DEFAULT_PRIORITY = 10;
var MODIFIERS = ['shift', 'alt', 'ctrl', 'meta'];

/**
 * InputGroup
 * @constructor
 */
var InputGroup = function(inputManager, name) {
    // true when this group is enabled
    this._enabled = true;

    // the name of the group
    this._name = name;

    //mask attribute when a "parent" group is disabled.
    this._mask = [];

    // Map of for custom event names to events instances
    // { 'customEventName' : [event1, event2 ...]}
    // there is one instance of event for each customEvent / nativeEvent combination
    this._events = {};

    // Map for native event names to events instances.
    this._mappings = {};

    // reference to the inputManager
    this._inputManager = inputManager;

    // the callback to collect native events bound to this instance
    this._boundCallback = this._collectNativeEvents.bind(this);

    // the group priority (the highest priorities of the events of this group)
    this._priority = DEFAULT_PRIORITY;

    // true when the group has at least one source (used only or debug)
    this._hasSources = false;
};

InputGroup.prototype = {
    /**
     * Adds mappings to this group.
     * Mappings are of the form:
     * {
     *      eventName: 'nativeEvent <[params...]>'
     *      ...
     * }
     *
     * Listener can be a function or an object.
     * If it's an object the InputManager will try to bind the listener.eventName method.
     *
     * @param mappings
     * @param listener
     */
    addMappings: function(mappings, listener) {
        for (var key in mappings) {
            mappings[this._name + ':' + key] = mappings[key];
            delete mappings[key];
        }

        this._inputManager.addMappings(mappings, listener);
    },

    _collectNativeEvents: function(nativeEvent) {
        if (!this._enabled || this._mask.length) {
            return;
        }
        //nativeEvent.preventDefault();
        var events = this._mappings[nativeEvent.type];
        if (!events) {
            return;
        }
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            if (
                event._source.isEventRegistered &&
                !event._source.isEventRegistered(nativeEvent, event._parsedEvent)
            ) {
                continue;
            }
            event._source.populateEvent(nativeEvent, event);
            if (!event._nativeEvents) {
                event._nativeEvents = [];
            }
            if (!event._nativeEvents.length) {
                //event must be queued
                var queue = this._inputManager._queues[event._priority];
                if (!queue) {
                    queue = [];
                    this._inputManager._queues[event._priority] = queue;
                }
                queue.push(event);
            }
            event._nativeEvents.push(nativeEvent);
        }
    },

    _addEvent: function(nativeEvent, eventName) {
        // creating an event instance for each eventName / raw nativeEvent  combination.
        var fullName = this._name + ':' + eventName;
        var registerEvent = false;
        // find or init the mapping native event/events instance for this native event
        var events = this._mappings[nativeEvent.name];
        var event;
        if (!events) {
            events = [];
            this._mappings[nativeEvent.name] = events;
            registerEvent = true;
        } else {
            // try to find an existing event that matches the new one
            event = this._findEvent(events, fullName, nativeEvent.raw);
        }

        // find or init the mapping eventName/events instance for this eventName
        var eventList = this._events[eventName];
        if (!eventList) {
            eventList = [];
            this._events[eventName] = eventList;
        }

        if (!event) {
            // event not found let's create a new one and add it to the maps
            event = new Event(fullName);
            events.push(event);
            eventList.push(event);
        }

        event._parsedEvent = nativeEvent;
        event._priority = DEFAULT_PRIORITY;

        // finding the source of the native event and enable the dispatch
        var source = this._inputManager._getSource(nativeEvent.name);
        if (source) {
            if (this._enabled && registerEvent) {
                source.setEnable(nativeEvent.name, this._boundCallback, true);
            }
            this._hasSources = true;
            event._source = source;
        }
    },

    _findEvent: function(list, name, nativeRaw) {
        for (var i = 0; i < list.length; i++) {
            var evt = list[i];
            if (evt.type === name && evt._parsedEvent.raw === nativeRaw) {
                return evt;
            }
        }
        return undefined;
    },

    _setEnable: function(enable) {
        this._enabled = enable;
        // adding / removing native events
        for (var nativeEvent in this._mappings) {
            var events = this._mappings[nativeEvent];
            var evt = events[0];
            if (!evt._source) {
                continue;
            }
            evt._source.setEnable(nativeEvent, this._boundCallback, enable);
        }
    }
};

/**
 * InputManager
 */
var InputManager = function() {
    // Contains all created input groups
    this._groups = {};

    // Contains all registered input sources.
    this._sources = [];

    // Event queues filled each frame with all the events to dispatch
    // queues[0] = [event1, event2]
    // queues[1] = [event3, event4]
    // ...
    // 0 is the top priority queue the higher the index the lowest the priority.
    // We use an array here even if some entries are undefined.
    // The array is the best compromise, ensuring queues order and iteration performance across browsers.
    this._queues = [];

    // initializing the default priority queue
    this._queues[DEFAULT_PRIORITY] = [];

    // the map af callbacks
    this._callbacks = {};

    // Custom parameters
    this._params = {};

    this._maskedGroups = [];

    window.dumpInputGroups = this._dumpInputGroups.bind(this);
    window.dumpEventSequence = this._dumpEventSequence.bind(this);
};

InputManager.prototype = {
    /**
     * Registers an InputSource.
     * Each time a mapping is added to the InputManager, it will try to find a suitable input source for the event,
     * among the input sources that have been registered.
     * See osgViewer/input/InputSource.js
     * @param source
     */
    registerInputSource: function(source) {
        if (!source.setEnable || !source.supportsEvent || !source.getName) {
            throw 'Invalid input target ' + JSON.stringify(source);
        }
        this._sources.push(source);
        source.setInputManager(this);
    },

    /**
     * Returns a registered InputSource named as the given name.
     * @param name the name of the input source to find.
     * @returns the input source or undefined if it was not found.
     */
    getInputSource: function(name) {
        for (var i = 0; i < this._sources.length; i++) {
            var source = this._sources[i];
            if (source.getName() === name) {
                return source;
            }
        }
        return undefined;
    },

    /**
     * Adds mappings to the inputManager.
     * Mappings are of the form:
     * {
     *      'groupName:eventName': 'nativeEvent <[params...]>'
     *      ...
     * }
     *
     * Listener can be a function or an object.
     * If it's an object the InputManager will try to bind the listener.eventName method.
     *
     * @param mappings
     * @param listener
     */
    addMappings: function(mappings, listener) {
        for (var key in mappings) {
            var nativeEvents = mappings[key];
            var groupEvent = key.split(':');
            if (groupEvent.length !== 2) {
                throw "Mapping should be of the form 'group:methodName': ['nativeevent1’, 'nativeevent2',...] ";
            }
            var group = this._getOrCreateGroup(groupEvent[0]);

            var callback;
            var eventName = groupEvent[1];
            if (listener) {
                if (typeof listener === 'object') {
                    callback = listener[eventName];
                    if (!callback || typeof callback !== 'function') {
                        throw 'Cannot find method ' + eventName + ' on ' + listener;
                    }
                    callback = callback.bind(listener);
                } else if (typeof listener === 'function') {
                    callback = listener;
                } else {
                    throw 'Invalid listener ' + listener;
                }
            }
            var parsedEvent;
            if (typeof nativeEvents === 'string') {
                parsedEvent = this._parseNativeEvent(nativeEvents);
                group._addEvent(parsedEvent, eventName);
            } else {
                for (var i = 0; i < nativeEvents.length; i++) {
                    var nativeEvent = nativeEvents[i];
                    parsedEvent = this._parseNativeEvent(nativeEvent);
                    group._addEvent(parsedEvent, eventName);
                }
            }

            // registering the callback for the new event
            this._callbacks[group._name + ':' + eventName] = callback;
        }
    },

    /**
     * Returns a group with the given name.
     * Note that this method looks up for an existing group with the given name, and creates it is not found.
     * @param name the name of the group
     * @returns the group.
     */
    group: function(name) {
        return this._getOrCreateGroup(name);
    },

    /**
     * Enables or disables the group with the given name.
     * @param groupName the group name
     * @param enable true to enable, false to disable.
     */
    setEnable: function(groupName, enable) {
        var group = this._groups[groupName];
        if (group) {
            group._setEnable(enable);
        }

        var index;
        //check for partial groups.
        for (var key in this._groups) {
            group = this._groups[key];

            if (enable) {
                // remove the group name from the mask
                index = group._mask.indexOf(groupName);
                if (index >= 0) {
                    group._mask.splice(index, 1);
                    this._maskedGroups.splice(this._maskedGroups.indexOf(groupName), 1);
                }
            } else {
                // add the group to the mask
                index = group._name.indexOf(groupName);
                if (index === 0 && group._name[index + groupName.length] === '.') {
                    group._mask.push(groupName);
                    this._maskedGroups.push(groupName);
                }
            }
        }
        if (!enable) {
            //discard all queued event emitted from this group
            for (var i = 0; i < this._queues.length; i++) {
                var queue = this._queues[i];
                if (!queue) {
                    continue;
                }
                for (var j = queue.length - 1; j >= 0; j--) {
                    var evt = queue[j];
                    if (evt.type.indexOf(groupName) >= 0) {
                        queue.splice(j, 1);
                        evt._nativeEvents.length = 0;
                    }
                }
            }
        }
    },

    /**
     * Sets an event or a group priority
     * The priority must be a positive number
     * 0 being the highest priority.
     *
     * @param eventName
     * @param priority
     */
    setPriority: function(eventName, priority) {
        var groupEvent = eventName.split(':');
        if (priority < 0) {
            throw 'priority must be a positive number';
        }
        var group = this._groups[groupEvent[0]];

        var event, eventList, i;
        if (group && groupEvent[1]) {
            // setPriority on a specific event
            eventList = group._events[groupEvent[1]];
            for (i = 0; i < eventList.length; i++) {
                event = eventList[i];
                event._priority = priority;
            }
            if (group._priority > priority) {
                group._priority = priority;
            }
        } else {
            // set Priority on a group, setting priority on all group's events.
            for (var key in this._groups) {
                group = this._groups[key];
                if (group._name.indexOf(eventName) >= 0) {
                    for (var evt in group._events) {
                        eventList = group._events[evt];
                        for (i = 0; i < eventList.length; i++) {
                            event = eventList[i];
                            event._priority = priority;
                        }
                    }
                }
            }
        }
    },

    /**
     * Return a higher priority than the priority of the group with the given name.
     * @param groupName the name of the group
     * @returns {number} the priority.
     */
    getHigherPriority: function(groupName) {
        var priority = DEFAULT_PRIORITY;
        for (var key in this._groups) {
            var group = this._groups[key];
            if (group._name.indexOf(groupName) >= 0) {
                if (group._priority < priority) {
                    priority = group._priority;
                }
            }
        }
        return priority > 0 ? priority - 1 : 0;
    },

    /**
     * Gets the parameter for the given name
     * @param name the name of the parameter
     * @returns {*} the parameter value, undefined if not found
     */
    getParam: function(name) {
        return this._params[name];
    },

    /**
     * Sets a parameter with the given name and the given value.
     * @param name the name of the parameter
     * @param value the value of the parameter
     */
    setParam: function(name, value) {
        this._params[name] = value;
    },

    /**
     * Disables all groups on the manager and clear all listeners attached to DOM elements.
     */
    cleanup: function() {
        for (var key in this._groups) {
            var group = this._groups[key];
            group._setEnable(false);
        }
    },

    _parseNativeEvent: function(event) {
        var tokens = event.split(' ');
        var parsedEvent = {};
        parsedEvent.name = tokens[0];
        var i;
        for (i = 1; i < tokens.length; i++) {
            var token = tokens[i];
            var value = true;
            if (token.indexOf('!') === 0) {
                value = false;
                token = token.substring(1, token.length);
            }
            if (MODIFIERS.indexOf(token) >= 0) {
                parsedEvent[token] = value;
            } else {
                parsedEvent.action = token.toLowerCase();
            }
        }

        if (parsedEvent.action) {
            // user may have used ShiftRight or ShiftLeft to specify which shift key he wants to trigger the event.
            // in that case adding the shift modifier as the browser will report it like that.
            for (i = 0; i < MODIFIERS.length; i++) {
                var mod = MODIFIERS[i];
                if (parsedEvent.action.indexOf(mod) === 0) {
                    parsedEvent[mod] = true;
                }
            }
        }

        if (parsedEvent.name.indexOf('key') === 0 && !parsedEvent.action && tokens.length > 1) {
            // Key down event, the user wants one of the modifier keys to be the action
            // we take the last one
            parsedEvent.action = tokens[tokens.length - 1];
        }

        parsedEvent.raw = event;

        return parsedEvent;
    },

    _getOrCreateGroup: function(name) {
        var group = this._groups[name];
        if (!group) {
            group = new InputGroup(this, name);
            this._groups[name] = group;
            //check if the group should be masked
            for (var i = 0; i < this._maskedGroups.length; i++) {
                var mask = this._maskedGroups[i];
                if (name.indexOf(mask) === 0) {
                    group._mask.push(mask);
                }
            }
        }
        return group;
    },

    /**
     * Internal use only.
     */
    update: function() {
        var i;
        //polling sources if relevant
        for (i = 0; i < this._sources.length; i++) {
            var source = this._sources[i];
            if (source.poll) {
                source.poll();
            }
        }

        //dispatch all queued events by priority order
        for (i = 0; i < this._queues.length; i++) {
            var queue = this._queues[i];
            if (!queue) {
                continue;
            }
            for (var j = 0; j < queue.length; j++) {
                var event = queue[j];
                this._callbacks[event.type](event);
                //window.dispatchEvent(event);
                event._nativeEvents.length = 0;
            }
            //flush the queue
            queue.length = 0;
        }
    },

    _getSource: function(triggerName) {
        for (var i = 0; i < this._sources.length; i++) {
            var source = this._sources[i];
            if (source.supportsEvent(triggerName)) {
                return source;
            }
        }
    },

    _dumpInputGroups: function(filter, onlyEnabled) {
        if (filter === true) {
            onlyEnabled = filter;
            filter = undefined;
        }
        for (var groupName in this._groups) {
            if (filter && groupName.indexOf(filter) < 0) {
                continue;
            }
            var group = this._groups[groupName];
            var enabled = group._enabled && !group._mask.length && group._hasSources;
            if (onlyEnabled && !enabled) {
                continue;
            }
            notify.groupCollapsed(
                '%c' + groupName + (enabled ? ' (enabled)' : ' (disabled)'),
                enabled ? '' : 'color: #888888'
            );

            notify.log('enabled:', group._enabled);
            notify.log('masks:', group._mask);
            notify.log('input sources:', group._hasSources);
            notify.group('events');
            for (var evt in group._events) {
                notify.groupCollapsed(evt);
                var events = group._events[evt];
                for (var i = 0; i < events.length; i++) {
                    var event = events[i];
                    var str =
                        '%c' +
                        event._parsedEvent.raw +
                        ' (' +
                        (event._source ? event._source.getName() : 'unknown source') +
                        ')';
                    var color = event._source ? '' : 'color: #888888';
                    notify.log(str, color);
                }
                notify.groupCollapsed('function');
                notify.log(this._callbacks[group._name + ':' + evt]);
                notify.groupEnd();
                notify.groupEnd();
            }

            notify.groupEnd();
            notify.groupEnd();
        }
    },

    _dumpEventSequence: function(filter, onlyEnabled) {
        var eventList = [];
        if (filter === true) {
            onlyEnabled = filter;
            filter = undefined;
        }
        var enabled;
        for (var groupKey in this._groups) {
            var group = this._groups[groupKey];
            enabled = group._enabled && !group._mask.length && group._hasSources;
            if (onlyEnabled && !enabled) {
                continue;
            }
            for (var eventKey in group._events) {
                var events = group._events[eventKey];
                var list = eventList[events[0]._priority];
                if (!list) {
                    list = [];
                    eventList[events[0]._priority] = list;
                }
                for (var i = 0; i < events.length; i++) {
                    var ev = events[i];
                    if (!filter || (filter && ev._parsedEvent.raw.indexOf(filter) >= 0)) {
                        list.push({
                            name: ev.type,
                            group: group._name,
                            on: ev._parsedEvent.raw,
                            enabled: group._enabled && !group._mask.length && !!ev._source,
                            source: ev._source
                                ? '(' + ev._source.getName() + ')'
                                : '(unknown source)'
                        });
                    }
                }
            }
        }

        for (var j = 0; j < eventList.length; j++) {
            var evts = eventList[j];
            if (evts) {
                notify.group('priority ' + j);
                var prevEvt;
                for (var k = 0; k < evts.length; k++) {
                    var evt = evts[k];
                    if (k !== 0 && prevEvt !== evt.name) {
                        notify.groupEnd();
                    }
                    if (prevEvt !== evt.name) {
                        var grp = this._groups[evt.group];
                        enabled = grp._enabled && !grp._mask.length && grp._hasSources;
                        notify.groupCollapsed('%c' + evt.name, enabled ? '' : 'color:#888888');
                    }
                    prevEvt = evt.name;
                    notify.groupCollapsed(
                        '%c' + evt.on + ' ' + evt.source,
                        evt.enabled ? '' : 'color:#888888'
                    );
                    notify.log(this._callbacks[evt.name]);
                    notify.groupEnd();
                }
                notify.groupEnd();
                notify.groupEnd();
            }
        }
    }
};

export default InputManager;
