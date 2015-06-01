( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;

    var NbTotalItems = 0;
    var NbTotalNodes = 0;

    var NbItems = 4;
    var Deep = 3;

    var QuadSizeX = 1;
    var QuadSizeY = QuadSizeX * 9 / 16.0;

    var Item;
    var Texture;

    function getOrCreateItem() {
        if ( Item === undefined ) {
            var rq = osg.createTexturedQuadGeometry( -QuadSizeX / 2.0, -QuadSizeY / 2.0, 0,
                QuadSizeX, 0, 0,
                0, QuadSizeY, 0 );
            rq.getOrCreateStateSet().setTextureAttributeAndModes( 0, Texture );
            Item = rq;
        }
        return Item;
    }

    function getRessource() {
        Texture = osg.Texture.createFromURL( 'textures/texture.png' );
    }

    function createItems( deep ) {
        var scale = Math.pow( 2, deep - 1 );

        var root = new osg.MatrixTransform();
        var nbx = NbItems;
        var nby = Math.floor( nbx * 9 / 16.0 );
        if ( deep === 0 ) {
            NbTotalItems += nbx * nby;
        }
        NbTotalNodes += nbx * nby;

        for ( var i = 0, l = nbx; i < l; i++ ) {
            for ( var j = 0, m = nby; j < m; j++ ) {
                var mt = new osg.MatrixTransform();
                var x, y;
                if ( deep === 0 ) {
                    x = ( -nbx * 0.5 + 0.5 + i ) * 1.1;
                    y = ( -nby * 0.5 + 0.5 + j ) * 1.1;

                    osg.Matrix.makeTranslate( x, y, 0, mt.getMatrix() );
                    if ( i % 2 === 0 ) {
                        mt.addChild( getOrCreateItem() );
                    } else {
                        mt.addChild( getOrCreateItem() );
                    }
                } else {
                    var s = nbx * deep * scale * 1.1;
                    x = ( -nbx * 0.5 + 0.5 + i ) * ( s );
                    y = ( -nby * 0.5 + 0.5 + j ) * ( s * 9 / 16.0 );
                    //osg.log([x,y]);
                    osg.Matrix.makeTranslate( x, y, 0, mt.getMatrix() );
                    mt.addChild( createItems( deep - 1 ) );
                }
                root.addChild( mt );
            }
        }
        return root;
    }

    function createScene() {
        getRessource();
        //var root = new osg.Node();
        var root = createItems( Deep );
        //root.addChild(items);

        osg.log( 'Total Items ' + NbTotalItems );
        osg.log( 'Total Nodes ' + NbTotalNodes );
        return root;
    }

    function main() {

        var canvas = document.getElementById( 'View' );

        var viewer = new osgViewer.Viewer( canvas );
        viewer.init();
        viewer.setSceneData( createScene() );
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();
        viewer.run();

    }

    window.addEventListener( 'load', main, true );
} )();
