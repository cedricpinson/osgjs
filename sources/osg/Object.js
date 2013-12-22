define( [
    'osg/Utils'
], function ( MACROUTILS ) {

        /**
     *  Object class
     *  @class Object
     */
    var Object = function () {
        this._name = undefined;
        this._userdata = undefined;
        this._instanceID = Object.getInstanceID();
    };

    /** @lends Object.prototype */
    Object.prototype = MACROUTILS.objectLibraryClass( {
            getInstanceID: function () {
                return this._instanceID;
            },
            setName: function ( name ) {
                this._name = name;
            },
            getName: function () {
                return this._name;
            },
            setUserData: function ( data ) {
                this._userdata = data;
            },
            getUserData: function () {
                return this._userdata;
            }
        },
        'osg', 'Object' );


    // get an instanceID for each object
    ( function () {
        var instanceID = 0;
        Object.getInstanceID = function () {
            instanceID += 1;
            return instanceID;
        };
    } )();

    return Object;
} );
