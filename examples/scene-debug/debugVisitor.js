var osg = window.OSG.osg;

var DebugVisitor = function () {
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );

    this._nodeListSize = 0;
    this._fullNodeList = [];
    this._nodeList = [];
    this._linkListSize = 0;
    this._linkList = [];
    this._focusedElement = 'scene';

    $( "body" ).append( '<svg width=100% height=100%></svg>' );
};

DebugVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {

    apply: function ( node ) {

        if ( this._fullNodeList[ node.getInstanceID() ] !== node ) {

            var nodeMatrix = '';
            if ( node.matrix ) {
                nodeMatrix = this.createMatrixGrid( node, nodeMatrix );
            }
            var stateset = null;
            if ( node.stateset ) {
                stateset = this.createStateset( node, stateset );
            }

            this._fullNodeList[ node.getInstanceID() ] = node;

            this._nodeList[ this._nodeListSize ] = {
                name: node.getName(),
                className: node.className(),
                instanceID: node.getInstanceID(),
                stateset: stateset,
                matrix: nodeMatrix
            };
            this._nodeListSize++;

        }

        var keys = Object.keys( node.children );
        if ( keys.length > 0 ) {
            for ( var i = 0, l = keys.length; i < l; i++ ) {
                var key = keys[ i ];
                this._linkList[ this._linkListSize ] = {
                    parentNode: node.getInstanceID(),
                    childrenNode: node.children[ key ].getInstanceID()
                };
                this._linkListSize++;
            }
        }

        this.traverse( node );
    },

    reset: function () {
        this._nodeListSize = 0;
        this._fullNodeList = [];
        this._nodeList = [];
        this._linkListSize = 0;
        this._linkList = [];
    },

    // Apply all the style
    injectStyleElement: function () {
        $( "body" ).append( '<button class="button">Access to the scene</button>' );

        $( '.button' ).click( function () {
            if ( this._focusedElement === 'scene' ) {
                $( '.button' ).text( 'Access to the graph' );
                $( 'svg' ).css( 'zIndex', '-2' );
                this._focusedElement = 'graph';
            } else {
                $( '.button' ).text( 'Access to the scene' );
                $( 'svg' ).css( 'zIndex', '2' );
                $( '.simple-tooltip' ).css( 'zIndex', '3' );
                this._focusedElement = 'scene';
            }
        }.bind( this ) );

        var css = document.createElement( "style" );
        css.type = "text/css";
        css.innerHTML = [
            ".node {",
            "text-align: center;",
            "cursor: pointer;",
            "}",
            ".node rect {",
            "stroke: #FFF;",
            "}",
            ".edgePath path {",
            "stroke: #FFF;",
            "fill: none;",
            "}",
            "table {",
            "text-align: right;",
            "}",
            "svg {",
            "position: absolute;",
            "left: 0px;",
            "top: 0px;",
            "}",
            ".button {",
            "position: absolute;",
            "left: 15px;",
            "top: 15px;",
            "z-index: 5;",
            "border: 0;",
            "background: #65a9d7;",
            "background: -webkit-gradient(linear, left top, left bottom, from(#3e779d), to(#65a9d7));",
            "background: -webkit-linear-gradient(top, #3e779d, #65a9d7);",
            "background: -moz-linear-gradient(top, #3e779d, #65a9d7);",
            "background: -ms-linear-gradient(top, #3e779d, #65a9d7);",
            "background: -o-linear-gradient(top, #3e779d, #65a9d7);",
            "padding: 5px 10px;",
            "-webkit-border-radius: 7px;",
            "-moz-border-radius: 7px;",
            "border-radius: 7px;",
            "-webkit-box-shadow: rgba(0,0,0,1) 0 1px 0;",
            "-moz-box-shadow: rgba(0,0,0,1) 0 1px 0;",
            "box-shadow: rgba(0,0,0,1) 0 1px 0;",
            "text-shadow: rgba(0,0,0,.4) 0 1px 0;",
            "color: white;",
            "font-size: 15px;",
            "font-family: Helvetica, Arial, Sans-Serif;",
            "text-decoration: none;",
            "vertical-align: middle;",
            "}",
            ".button:hover {",
            "border-top-color: #28597a;",
            "background: #28597a;",
            "color: #ccc;",
            "}",
            ".button:active {",
            "border-top-color: #1b435e;",
            "background: #1b435e;",
            "}"
        ].join( '\n' );
        document.getElementsByTagName( "head" )[ 0 ].appendChild( css );
    },

    // Simple tooltips implementation
    SimpleTooltips: function ( options ) {
        this.options = options;

        var css = document.createElement( "style" );
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
            "}",
            ".simple-tooltip .name {",
            "font-weight: bold;",
            "color: #60b1fc;",
            "margin: 0;",
            "}",
            ".simple-tooltip .description {",
            "margin: 0;",
            "}"
        ].join( '\n' );
        document.getElementsByTagName( "head" )[ 0 ].appendChild( css );

        this.el = document.createElement( 'div' );
        this.el.className = 'simple-tooltip';
        document.body.appendChild( this.el );

        function showTooltip( e ) {
            var target = e.currentTarget;
            this.el.innerHTML = target.getAttribute( 'title' );
            this.el.style.display = 'block';
            this.el.style.left = ( $( target ).position().left + $( target ).get( 0 ).getBoundingClientRect().width ) + 'px';
            this.el.style.top = $( target ).position().top + 'px';
        }

        function hideTooltip( e ) {
            this.el.style.display = 'none';
        }

        var nodes = document.querySelectorAll( this.options.selector );
        for ( var i = 0; i < nodes.length; i++ ) {
            nodes[ i ].addEventListener( 'mouseover', showTooltip.bind( this ), false );
            nodes[ i ].addEventListener( 'mouseout', hideTooltip.bind( this ), false );
        }
    },

    // Create and display a dagre d3 graph
    createGraph: function () {

        // Include dagre and d3 script
        $.getScript( '../vendors/d3.js', function () {
            $.getScript( '../vendors/dagre-d3.js', function () {

                var g = new dagreD3.Digraph();

                g = this.generateNodeAndLink( g );

                // Add the style of the graph
                this.injectStyleElement();

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

                new this.SimpleTooltips( {
                    selector: '.node'
                } );

                var self = this;

                // Do a console log of the node (or stateset) and save it in Window.*
                $( '.node' ).click( function () {
                    var identifier = $( this ).attr( 'title' ).split( '<' )[ 1 ].split( '>' )[ 1 ];
                    if ( identifier.search( 'StateSet' ) === -1 ) {
                        window.activeNode = self._fullNodeList[ identifier ];
                        console.log( 'window.activeNode is set.' );
                        console.log( self._fullNodeList[ identifier ] );
                    } else {
                        var stateset = self._fullNodeList[ identifier.split( ' ' )[ 2 ] ].stateset;
                        window.activeStateset = stateset;
                        console.log( 'window.activeStateset is set.' );
                        console.log( stateset );
                    }

                } );

            }.bind( this ) );
        }.bind( this ) );
    },

    // Subfunction of createGraph, will iterate to create all the node and link in dagre
    generateNodeAndLink: function ( g ) {
        for ( var i = 0; i < this._nodeListSize; i++ ) {
            var element = this._nodeList[ i ];

            g.addNode( element.instanceID, {
                label: element.className + ( element.name ? '\n' + element.name : '' ),
                description: ( element.stateset != null ? 'StateSetID : ' + element.stateset.statesetID : '' ) + ( element.stateset != null && element.matrix !== '' ? '<br /><br />' : '' ) + element.matrix
            } );

            if ( element.stateset != null ) {

                g.addNode( element.stateset.name, {
                    label: 'StateSet',
                    description: 'numTexture : ' + element.stateset.numTexture,
                    style: 'fill: #0099FF;stroke-width: 0px;'
                } );

                g.addEdge( null, element.instanceID, element.stateset.name, {
                    style: 'stroke: #0099FF;'
                } );
            }
        }

        for ( i = 0; i < this._linkListSize; i++ ) {
            g.addEdge( null, this._linkList[ i ].parentNode, this._linkList[ i ].childrenNode );
        }

        return g;
    },

    // Create an array to display the matrix
    createMatrixGrid: function ( node, nodeMatrix ) {

        nodeMatrix += '<table><tr><td>' + node.matrix[ 0 ] + '</td>';
        nodeMatrix += '<td>' + node.matrix[ 1 ] + '</td>';
        nodeMatrix += '<td>' + node.matrix[ 2 ] + '</td>';
        nodeMatrix += '<td>' + node.matrix[ 3 ] + '</td></tr>';

        nodeMatrix += '<tr><td>' + node.matrix[ 4 ] + '</td>';
        nodeMatrix += '<td>' + node.matrix[ 5 ] + '</td>';
        nodeMatrix += '<td>' + node.matrix[ 6 ] + '</td>';
        nodeMatrix += '<td>' + node.matrix[ 7 ] + '</td></tr>';

        nodeMatrix += '<tr><td>' + node.matrix[ 8 ] + '</td>';
        nodeMatrix += '<td>' + node.matrix[ 9 ] + '</td>';
        nodeMatrix += '<td>' + node.matrix[ 10 ] + '</td>';
        nodeMatrix += '<td>' + node.matrix[ 11 ] + '</td></tr>';

        nodeMatrix += '<tr><td>' + node.matrix[ 12 ] + '</td>';
        nodeMatrix += '<td>' + node.matrix[ 13 ] + '</td>';
        nodeMatrix += '<td>' + node.matrix[ 14 ] + '</td>';
        nodeMatrix += '<td>' + node.matrix[ 15 ] + '</td></tr></table>';

        return nodeMatrix;
    },

    // Get the stateset and create the stateset display structure
    createStateset: function ( node, stateset ) {
        stateset = {
            name: 'StateSet - ' + node.getInstanceID(),
            statesetID: node.stateset.getInstanceID(),
            parentID: node.getInstanceID(),
            stateset: node.stateset,
            numTexture: node.stateset.getNumTextureAttributeLists()
        };
        return stateset;
    },

    getNodeListSize: function () {
        return this._nodeListSize;
    },

    getFullNodeList: function () {
        return this._fullNodeList;
    },

    getNodeList: function () {
        return this._nodeList;
    },

    getLinkListSize: function () {
        return this._linkListSize;
    },

    getLinkList: function () {
        return this._linkList;
    }

} );
