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
    'osgDB/ReaderParser'
], function ( Q, MACROUTILS, Lod, NodeVisitor, Matrix, Vec3, Node, Geometry, ReaderParser) {
    /**
     *  PagedLOD that can contains paged child nodes
     *  @class PagedLod
     */
    var PagedLOD = function () {
        Lod.call( this );
        this.radius = -1;
        this.range = [];
        this.perRangeDataList = [];
        this.loading = false;
        this.expiryTime = 10.0;
    };


    /**
     *  PerRangeData utility structure to store per range values
     *  @class PerRangeData
     */
    var PerRangeData=function()
    {
        this.filename = undefined;
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
         if ( childNo >= this.range.length ) {
                var r = [];
                r.push( [ min, min ] );
                this.range.push( r );
            }
            this.range[ childNo ][ 0 ] = min;
            this.range[ childNo ][ 1 ] = max;
        },

        setExpiryTime: function ( expiryTime )
        {
            this.expiryTime = expiryTime;
        },

        setFileName: function ( childNo, filename)
        {
            // May we should expand the vector first?
            if ( childNo >= this.perRangeDataList.length)
            {
                var rd = new PerRangeData();
                rd.filename = filename;
                this.perRangeDataList.push( rd );
            } else {
                this.perRangeDataList[childNo].filename = filename;
            }
        },
        setFunction : function ( childNo, func )
        {
            if ( childNo >= this.perRangeDataList.length)
            {
                var rd = new PerRangeData();
                rd.function = func;
                this.perRangeDataList.push( rd );
            } else {
                this.perRangeDataList[childNo].function = func;
            }
        },

        addChild: function ( node, min, max ) {
            Lod.prototype.addChild.call( this, node, min, max );
            this.perRangeDataList.push( new PerRangeData() );
        },

        addChildNode : function ( node ) {
            Lod.prototype.addChildNode.call( this, node );
            // this.perRangeDataList.push ( null );
        },

        loadNode : function (perRangeData, node)
        {
            if (perRangeData.function === undefined)
                this.loadNodeFromUrl (perRangeData, node);
            else this.loadNodeFromFunction (perRangeData, node);
        },

        loadNodeFromUrl : function ( perRangeData, node ) {
            // TODO:
            // we should ask to the Cache if the data is in the IndexedDB first
            console.log( 'loading ' + perRangeData.filename );
            var req = new XMLHttpRequest();
            req.open( 'GET', perRangeData.filename, true );
            req.onload = function( aEvt ) {
                var promise = ReaderParser.parseSceneGraph( JSON.parse( req.responseText ) );
                Q.when( promise ).then( function( child ) {
                    node.addChildNode( child );
                    //perRangeData.loaded = false;
                } );
                console.log( 'success ' + perRangeData.filename, aEvt );
            };

            req.onerror = function( aEvt ) {
                console.log( 'error ' + perRangeData.filename, aEvt );
            };
            req.send( null );
        },

        loadNodeFromFunction : function ( perRangeData, node) {
            //var defer = Q.defer();
            //var child = (perRangeData.function)();
            Q.when((perRangeData.function)()).then(function ( child )
                {
                     node.addChildNode(child);
                 });
           
        },



        removeExpiredChildren : function ( frameStamp, gl ) {

            var ReleaseVisitor = function( gl ) {
                            NodeVisitor.call(this, NodeVisitor.TRAVERSE_ALL_CHILDREN);
                            this.gl = gl;
                        };
                        
                        ReleaseVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {


                            apply: function(node) {
                                if (node instanceof Geometry)
                                {
                                    node.releaseGLObjects(this.gl);
                                    console.log('RELEASED GL OBJECTS');
                                }
                                this.traverse(node);
                            }
                        });

            if (frameStamp.getFrameNumber() === 0) return;
             var numChildren = this.children.length;
             for (var i = numChildren - 1; i > 0; i--) {
                //First children never expires
                var timed = frameStamp.getSimulationTime() - this.perRangeDataList[i].timeStamp;
                if  (timed > this.expiryTime ){
                    if (i === this.children.length - 1)
                    {

                        this.children[i].accept(new ReleaseVisitor(gl));
                        this.removeChild(this.children[i]);
                        this.perRangeDataList[i].loaded = false;
                        console.log('removing node number', i);
                        numChildren--;
                    }
                } else {
                    return;
                }
             }
        },

        traverse: (function() {

            // avoid to generate variable on the heap to limit garbage collection
            // instead create variable and use the same each time
            var zeroVector = [ 0.0, 0.0, 0.0 ];
            var eye = [ 0.0, 0.0, 0.0 ];
            var viewModel = Matrix.create();
            return function ( visitor ) {
                var traversalMode = visitor.traversalMode;
                var updateTimeStamp = false;
                if (visitor.getVisitorType() === NodeVisitor.CULL_VISITOR)
                {
                    updateTimeStamp = true;
                    this.frameNumberOfLastTraversal = visitor.getFrameStamp().getFrameNumber();
                }

                switch ( traversalMode ) {

                case NodeVisitor.TRAVERSE_ALL_CHILDREN:

                    for ( var index = 0; index < this.children.length; index++ ) {
                        this.children[ index ].accept( visitor );
                    }
                    break;

                case ( NodeVisitor.TRAVERSE_ACTIVE_CHILDREN ):
                    var requiredRange = 0;

                    // First approximation calculate distance from viewpoint
                    var matrix = visitor.getCurrentModelviewMatrix();
                    Matrix.inverse( matrix, viewModel );
                    if ( this.rangeMode ===  Lod.DISTANCE_FROM_EYE_POINT){
                        Matrix.transformVec3( viewModel, zeroVector, eye );
                        var d = Vec3.distance( eye, this.getBound().center() );
                        requiredRange = d;

                    } else {

                        var viewMatrix = Matrix.create();
                        var center = [ 0.0, 0.0, 0.0 ];
                        var up = [ 0.0, 0.0, 0.0 ];
                        // Get the View Matrix
                        Matrix.getLookAt( viewModel, eye, center, up, 1 );
                        Matrix.makeLookAt( eye, Vec3.neg(center, center), up, viewMatrix);
                        var projmatrix = visitor.getCurrentProjectionMatrix();
                        var info = {};
                        Matrix.getFrustum(projmatrix, info);
                        //requiredRange = this.projectSphere(this.getBound(),viewMatrix, info.zNear/info.right);
                        requiredRange = this.projectSphere(this.getBound(),viewMatrix, projmatrix[0]);
                        // Try to get near the real value
                        requiredRange = requiredRange*visitor.getViewport().height()*visitor.getViewport().height()*0.25;
                        console.log('PIXEL SIZE: ', requiredRange);
                        if ( requiredRange < 0 ) requiredRange = 0;
                    }

                    var needToLoadChild = false;
                    var lastChildTraversed = -1;
                    for ( var j = 0; j < this.range.length; ++j ) {
                        if ( this.range[ j ][ 0 ] <= requiredRange && requiredRange < this.range[ j ][ 1 ] ) {
                            if ( j < this.children.length ) {
                                if (updateTimeStamp)
                                {
                                    this.perRangeDataList[j].timeStamp = visitor.getFrameStamp().getSimulationTime();
                                    //this.perRangeDataList[j].frameNumber = visitor.getFrameStamp().getFrameNumber();
                                }
                                this.children[ j ].accept( visitor );
                                lastChildTraversed = j;
                            }
                            else {
                                needToLoadChild = true;
                            }
                        }
                    }
                    if ( needToLoadChild )
                    {
                        var numChildren = this.children.length;
                        if ( numChildren > 0 && ((numChildren -1) !== lastChildTraversed )) {

                            if (updateTimeStamp) {
                                this.perRangeDataList[numChildren -1].timeStamp = visitor.getFrameStamp().getSimulationTime();
                                //this.perRangeDataList[numChildren -1].frameNumber = visitor.getFrameStamp().getFrameNumber();
                            }

                            this.children[numChildren-1].accept( visitor );
                        }
                         // now request the loading of the next unloaded child.
                        if ( numChildren < this.range.length ){

                            // Here we should do the request
                            var group = visitor.nodePath[visitor.nodePath.length -1];
                            if (this.perRangeDataList[numChildren].loaded === false)
                            {
                                console.log('Requesting the child file : ', this.perRangeDataList[numChildren]);
                                this.perRangeDataList[numChildren].loaded = true;
                                this.loadNode(this.perRangeDataList[numChildren], group);
                            }
                        }
                    }
                    // Remove the expired childs if any
                    this.removeExpiredChildren(visitor.getFrameStamp(), visitor.getCurrentCamera().getGraphicContext());
                    break;

                default:
                    break;
                }
            };
        })()



        } ), 'osg', 'PagedLOD' );

    MACROUTILS.setTypeID( PagedLOD );
    return PagedLOD;
});