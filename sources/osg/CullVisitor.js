define( [
    'osg/Notify',
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/CullSettings',
    'osg/CullStack',
    'osg/Matrix',
    'osg/MatrixTransform',
    'osg/Projection',
    'osg/LightSource',
    'osg/Geometry',
    'osg/RenderLeaf',
    'osg/RenderStage',
    'osg/Node',
    'osg/Lod',
    'osg/PagedLOD',
    'osgShadow/ShadowedScene',
    'osg/Camera',
    'osg/TransformEnums',
    'osg/Vec4',
    'osg/Vec3',
    'osg/ComputeMatrixFromNodePath'

], function ( Notify, MACROUTILS, NodeVisitor, CullSettings, CullStack, Matrix, MatrixTransform, Projection, LightSource, Geometry, RenderLeaf, RenderStage, Node, Lod, PagedLOD, ShadowedScene, Camera, TransformEnums, Vec4, Vec3, ComputeMatrixFromNodePath ) {

    /**
     * CullVisitor traverse the tree and collect Matrix/State for the rendering traverse
     * @class CullVisitor
     */
    var CullVisitor = function () {
        NodeVisitor.call( this, NodeVisitor.TRAVERSE_ACTIVE_CHILDREN );
        CullSettings.call( this );
        CullStack.call( this );

        this._rootStateGraph = undefined;
        this._currentStateGraph = undefined;
        this._currentRenderBin = undefined;
        this._currentRenderStage = undefined;
        this._rootRenderStage = undefined;
        this._frustum = [ Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create() ];
        this._computedNear = Number.POSITIVE_INFINITY;
        this._computedFar = Number.NEGATIVE_INFINITY;
        this._enableFrustumCulling = false;
        var lookVector = [ 0.0, 0.0, -1.0 ];
        this._camera = undefined;
        /*jshint bitwise: false */
        this._bbCornerFar = ( lookVector[ 0 ] >= 0 ? 1 : 0 ) | ( lookVector[ 1 ] >= 0 ? 2 : 0 ) | ( lookVector[ 2 ] >= 0 ? 4 : 0 );
        this._bbCornerNear = ( ~this._bbCornerFar ) & 7;
        /*jshint bitwise: true */

        this._reserveLeafStack = [ new RenderLeaf() ];
        this._reserveLeafStack.current = 0;

        this._renderBinStack = [];
        this.visitorType = NodeVisitor.CULL_VISITOR;

        this._identityMatrix = Matrix.create();
    };

    /** @lends CullVisitor.prototype */
    CullVisitor.prototype = MACROUTILS.objectInehrit( CullStack.prototype, MACROUTILS.objectInehrit( CullSettings.prototype, MACROUTILS.objectInehrit( NodeVisitor.prototype, {
        distance: function ( coord, matrix ) {
            return -( coord[ 0 ] * matrix[ 2 ] + coord[ 1 ] * matrix[ 6 ] + coord[ 2 ] * matrix[ 10 ] + matrix[ 14 ] );
        },

        handleCullCallbacksAndTraverse: function ( node ) {
            var ccb = node.getCullCallback();
            if ( ccb ) {
                if ( !ccb.cull( node, this ) ) {
                    return;
                }
            }
            this.traverse( node );
        },
        setCamera: function ( camera ) {
            this._camera = camera;
        },
        getCurrentCamera: function () {
            return this._camera;
        },
        updateCalculatedNearFar: function ( matrix, drawable ) {

            var bb = drawable.getBoundingBox();
            var dNear, dFar;

            // efficient computation of near and far, only taking into account the nearest and furthest
            // corners of the bounding box.
            dNear = this.distance( bb.corner( this._bbCornerNear ), matrix );
            dFar = this.distance( bb.corner( this._bbCornerFar ), matrix );

            if ( dNear > dFar ) {
                var tmp = dNear;
                dNear = dFar;
                dFar = tmp;
            }

            if ( dFar < 0.0 ) {
                // whole object behind the eye point so discard
                return false;
            }

            if ( dNear < this._computedNear ) {
                this._computedNear = dNear;
            }

            if ( dFar > this._computedFar ) {
                this._computedFar = dFar;
            }

            return true;
        },

        clampProjectionMatrix: function ( projection, znear, zfar, nearFarRatio, resultNearFar ) {
            var epsilon = 1e-6;
            if ( zfar < znear - epsilon ) {
                Notify.log( 'clampProjectionMatrix not applied, invalid depth range, znear = ' + znear + '  zfar = ' + zfar );
                return false;
            }

            var desiredZnear, desiredZfar;
            if ( zfar < znear + epsilon ) {
                // znear and zfar are too close together and could cause divide by zero problems
                // late on in the clamping code, so move the znear and zfar apart.
                var average = ( znear + zfar ) * 0.5;
                znear = average - epsilon;
                zfar = average + epsilon;
                // OSG_INFO << '_clampProjectionMatrix widening znear and zfar to '<<znear<<' '<<zfar<<std::endl;
            }

            if ( Math.abs( Matrix.get( projection, 0, 3 ) ) < epsilon &&
                Math.abs( Matrix.get( projection, 1, 3 ) ) < epsilon &&
                Math.abs( Matrix.get( projection, 2, 3 ) ) < epsilon ) {
                // OSG_INFO << 'Orthographic matrix before clamping'<<projection<<std::endl;

                var deltaSpan = ( zfar - znear ) * 0.02;
                if ( deltaSpan < 1.0 ) {
                    deltaSpan = 1.0;
                }
                desiredZnear = znear - deltaSpan;
                desiredZfar = zfar + deltaSpan;

                // assign the clamped values back to the computed values.
                znear = desiredZnear;
                zfar = desiredZfar;

                Matrix.set( projection, 2, 2, -2.0 / ( desiredZfar - desiredZnear ) );
                Matrix.set( projection, 3, 2, -( desiredZfar + desiredZnear ) / ( desiredZfar - desiredZnear ) );

                // OSG_INFO << 'Orthographic matrix after clamping '<<projection<<std::endl;
            } else {

                // OSG_INFO << 'Persepective matrix before clamping'<<projection<<std::endl;
                //std::cout << '_computed_znear'<<_computed_znear<<std::endl;
                //std::cout << '_computed_zfar'<<_computed_zfar<<std::endl;

                var zfarPushRatio = 1.02;
                var znearPullRatio = 0.98;

                //znearPullRatio = 0.99;

                desiredZnear = znear * znearPullRatio;
                desiredZfar = zfar * zfarPushRatio;

                // near plane clamping.
                var minNearPlane = zfar * nearFarRatio;
                if ( desiredZnear < minNearPlane ) {
                    desiredZnear = minNearPlane;
                }

                // assign the clamped values back to the computed values.
                znear = desiredZnear;
                zfar = desiredZfar;

                var m22 = Matrix.get( projection, 2, 2 );
                var m32 = Matrix.get( projection, 3, 2 );
                var m23 = Matrix.get( projection, 2, 3 );
                var m33 = Matrix.get( projection, 3, 3 );
                var transNearPlane = ( -desiredZnear * m22 + m32 ) / ( -desiredZnear * m23 + m33 );
                var transFarPlane = ( -desiredZfar * m22 + m32 ) / ( -desiredZfar * m23 + m33 );

                var ratio = Math.abs( 2.0 / ( transNearPlane - transFarPlane ) );
                var center = -( transNearPlane + transFarPlane ) / 2.0;

                var matrix = [ 1.0, 0.0, 0.0, 0.0,
                    0.0, 1.0, 0.0, 0.0,
                    0.0, 0.0, ratio, 0.0,
                    0.0, 0.0, center * ratio, 1.0
                ];
                Matrix.postMult( matrix, projection );
                // OSG_INFO << 'Persepective matrix after clamping'<<projection<<std::endl;
            }
            if ( resultNearFar !== undefined ) {
                resultNearFar[ 0 ] = znear;
                resultNearFar[ 1 ] = zfar;
            }
            return true;
        },

        setStateGraph: function ( sg ) {
            this._rootStateGraph = sg;
            this._currentStateGraph = sg;
        },
        setRenderStage: function ( rg ) {
            this._rootRenderStage = rg;
            this._currentRenderBin = rg;
        },
        reset: function () {
            CullStack.prototype.reset.call( this );
            // Reset the stack before reseting the current leaf index.
            // Reseting elements and refilling them later is faster than create new elements
            // That's the reason to have a leafStack, see http://jsperf.com/refill/2
            this.resetRenderLeafStack();
            this._reserveLeafStack.current = 0;

            this._computedNear = Number.POSITIVE_INFINITY;
            this._computedFar = Number.NEGATIVE_INFINITY;
        },

        getCurrentRenderBin: function () {
            return this._currentRenderBin;
        },

        setCurrentRenderBin: function ( rb ) {
            this._currentRenderBin = rb;
        },

        // mimic the osg implementation
        // in osg you can push 0, in this case an identity matrix will be loaded
        addPositionedAttribute: function ( matrix, attribute ) {

            var m = matrix ? matrix : this._identityMatrix;
            this._currentRenderBin.getStage().positionedAttribute.push( [ m, attribute ] );

        },

        pushStateSet: function ( stateset ) {
            this._currentStateGraph = this._currentStateGraph.findOrInsert( stateset );
            if ( stateset.getBinName() !== undefined ) {
                var renderBinStack = this._renderBinStack;
                var currentRenderBin = this._currentRenderBin;
                renderBinStack.push( currentRenderBin );
                this._currentRenderBin = currentRenderBin.getStage().findOrInsert( stateset.getBinNumber(), stateset.getBinName() );
            }
        },

        /** Pop the top state set and hence associated state group.
         * Move the current state group to the parent of the popped
         * state group.
         */
        popStateSet: function () {
            var currentStateGraph = this._currentStateGraph;
            var stateset = currentStateGraph.getStateSet();
            this._currentStateGraph = currentStateGraph.parent;
            if ( stateset.getBinName() !== undefined ) {
                var renderBinStack = this._renderBinStack;
                if ( renderBinStack.length === 0 ) {
                    this._currentRenderBin = this._currentRenderBin.getStage();
                } else {
                    this._currentRenderBin = renderBinStack.pop();
                }
            }
        },

        popProjectionMatrix: function () {
            if ( this._computeNearFar === true && this._computedFar >= this._computedNear ) {
                var m = this.getCurrentProjectionMatrix();
                this.clampProjectionMatrix( m, this._computedNear, this._computedFar, this._nearFarRatio );
            }
            CullStack.prototype.popProjectionMatrix.call( this );
        },

        apply: function ( node ) {
            this[ node.typeID ].call( this, node );
        },

        createOrReuseRenderLeaf: function () {
            var l = this._reserveLeafStack[ this._reserveLeafStack.current++ ];
            if ( this._reserveLeafStack.current === this._reserveLeafStack.length ) {
                this._reserveLeafStack.push( new RenderLeaf() );
            }
            return l;
        },

        resetRenderLeafStack: function () {
            for ( var i = 0, j = this._reserveLeafStack.current; i <= j; i++ ) {
                this._reserveLeafStack[ i ].reset();
            }
        },

        initFrustrumPlanes: ( function() {

            var mvp = Matrix.create();

            return function ( camera ) {
                if ( this._enableFrustumCulling === true ) {
                    Matrix.mult( camera.getProjectionMatrix(), camera.getViewMatrix(), mvp );
                    this.getFrustumPlanes( mvp, this._frustum );
                }
            };
        })(),

        setEnableFrustumCulling: function ( value ) {
            this._enableFrustumCulling = value;
        },

        getFrustumPlanes: ( function () {

            var right = Vec4.create();
            var left = Vec4.create();
            var bottom = Vec4.create();
            var top = Vec4.create();
            var far = Vec4.create();
            var near = Vec4.create();

            return function ( matrix, result, withNearFar, normalize ) {
                if ( withNearFar === undefined )
                    withNearFar = false;
                // Right clipping plane.
                right[ 0 ] = matrix[ 3 ] - matrix[ 0 ];
                right[ 1 ] = matrix[ 7 ] - matrix[ 4 ];
                right[ 2 ] = matrix[ 11 ] - matrix[ 8 ];
                right[ 3 ] = matrix[ 15 ] - matrix[ 12 ];
                result[ 0 ] = right;
                // Left clipping plane.
                left[ 0 ] = matrix[ 3 ] + matrix[ 0 ];
                left[ 1 ] = matrix[ 7 ] + matrix[ 4 ];
                left[ 2 ] = matrix[ 11 ] + matrix[ 8 ];
                left[ 3 ] = matrix[ 15 ] + matrix[ 12 ];
                result[ 1 ] = left;
                // Bottom clipping plane.
                bottom[ 0 ] = matrix[ 3 ] + matrix[ 1 ];
                bottom[ 1 ] = matrix[ 7 ] + matrix[ 5 ];
                bottom[ 2 ] = matrix[ 11 ] + matrix[ 9 ];
                bottom[ 3 ] = matrix[ 15 ] + matrix[ 13 ];
                result[ 2 ] = bottom;
                // Top clipping plane.
                top[ 0 ] = matrix[ 3 ] - matrix[ 1 ];
                top[ 1 ] = matrix[ 7 ] - matrix[ 5 ];
                top[ 2 ] = matrix[ 11 ] - matrix[ 9 ];
                top[ 3 ] = matrix[ 15 ] - matrix[ 13 ];
                result[ 3 ] = top;

                if ( withNearFar ) {
                    // Far clipping plane.
                    far[ 0 ] = matrix[ 3 ] - matrix[ 2 ];
                    far[ 1 ] = matrix[ 7 ] - matrix[ 6 ];
                    far[ 2 ] = matrix[ 11 ] - matrix[ 10 ];
                    far[ 3 ] = matrix[ 15 ] - matrix[ 14 ];
                    result[ 4 ] = far;
                    // Near clipping plane.
                    near[ 0 ] = matrix[ 3 ] + matrix[ 2 ];
                    near[ 1 ] = matrix[ 7 ] + matrix[ 6 ];
                    near[ 2 ] = matrix[ 11 ] + matrix[ 10 ];
                    near[ 3 ] = matrix[ 15 ] + matrix[ 14 ];
                    result[ 5 ] = near;
                }
                if ( normalize === undefined || normalize ) {
                    //Normalize the planes
                    var j = withNearFar ? 6 : 4;
                    for ( var i = 0; i < j; i++ ) {
                        var norm = result[ i ][ 0 ] * result[ i ][ 0 ] + result[ i ][ 1 ] * result[ i ][ 1 ] + result[ i ][ 2 ] * result[ i ][ 2 ];
                        var inv = 1.0 / Math.sqrt( norm );
                        result[ i ][ 0 ] = result[ i ][ 0 ] * inv;
                        result[ i ][ 1 ] = result[ i ][ 1 ] * inv;
                        result[ i ][ 2 ] = result[ i ][ 2 ] * inv;
                        result[ i ][ 3 ] = result[ i ][ 3 ] * inv;
                    }
                }
            };
        } )(),
        isCulled: ( function () {
            var position = Vec3.create();
            var scaleVec = Vec3.create();
            return function ( node ) {
                var pos = node.getBound().center();
                Vec3.copy( pos, position );
                var m = ComputeMatrixFromNodePath.computeLocalToWorld( this.nodePath );
                scaleVec = Matrix.getScale2( m, scaleVec );
                var scale = Math.sqrt( Math.max( Math.max( scaleVec[ 0 ], scaleVec[ 1 ] ), scaleVec[ 2 ] ) );
                var radius = -node.getBound().radius() * scale;
                Matrix.transformVec3( m, position, position );
                var d;
                for ( var i = 0, j = this._frustum.length; i < j; i++ ) {
                    d = this._frustum[ i ][ 0 ] * position[ 0 ] + this._frustum[ i ][ 1 ] * position[ 1 ] + this._frustum[ i ][ 2 ] * position[ 2 ] + this._frustum[ i ][ 3 ];
                    if ( d <= radius ) {
                        return true;
                    }
                }
                return false;
            };
        } )()
    } ) ) );

    CullVisitor.prototype[ Camera.typeID ] = function ( camera ) {

        var stateset = camera.getStateSet();
        if ( stateset ) {
            this.pushStateSet( stateset );
        }

        if ( camera.light ) {
            this.addPositionedAttribute( this.getCurrentModelViewMatrix(), camera.light );
        }

        var modelview = this._getReservedMatrix();
        var projection = this._getReservedMatrix();

        if ( camera.getReferenceFrame() === TransformEnums.RELATIVE_RF ) {

            var lastProjectionMatrix = this.getCurrentProjectionMatrix();
            Matrix.mult( lastProjectionMatrix, camera.getProjectionMatrix(), projection );

            var lastViewMatrix = this.getCurrentModelViewMatrix();
            Matrix.mult( lastViewMatrix, camera.getViewMatrix(), modelview );

        } else {

            // absolute
            Matrix.copy( camera.getViewMatrix(), modelview );
            Matrix.copy( camera.getProjectionMatrix(), projection );

        }

        this.pushProjectionMatrix( projection );
        this.pushModelViewMatrix( modelview );


        if ( camera.getViewport() ) {
            this.pushViewport( camera.getViewport() );
        }

        // save current state of the camera
        var previousZnear = this._computedNear;
        var previousZfar = this._computedFar;
        var previousCullsettings = new CullSettings();
        previousCullsettings.setCullSettings( this );

        this._computedNear = Number.POSITIVE_INFINITY;
        this._computedFar = Number.NEGATIVE_INFINITY;
        this.setCullSettings( camera );

        // nested camera
        if ( camera.getRenderOrder() === Camera.NESTED_RENDER ) {

            this.handleCullCallbacksAndTraverse( camera );

        } else {
            // not tested

            var previousStage = this.getCurrentRenderBin().getStage();

            // use render to texture stage
            var rtts = new RenderStage();
            rtts.setCamera( camera );
            rtts.setClearDepth( camera.getClearDepth() );
            rtts.setClearColor( camera.getClearColor() );

            rtts.setClearMask( camera.getClearMask() );

            var vp;
            if ( camera.getViewport() === undefined ) {
                vp = previousStage.getViewport();
            } else {
                vp = camera.getViewport();
            }
            rtts.setViewport( vp );

            // skip positional state for now
            // ...

            var previousRenderBin = this.getCurrentRenderBin();

            this.setCurrentRenderBin( rtts );

            this.handleCullCallbacksAndTraverse( camera );

            this.setCurrentRenderBin( previousRenderBin );

            if ( camera.getRenderOrder() === Camera.PRE_RENDER ) {
                this.getCurrentRenderBin().getStage().addPreRenderStage( rtts, camera.renderOrderNum );
            } else {
                this.getCurrentRenderBin().getStage().addPostRenderStage( rtts, camera.renderOrderNum );
            }
        }

        this.popModelViewMatrix();
        this.popProjectionMatrix();

        if ( camera.getViewport() ) {
            this.popViewport();
        }

        // restore previous state of the camera
        this.setCullSettings( previousCullsettings );
        this._computedNear = previousZnear;
        this._computedFar = previousZfar;

        if ( stateset ) {
            this.popStateSet();
        }

    };


    CullVisitor.prototype[ MatrixTransform.typeID ] = function ( node ) {

        var matrix = this._getReservedMatrix();

        if ( node.getReferenceFrame() === TransformEnums.RELATIVE_RF ) {

            var lastMatrixStack = this.getCurrentModelViewMatrix();
            Matrix.mult( lastMatrixStack, node.getMatrix(), matrix );

        } else {
            // absolute
            Matrix.copy( node.getMatrix(), matrix );
        }
        this.pushModelViewMatrix( matrix );

        var stateset = node.getStateSet();
        if ( stateset ) {
            this.pushStateSet( stateset );
        }

        if ( node.light ) {
            this.addPositionedAttribute( this.getCurrentModelViewMatrix(), node.light );
        }

        this.handleCullCallbacksAndTraverse( node );

        if ( stateset ) {
            this.popStateSet();
        }

        this.popModelViewMatrix();

    };

    CullVisitor.prototype[ Projection.typeID ] = function ( node ) {
        var lastMatrixStack = this.getCurrentProjectionMatrix();
        var matrix = this._getReservedMatrix();
        Matrix.mult( lastMatrixStack, node.getProjectionMatrix(), matrix );
        this.pushProjectionMatrix( matrix );

        var stateset = node.getStateSet();

        if ( stateset ) {
            this.pushStateSet( stateset );
        }

        this.handleCullCallbacksAndTraverse( node );

        if ( stateset ) {
            this.popStateSet();
        }

        this.popProjectionMatrix();
    };

    CullVisitor.prototype[ Node.typeID ] = function ( node ) {

        // We need the frame stamp > 0 to do the frustum culling, otherwise the projection matrix is not correct
        // Camera and lights must enlarge node parent bounding boxes for this not to cull
        // camera/lights/shadows
        if ( this._enableFrustumCulling === true && node.isCullingActive() && this.getFrameStamp().getFrameNumber() !== 0 && this.isCulled( node ) ) return;

        var stateset = node.getStateSet();
        if ( stateset ) {
            this.pushStateSet( stateset );
        }
        if ( node.light ) {
            this.addPositionedAttribute( this.getCurrentModelViewMatrix(), node.light );
        }

        this.handleCullCallbacksAndTraverse( node );

        if ( stateset ) {
            this.popStateSet();
        }
    };

    // same code like Node
    CullVisitor.prototype[ Lod.typeID ] = CullVisitor.prototype[ Node.typeID ];

    // same code like Node
    CullVisitor.prototype[ PagedLOD.typeID ] = CullVisitor.prototype[ Node.typeID ];

    // same code like Node
    CullVisitor.prototype[ ShadowedScene.typeID ] = CullVisitor.prototype[ Node.typeID ];

    CullVisitor.prototype[ LightSource.typeID ] = function ( node ) {

        var stateset = node.getStateSet();
        if ( stateset ) {
            this.pushStateSet( stateset );
        }

        var light = node.getLight();
        if ( light ) {
            this.addPositionedAttribute( this.getCurrentModelViewMatrix(), light );
        }

        this.handleCullCallbacksAndTraverse( node );

        if ( stateset ) {
            this.popStateSet();
        }
    };

    CullVisitor.prototype[ Geometry.typeID ] = function ( node ) {

        var modelview = this.getCurrentModelViewMatrix();
        var bb = node.getBoundingBox();
        if ( this._computeNearFar && bb.valid() ) {
            if ( !this.updateCalculatedNearFar( modelview, node ) ) {
                return;
            }
        }

        var stateset = node.getStateSet();
        if ( stateset ) {
            this.pushStateSet( stateset );
        }

        // using modelview is not a pb because geometry
        // is a leaf node, else traversing the graph would be an
        // issue because we use modelview after
        this.handleCullCallbacksAndTraverse( node );

        var leafs = this._currentStateGraph.leafs;
        if ( leafs.length === 0 ) {
            this._currentRenderBin.addStateGraph( this._currentStateGraph );
        }

        var leaf = this.createOrReuseRenderLeaf();
        var depth = 0;
        if ( bb.valid() ) {
            depth = this.distance( bb.center(), modelview );
        }
        if ( isNaN( depth ) ) {
            Notify.warn( 'warning geometry has a NaN depth, ' + modelview + ' center ' + bb.center() );
        } else {

            leaf.init( this._currentStateGraph,
                       node,
                       this.getCurrentProjectionMatrix(),
                       this.getCurrentViewMatrix(),
                       this.getCurrentModelViewMatrix(),
                       this.getCurrentModelWorldMatrix(),
                       depth );

            leafs.push( leaf );
        }

        if ( stateset ) {
            this.popStateSet();
        }
    };

    return CullVisitor;
} );
