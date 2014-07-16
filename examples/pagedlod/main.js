/**
 * @author Jordi Torres
 */


OSG.globalify();

var minExtent = [ -1000000.0, -1000000.0 ];
var maxExtent = [ 1000000.0, 1000000.0 ];

var main = function () {

    // The 3D canvas.
    var canvas = document.getElementById( "View" );
    var w = window.innerWidth;
    var h = window.innerHeight;
    osg.log( "size " + w + " x " + h );
    canvas.style.width = w;
    canvas.style.height = h;
    canvas.width = w;
    canvas.height = h;
    var viewer;
    var size = 10;
    var node = osg.createTexturedQuadGeometry( minExtent[ 0 ], minExtent[ 1 ], 0, maxExtent[ 0 ] - minExtent[ 0 ], 0, 0, 0, maxExtent[ 1 ] - minExtent[ 1 ], 0 );

    function createTileForGeometry( i, x, y, width, height ) {
        
        var node = osg.createTexturedQuadGeometry( x, y, 0, width, 0, 0, 0, height, 0 );
        var materialGround = new osg.Material();
        materialGround.setAmbient( [ 1 * i / 8, 1 * i / 2 , 1 * i / 2, 1 ] );
        materialGround.setDiffuse( [ 0, 0, 0, 1 ] );
        node.getOrCreateStateSet().setAttributeAndMode( materialGround );
        return node;
    }

    function subTileLevelRowCol( subTileId, level, row, col ) {
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

        sLevel = level + 1;
        sCol = col * 2 + x;
        sRow = row * 2 + y;
        return {
            sLevel: sLevel,
            sCol: sCol,
            sRow: sRow
        };
    }

    function levelRowColToXYWidthHeight( rootLevel, level, row, col ) {
        var leveldiff = level - rootLevel;
        var tileExtent = computeExtent( leveldiff, row, col );
        var width = maxx - minx;
        var height = maxy - miny;
        return {
            x: tileExtent.minx,
            y: tileExtent.miny,
            width: width,
            height: height
        };

    }

    function computeExtent( level, x, y ) {
        var numTiles = ( 1 << level );
        var width = ( maxExtent[ 0 ] - minExtent[ 0 ] ) / numTiles;
        var height = ( maxExtent[ 1 ] - minExtent[ 1 ] ) / numTiles;
        minx = minExtent[ 0 ] + x * width;
        miny = minExtent[ 1 ] + y * height;
        maxx = minx + width;
        maxy = miny + height;
        return {
            minx: minx,
            miny: miny,
            maxx: maxx,
            maxy: maxy
        };
    }

    var create = function createPagedLODGroup( parent ) {
        var group = new osg.Node();

        for ( i = 0; i < 4; i++ ) {
            var designation = subTileLevelRowCol( i, parent.level, parent.x, parent.y );
            var tileGeometry = levelRowColToXYWidthHeight( 0, designation.sLevel, designation.sRow, designation.sCol );
            // console.log('L =', designation.sLevel,' Row =', designation.sRow ,' Col =', designation.sCol);
            // console.log ('tileGeometry =', tileGeometry.x , tileGeometry.y, tileGeometry.width, tileGeometry.height);
            var node = createTileForGeometry( i, tileGeometry.x, tileGeometry.y, tileGeometry.width, tileGeometry.height );

            var plod = new osg.PagedLOD();
            plod.setRangeMode( osg.PagedLOD.PIXEL_SIZE_ON_SCREEN );
            plod.addChild( node, 0, 100000 );
            plod.setFunction( 1, create );
            plod.setRange( 1, 100000, Infinity );
            plod.level = designation.sLevel;
            plod.x = designation.sRow;
            plod.y = designation.sCol;
            group.addChild( plod );
        }
        //console.log('l=',parent.level,' x=',parent.x,' y =',parent.y);
        return group;
    }

    // Set up the PagedLOD root level
    var plod = new osg.PagedLOD();
    plod.addChild( node, 0, 100000 );
    plod.setRangeMode( osg.PagedLOD.PIXEL_SIZE_ON_SCREEN );
    plod.level = 0;
    plod.x = 0;
    plod.y = 0;
    plod.setFunction( 1, create );
    plod.setRange( 1, 100000, Infinity );

    // The viewer
    viewer = new osgViewer.Viewer( canvas , { 'enableFrustumCulling': true } );
    viewer.init();
    viewer.setSceneData( plod );
    var bs = plod.getBound();
    viewer.setupManipulator();
    viewer.getManipulator().setDistance( bs.radius() * 1.5 );
    viewer.run();
};

window.addEventListener( "load", main, true );
