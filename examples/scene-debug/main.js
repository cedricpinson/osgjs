var OSG = window.OSG;
OSG.globalify();
var osg = window.osg;
var osgViewer = window.osgViewer;

var main = function () {
    var canvas = document.getElementById( 'View' );

    var viewer;
    try {
        viewer = new osgViewer.Viewer( canvas, {
            antialias: true,
            alpha: true
        } );
        viewer.init();
        var rotate = new osg.MatrixTransform();
        rotate.addChild( createScene() );
        viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
        viewer.setSceneData( rotate );
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();

        viewer.run();

    } catch ( er ) {
        osg.log( 'exception in osgViewer ' + er );
    }
};

function createGraph() {

    var g = new dagreD3.Digraph();

    for ( i = 0; i < nodeListSize; i++ ) {
        g.addNode( nodeList[ i ].instanceID, {
            label: nodeList[ i ].className + ( nodeList[ i ].name ? '\n' + nodeList[ i ].name : '' ),
            description: ( nodeList[ i ].stateset != null ? 'StateSetID : ' + nodeList[ i ].stateset.statesetID : '' ) + ( nodeList[ i ].stateset != null && nodeList[ i ].matrix !== '' ? '<br /><br />' : '' ) + nodeList[ i ].matrix
        } );

        if ( nodeList[ i ].stateset != null ) {
            g.addNode( nodeList[ i ].stateset.name, {
                label: 'StateSet',
                description: 'numTexture : ' + nodeList[ i ].stateset.numTexture,
                style: 'fill: #0099FF;stroke-width: 0px;'
            } );

            g.addEdge( null, nodeList[ i ].instanceID, nodeList[ i ].stateset.name, {
                style: 'stroke: #0099FF;'
            } );
        }
    }

    for ( i = 0; i < linkListSize; i++ ) {
        g.addEdge( null, linkList[ i ].parentNode, linkList[ i ].childrenNode );
    }

    // Create the renderer
    var renderer = new dagreD3.Renderer();

    // Set up an SVG group so that we can translate the final graph.
    var svg = d3.select( 'svg' ),
        svgGroup = svg.append( 'g' );

    // Set initial zoom to 75%
    var initialScale = 0.75;
    var oldZoom = renderer.zoom();
    renderer.zoom( function ( graph, svg ) {
        var zoom = oldZoom( graph, svg );

        zoom.scale( initialScale ).event( svg );
        return zoom;
    } );

    // Simple function to style the tooltip for the given node.
    var styleTooltip = function ( name, description ) {
        return '<p class="name">' + name + '</p><pre class="description">' + description + '</pre>';
    };

    // Override drawNodes to set up the hover.
    var oldDrawNodes = renderer.drawNodes();
    renderer.drawNodes( function ( g, svg ) {
        var svgNodes = oldDrawNodes( g, svg );

        // Set the title on each of the nodes and use tipsy to display the tooltip on hover
        svgNodes.attr( 'title', function ( d ) {
            return styleTooltip( d, g.node( d ).description )
        } )
            .each( function ( d ) {
                $( this ).tipsy( {
                    gravity: 'w',
                    opacity: 1,
                    html: true
                } );
            } );

        return svgNodes;
    } );

    // Run the renderer. This is what draws the final graph.
    var layout = renderer.run( g, svgGroup );

    $( '.node' ).click( function () {
        var identifier = $( this ).attr( 'original-title' ).split( '<' )[ 1 ].split( '>' )[ 1 ];
        if ( identifier.search( 'StateSet' ) === -1 ) {
            console.log( fullNodeList[ identifier ] );
        } else {
            console.log( fullNodeList[ identifier.split( ' ' )[ 2 ] ].stateset );
        }

    } );

}

var createTexturedBox = function ( centerx, centery, centerz,
    sizex, sizey, sizez,
    l, r, b, t ) {
    var model = osg.createTexturedBoxGeometry( centerx,
        centery,
        centerz,
        sizex,
        sizey,
        sizez );

    var uvs = model.getAttributes().TexCoord0;
    var array = uvs.getElements();

    array[ 0 ] = l;
    array[ 1 ] = t;
    array[ 2 ] = l;
    array[ 3 ] = b;
    array[ 4 ] = r;
    array[ 5 ] = b;
    array[ 6 ] = r;
    array[ 7 ] = t;

    array[ 8 ] = l;
    array[ 9 ] = t;
    array[ 10 ] = l;
    array[ 11 ] = b;
    array[ 12 ] = r;
    array[ 13 ] = b;
    array[ 14 ] = r;
    array[ 15 ] = t;


    array[ 16 ] = 0;
    array[ 17 ] = 0;
    array[ 18 ] = 0;
    array[ 19 ] = 0;
    array[ 20 ] = 0;
    array[ 21 ] = 0;
    array[ 22 ] = 0;
    array[ 23 ] = 0;

    array[ 24 ] = 0;
    array[ 25 ] = 0;
    array[ 26 ] = 0;
    array[ 27 ] = 0;
    array[ 28 ] = 0;
    array[ 29 ] = 0;
    array[ 30 ] = 0;
    array[ 31 ] = 0;


    array[ 32 ] = 0;
    array[ 33 ] = 0;
    array[ 34 ] = 0;
    array[ 35 ] = 0;
    array[ 36 ] = 0;
    array[ 37 ] = 0;
    array[ 38 ] = 0;
    array[ 39 ] = 0;

    array[ 40 ] = 0;
    array[ 41 ] = 0;
    array[ 42 ] = 0;
    array[ 43 ] = 0;
    array[ 44 ] = 0;
    array[ 45 ] = 0;
    array[ 46 ] = 0;
    array[ 47 ] = 0;

    return model;
};

var createEffect = function ( texture, target, center ) {

    var totalSizeX = 20;
    var maxx = 20;

    var sizex = totalSizeX / maxx;
    var maxy = maxx / 4;

    var size = [ sizex, sizex, sizex ];

    var group = new osg.MatrixTransform();

    for ( var y = 0; y < maxy; y++ ) {
        for ( var x = 0; x < maxx; x++ ) {
            var mtr = new osg.MatrixTransform();
            var rx = x * size[ 0 ] - maxx * size[ 0 ] * 0.5 + center[ 0 ];
            var ry = 0 + center[ 1 ];
            var rz = y * size[ 2 ] - maxy * size[ 2 ] * 0.5 + center[ 2 ];
            mtr.setMatrix( osg.Matrix.makeTranslate( rx, ry, rz, [] ) );

            var model = createTexturedBox( 0, 0, 0,
                size[ 0 ], size[ 1 ], size[ 2 ],
                x / ( maxx + 1 ), ( x + 1 ) / ( maxx + 1 ),
                y / ( maxy + 1 ), ( y + 1 ) / ( maxy + 1 ) );
            model.getOrCreateStateSet().setTextureAttributeAndMode( 0, texture );

            mtr.addChild( model );
            group.addChild( mtr );
            var t = ( x * maxy + y ) * 0.1;
            mtr._lastUpdate = t;
            mtr._start = t;
            mtr._axis = [ Math.random(), Math.random(), Math.random() ];
            osg.Vec3.normalize( mtr._axis, mtr._axis );
        }
    }
    return group;
};

function createScene() {

    var root = new osg.Node();

    var texture = osg.Texture.createFromURL( 'image.png' );
    var target = new osg.MatrixTransform();
    var targetModel = osg.createTexturedBoxGeometry( 0,
        0,
        0,
        2,
        2,
        2 );
    target.addChild( targetModel );
    var material = new osg.Material();
    material.setDiffuse( [ 1, 0, 0, 1 ] );
    target.getOrCreateStateSet().setAttributeAndMode( material );

    var targetPos = [ 0, 0, 0 ];
    var centerPos = [ 20, 8, 30 ];

    var group = createEffect( texture, targetPos, centerPos );

    root.addChild( group );
    root.addChild( target );

    var visitor = new DebugVisitor;
    root.accept( visitor );

    createGraph();

    return root;
}

window.addEventListener( 'load', main, true );