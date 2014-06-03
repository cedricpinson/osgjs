/**
 * @author Jordi Torres
 */



OSG.globalify();

var main = function () {
    osg.ReportWebGLError = true;
    var canvas = document.getElementById( "3DView" );
    var w = window.innerWidth;
    var h = window.innerHeight;
    osg.log( "size " + w + " x " + h );
    canvas.style.width = w;
    canvas.style.height = h;
    canvas.width = w;
    canvas.height = h;

    var stats = document.getElementById( "Stats" );
    var lod;
    var viewer;
    viewer = new osgViewer.Viewer( canvas, {
        antialias: true,
        alpha: true
    } );
    viewer.init();
    viewer.setupManipulator();

    viewer.getCamera().setClearColor( [ 1.0, 1.0, 1.0, 1.0 ] );
    viewer.setSceneData( createScene() );
    viewer.setupManipulator();
    viewer.run();
};

function createScene() {
    var lodNode = new osg.Lod();
    Q.when( osgDB.parseSceneGraph( getModelB() ) ).then( function ( o ) {
        lodNode.addChild( o, 0, 50 );
    } );

    Q.when( osgDB.parseSceneGraph( getModel() ) ).then( function ( data ) {
        lodNode.addChild( data, 50, Infinity );
    } );
    return lodNode;
}


window.addEventListener("load", main ,true);
