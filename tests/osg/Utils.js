'use strict';
var assert = require( 'chai' ).assert;
var Utils = require( 'osg/Utils' );


module.exports = function () {

    var checkBaseClass = function ( BaseObject, libraryName, className ) {
        var a = new BaseObject();
        assert.equal( a.className(), className, 'check className' );
        assert.equal( a.libraryName(), libraryName, 'check libraryName' );
        assert.equal( a.getTypeID(), BaseObject.getTypeID(), 'check typeID' );
    };

    var checkExtendedClass = function ( BaseObject, ExtendedObject, libraryName, className ) {
        var a = new BaseObject();
        var b = new ExtendedObject();
        assert.equal( b.className(), className, 'check className' );
        assert.equal( b.libraryName(), libraryName, 'check libraryName' );
        assert.isOk( b.getTypeID() === ExtendedObject.getTypeID() && b.getTypeID() !== a.getTypeID(), 'check typeID' );
        assert.isOk( b instanceof BaseObject, 'check b is instance of BaseObject' );
    };

    test( 'createPrototypeObject', function () {

        var BaseObject = function () {
            this._var0 = 1;
        };

        Utils.createPrototypeObject( BaseObject, {
            getMember: function () {
                return 1;
            }

        }, 'toto', 'Asticot' );

        checkBaseClass( BaseObject, 'toto', 'Asticot' );

        var ExtendedObject = function () {
            BaseObject.call( this );
            this._var1 = 1;
        };

        Utils.createPrototypeObject( ExtendedObject, Utils.objectInherit( BaseObject.prototype, {
            getMember: function () {
                return 2;
            }
        } ), 'toto', 'LeRigolo' );

        checkExtendedClass( BaseObject, ExtendedObject, 'toto', 'LeRigolo' );


        var BaseObjectOld = function () {
            this._var0 = 1;
        };
        BaseObjectOld.prototype = Utils.objectLibraryClass( {
            getMember: function () {
                return 1;
            }

        }, 'toto1', 'Asticot1' );
        Utils.setTypeID( BaseObjectOld );
        checkBaseClass( BaseObjectOld, 'toto1', 'Asticot1' );

        var ExtendedObjectOld = function () {
            BaseObjectOld.call( this );
            this._var1 = 1;
        };

        ExtendedObjectOld.prototype = Utils.objectLibraryClass( Utils.objectInherit( BaseObjectOld.prototype, {
            getMember: function () {
                return 2;
            }
        } ), 'toto1', 'LeRigolo1' );
        Utils.setTypeID( ExtendedObjectOld );

        checkExtendedClass( BaseObjectOld, ExtendedObjectOld, 'toto1', 'LeRigolo1' );

    } );

};
