/**
 * @author Jordi Torres
 */


define( [
    'Q',
    'osg/Utils',
    'osg/Lod',
    'osg/NodeVisitor',
    'osg/Matrix',
    'osg/Vec3',
    'osg/Node',
    'osg/Geometry',
    'osg/Notify'
], function ( Q, MACROUTILS, Lod, NodeVisitor, Matrix, Vec3, Node, Geometry, Notify ) {
    /**
     *  PagedLOD that can contains paged child nodes
     *  @class PagedLod
     */
    var PagedLOD = function () {
        Lod.call( this );
        this._perRangeDataList = [];
        this._loading = false;
        this._expiryTime = 10.0;
        this._centerMode = Lod.USER_DEFINED_CENTER;
    };

    /**
     *  PerRangeData utility structure to store per range values
     *  @class PerRangeData
     */
    var PerRangeData = function () {
        this.filename = '';
        this.function = undefined;
        this.loaded = false;
        this.timeStamp = 0.0;
        this.frameNumber = 0;
        this.frameNumberOfLastTraversal = 0;
    };

    /** @lends PagedLOD.prototype */
    PagedLOD.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Lod.prototype, {
        // Functions here
        setRange: function ( childNo, min, max ) {
            if ( childNo >= this._range.length ) {
                var r = [];
                r.push( [ min, min ] );
                this._range.push( r );
            }
            this._range[ childNo ][ 0 ] = min;
            this._range[ childNo ][ 1 ] = max;
        },

        setExpiryTime: function ( expiryTime ) {
            this._expiryTime = expiryTime;
        },

        setFileName: function ( childNo, filename ) {
            // May we should expand the vector first?
            if ( childNo >= this._perRangeDataList.length ) {
                var rd = new PerRangeData();
                rd.filename = filename;
                this._perRangeDataList.push( rd );
            } else {
                this._perRangeDataList[ childNo ].filename = filename;
            }
        },
        setFunction: function ( childNo, func ) {
            if ( childNo >= this._perRangeDataList.length ) {
                var rd = new PerRangeData();
                rd.function = func;
                this._perRangeDataList.push( rd );
            } else {
                this._perRangeDataList[ childNo ].function = func;
            }
        },

        addChild: function ( node, min, max ) {
            Lod.prototype.addChild.call( this, node, min, max );
            this._perRangeDataList.push( new PerRangeData() );
        },

        addChildNode: function ( node ) {
            Lod.prototype.addChildNode.call( this, node );
            // this.perRangeDataList.push ( null );
        },

        loadNode: function ( perRangeData, node ) {
            if ( perRangeData.function === undefined )
                this.loadNodeFromURL( perRangeData, node );
            else this.loadNodeFromFunction( perRangeData, node );
        },

        loadNodeFromURL: function ( perRangeData, node ) {
            // TODO:
            // we should ask to the Cache if the data is in the IndexedDB first
            var ReaderParser = require( 'osgDB/ReaderParser' );
            Notify.log( 'loading ' + perRangeData.filename );
            var req = new XMLHttpRequest();
            req.open( 'GET', perRangeData.filename, true );
            req.onload = function ( aEvt ) {
                var promise = ReaderParser.parseSceneGraph( JSON.parse( req.responseText ) );
                Q.when( promise ).then( function ( child ) {
                    node.addChildNode( child );
                } );
                Notify.log( 'success ' + perRangeData.filename, aEvt );
            };

            req.onerror = function ( aEvt ) {
                Notify.error( 'error ' + perRangeData.filename, aEvt );
            };
            req.send( null );
        },

        loadNodeFromFunction: function ( perRangeData, node ) {
            // Need to call with this paged lod as parent
            Q.when( ( perRangeData.function )( this ) ).then( function ( child ) {
                node.addChildNode( child );
            } );
        },

        removeExpiredChildren: function ( frameStamp, gl ) {

            var ReleaseVisitor = function ( gl ) {
                NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );
                this.gl = gl;
            };
            ReleaseVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
                apply: function ( node ) {
                    if ( node instanceof Geometry ) {
                        node.releaseGLObjects( this.gl );
                    }
                    this.traverse( node );
                }
            } );
            if ( frameStamp.getFrameNumber() === 0 ) return;
            var numChildren = this.children.length;
            for ( var i = numChildren - 1; i > 0; i-- ) {
                //First children never expires, also children added with addChild method should not be deleted
                var timed = frameStamp.getSimulationTime() - this._perRangeDataList[ i ].timeStamp;
                if ( ( timed > this._expiryTime ) && ( this._perRangeDataList[ i ].filename.length > 0 ||
                                                    this._perRangeDataList[ i ].function !== undefined ) ){
                    if ( i === this.children.length - 1 ) {
                        this.children[ i ].accept( new ReleaseVisitor( gl ) );
                        this.removeChild( this.children[ i ] );
                        this._perRangeDataList[ i ].loaded = false;
                        numChildren--;
                    }
                } else {
                    return;
                }
            }
        },

        traverse: ( function () {

            // avoid to generate variable on the heap to limit garbage collection
            // instead create variable and use the same each time
            var zeroVector = Vec3.create();
            var eye = Vec3.create();
            var viewModel = Matrix.create();
            return function ( visitor ) {
                var traversalMode = visitor.traversalMode;
                var updateTimeStamp = false;
                if ( visitor.getVisitorType() === NodeVisitor.CULL_VISITOR ) {
                    updateTimeStamp = true;
                    //this._frameNumberOfLastTraversal = visitor.getFrameStamp().getFrameNumber();
                }

                switch ( traversalMode ) {

                case NodeVisitor.TRAVERSE_ALL_CHILDREN:

                    for ( var index = 0; index < this.children.length; index++ ) {
                        this.children[ index ].accept( visitor );
                    }
                    break;

                case ( NodeVisitor.TRAVERSE_ACTIVE_CHILDREN ):
                    var requiredRange = 0;

                    // Calculate distance from viewpoint
                    var matrix = visitor.getCurrentModelviewMatrix();
                    Matrix.inverse( matrix, viewModel );
                    if ( this._rangeMode === Lod.DISTANCE_FROM_EYE_POINT ) {
                        Matrix.transformVec3( viewModel, zeroVector, eye );
                        var d = Vec3.distance( eye, this.getBound().center() );
                        requiredRange = d;
                    } else {
                        // Calculate pixels on screen
                        var projmatrix = visitor.getCurrentProjectionMatrix();
                        // focal lenght is the value stored in projmatrix[0] 
                        requiredRange = this.projectBoundingSphere( this.getBound(), matrix, projmatrix[ 0 ] );
                        // Get the real area value
                        requiredRange = ( requiredRange * visitor.getViewport().width() * visitor.getViewport().width() ) * 0.25;
                        if ( requiredRange < 0 ) requiredRange = this._range[ this._range.length -1 ][ 0 ];
                    }

                    var needToLoadChild = false;
                    var lastChildTraversed = -1;
                    for ( var j = 0; j < this._range.length; ++j ) {
                        if ( this._range[ j ][ 0 ] <= requiredRange && requiredRange < this._range[ j ][ 1 ] ) {
                            if ( j < this.children.length ) {
                                if ( updateTimeStamp ) {
                                    this._perRangeDataList[ j ].timeStamp = visitor.getFrameStamp().getSimulationTime();
                                    //this.perRangeDataList[j].frameNumber = visitor.getFrameStamp().getFrameNumber();
                                }
                                this.children[ j ].accept( visitor );
                                lastChildTraversed = j;
                            } else {
                                needToLoadChild = true;
                            }
                        }
                    }
                    if ( needToLoadChild ) {
                        var numChildren = this.children.length;
                        if ( numChildren > 0 && ( ( numChildren - 1 ) !== lastChildTraversed ) ) {

                            if ( updateTimeStamp ) {
                                this._perRangeDataList[ numChildren - 1 ].timeStamp = visitor.getFrameStamp().getSimulationTime();
                                //this.perRangeDataList[numChildren -1].frameNumber = visitor.getFrameStamp().getFrameNumber();
                            }

                            this.children[ numChildren - 1 ].accept( visitor );
                        }
                        // now request the loading of the next unloaded child.
                        if ( numChildren < this._range.length ) {

                            // Here we should do the request
                            var group = visitor.nodePath[ visitor.nodePath.length - 1 ];
                            if ( this._perRangeDataList[ numChildren ].loaded === false ) {
                                this._perRangeDataList[ numChildren ].loaded = true;
                                this.loadNode( this._perRangeDataList[ numChildren ], group );
                            }
                        }
                    }
                    // Remove the expired childs if any
                    this.removeExpiredChildren( visitor.getFrameStamp(), visitor.getCurrentCamera().getGraphicContext() );
                    break;

                default:
                    break;
                }
            };
        } )()



    } ), 'osg', 'PagedLOD' );

    MACROUTILS.setTypeID( PagedLOD );
    return PagedLOD;
} );
