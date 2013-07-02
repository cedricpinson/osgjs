module("osgGA");
test("osgGA.OrbitManipulator", function() {
    var manipulator = new osgGA.OrbitManipulator();
    var matrix = manipulator.getInverseMatrix();
    ok(matrix !== undefined, "check getInverseMatrix method");
});

test("osgGA.FirstPersonManipulator", function() {
    var manipulator = new osgGA.FirstPersonManipulator();
    var matrix = manipulator.getInverseMatrix();
    ok(matrix !== undefined, "check getInverseMatrix method");
});


test("osgGA.OrbitManipulator check controllers", function() {
    var manipulator = new osgGA.OrbitManipulator();
    var list = manipulator.getControllerList();
    ok(list.StandardMouseKeyboard !== undefined, "check mouse support");
    ok(list.Hammer !== undefined, "check hammer support");
});
