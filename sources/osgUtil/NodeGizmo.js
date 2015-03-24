define( [
    'osg/Node',
    'osg/MatrixTransform',
    'osg/Depth',
    'osg/BlendFunc',
    'osg/CullFace',
    'osg/Uniform',
    'osg/Vec2',
    'osg/Vec3',
    'osg/Matrix',
    'osg/Quat',
    'osgUtil/IntersectionVisitor',
    'osgUtil/LineSegmentIntersector',
    'osgUtil/GizmoGeometry',
    'osg/TransformEnums',
    'osg/Utils'
], function ( Node, MatrixTransform, Depth, BlendFunc, CullFace, Uniform, Vec2, Vec3, Matrix, Quat, IntersectionVisitor, LineSegmentIntersector, GizmoGeometry, TransformEnums, MACROUTILS ) {

    'use strict';

    var getCanvasCoord = function ( vec, e ) {
        vec[ 0 ] = e.offsetX === undefined ? e.layerX : e.offsetX;
        vec[ 1 ] = e.offsetY === undefined ? e.layerY : e.offsetY;
    };

    var HideCullCallback = function () {};
    HideCullCallback.prototype = {
        cull: function () {
            return false;
        }
    };

    var blendAttribute = new BlendFunc( BlendFunc.SRC_ALPHA, BlendFunc.ONE_MINUS_SRC_ALPHA );

    var LineCustomIntersector = function ( testPlane ) {
        this._testPlane = testPlane; // intersection plane or line
        this._inter = Vec3.create(); // translate distance
        LineSegmentIntersector.call( this );
    };
    LineCustomIntersector.prototype = MACROUTILS.objectInherit( LineSegmentIntersector.prototype, {
        enter: ( function () {
            var axis = Vec3.create();
            var dir = Vec3.create();

            return function ( node ) {
                if ( node._nbAxis === undefined )
                    return true;

                Vec3.init( axis );
                axis[ node._nbAxis ] = 1.0;
                if ( !this._testPlane ) {
                    // intersection line line
                    Vec3.normalize( Vec3.sub( this._iEnd, this._iStart, dir ), dir );

                    var a01 = -Vec3.dot( dir, axis );
                    var b0 = Vec3.dot( this._iStart, dir );
                    var det = Math.abs( 1.0 - a01 * a01 );

                    var b1 = -Vec3.dot( this._iStart, axis );
                    Vec3.init( this._inter );
                    this._inter[ node._nbAxis ] = ( a01 * b0 - b1 ) / det;
                } else {
                    // intersection line plane
                    var dist1 = Vec3.dot( this._iStart, axis );
                    var dist2 = Vec3.dot( this._iEnd, axis );
                    // ray copplanar to triangle
                    if ( dist1 === dist2 )
                        return false;
                    // intersection between ray and triangle
                    var val = -dist1 / ( dist2 - dist1 );
                    this._inter[ 0 ] = this._iStart[ 0 ] + ( this._iEnd[ 0 ] - this._iStart[ 0 ] ) * val;
                    this._inter[ 1 ] = this._iStart[ 1 ] + ( this._iEnd[ 1 ] - this._iStart[ 1 ] ) * val;
                    this._inter[ 2 ] = this._iStart[ 2 ] + ( this._iEnd[ 2 ] - this._iStart[ 2 ] ) * val;
                }
                return false;
            };
        } )(),
        intersect: function () {
            return false;
        }
    } );

    // The MT node can be detected as such because they
    // have a '_nbAxis' property on them (x=0, y=1, z=2)
    //
    // MatrixTransform _________________________________________
    //           |                    |                         |
    //    ____ Rotate             Translate               TranslatePlane
    //   |     / | \                / | \                     / | \
    //   MT   MT MT MT             MT MT MT                  MT MT MT
    //   |     \ | /                \ | /                     \ | /
    // FullArc  \|/                  \|/                       \|/
    //       ____|_____            ___|________              ___|________
    //      |          |          |            |            |            |
    //   DrawArc   HideNode   DrawArrow    HideNode     DrawPlane    HideNode
    //                 |                       |                         |
    //              PickArc                PickArrow                  PickPlane
    //
    var NodeGizmo = function ( viewer ) {
        MatrixTransform.call( this );

        this._tmask = 1; // traversal mask when picking the scene

        // We can set this boolean to true if we want to insert a MatrixTransform just
        // before the picked geometry.
        // Otherwise, we simply select the first MatrixTransform with an 'editMask' property
        this._autoInsertMT = false;

        this._viewer = viewer;
        this._canvas = viewer.getGraphicContext().canvas;
        this._manipulator = viewer.getManipulator();

        this._rotateNode = new MatrixTransform();
        this._translateNode = new MatrixTransform();
        this._planeNode = new MatrixTransform();

        this._rotateInLocal = true; // local vs static space
        this._showAngle = new MatrixTransform();

        //for realtime picking
        this._downCanvasCoord = Vec2.create();
        this._hoverNode = null; // the hovered x/y/z MT node
        this._keepHoverColor = null;

        // for editing
        this._isEditing = false;

        this._editLineOrigin = Vec3.create();
        this._editLineDirection = Vec3.create();
        this._editOffset = Vec3.create();

        this._editLocal = Matrix.create();
        this._editWorldTrans = Matrix.create();
        this._editWorldScaleRot = Matrix.create();
        this._editInvWorldScaleRot = Matrix.create();

        this._debugNode = new Node();

        this._attachedNode = null;
        this.attachToGeometry( null );

        this.init();
    };

    // picking masks
    NodeGizmo.NO_PICK = 1 << 0;
    NodeGizmo.PICK_ARC = 1 << 1;
    NodeGizmo.PICK_ARROW = 1 << 2;
    NodeGizmo.PICK_PLANE = 1 << 3;

    NodeGizmo.PICK_X = 1 << 4;
    NodeGizmo.PICK_Y = 1 << 5;
    NodeGizmo.PICK_Z = 1 << 6;

    NodeGizmo.PICK_XYZ = NodeGizmo.PICK_X | NodeGizmo.PICK_Y | NodeGizmo.PICK_Z;
    NodeGizmo.PICK_GIZMO = NodeGizmo.PICK_ARC | NodeGizmo.PICK_ARROW | NodeGizmo.PICK_PLANE;

    NodeGizmo.prototype = MACROUTILS.objectInherit( MatrixTransform.prototype, {
        setTraversalMask: function ( tmask ) {
            this._tmask = tmask;
        },
        init: function () {
            this.getOrCreateStateSet().setAttributeAndModes( new Depth( Depth.DISABLE ) );
            this.getOrCreateStateSet().setAttributeAndModes( new CullFace( CullFace.DISABLE ) );

            var UpdateCallback = function () {};
            UpdateCallback.prototype = {
                update: this.updateGizmo.bind( this )
            };
            this.addUpdateCallback( new UpdateCallback() );
            this.addChild( this.initNodeTranslate() );
            this.addChild( this.initNodeTranslatePlane() );
            this.addChild( this.initNodeRotate() );
            if ( this._debugNode ) {
                this._debugNode.addChild( GizmoGeometry.createDebugLineGeometry() );
                this.addChild( this._debugNode );
                this._debugNode.setNodeMask( 0x0 );
            }

            var canvas = this._canvas;
            canvas.addEventListener( 'mousemove', this.onMouseMove.bind( this ) );
            canvas.addEventListener( 'mousedown', this.onMouseDown.bind( this ) );
            canvas.addEventListener( 'mouseup', this.onMouseUp.bind( this ) );
            canvas.addEventListener( 'mouseout', this.onMouseUp.bind( this ) );
        },
        attachToNodePath: function ( nodepath ) {
            var node;
            if ( nodepath ) {
                for ( var i = nodepath.length - 1; i >= 0; --i ) {
                    var editMask = nodepath[ i ].editMask || 0;
                    if ( editMask & NodeGizmo.PICK_GIZMO ) {
                        node = nodepath[ i ];
                        break;
                    }
                }
            }
            if ( !node ) {
                this._attachedNode = null;
                this.setNodeMask( 0x0 );
                return;
            }

            this._attachedNode = node;
            this.updateGizmoMask();
        },
        attachToMatrixTransform: function ( node ) {
            if ( !node ) {
                this._attachedNode = null;
                this.setNodeMask( 0x0 );
                return;
            }
            if ( node.editMask === undefined )
                node.editMask = NodeGizmo.PICK_GIZMO;

            this._attachedNode = node;
            this.updateGizmoMask();
        },
        attachToGeometry: function ( node ) {
            if ( !node ) {
                this._attachedNode = null;
                this.setNodeMask( 0x0 );
                return;
            }
            // insert MatrixTransform node before geometry node
            var pr = node.getParents();
            if ( pr[ 0 ].editMask === undefined ) {
                var imt = new MatrixTransform();
                while ( pr.length > 0 ) {
                    pr[ 0 ].addChild( imt );
                    pr[ 0 ].removeChild( node );
                }
                imt.addChild( node );
                imt.editMask = NodeGizmo.PICK_GIZMO;
                node = imt;
            } else {
                node = pr[ 0 ];
            }

            this._attachedNode = node;
            this.updateGizmoMask();
        },
        updateGizmoMask: function () {
            if ( !this._attachedNode ) {
                this.setNodeMask( 0x0 );
                return;
            }
            var mask = this._attachedNode.editMask;
            this.setNodeMask( mask & NodeGizmo.PICK_GIZMO ? NodeGizmo.NO_PICK : 0x0 );
            this._translateNode.setNodeMask( mask & NodeGizmo.PICK_ARROW ? NodeGizmo.PICK_ARROW : 0x0 );
            this._rotateNode.setNodeMask( mask & NodeGizmo.PICK_ARC ? NodeGizmo.PICK_ARC : 0x0 );
            this._planeNode.setNodeMask( mask & NodeGizmo.PICK_PLANE ? NodeGizmo.PICK_PLANE : 0x0 );
        },
        onNodeHovered: function ( hit ) {
            if ( this._hoverNode )
                this._hoverNode.getStateSet().getUniform( 'uColor' ).set( this._keepHoverColor );
            if ( !hit ) {
                this._hoverNode = null;
                return;
            }

            // stop at the first X/Y/Z matrix node
            var np = hit.nodepath;
            var i = np.length - 1;
            var node = np[ i ];
            while ( node._nbAxis === undefined ) {
                if ( i === 0 )
                    return;
                node = np[ --i ];
            }

            var unif = node.getStateSet().getUniform( 'uColor' );
            this._hoverNode = node;
            this._keepHoverColor = unif.get();
            unif.set( [ 1.0, 1.0, 0.0, 1.0 ] );
        },
        initNodeRotate: function () {
            var drawArcXYZ = GizmoGeometry.createTorusGeometry( 1.0, 0.01, 6, 64, Math.PI * 2 );
            var drawArc = GizmoGeometry.createTorusGeometry( 1.0, 0.01, 6, 64, Math.PI );
            var pickArc = GizmoGeometry.createTorusGeometry( 1.0, 0.1, 6, 64, Math.PI );

            var mtXYZ = new MatrixTransform();
            var mtX = new MatrixTransform();
            var mtY = new MatrixTransform();
            var mtZ = new MatrixTransform();
            mtX._nbAxis = 0;
            mtY._nbAxis = 1;
            mtZ._nbAxis = 2;

            var hideNode = new Node();
            hideNode.setCullCallback( new HideCullCallback() );
            hideNode.addChild( pickArc );

            // set masks
            drawArcXYZ.setNodeMask( NodeGizmo.NO_PICK );
            drawArc.setNodeMask( NodeGizmo.NO_PICK );
            pickArc.setNodeMask( NodeGizmo.PICK_ARC );
            mtX.setNodeMask( NodeGizmo.PICK_X );
            mtY.setNodeMask( NodeGizmo.PICK_Y );
            mtZ.setNodeMask( NodeGizmo.PICK_Z );

            mtXYZ.addChild( drawArcXYZ );
            mtX.addChild( drawArc );
            mtY.addChild( drawArc );
            mtZ.addChild( drawArc );

            mtX.addChild( hideNode );
            mtY.addChild( hideNode );
            mtZ.addChild( hideNode );

            mtXYZ.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 0.2, 0.2, 0.2, 1.0 ], 'uColor' ) );
            mtX.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 1.0, 0.0, 0.0, 1.0 ], 'uColor' ) );
            mtY.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 0.0, 1.0, 0.0, 1.0 ], 'uColor' ) );
            mtZ.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 0.0, 0.0, 1.0, 1.0 ], 'uColor' ) );

            var showAngle = this._showAngle;
            showAngle.getOrCreateStateSet().setAttributeAndModes( blendAttribute );
            showAngle.setNodeMask( 0x0 );
            showAngle.getOrCreateStateSet().addUniform( Uniform.createFloat3( [ 1.0, 0.0, 0.0 ], 'uBase' ) );
            showAngle.getOrCreateStateSet().addUniform( Uniform.createFloat( 0.0, 'uAngle' ) );
            showAngle.addChild( GizmoGeometry.createQuadCircleGeometry() );

            var rotate = this._rotateNode;
            rotate.setNodeMask( NodeGizmo.PICK_ARC );
            rotate.addChild( mtXYZ );
            rotate.addChild( mtX );
            rotate.addChild( mtY );
            rotate.addChild( mtZ );
            rotate.addChild( showAngle );
            return rotate;
        },
        initNodeTranslate: function () {
            var aHeight = 1.5;
            var aConeHeight = 0.3;
            var pickStart = 0.5; // offset (because of the picking plane)
            var pickHeight = ( aHeight - pickStart + aConeHeight ) * 1.1;

            // cone arrow
            var mtCone = new MatrixTransform();
            Matrix.makeTranslate( 0.0, 0.0, aHeight + aConeHeight * 0.5, mtCone.getMatrix() );
            mtCone.addChild( GizmoGeometry.createCylinderGeometry( 0.0, 0.07, aConeHeight, 32, 1, true, true ) );
            // arrow base
            var mtArrow = new MatrixTransform();
            Matrix.makeTranslate( 0.0, 0.0, aHeight * 0.5, mtArrow.getMatrix() );
            mtArrow.addChild( GizmoGeometry.createCylinderGeometry( 0.01, 0.01, aHeight, 32, 1, true, true ) );
            // draw arrow
            var drawArrow = new Node();
            drawArrow.addChild( mtArrow );
            drawArrow.addChild( mtCone );

            var pickArrow = GizmoGeometry.createCylinderGeometry( 0.1, 0.1, pickHeight, 32, 1, true, true );

            var mtX = new MatrixTransform();
            var mtY = new MatrixTransform();
            var mtZ = new MatrixTransform();
            mtX._nbAxis = 0;
            mtY._nbAxis = 1;
            mtZ._nbAxis = 2;

            Matrix.makeRotate( Math.PI * 0.5, 0.0, 1.0, 0.0, mtX.getMatrix() );
            Matrix.makeRotate( -Math.PI * 0.5, 1.0, 0.0, 0.0, mtY.getMatrix() );

            var hideNode = new MatrixTransform();
            hideNode.setCullCallback( new HideCullCallback() );
            Matrix.makeTranslate( 0.0, 0.0, pickStart + pickHeight * 0.5, hideNode.getMatrix() );
            hideNode.addChild( pickArrow );

            // set masks
            drawArrow.setNodeMask( NodeGizmo.NO_PICK );
            pickArrow.setNodeMask( NodeGizmo.PICK_ARROW );
            mtX.setNodeMask( NodeGizmo.PICK_X );
            mtY.setNodeMask( NodeGizmo.PICK_Y );
            mtZ.setNodeMask( NodeGizmo.PICK_Z );

            mtX.addChild( drawArrow );
            mtY.addChild( drawArrow );
            mtZ.addChild( drawArrow );

            mtX.addChild( hideNode );
            mtY.addChild( hideNode );
            mtZ.addChild( hideNode );

            mtX.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 1.0, 0.0, 0.0, 1.0 ], 'uColor' ) );
            mtY.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 0.0, 1.0, 0.0, 1.0 ], 'uColor' ) );
            mtZ.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 0.0, 0.0, 1.0, 1.0 ], 'uColor' ) );

            var translate = this._translateNode;
            translate.setNodeMask( NodeGizmo.PICK_ARROW );
            translate.addChild( mtX );
            translate.addChild( mtY );
            translate.addChild( mtZ );
            return translate;
        },
        initNodeTranslatePlane: function () {
            var mtPlane = new MatrixTransform();
            Matrix.makeTranslate( 0.5, 0.5, 0.0, mtPlane.getMatrix() );
            Matrix.postMult( Matrix.makeScale( 0.5, 0.5, 1.0, Matrix.create() ), mtPlane.getMatrix() );
            mtPlane.addChild( GizmoGeometry.createPlaneGeometry() );

            var mtX = new MatrixTransform();
            var mtY = new MatrixTransform();
            var mtZ = new MatrixTransform();
            mtX._nbAxis = 0;
            mtY._nbAxis = 1;
            mtZ._nbAxis = 2;

            Matrix.makeRotate( -Math.PI * 0.5, 0.0, 1.0, 0.0, mtX.getMatrix() );
            Matrix.makeRotate( Math.PI * 0.5, 1.0, 0.0, 0.0, mtY.getMatrix() );

            // set masks
            mtPlane.setNodeMask( NodeGizmo.PICK_PLANE );
            mtX.setNodeMask( NodeGizmo.PICK_X );
            mtY.setNodeMask( NodeGizmo.PICK_Y );
            mtZ.setNodeMask( NodeGizmo.PICK_Z );

            mtX.addChild( mtPlane );
            mtY.addChild( mtPlane );
            mtZ.addChild( mtPlane );

            mtX.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 1.0, 0.0, 0.0, 0.3 ], 'uColor' ) );
            mtY.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 0.0, 1.0, 0.0, 0.3 ], 'uColor' ) );
            mtZ.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 0.0, 0.0, 1.0, 0.3 ], 'uColor' ) );

            var plane = this._planeNode;
            plane.setNodeMask( NodeGizmo.PICK_PLANE );
            plane.getOrCreateStateSet().setAttributeAndModes( blendAttribute );
            plane.addChild( mtX );
            plane.addChild( mtY );
            plane.addChild( mtZ );
            return plane;
        },
        updateArcRotation: ( function () {
            var quat = Quat.create();
            var quatx = Quat.makeRotate( -Math.PI * 0.5, 0.0, 1.0, 0.0, Quat.create() );
            var quaty = Quat.makeRotate( -Math.PI * 0.5, 1.0, 0.0, 0.0, Quat.create() );
            return function ( eye ) {
                var rotateNode = this._rotateNode;
                var arcs = rotateNode.getChildren();
                // eye arc
                quat[ 0 ] = -eye[ 1 ];
                quat[ 1 ] = eye[ 0 ];
                quat[ 2 ] = 0.0;
                quat[ 3 ] = 1.0 + eye[ 2 ];
                Quat.normalize( quat, quat );
                Matrix.makeRotateFromQuat( quat, arcs[ 0 ].getMatrix() );
                // x arc
                Quat.makeRotate( Math.atan2( eye[ 2 ], eye[ 1 ] ), 1.0, 0.0, 0.0, quat );
                Quat.mult( quat, quatx, quat );
                Matrix.makeRotateFromQuat( quat, arcs[ 1 ].getMatrix() );
                // y arc
                Quat.makeRotate( Math.atan2( -eye[ 0 ], -eye[ 2 ] ), 0.0, 1.0, 0.0, quat );
                Quat.mult( quat, quaty, quat );
                Matrix.makeRotateFromQuat( quat, arcs[ 2 ].getMatrix() );
                // z arc
                Quat.makeRotate( Math.atan2( -eye[ 0 ], eye[ 1 ] ), 0.0, 0.0, 1.0, quat );
                Matrix.makeRotateFromQuat( quat, arcs[ 3 ].getMatrix() );

                arcs[ 1 ].dirtyBound();
                arcs[ 2 ].dirtyBound();
                arcs[ 3 ].dirtyBound();
            };
        } )(),
        getTransformType: function ( node ) {
            var n = node;
            while ( n.parents.length > 0 ) {
                if ( n.referenceFrame !== undefined && n.referenceFrame === TransformEnums.ABSOLUTE_RF )
                    return TransformEnums.ABSOLUTE_RF;
                n = n.parents[ 0 ];
            }
            return TransformEnums.RELATIVE_RF;
        },
        updateGizmo: ( function () {
            var eye = Vec3.create();
            var trVec = Vec3.create();
            var tmpVec = Vec3.create();

            var temp = Matrix.create();
            var trWorld = Matrix.create();
            var invScale = Matrix.create();
            var scGiz = Matrix.create();

            return function () {
                if ( !this._attachedNode )
                    return;
                var ttype = this.getTransformType( this._attachedNode );
                this.setReferenceFrame( ttype );
                this.setCullingActive( ttype === TransformEnums.RELATIVE_RF );
                var worldMat = this._attachedNode.getWorldMatrices()[ 0 ];

                // world trans
                Matrix.getTrans( worldMat, trVec );
                Matrix.makeTranslate( trVec[ 0 ], trVec[ 1 ], trVec[ 2 ], trWorld );

                // normalize gizmo size
                var scaleFactor = 3.0;
                if ( ttype === TransformEnums.ABSOLUTE_RF ) {
                    eye[ 0 ] = eye[ 1 ] = eye[ 2 ] = 0.0;
                    tmpVec[ 0 ] = tmpVec[ 1 ] = tmpVec[ 2 ] = 1.0;
                } else {
                    var scaleFov = Matrix.getScale( this._viewer.getCamera().getProjectionMatrix(), tmpVec )[ 0 ];
                    this._manipulator.getEyePosition( eye );
                    scaleFactor = Vec3.distance( eye, trVec ) / ( 10 * scaleFov );
                }
                Matrix.makeScale( scaleFactor, scaleFactor, scaleFactor, scGiz );

                // gizmo node
                Matrix.mult( trWorld, scGiz, this.getMatrix() );

                Vec3.sub( eye, trVec, eye );
                Vec3.normalize( eye, eye );

                // rotate node
                if ( this._rotateInLocal ) {
                    // world scale
                    Matrix.getScale( worldMat, tmpVec );
                    Matrix.makeScale( tmpVec[ 0 ], tmpVec[ 1 ], tmpVec[ 2 ], invScale );
                    Matrix.inverse( invScale, invScale );

                    Matrix.mult( worldMat, invScale, temp );
                    temp[ 12 ] = temp[ 13 ] = temp[ 14 ] = 0.0;
                    Matrix.copy( temp, this._rotateNode.getMatrix() );
                    Matrix.inverse( temp, temp );
                    Matrix.transformVec3( temp, eye, eye );
                } else {
                    Matrix.makeIdentity( this._rotateNode.getMatrix() );
                }

                this.updateArcRotation( eye );

                this._rotateNode.dirtyBound();
                this._translateNode.dirtyBound();
                this._planeNode.dirtyBound();

                if ( this._isEditing )
                    Matrix.copy( this._hoverNode.getMatrix(), this._showAngle.getMatrix() );
            };
        } )(),
        computeNearestIntersection: ( function () {
            var sortByRatio = function ( a, b ) {
                return a.ratio - b.ratio;
            };
            var coord = Vec2.create();

            return function ( e, tmask ) {
                getCanvasCoord( coord, e );

                // canvas to webgl coord
                var canvas = this._canvas;
                var x = coord[ 0 ] * ( canvas.width / canvas.clientWidth );
                var y = ( canvas.clientHeight - coord[ 1 ] ) * ( canvas.height / canvas.clientHeight );

                var hits = this._viewer.computeIntersections( x, y, tmask );

                if ( hits.length === 0 )
                    return undefined;

                hits.sort( sortByRatio );
                return hits[ 0 ];
            };
        } )(),
        setOnlyGizmoPicking: function () {
            // enable picking only for the gizmo
            this._viewer.getCamera().addChild( this );
            this._viewer.getSceneData().setNodeMask( 0x0 );
            this.setNodeMask( ~0x0 );
        },
        setOnlyScenePicking: function () {
            this._viewer.getCamera().removeChild( this );
            this._viewer.getSceneData().setNodeMask( ~0x0 );
            this.setNodeMask( NodeGizmo.NO_PICK );
        },
        pickGizmo: function ( e, tmask ) {
            this.setOnlyGizmoPicking();
            var hit = this.computeNearestIntersection( e, tmask );
            this.setOnlyScenePicking();
            return hit;
        },
        getCanvasPositionFromWorldPoint: function ( worldPoint, out ) {
            var cam = this._viewer.getCamera();
            var mat = Matrix.create();
            Matrix.preMult( mat, cam.getViewport() ? cam.getViewport().computeWindowMatrix() : Matrix.create() );
            Matrix.preMult( mat, cam.getProjectionMatrix() );
            if ( this.getReferenceFrame() === TransformEnums.RELATIVE_RF )
                Matrix.preMult( mat, cam.getViewMatrix() );

            var screenPoint = out || Vec3.create();
            Matrix.transformVec3( mat, worldPoint, screenPoint );

            // canvas to webgl coord
            var canvas = this._canvas;
            out[ 0 ] = out[ 0 ] / ( canvas.width / canvas.clientWidth );
            out[ 1 ] = canvas.clientHeight - out[ 1 ] / ( canvas.height / canvas.clientHeight );
            return out;
        },
        onMouseDown: function ( e ) {
            getCanvasCoord( this._downCanvasCoord, e );
            if ( !this._hoverNode || !this._attachedNode )
                return;
            this._viewer._eventProxy.StandardMouseKeyboard._enable = false;

            this.saveEditMatrices();
            var nm = this._hoverNode.getParents()[ 0 ].getNodeMask();
            this._isEditing = true;

            if ( nm & NodeGizmo.PICK_ARC ) {
                this._translateNode.setNodeMask( 0x0 );
                this._planeNode.setNodeMask( 0x0 );
                this.startRotateEdit( e );
            } else if ( nm & NodeGizmo.PICK_ARROW ) {
                this._rotateNode.setNodeMask( 0x0 );
                this._planeNode.setNodeMask( 0x0 );
                this.startTranslateEdit( e );
            } else if ( nm & NodeGizmo.PICK_PLANE ) {
                this._rotateNode.setNodeMask( 0x0 );
                this._translateNode.setNodeMask( 0x0 );
                this.startPlaneEdit( e );
            }
        },
        saveEditMatrices: function () {
            Matrix.copy( this._attachedNode.getMatrix(), this._editLocal );
            // save the world translation
            var wm = this._attachedNode.getWorldMatrices()[ 0 ];
            Matrix.makeTranslate( wm[ 12 ], wm[ 13 ], wm[ 14 ], this._editWorldTrans );
            // save the inv of world rotation + scale
            Matrix.copy( wm, this._editWorldScaleRot );
            // removes translation
            this._editWorldScaleRot[ 12 ] = this._editWorldScaleRot[ 13 ] = this._editWorldScaleRot[ 14 ] = 0.0;
            Matrix.inverse( this._editWorldScaleRot, this._editInvWorldScaleRot );
        },
        startRotateEdit: function ( e ) {
            var gizmoMat = this._rotateNode.getWorldMatrices()[ 0 ];

            // center of gizmo on screen
            var projCenter = Vec3.create();
            Matrix.transformVec3( gizmoMat, projCenter, projCenter );
            this.getCanvasPositionFromWorldPoint( projCenter, projCenter );

            // pick rotate gizmo
            var hit = this.pickGizmo( e, this._hoverNode.getNodeMask() | NodeGizmo.PICK_ARC );
            if ( !hit ) return;
            // compute tangent direction
            var sign = this._hoverNode._nbAxis === 0 ? -1.0 : 1.0;
            var tang = Vec3.create();
            tang[ 0 ] = sign * hit.point[ 1 ];
            tang[ 1 ] = -sign * hit.point[ 0 ];
            tang[ 2 ] = hit.point[ 2 ];

            // project tangent on screen
            var projArc = Vec3.create();
            Matrix.transformVec3( this._hoverNode.getMatrix(), tang, projArc );
            Matrix.transformVec3( gizmoMat, projArc, projArc );
            this.getCanvasPositionFromWorldPoint( projArc, projArc );

            var dir = this._editLineDirection;
            Vec2.sub( projArc, projCenter, dir );
            Vec2.normalize( dir, dir );

            // show angle
            this._showAngle.setNodeMask( NodeGizmo.NO_PICK );
            hit.point[ 2 ] = 0.0;
            var stateAngle = this._showAngle.getStateSet();
            stateAngle.getUniform( 'uAngle' ).set( 0.0 );
            stateAngle.getUniform( 'uBase' ).set( Vec3.normalize( hit.point, hit.point ) );

            getCanvasCoord( this._editLineOrigin, e );
        },
        startTranslateEdit: function ( e ) {
            var origin = this._editLineOrigin;
            var dir = this._editLineDirection;

            // 3d origin (center of gizmo)
            var gizmoMat = this._translateNode.getWorldMatrices()[ 0 ];
            Matrix.getTrans( gizmoMat, origin );

            // 3d direction
            Vec3.init( dir );
            dir[ this._hoverNode._nbAxis ] = 1.0;
            Vec3.add( origin, dir, dir );

            // project on canvas
            this.getCanvasPositionFromWorldPoint( origin, origin );
            this.getCanvasPositionFromWorldPoint( dir, dir );

            Vec2.sub( dir, origin, dir );
            Vec2.normalize( dir, dir );

            var offset = this._editOffset;
            getCanvasCoord( offset, e );
            Vec2.sub( offset, origin, offset );
        },
        startPlaneEdit: function ( e ) {
            var origin = this._editLineOrigin; // just used to determine the 2d offset

            // 3d origin (center of gizmo)
            var gizmoMat = this._planeNode.getWorldMatrices()[ 0 ];
            Matrix.getTrans( gizmoMat, origin );

            // project on canvas
            this.getCanvasPositionFromWorldPoint( origin, origin );

            var offset = this._editOffset;
            getCanvasCoord( offset, e );
            Vec2.sub( offset, origin, offset );
        },
        drawLineCanvasDebug: function ( x1, y1, x2, y2 ) {
            this._debugNode.setNodeMask( NodeGizmo.NO_PICK );
            var buffer = this._debugNode.getChildren()[ 0 ].getAttributes().Vertex;
            buffer.getElements()[ 0 ] = ( ( x1 / this._canvas.clientWidth ) * 2 ) - 1.0;
            buffer.getElements()[ 1 ] = ( ( ( this._canvas.clientHeight - y1 ) / this._canvas.clientHeight ) ) * 2 - 1.0;
            buffer.getElements()[ 2 ] = ( ( x2 / this._canvas.clientWidth ) * 2 ) - 1.0;
            buffer.getElements()[ 3 ] = ( ( ( this._canvas.clientHeight - y2 ) / this._canvas.clientHeight ) ) * 2 - 1.0;
            buffer.dirty();
        },
        pickAndSelect: function ( e ) {
            this.setNodeMask( 0x0 );
            var hit = this.computeNearestIntersection( e, this._tmask );
            if ( this._autoInsertMT )
                this.attachToGeometry( hit ? hit.nodepath[ hit.nodepath.length - 1 ] : hit );
            else
                this.attachToNodePath( hit ? hit.nodepath : hit );
        },
        onMouseUp: function ( e ) {
            var smk = this._viewer._eventProxy.StandardMouseKeyboard;
            if ( smk._enable === false ) {
                smk._enable = true;
                this._viewer._eventProxy.StandardMouseKeyboard.mouseup( e );
            }
            if ( this._debugNode )
                this._debugNode.setNodeMask( 0x0 );

            var v = Vec2.create();
            getCanvasCoord( v, e );
            if ( Vec2.distance( this._downCanvasCoord, v ) === 0.0 )
                this.pickAndSelect( e );

            this._showAngle.setNodeMask( 0x0 );
            this._isEditing = false;
            if ( !this._hoverNode )
                return;
            this.updateGizmoMask();
        },
        onMouseMove: function ( e ) {
            if ( !this._attachedNode )
                return;
            var hit;
            if ( this._isEditing === false ) {
                hit = this.pickGizmo( e, NodeGizmo.PICK_XYZ | NodeGizmo.PICK_GIZMO );
                this.onNodeHovered( hit );
                return;
            }
            if ( !this._hoverNode )
                return;
            var par = this._hoverNode.getParents()[ 0 ];
            if ( par === this._rotateNode )
                this.updateRotateEdit( e );
            else if ( par === this._translateNode )
                this.updateTranslateEdit( e );
            else if ( par === this._planeNode )
                this.updatePlaneEdit( e );
        },
        updateRotateEdit: ( function () {
            var mrot = Matrix.create();
            var vec = Vec2.create();

            return function ( e ) {

                var origin = this._editLineOrigin;
                var dir = this._editLineDirection;

                getCanvasCoord( vec, e );
                Vec2.sub( vec, origin, vec );
                var dist = Vec2.dot( vec, dir );

                if ( this._debugNode )
                    this.drawLineCanvasDebug( origin[ 0 ], origin[ 1 ], origin[ 0 ] + dir[ 0 ] * dist, origin[ 1 ] + dir[ 1 ] * dist );

                var angle = 7 * dist / Math.min( this._canvas.clientWidth, this._canvas.clientHeight );
                angle %= ( Math.PI * 2 );
                var nbAxis = this._hoverNode._nbAxis;
                if ( nbAxis === 0 )
                    Matrix.makeRotate( -angle, 1.0, 0.0, 0.0, mrot );
                else if ( nbAxis === 1 )
                    Matrix.makeRotate( -angle, 0.0, 1.0, 0.0, mrot );
                else if ( nbAxis === 2 )
                    Matrix.makeRotate( -angle, 0.0, 0.0, 1.0, mrot );

                this._showAngle.getOrCreateStateSet().getUniform( 'uAngle' ).set( nbAxis === 0 ? -angle : angle );

                if ( !this._rotateInLocal ) {
                    Matrix.postMult( this._editInvWorldScaleRot, mrot );
                    Matrix.preMult( mrot, this._editWorldScaleRot );
                }

                Matrix.mult( this._editLocal, mrot, this._attachedNode.getMatrix() );

                this._attachedNode.dirtyBound();
            };
        } )(),
        updateTranslateEdit: ( function () {
            var vec = Vec2.create();
            var tra = Vec2.create();

            return function ( e ) {

                var origin = this._editLineOrigin;
                var dir = this._editLineDirection;

                getCanvasCoord( vec, e );
                Vec2.sub( vec, origin, vec );
                Vec2.sub( vec, this._editOffset, vec );

                var dist = Vec2.dot( vec, dir );
                vec[ 0 ] = origin[ 0 ] + dir[ 0 ] * dist;
                vec[ 1 ] = origin[ 1 ] + dir[ 1 ] * dist;

                if ( this._debugNode )
                    this.drawLineCanvasDebug( origin[ 0 ], origin[ 1 ], vec[ 0 ], vec[ 1 ] );

                // canvas to webgl coord
                var canvas = this._canvas;
                var coordx = vec[ 0 ] * ( canvas.width / canvas.clientWidth );
                var coordy = ( canvas.clientHeight - vec[ 1 ] ) * ( canvas.height / canvas.clientHeight );

                // project 2D point on the 3d line
                var lsi = new LineCustomIntersector();
                lsi.set( [ coordx, coordy, 0.0 ], [ coordx, coordy, 1.0 ] );
                var iv = new IntersectionVisitor();
                iv.setTraversalMask( this._hoverNode.getNodeMask() | NodeGizmo.PICK_ARROW );
                iv.setIntersector( lsi );

                Matrix.copy( this._editWorldTrans, this.getMatrix() );

                this.setOnlyGizmoPicking();
                this._viewer._camera.accept( iv );
                this.setOnlyScenePicking();

                Matrix.transformVec3( this._editInvWorldScaleRot, lsi._inter, tra );
                Matrix.multTranslate( this._editLocal, tra, this._attachedNode.getMatrix() );

                this._attachedNode.dirtyBound();
            };
        } )(),
        updatePlaneEdit: function ( e ) {
            var vec = Vec3.create();
            getCanvasCoord( vec, e );
            Vec2.sub( vec, this._editOffset, vec );

            // canvas to webgl coord
            var canvas = this._canvas;
            var coordx = vec[ 0 ] * ( canvas.width / canvas.clientWidth );
            var coordy = ( canvas.clientHeight - vec[ 1 ] ) * ( canvas.height / canvas.clientHeight );

            // project 2D point on the 3d plane
            var lsi = new LineCustomIntersector( true );
            lsi.set( [ coordx, coordy, 0.0 ], [ coordx, coordy, 1.0 ] );
            var iv = new IntersectionVisitor();
            iv.setTraversalMask( this._hoverNode.getNodeMask() | NodeGizmo.PICK_PLANE );
            iv.setIntersector( lsi );

            Matrix.copy( this._editWorldTrans, this.getMatrix() );

            this.setOnlyGizmoPicking();
            this._viewer._camera.accept( iv );
            this.setOnlyScenePicking();

            Matrix.transformVec3( this._editInvWorldScaleRot, lsi._inter, vec );
            Matrix.multTranslate( this._editLocal, vec, this._attachedNode.getMatrix() );

            this._attachedNode.dirtyBound();
        }
    } );

    return NodeGizmo;
} );
