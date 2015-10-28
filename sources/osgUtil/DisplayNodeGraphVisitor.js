define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osgAnimation/MorphGeometry'

], function ( MACROUTILS, NodeVisitor, MorphGeometry ) {

    'use strict';

    // Make the jquery dependency optional
    try {
        var $ = require( 'jquery' );
    } catch ( e ) {
        throw new Error( 'jQuery is required to use the DisplayNodeGraphVisitor' );
    }

    // Simple tooltips implementation
    var SimpleTooltips = function ( options ) {

        this.options = options;
        var css = document.createElement( 'style' );
        css.type = 'text/css';
        css.innerHTML = [
            '.osgDebugSimpleTooltip {',
            'display: none;',
            'position: absolute;',
            'margin-left: 10px;',
            'border-radius: 4px;',
            'padding: 10px;',
            'background: rgba(0,0,0,.9);',
            'color: #ffffff;',
            '}',
            '.osgDebugSimpleTooltip:before {',
            'content: ',
            ';',
            'position: absolute;',
            'left: -10px;',
            'top: 8px;',
            'border: 10px solid transparent;',
            'border-width: 10px 10px 10px 0;',
            'border-right-color: rgba(0,0,0,.9);',
            '}'
        ].join( '\n' );
        document.getElementsByTagName( 'head' )[ 0 ].appendChild( css );

        this.el = document.createElement( 'div' );
        this.el.className = 'osgDebugSimpleTooltip';
        document.body.appendChild( this.el );
        var nodes = document.querySelectorAll( this.options.selector );
        for ( var i = 0; i < nodes.length; i++ ) {
            nodes[ i ].addEventListener( 'mouseover', this.showTooltip.bind( this ), false );
            nodes[ i ].addEventListener( 'mouseout', this.hideTooltip.bind( this ), false );
        }
    };
    SimpleTooltips.prototype = {
        showTooltip: function ( e ) {
            var target = e.currentTarget;
            this.el.innerHTML = target.getAttribute( 'title' );
            this.el.style.display = 'block';
            this.el.style.left = ( $( target ).position().left + $( target ).get( 0 ).getBoundingClientRect().width ) + 'px';
            this.el.style.top = $( target ).position().top + 'px';
        },
        hideTooltip: function ( /* e */) {
            this.el.style.display = 'none';
        }
    };


    var DisplayNodeGraphVisitor = function () {
        NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );

        this._fullNodeList = []; // indexed with instanceID, references nodes, stateSet, sourceGeometry...
        this._nodeList = []; // array with all the nodes
        this._linkList = []; // edges
        this._focusedElement = 'graph';

        this._idToDomElement = new window.Map();
        this._uniqueEdges = new window.Set();

        this._cbSelect = undefined; // callback when selecting a node

        this._$svg = $( '<svg width=100% height=100%></svg>' );
        $( 'body' ).append( this._$svg );

        this._css = '.node {text-align: center;cursor: pointer;}.node rect {stroke: #FFF;}.edgePath path {stroke: #FFF;fill: none;}table {text-align: right;}svg {position: absolute;left: 0px;top: 0px;}.osgDebugButton {position: absolute;left: 15px;top: 15px;z-index: 5;border: 0;background: #65a9d7;background: -webkit-gradient(linear, left top, left bottom, from(#3e779d), to(#65a9d7));background: -webkit-linear-gradient(top, #3e779d, #65a9d7);background: -moz-linear-gradient(top, #3e779d, #65a9d7);background: -ms-linear-gradient(top, #3e779d, #65a9d7);background: -o-linear-gradient(top, #3e779d, #65a9d7);padding: 5px 10px;-webkit-border-radius: 7px;-moz-border-radius: 7px;border-radius: 7px;-webkit-box-shadow: rgba(0,0,0,1) 0 1px 0;-moz-box-shadow: rgba(0,0,0,1) 0 1px 0;box-shadow: rgba(0,0,0,1) 0 1px 0;text-shadow: rgba(0,0,0,.4) 0 1px 0;color: white;font-size: 15px;font-family: Helvetica, Arial, Sans-Serif;text-decoration: none;vertical-align: middle;}.osgDebugButton:hover {border-top-color: #28597a;background: #28597a;color: #ccc;}.osgDebugButton:active {border-top-color: #1b435e;background: #1b435e;}.osgDebugSimpleTooltip .osgDebugName {font-weight: bold;color: #60b1fc;margin: 0;}.osgDebugSimpleTooltip .osgDebugDescription {margin: 0;}';
    };

    DisplayNodeGraphVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
        setCallbackSelect: function ( cb ) {
            this._cbSelect = cb;
        },
        apply: function ( node ) {
            if ( node._isNormalDebug )
                return;

            if ( this._fullNodeList[ node.getInstanceID() ] !== node ) {
                this._nodeList.push( node );
            }

            if ( this.nodePath.length >= 2 ) {
                var parentID = this.nodePath[ this.nodePath.length - 2 ].getInstanceID();
                var childID = node.getInstanceID();
                var key = parentID + '+' + childID;
                if ( !this._uniqueEdges.has( key ) ) {
                    this._linkList.push( {
                        parentNode: parentID,
                        childrenNode: childID
                    } );
                    this._uniqueEdges.add( key );
                }
            }

            this.traverse( node );
        },

        reset: function () {
            this._$svg.empty();
            this._fullNodeList.length = 0;
            this._nodeList.length = 0;
            this._linkList.length = 0;
            this._uniqueEdges.clear();
            this._focusedElement = 'scene';
            $( '.osgDebugButton' ).hide();
        },

        focusOnScene: function () {
            $( '.osgDebugButton' ).text( 'Access to the graph' );
            this._$svg.css( 'zIndex', '-2' );
            this._focusedElement = 'scene';
        },

        focusOnGraph: function () {
            $( '.osgDebugButton' ).text( 'Access to the scene' );
            this._$svg.css( 'zIndex', '2' );
            $( '.osgDebugSimpleTooltip' ).css( 'zIndex', '3' );
            this._focusedElement = 'graph';
        },

        // Apply all the style
        injectStyleElement: function () {
            if ( this._cssInjected )
                return;
            this._cssInjected = true;

            $( 'body' ).append( '<button class="osgDebugButton">Access to the scene</button>' );
            $( '.osgDebugButton' ).click( function () {
                if ( this._focusedElement === 'scene' )
                    this.focusOnGraph();
                else
                    this.focusOnScene();
            }.bind( this ) );

            var css = document.createElement( 'style' );
            css.type = 'text/css';
            css.innerHTML = this._css;
            document.getElementsByTagName( 'head' )[ 0 ].appendChild( css );
        },

        // Create and display a dagre d3 graph
        createGraph: function () {
            if ( window.d3 && window.dagreD3 ) {
                this.createGraphApply();
                return;
            }
            var d3url = '//cdnjs.cloudflare.com/ajax/libs/d3/3.4.13/d3.min.js';
            var dagreurl = '//cdn.jsdelivr.net/dagre-d3/0.2.9/dagre-d3.min.js';
            $.getScript( d3url ).done( function () {
                $.getScript( dagreurl ).done( this.createGraphApply.bind( this ) );
            }.bind( this ) );
        },

        createGraphApply: function () {
            var g = new window.dagreD3.Digraph();

            g = this.g = this.generateNodeAndLink( g );

            // Add the style of the graph
            this.injectStyleElement();
            $( '.osgDebugButton' ).show();

            // Create the renderer
            var renderer = this.renderer = new window.dagreD3.Renderer();

            // Set up an SVG group so that we can translate the final graph.
            var svg = window.d3.select( this._$svg.get( 0 ) );
            var svgGroup = svg.append( 'g' );

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
                return '<p class="osgDebugName">' + name + '</p><pre class="osgDebugDescription">' + description + '</pre>';
            };

            var idToDom = this._idToDomElement;
            // Override drawNodes to set up the hover.
            var oldDrawNodes = renderer.drawNodes();
            renderer.drawNodes( function ( g, svg ) {
                var svgNodes = oldDrawNodes( g, svg );

                // Set the title on each of the nodes and use tipsy to display the tooltip on hover
                svgNodes.attr( 'title', function ( d ) {
                    idToDom.set( d, this );
                    return styleTooltip( d, g.node( d ).description );
                } );

                return svgNodes;
            } );

            // Run the renderer. This is what draws the final graph.
            renderer.run( g, svgGroup );

            this.tooltip = new SimpleTooltips( {
                selector: '.node'
            } );

            // Do a console log of the node (or stateset) and save it in window.*
            $( '.node' ).click( this.onNodeSelect.bind( this ) );
            this.focusOnGraph();
        },
        selectNode: function ( node ) {
            var id = node.getInstanceID();
            var dom = this._idToDomElement.get( id );
            if ( dom )
                $( dom ).click();
        },
        onNodeSelect: function ( e ) {
            var target = e.currentTarget;
            var identifier = $( target.getAttribute( 'title' ) )[ 0 ].innerHTML;
            var fnl = this._fullNodeList;

            if ( this.lastStateSet )
                this.lastStateSet.childNodes[ 0 ].style.fill = '#09f';
            if ( this.lastNode )
                this.lastNode.childNodes[ 0 ].style.fill = '#fff';
            this.lastStateSet = this.lastNode = null;
            target.childNodes[ 0 ].style.fill = '#f00';

            var elt = fnl[ identifier ];

            if ( elt.className() !== 'StateSet' ) {
                this.lastNode = target;
                window.activeNode = elt;
                console.log( 'window.activeNode is set.' );
                console.log( window.activeNode );
            } else {
                this.lastStateSet = target;
                window.activeStateset = elt;
                console.log( 'window.activeStateset is set.' );
                console.log( window.activeStateset );
            }
            if ( this._cbSelect )
                this._cbSelect( elt );
        },
        // Subfunction of createGraph, will iterate to create all the node and link in dagre
        generateNodeAndLink: function ( g ) {

            var fullNodeList = this._fullNodeList;
            var nodeList = this._nodeList;
            var i = 0;
            var nodeLength = nodeList.length;

            for ( i = 0; i < nodeLength; i++ ) {
                var node = nodeList[ i ];

                fullNodeList[ node.getInstanceID() ] = node;

                var description = '';
                if ( node.getMatrix && node.getMatrix() ) {
                    description += '<br /><br />' + this.createMatrixGrid( node, node.getMatrix() );
                }

                g.addNode( node.getInstanceID(), {
                    label: node.className() + ( node.getName() ? '\n' + node.getName() : '' ),
                    description: description,
                    style: 'fill: ' + this.getColorFromClassName( node.className() ) + ';stroke-width: 0px;'
                } );

                //////////////////
                // STATESET
                //////////////////
                var stateSet = node.getStateSet();
                if ( stateSet ) {

                    var stateSetID = stateSet.getInstanceID();
                    fullNodeList[ stateSetID ] = stateSet;

                    if ( !g.hasNode( stateSetID ) ) {
                        g.addNode( stateSetID, {
                            label: 'StateSet',
                            description: 'numTexture : ' + stateSet.getNumTextureAttributeLists(),
                            style: 'fill: ' + this.getColorFromClassName( stateSet.className() ) + ';stroke-width: 0px;'
                        } );
                    }

                    g.addEdge( null, node.getInstanceID(), stateSetID, {
                        style: 'stroke: ' + this.getColorFromClassName( stateSet.className() ) + ';'
                    } );
                }

                //////////////////
                // SOURCE GEOMETRY
                //////////////////
                var sourceGeom = node.getSourceGeometry && node.getSourceGeometry();
                if ( sourceGeom && sourceGeom instanceof MorphGeometry ) {

                    var sourceGeomID = sourceGeom.getInstanceID();
                    fullNodeList[ sourceGeomID ] = stateSet;

                    g.addNode( sourceGeomID, {
                        label: sourceGeom.className() + ( sourceGeom.getName() ? '\n' + sourceGeom.getName() : '' ),
                        style: 'fill: ' + this.getColorFromClassName( sourceGeom.className() ) + ';stroke-width: 0px;'
                    } );

                    g.addEdge( null, node.getInstanceID(), sourceGeomID, {
                        style: 'stroke: ' + this.getColorFromClassName( sourceGeom.className() ) + ';'
                    } );
                }
            }

            var linkList = this._linkList;
            var linkLength = this._linkList.length;
            for ( i = 0; i < linkLength; i++ ) {
                g.addEdge( null, linkList[ i ].parentNode, linkList[ i ].childrenNode );
            }

            return g;
        },

        getColorFromClassName: function ( name ) {
            switch ( name ) {
            case 'Geometry':
                return '#FFCC55';
            case 'RigGeometry':
                return '#DD8800';
            case 'MorphGeometry':
                return '#AA5500';
            case 'MatrixTransform':
                return '#CE697E';
            case 'StateSet':
                return '#0099FF';
            case 'Skeleton':
                return '#96999E';
            case 'Bone':
                return '#A9DEAA';
            case 'Node':
                return '#FFFFFF';
            default:
                return '#FF00AA';
            }
        },

        // Create an array to display the matrix
        createMatrixGrid: function ( node, matrixArray ) {

            var nodeMatrix = '';

            nodeMatrix += '<table><tr><td>' + matrixArray[ 0 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 4 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 8 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 12 ] + '</td></tr>';

            nodeMatrix += '<tr><td>' + matrixArray[ 1 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 5 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 9 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 13 ] + '</td></tr>';

            nodeMatrix += '<tr><td>' + matrixArray[ 2 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 6 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 10 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 14 ] + '</td></tr>';

            nodeMatrix += '<tr><td>' + matrixArray[ 3 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 7 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 11 ] + '</td>';
            nodeMatrix += '<td>' + matrixArray[ 15 ] + '</td></tr></table>';

            return nodeMatrix;
        },

        getFullNodeList: function () {
            return this._fullNodeList;
        },

        getNodeList: function () {
            return this._nodeList;
        },

        getLinkList: function () {
            return this._linkList;
        }

    } );

    return DisplayNodeGraphVisitor;
} );
