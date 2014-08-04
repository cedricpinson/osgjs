function getSimpleScene() {

    var root = new osg.Node();

    var sol = osg.createTexturedQuadGeometry(-20, -20, 0, 40, 0, 0, 0, 40, 0 );
    var cube = osg.createTexturedBoxGeometry( 0, 0, 0.5, 1, 1, 1 );
    var home = osg.createTexturedBoxGeometry( 0, 0, 0, 500, 500, 500 );

    home.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

    var boiteTexture = osg.Texture.createFromURL( 'textures/boite.png' );
    var solTexture = osg.Texture.createFromURL( 'textures/sol.jpg' );
    var skyboxTexture = osg.Texture.createFromURL( 'textures/miramar.jpg' );

    boiteTexture.setMinFilter(osg.Texture.LINEAR_MIPMAP_LINEAR);
    solTexture.setMinFilter(osg.Texture.LINEAR_MIPMAP_LINEAR);

    cube.getOrCreateStateSet().setTextureAttributeAndMode(0, boiteTexture);
    sol.getOrCreateStateSet().setTextureAttributeAndMode(0, solTexture);
    home.getOrCreateStateSet().setTextureAttributeAndMode(0, skyboxTexture);
    var node = new osg.Node();
    
    node.addChild(sol);
    node.addChild(cube);
    node.addChild(home);

    root.addChild(node);

    return root;
}       
