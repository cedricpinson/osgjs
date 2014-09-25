define( [
	'vendors/JQuery',
	'vendors/D3',
	'vendors/Dagre',
	'vendors/Tipsy',

    'osg/Utils',
    'osg/NodeVisitor'
], function ( $, D3, Dagre, Tipsy, MACROUTILS, NodeVisitor ) {

    'use strict';

    var DebugVisitor = function () {
        NodeVisitor.call( this );
        this.nodeListSize = 0;
        this.fullNodeList = [];
        this.nodeList = [];
        this.linkListSize = 0;
        this.linkList = [];
    };

    DebugVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {

        apply: function ( node ) {

            //If the node have a matrix, iterate to create a perfect grid
            var nodeMatrix = '';
            if ( node.matrix ) {
                var maxSize = 0;
                var firstRowMaxSize = 0;
                for ( i = 0; i < 16; i++ ) {
                    if ( ( node.matrix[ i ] + '' ).length > maxSize ) {
                        maxSize = ( node.matrix[ i ] + '' ).length;
                    }
                    if ( i % 4 === 0 && ( node.matrix[ i ] + '' ).length > firstRowMaxSize ) {
                        firstRowMaxSize = ( node.matrix[ i ] + '' ).length;
                    }
                }
                maxSize++;
                for ( i = 0; i < 16; i++ ) {
                    if ( i % 4 === 0 ) {
                        for ( j = ( node.matrix[ i ] + '' ).length; j < firstRowMaxSize; j++ ) {
                            nodeMatrix += ' ';
                        }
                    } else {
                        for ( j = ( node.matrix[ i ] + '' ).length; j < maxSize; j++ ) {
                            nodeMatrix += ' ';
                        }
                    }
                    nodeMatrix += node.matrix[ i ];
                    if ( ( i + 1 ) % 4 === 0 ) {
                        nodeMatrix += '<br />';
                    }
                }
            }

            var stateset = null;
            if ( node.stateset ) {
                stateset = {
                    name: 'StateSet - ' + node.getInstanceID(),
                    statesetID: node.stateset.getInstanceID(),
                    parentID: node.getInstanceID(),
                    stateset: node.stateset,
                    numTexture: node.stateset.getNumTextureAttributeLists()
                };
            }

            this.fullNodeList[ node.getInstanceID() ] = node;

            this.nodeList[ this.nodeListSize ] = {
                name: node.getName(),
                className: node.className(),
                instanceID: node.getInstanceID(),
                stateset: stateset,
                matrix: nodeMatrix
            };
            this.nodeListSize++;

            //Iterate on the childs to store all the links
            for ( var childID in node.children ) {
                this.linkList[ this.linkListSize ] = {
                    parentNode: node.getInstanceID(),
                    childrenNode: node.children[ childID ].getInstanceID()
                };
                this.linkListSize++;
            }

            this.traverse( node );
        },

        createGraph: function () {

            var g = new Dagre.Digraph();

            for ( i = 0; i < this.nodeListSize; i++ ) {
                g.addNode( this.nodeList[ i ].instanceID, {
                    label: this.nodeList[ i ].className + ( this.nodeList[ i ].name ? '\n' + this.nodeList[ i ].name : '' ),
                    description: ( this.nodeList[ i ].stateset != null ? 'StateSetID : ' + this.nodeList[ i ].stateset.statesetID : '' ) + ( this.nodeList[ i ].stateset != null && this.nodeList[ i ].matrix !== '' ? '<br /><br />' : '' ) + this.nodeList[ i ].matrix
                } );

                if ( this.nodeList[ i ].stateset != null ) {
                    g.addNode( this.nodeList[ i ].stateset.name, {
                        label: 'StateSet',
                        description: 'numTexture : ' + this.nodeList[ i ].stateset.numTexture,
                        style: 'fill: #0099FF;stroke-width: 0px;'
                    } );

                    g.addEdge( null, this.nodeList[ i ].instanceID, this.nodeList[ i ].stateset.name, {
                        style: 'stroke: #0099FF;'
                    } );
                }
            }

            for ( i = 0; i < this.linkListSize; i++ ) {
                g.addEdge( null, this.linkList[ i ].parentNode, this.linkList[ i ].childrenNode );
            }

            // Create the renderer
            var renderer = new Dagre.Renderer();

            // Set up an SVG group so that we can translate the final graph.
            var svg = D3.select( 'svg' ),
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
                    console.log( this.fullNodeList[ identifier ] );
                } else {
                    console.log( this.fullNodeList[ identifier.split( ' ' )[ 2 ] ].stateset );
                }

            } );

        }

    } );

    return DebugVisitor;
} );