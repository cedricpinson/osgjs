### Status
[![Build Status](https://travis-ci.org/cedricpinson/osgjs.png)](https://travis-ci.org/cedricpinson/osgjs)

OSG.JS WebGL framework
----------------------------

(http://osgjs.org/)

OSGJS is a WebGL framework based on OpenSceneGraph concepts. It allows an individual to use an “OpenSceneGraph-like” toolbox to interact with WebGL via JavaScript, and provides facilities for exporting various assets to the osgjs format. The API is kept as similar to OpenSceneGraph as possible, providing a familiar environment to veterans of the library and introducing newcomers to a popular and heavily-scrutinzed set of interfaces


The mailing list is available here: http://groups.google.com/group/osgjs

If you are interested in contributing, contact us on the IRC channels #webgl on Freenode, or by e-mail at contact@osgjs.org. Follow @trigrou on twitter to get news and update


How to build your own osgjs
----------------------------


First, clone a copy of the main git repo by running:


    git clone git://github.com/cedricpinson/osgjs.git
    cd osgjs
    npm install # before you may need to npm install -g grunt-cli
    grunt build


The built version of osgjs will be put in the `build/` subdirectory.

Running the examples
--------------------

Simply type in the command-line:

    grunt serve

It should open a browser pointing to the examples directory.

OpenSceneGraph osgjs plugin
----------------------------

There is a plugin on my openscengraph branch https://github.com/cedricpinson/osg. This plugin will help you to export data from osg to osgjs. More instructions are available on the [wiki](https://github.com/cedricpinson/osgjs/wiki/Convert-model-with-OSG)
