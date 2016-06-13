'use strict';
var assert = require( 'chai' ).assert;
var Utils = require( 'osg/Utils' );


module.exports = function () {

    var checkBaseClass = function ( BaseObject ) {
        var a = new BaseObject();
        assert.isOk( a.className() === 'Asticot', 'check className' );
        assert.isOk( a.libraryName() === 'toto', 'check libraryName' );
        assert.isOk( a.getTypeID() === BaseObject.getTypeID(), 'check typeID' );
    };

    var checkExtendedClass = function ( BaseObject, ExtendedObject ) {
        var a = new BaseObject();
        var b = new ExtendedObject();
        assert.isOk( b.className() === 'LeRigolo', 'check className' );
        assert.isOk( b.libraryName() === 'toto', 'check libraryName' );
        assert.isOk( b.getTypeID() === ExtendedObject.getTypeID() && b.getTypeID() !== a.getTypeID(), 'check typeID' );
        assert.isOk( b instanceof BaseObject, 'check b is instance of BaseObject' );
    };

    test( 'createPrototypeClass', function () {

        var BaseObject = function () {
            this._var0 = 1;
        };

        Utils.createPrototypeClass( BaseObject, {
            getMember: function () {
                return 1;
            }

        }, 'toto', 'Asticot' );

        checkBaseClass( BaseObject );

        var ExtendedObject = function () {
            BaseObject.call( this );
            this._var1 = 1;
        };

        Utils.createPrototypeClass( ExtendedObject, Utils.objectInherit( BaseObject.prototype, {
            getMember: function () {
                return 2;
            }
        } ), 'toto', 'LeRigolo' );

        checkExtendedClass( BaseObject, ExtendedObject );


        var BaseObjectOld = function () {
            this._var0 = 1;
        };
        BaseObjectOld.prototype = Utils.objectLibraryClass( {
            getMember: function () {
                return 1;
            }

        }, 'toto', 'Asticot' );
        Utils.setTypeID( BaseObjectOld );
        checkBaseClass( BaseObjectOld );

        var ExtendedObjectOld = function () {
            BaseObjectOld.call( this );
            this._var1 = 1;
        };

        ExtendedObjectOld.prototype = Utils.objectLibraryClass( Utils.objectInherit( BaseObjectOld.prototype, {
            getMember: function () {
                return 2;
            }
        } ), 'toto', 'LeRigolo' );
        Utils.setTypeID( ExtendedObjectOld );

        checkExtendedClass( BaseObjectOld, ExtendedObjectOld );

    } );

};
