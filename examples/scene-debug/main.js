var OSG = window.OSG;
OSG.globalify();
var osg = window.osg;
var osgViewer = window.osgViewer;

// Simple tooltips
function SimpleTooltips( options ) {

    this.options = options;

    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = [
        ".simple-tooltip {",
            "display: none;",
            "position: absolute;",
            "margin-left: 10px;",
            "border-radius: 4px;",
            "padding: 10px;",
            "background: rgba(0,0,0,.9);",
            "color: #ffffff;",
        "}",
        ".simple-tooltip:before {",
            "content: ' ';",
            "position: absolute;",
            "left: -10px;",
            "top: 8px;",
            "border: 10px solid transparent;",
            "border-width: 10px 10px 10px 0;",
            "border-right-color: rgba(0,0,0,.9);",
        "}"
    ].join('\n');
    document.getElementsByTagName("head")[0].appendChild(css);

    this.el = document.createElement('div');
    this.el.className = 'simple-tooltip';
    document.body.appendChild(this.el);

    function showTooltip(e) {
        var target = e.currentTarget;
        this.el.innerHTML = target.getAttribute('title');
        this.el.style.display = 'block';
        this.el.style.left = ($(target).position().left + $(target).get(0).getBoundingClientRect().width) + 'px';
        this.el.style.top = $(target).position().top + 'px';
    }

    function hideTooltip(e) {
        this.el.style.display = 'none';
    }

    var nodes = document.querySelectorAll( this.options.selector );
    for (var i=0; i<nodes.length; i++) {
        nodes[i].addEventListener('mouseover', showTooltip.bind(this), false);
        nodes[i].addEventListener('mouseout', hideTooltip.bind(this), false);
    }
}

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

    $( '.button' ).click( function () {
        if ( $( 'svg' ).css( 'zIndex' ) === '-1' ) {
            $( '.button' ).text( 'Access to the scene' );
            $( 'svg' ).css( 'zIndex', '1' );
        } else {
            $( '.button' ).text( 'Access to the graph' );
            $( 'svg' ).css( 'zIndex', '-1' );
        }
    } );

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
            return styleTooltip( d, g.node( d ).description );
        } );

        return svgNodes;
    } );

    // Run the renderer. This is what draws the final graph.
    var layout = renderer.run( g, svgGroup );

    new SimpleTooltips({
        selector: '.node'
    });

    $( '.node' ).click( function () {
        var identifier = $( this ).attr( 'title' ).split( '<' )[ 1 ].split( '>' )[ 1 ];
        if ( identifier.search( 'StateSet' ) === -1 ) {
            window.activeNode = fullNodeList[ identifier ];
            console.log( 'window.activeNode is set.' );
            console.log( fullNodeList[ identifier ] );
        } else {
            var stateset = fullNodeList[ identifier.split( ' ' )[ 2 ] ].stateset;
            window.activeStateset = stateset;
            console.log( 'window.activeStateset is set.' );
            console.log( stateset );

        }

    } );

}

function createScene() {

    var root = new osg.Node();

    var group1 = new osg.MatrixTransform();
    var group21 = new osg.MatrixTransform();
    var group22 = new osg.MatrixTransform();
    var group3 = new osg.MatrixTransform();
    var group31 = new osg.MatrixTransform();
    var group32 = new osg.MatrixTransform();
    var group4 = new osg.MatrixTransform();

    group1.setMatrix( osg.Matrix.makeTranslate( +5, 10, -5 ) );
    group21.setMatrix( osg.Matrix.makeTranslate( 0, 10, 0 ) );
    group22.setMatrix( osg.Matrix.makeTranslate( 10, 0, 0 ) );
    group3.setMatrix( osg.Matrix.makeTranslate( 0, 0, -5 ) );
    group31.setMatrix( osg.Matrix.makeTranslate( 0, -5, 0 ) );
    group32.setMatrix( osg.Matrix.makeTranslate( -5, 0, 0 ) );

    var ground1 = osg.createTexturedBox( 0, 0, 0, 6, 5, 4 );
    var ground2 = osg.createTexturedBoxGeometry( 0, 0, 0, 2, 2, 2 );
    var ground3 = osg.createTexturedBox( 0, 0, 0, 1, 1, 1 );
    var ground31 = osg.createTexturedBox( 0, 0, 0, 1, 1, 1 );
    var ground32 = osg.createTexturedBox( 0, 0, 0, 1, 1, 1 );
    var ground4 = osg.createTexturedBoxGeometry( 0, 0, 0, 2, 2, 2 );

    var material2 = new osg.Material();
    var material3 = new osg.Material();
    var material4 = new osg.Material();
    material2.setDiffuse( [ 0, 0, 1, 1 ] );
    material3.setDiffuse( [ 0, 1, 0, 1 ] );
    material4.setDiffuse( [ 1, 0, 0, 1 ] );
    ground2.getOrCreateStateSet().setAttributeAndMode( material2 );
    group3.getOrCreateStateSet().setAttributeAndMode( material3 );
    group4.getOrCreateStateSet().setAttributeAndMode( material4 );

    group1.addChild( ground1 );
    group21.addChild( ground2 );
    group22.addChild( ground2 );
    group3.addChild( ground3 );
    group3.addChild( group31 );
    group3.addChild( group32 );
    group31.addChild( ground31 );
    group32.addChild( ground32 );
    group4.addChild( ground4 );

    root.addChild( group1 );
    root.addChild( group21 );
    root.addChild( group22 );
    root.addChild( group3 );
    root.addChild( group4 );

    var visitor = new DebugVisitor;
    root.accept( visitor );

    createGraph();

    return root;
}

window.addEventListener( 'load', main, true );
