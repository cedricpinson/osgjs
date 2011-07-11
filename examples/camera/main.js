function createScene() {
    var canvas = document.getElementById("3DView");

    // create a camera that will render to texture
    rttSize = [512,512];
    var rttCamera = new osg.Camera();
    rttCamera.setName("rttCamera");
    rttCamera.setProjectionMatrix(osg.Matrix.makeOrtho(0, rttSize[0], 0, rttSize[1], -5, 5));
    rttCamera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    rttCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    rttCamera.setViewport(new osg.Viewport(0,0,rttSize[0],rttSize[1]));

    // we will render a textured quad on the rtt target with a fixed texture without
    // motion
    var textureQuad = osg.createTexturedQuad(0,0,0,
                                             rttSize[0], 0 ,0,
                                             0, rttSize[1],0);
    textureQuad.getOrCreateStateSet().setTextureAttributeAndMode(0, osg.Texture.createFromURL("textures/sol_trauma_periph.png"));
    rttCamera.addChild(textureQuad);

    // we attach the target texture to our camera
    var rttTargetTexture = new osg.Texture();
    rttTargetTexture.setTextureSize(rttSize[0],rttSize[1]);
    rttTargetTexture.setMinFilter('LINEAR');
    rttTargetTexture.setMagFilter('LINEAR');
    rttCamera.attachTexture(gl.COLOR_ATTACHMENT0, rttTargetTexture, 0);



    // now we want to use the result of the previous rtt
    // for this we will create a textured quad that will use the rtt
    // target texture
    var texturedQuadUsingTargetTexture = osg.createTexturedQuad(-25,-25,0,
                                                                50, 0 ,0,
                                                                0, 50 ,0);
    texturedQuadUsingTargetTexture.getOrCreateStateSet().setTextureAttributeAndMode(0, rttTargetTexture);

    var root = new osg.Node();

    // we add this quad to manipulate it with the mouse
    root.addChild(texturedQuadUsingTargetTexture);

    // we create a ortho camera to display the rtt in hud like
    var hudCamera = new osg.Camera();

    hudCamera.setProjectionMatrix(osg.Matrix.makeOrtho(0, canvas.width, 0, canvas.height, -5, 5));
    hudCamera.setViewMatrix(osg.Matrix.makeTranslate(25,25,0));
    hudCamera.setRenderOrder(osg.Camera.NESTED_RENDER, 0);
    hudCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);

    hudCamera.addChild(texturedQuadUsingTargetTexture);

    root.addChild(hudCamera);
    root.addChild(rttCamera);

    return root;
}


window.addEventListener("load",
                        function() {
                            var canvas = document.getElementById("3DView");
                            var w = window.innerWidth;
                            var h = window.innerHeight;
                            canvas.style.width = w;
                            canvas.style.height = h;
                            canvas.width = w;
                            canvas.height = h;

                            var viewer = new osgViewer.Viewer(document.getElementById("3DView"));
                            viewer.init();
                            viewer.setupManipulator();
                            viewer.setSceneData(createScene());
                            viewer.run();
                        }
                        ,true);
