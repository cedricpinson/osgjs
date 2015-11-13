'use strict';

var MACROUTILS = require( 'osg/Utils' );
var Transform = require( 'osg/Transform' );
var Vec3 = require( 'osg/Vec3' );
var Vec4 = require( 'osg/Vec4' );
var Quat = require( 'osg/Quat' );
var Matrix = require( 'osg/Matrix' );
var StateAttribute = require( 'osg/StateAttribute' );
var BillboardAttribute = require( 'osg/BillboardAttribute' );
var NodeVisitor = require( 'osg/NodeVisitor' );
var TransformEnums = require( 'osg/TransformEnums' );
var Node = require( 'osg/Node' );

/** AutoTransform is a derived form of Transform that automatically
 * scales or rotates to keep its children aligned with screen coordinates.
 * W.r.t. AutorotateModes only rotate to screen is supported right now.
 * More AutorotateModes modes should be addressed in the future.
 * @class AutoTransform
 */

var AutoTransform = function () {
    Transform.call( this );
    this._matrix = Matrix.create();
    this._position = Vec3.create();
    this._matrixDirty = true;
    this._scale = Vec3.createAndSet( 1.0, 1.0, 1.0 );
    this._minimumScale = 0;
    this._maximumScale = Number.MAX_VALUE;
    this._rotation = Quat.create();
    this._pivotPoint = Vec3.create();
    this._autoScaleToScreen = false;
    this._autoRotateToScreen = false;
    this._cachedMatrix = Matrix.create();
    this._firstTimeToInitEyePoint = true;
    this._autoScaleTransitionWidthRatio = 0.25;
    this._billboardAttribute = undefined;
    this._previousWidth = 0.0;
    this._previousHeight = 0.0;
    this._previousProjection = Matrix.create();
    this._previousPosition = Vec3.create();
};

/** @lends Autotransform.prototype */
AutoTransform.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Transform.prototype, {

    getMatrix: function () {
        return this._matrix;
    },

    setMatrix: function ( m ) {
        this._matrix = m;
        this.dirtyBound();
    },

    setPosition: function ( pos ) {
        this._position = pos;
        this._matrixDirty = true;
        this.dirtyBound();
    },
    getPosition: function () {
        return this._position;
    },

    setRotation: function ( quat ) {
        this._rotation = quat;
        this._matrixDirty = true;
        this.dirtyBound();
    },

    getRotation: function () {
        return this._rotation;
    },

    setScale: function ( scale ) {
        this.setScaleFromVec3( Vec3.createAndSet( scale, scale, scale ) );
    },

    setScaleFromVec3: function ( scaleVec ) {
        this._scale = scaleVec;
        this._matrixDirty = true;
        this.dirtyBound();
    },

    getScale: function () {
        return this._scale;
    },

    setMinimumScale: function ( minimumScale ) {
        this._minimumScale = minimumScale;
    },

    getMinimumScale: function () {
        return this._minimumScale;
    },

    setMaximumScale: function ( maximumScale ) {
        this._maximumScale = maximumScale;
    },

    getMaximumScale: function () {
        return this._maximumScale;
    },

    setAutoScaleToScreen: function ( autoScaleToScreen ) {
        this._autoScaleToScreen = autoScaleToScreen;
        this._matrixDirty = true;
    },

    getAutoScaleToScreen: function () {
        return this._autoScaleToScreen;
    },

    setAutoRotateToScreen: function ( value ) {
        this._autoRotateToScreen = value;
        if ( !this._billboardAttribute ) {
            this._billboardAttribute = new BillboardAttribute();
        }
        var stateset = this.getOrCreateStateSet();
        if ( value ) {
            // Temporary hack because StateAttribute.ON does not work right now
            this._billboardAttribute.setEnabled( true );
            stateset.setAttributeAndModes( this._billboardAttribute, StateAttribute.ON );
        } else {
            // Temporary hack because StateAttribute.OFF does not work right now
            this._billboardAttribute.setEnabled( false );
            stateset.setAttributeAndModes( this._billboardAttribute, StateAttribute.OFF );
        }
    },

    getAutoRotateToScreen: function () {
        return this._autoRotateToScreen;
    },

    setAutoScaleTransitionWidthRatio: function ( autoScaleTransitionWidthRatio ) {
        this._autoScaleTransitionWidthRatio = autoScaleTransitionWidthRatio;
    },

    getAutoScaleTransitionWidthRatio: function () {
        return this._autoScaleTransitionWidthRatio;
    },

    // local to "local world" (not Global World)
    computeLocalToWorldMatrix: function ( matrix /*, nodeVisitor */ ) {
        if ( this._matrixDirty ) this.computeMatrix();
        if ( this.referenceFrame === TransformEnums.RELATIVE_RF ) {
            Matrix.preMult( matrix, this._matrix );
        } else {
            Matrix.copy( this._matrix, matrix );
        }
    },

    computeMatrix: ( function () {
        var neg = Vec3.create();
        return function () {
            if ( !this._matrixDirty ) return;
            Matrix.makeRotateFromQuat( this._rotation, this._matrix );
            //_cachedMatrix.postMultTranslate(_position);
            Matrix.postMultTranslate( this._matrix, this._position );
            Matrix.preMultScale( this._matrix, this._scale );
            Matrix.preMultTranslate( this._matrix, Vec3.neg( this._pivotPoint, neg ) );
            this._matrixDirty = false;
        };

    } )(),

    computeWorldToLocalMatrix: ( function () {
        var neg = Vec3.create();
        var rotInverse = Quat.create();
        var scaleInverse = Vec3.create();
        return function ( matrix /*, nodeVisitor */ ) {
            if ( this.scale[ 0 ] === 0.0 && this.scale[ 1 ] === 0.0 && this.scale[ 2 ] === 0.0 ) {
                return false;
            }
            scaleInverse[ 0 ] = 1 / this._scale[ 0 ];
            scaleInverse[ 1 ] = 1 / this._scale[ 1 ];
            scaleInverse[ 2 ] = 1 / this._scale[ 2 ];
            if ( this.referenceFrame === TransformEnums.RELATIVE_RF ) {
                Matrix.postMultTranslate( matrix, Vec3.neg( this._position, neg ) );
                Matrix.postMultRotate( matrix, Quat.inverse( this._rotation, rotInverse ) );
                Matrix.postMultScale( matrix, scaleInverse );
                Matrix.postMultTranslate( matrix, this._pivotPoint );
            } else { // absolute
                Matrix.makeRotateFromQuat( Quat.inverse( this._rotation, rotInverse ), this._matrix );
                Matrix.preMultTranslate( matrix, Vec3.neg( this._position, neg ) );
                Matrix.postMultScale( matrix, scaleInverse );
                Matrix.postMultTranslate( matrix, this._pivotPoint );
            }
            return true;
        };
    } )(),

    computeBound: ( function () {
        var matrix = Matrix.create();
        return function ( bSphere ) {
            if ( this._autoScaleToScreen && this._firstTimeToInitEyePoint )
                return bSphere;
            Node.prototype.computeBound.call( this, bSphere );
            if ( !bSphere.valid() ) {
                return bSphere;
            }
            Matrix.makeIdentity( matrix );
            // local to local world (not Global World)
            this.computeLocalToWorldMatrix( matrix );
            Matrix.transformBoundingSphere( matrix, bSphere, bSphere );
            return bSphere;
        };
    } )(),

    accept: ( function () {

        return function ( visitor ) {
            if ( visitor.getVisitorType() === NodeVisitor.CULL_VISITOR ) {
                // TODO only recalculate scale if needed.
                if ( this._autoScaleToScreen ) {
                    var width = visitor.getViewport().width();
                    var height = visitor.getViewport().height();
                    var projMat = visitor.getCurrentProjectionMatrix();
                    var position = this._position;
                    var doUpdate = this._firstTimeToInitEyePoint;

                    if ( !this._firstTimeToInitEyePoint ) {
                        if ( width !== this._previousWidth || height !== this._previousHeight ) {
                            doUpdate = true;
                        } else if ( !Matrix.equal( projMat, this._previousProjection ) ) {
                            doUpdate = true;
                        } else if ( !Vec3.equal( position, this._previousPosition ) ) {
                            doUpdate = true;
                        }
                    }
                    this._firstTimeToInitEyePoint = false;
                    if ( doUpdate ) {
                        var modelViewMat = visitor.getCurrentModelViewMatrix();
                        var viewport = visitor.getViewport();
                        var psvector = this.computePixelSizeVector( viewport, projMat, modelViewMat );
                        var v = Vec4.createAndSet( this._position[ 0 ], this._position[ 1 ], this._position[ 2 ], 1.0 );
                        var pixelSize = Vec4.dot( v, psvector );
                        pixelSize = 0.48 / pixelSize;
                        var size = 1.0 / pixelSize;
                        if ( this._autoScaleTransitionWidthRatio > 0.0 ) {
                            var c, b, a;
                            if ( this._minimumScale > 0.0 ) {
                                var j = this._minimumScale;
                                var i = ( this._maximumScale < Number.MAX_VALUE ) ?
                                    this._minimumScale + ( this._maximumScale - this._minimumScale ) * this._autoScaleTransitionWidthRatio :
                                    this._minimumScale * ( 1.0 + this._autoScaleTransitionWidthRatio );
                                c = 1.0 / ( 4.0 * ( i - j ) );
                                b = 1.0 - 2.0 * c * i;
                                a = j + b * b / ( 4.0 * c );
                                var k = -b / ( 2.0 * c );
                                if ( size < k ) size = this._minimumScale;
                                else if ( size < i ) size = a + b * size + c * ( size * size );
                            }
                            if ( this._maximumScale < Number.MAX_VALUE ) {
                                var n = this._maximumScale;
                                var m = ( this._minimumScale > 0.0 ) ?
                                    this._maximumScale + ( this._minimumScale - this._maximumScale ) * this._autoScaleTransitionWidthRatio :
                                    this._maximumScale * ( 1.0 - this._autoScaleTransitionWidthRatio );
                                c = 1.0 / ( 4.0 * ( m - n ) );
                                b = 1.0 - 2.0 * c * m;
                                a = n + b * b / ( 4.0 * c );
                                var p = -b / ( 2.0 * c );

                                if ( size > p ) size = this._maximumScale;
                                else if ( size > m ) size = a + b * size + c * ( size * size );
                            }
                        }
                        this.setScale( size );
                    }
                    this._previousWidth = width;
                    this._previousHeight = height;
                    Vec3.copy( position, this._previousPosition );
                    Matrix.copy( projMat, this._previousProjection );
                }
            }

            Node.prototype.accept.call( this, visitor );
        };
    } )(),

    computePixelSizeVector: ( function () {
        var scale00 = Vec3.create();
        var scale10 = Vec3.create();
        return function ( W, P, M ) {
            // Where W = viewport, P = ProjectionMatrix, M = ModelViewMatrix
            // Comment from OSG:
            // pre adjust P00,P20,P23,P33 by multiplying them by the viewport window matrix.
            // here we do it in short hand with the knowledge of how the window matrix is formed
            // note P23,P33 are multiplied by an implicit 1 which would come from the window matrix.

            // scaling for horizontal pixels
            var P00 = P[ 0 ] * W.width() * 0.5;
            var P20_00 = P[ 8 ] * W.width() * 0.5 + P[ 11 ] * W.width() * 0.5;
            Vec3.set( M[ 0 ] * P00 + M[ 2 ] * P20_00,
                M[ 4 ] * P00 + M[ 6 ] * P20_00,
                M[ 8 ] * P00 + M[ 10 ] * P20_00, scale00 );

            // scaling for vertical pixels
            var P10 = P[ 5 ] * W.height() * 0.5;
            var P20_10 = P[ 9 ] * W.height() * 0.5 + P[ 11 ] * W.height() * 0.5;
            Vec3.set( M[ 1 ] * P10 + M[ 2 ] * P20_10,
                M[ 5 ] * P10 + M[ 6 ] * P20_10,
                M[ 9 ] * P10 + M[ 10 ] * P20_10, scale10 );

            var P23 = P[ 11 ];
            var P33 = P[ 15 ];
            var pixelSizeVector = Vec4.createAndSet( M[ 2 ] * P23, M[ 6 ] * P23, M[ 10 ] * P23, M[ 14 ] * P23 + M[ 15 ] * P33 );

            var scaleRatio = 0.7071067811 / Math.sqrt( Vec3.length2( scale00 ) + Vec3.length2( scale10 ) );
            Vec4.mult( pixelSizeVector, scaleRatio, pixelSizeVector );
            return pixelSizeVector;
        };
    } )()


} ), 'osg', 'AutoTransform' );
MACROUTILS.setTypeID( AutoTransform );

module.exports = AutoTransform;
