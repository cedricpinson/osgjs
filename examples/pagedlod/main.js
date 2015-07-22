( function () {
    /**
     * @author Jordi Torres
     */
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;

    var minExtent = [ -1000000.0, -1000000.0 ];
    var maxExtent = [ 1000000.0, 1000000.0 ];

    var Example = function () {
        var maxx, minx, miny, maxy;
        var viewer;
        var params = undefined;
        var gui = undefined;

        this._config = {
            lodScale: 0.01,
            acceptNewRequests: true
        };
    };

    Example.prototype = {

        createTileForGeometry: function ( i, x, y, width, height ) {

            var node = osg.createTexturedQuadGeometry( x, y, 0, width, 0, 0, 0, height, 0 );
            var materialGround = new osg.Material();
            materialGround.setAmbient( [ 1 * i / 8, 1 * i / 2, 1 * i / 2, 1 ] );
            materialGround.setDiffuse( [ 0, 0, 0, 1 ] );
            node.getOrCreateStateSet().setAttributeAndModes( materialGround );
            return node;
        },

        subTileLevelRowCol: function ( subTileId, level, row, col ) {
            var x = 0;
            var y = 0; // subtileID = 0 is 0,0
            if ( subTileId === 1 ) {
                x = 1;
            } else if ( subTileId === 2 ) {
                y = 1;
            } else if ( subTileId === 3 ) {
                x = 1;
                y = 1;
            }

            var sLevel = level + 1;
            var sCol = col * 2 + x;
            var sRow = row * 2 + y;
            return {
                sLevel: sLevel,
                sCol: sCol,
                sRow: sRow
            };
        },

        levelRowColToXYWidthHeight: function ( rootLevel, level, row, col ) {
            var leveldiff = level - rootLevel;
            var tileExtent = this.computeExtent( leveldiff, row, col );
            var width = this.maxx - this.minx;
            var height = this.maxy - this.miny;
            return {
                x: tileExtent.minx,
                y: tileExtent.miny,
                width: width,
                height: height
            };

        },

        computeExtent: function ( level, x, y ) {
            var numTiles = ( 1 << level );
            var width = ( maxExtent[ 0 ] - minExtent[ 0 ] ) / numTiles;
            var height = ( maxExtent[ 1 ] - minExtent[ 1 ] ) / numTiles;
            this.minx = minExtent[ 0 ] + x * width;
            this.miny = minExtent[ 1 ] + y * height;
            this.maxx = this.minx + width;
            this.maxy = this.miny + height;
            return {
                minx: this.minx,
                miny: this.miny,
                maxx: this.maxx,
                maxy: this.maxy
            };
        },

        initGui: function () {
            this.gui = new window.dat.GUI();
            var self = this;
            // config to let dat.gui change the scale
            var lodScaleController = this.gui.add( this._config, 'lodScale', 0.01, 3.0 );
            lodScaleController.onChange( function ( value ) {
                self.viewer.getCamera().getRenderer().getCullVisitor().setLODScale( value );
            } );
            var acceptRequestscontroller = this.gui.add( this._config, 'acceptNewRequests' );
            acceptRequestscontroller.onChange( function ( value ) {
                self.viewer.getDatabasePager().setAcceptNewDatabaseRequests( value );
            } );

        },
        run: function () {
            // The 3D canvas.
            var canvas = document.getElementById( 'View' );

            var node = osg.createTexturedQuadGeometry( minExtent[ 0 ], minExtent[ 1 ], 0, maxExtent[ 0 ] - minExtent[ 0 ], 0, 0, 0, maxExtent[ 1 ] - minExtent[ 1 ], 0 );
            // Init create function
            var that = this;
            var create = function createPagedLODGroup( parent ) {
                var group = new osg.Node();

                for ( var i = 0; i < 4; i++ ) {
                    var designation = that.subTileLevelRowCol( i, parent.level, parent.x, parent.y );
                    var tileGeometry = that.levelRowColToXYWidthHeight( 0, designation.sLevel, designation.sRow, designation.sCol );
                    // console.log('L =', designation.sLevel,' Row =', designation.sRow ,' Col =', designation.sCol);
                    // console.log ('tileGeometry =', tileGeometry.x , tileGeometry.y, tileGeometry.width, tileGeometry.height);
                    var node = that.createTileForGeometry( i, tileGeometry.x, tileGeometry.y, tileGeometry.width, tileGeometry.height );

                    var plod = new osg.PagedLOD();
                    plod.setRangeMode( osg.PagedLOD.PIXEL_SIZE_ON_SCREEN );
                    plod.addChild( node, 0, 100000 );
                    plod.setFunction( 1, create );
                    plod.setRange( 1, 100000, Number.MAX_VALUE );
                    plod.level = designation.sLevel;
                    plod.x = designation.sRow;
                    plod.y = designation.sCol;
                    group.addChild( plod );
                }
                //console.log('l=',parent.level,' x=',parent.x,' y =',parent.y);
                return group;
            };

            // Set up the PagedLOD root level
            var plod = new osg.PagedLOD();
            plod.addChild( node, 0, 100000 );
            plod.setRangeMode( osg.PagedLOD.PIXEL_SIZE_ON_SCREEN );
            plod.level = 0;
            plod.x = 0;
            plod.y = 0;
            plod.setFunction( 1, create );
            plod.setRange( 1, 100000, Number.MAX_VALUE );

            // The viewer
            this.viewer = new osgViewer.Viewer( canvas, {
                'enableFrustumCulling': true
            } );
            this.viewer.init();
            this.viewer.getDatabasePager().setProgressCallback( function ( a, b ) {
                window.progress( a + b );
            } );
            this.viewer.setSceneData( plod );
            var bs = plod.getBound();
            this.viewer.setupManipulator();
            this.viewer.getManipulator().setDistance( bs.radius() * 1.5 );
            this.initGui();
            // Cheat dat gui to show at least two decimals and start at 1.0
            this._config.lodScale = 1.0;
            for ( var i in this.gui.__controllers )
                this.gui.__controllers[ i ].updateDisplay();
            this.viewer.run();
        }
    };

    window.addEventListener( 'load', function () {
        var example = new Example();
        example.run();
    }, true );
} )();
