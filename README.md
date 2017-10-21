### Status

[![Join the chat at https://gitter.im/cedricpinson/osgjs](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/cedricpinson/osgjs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/cedricpinson/osgjs.svg?branch=master)](https://travis-ci.org/cedricpinson/osgjs)
[![Coverity Status](https://scan.coverity.com/projects/9275/badge.svg)](https://scan.coverity.com/projects/cedricpinson-osgjs)
OSG.JS WebGL framework
----------------------------

(http://osgjs.org/)

OSGJS is a WebGL framework based on OpenSceneGraph concepts. It allows an individual to use an “OpenSceneGraph-like” toolbox to interact with WebGL via JavaScript, and provides facilities for exporting various assets to the osgjs format. The API is kept as similar to OpenSceneGraph as possible, providing a familiar environment to veterans of the library and introducing newcomers to a popular and heavily-scrutinzed set of interfaces


The mailing list is available here: http://groups.google.com/group/osgjs

If you are interested in contributing, contact us on the osgjs gitter channel ( https://gitter.im/cedricpinson/osgjs ) or on the IRC channel #osgjs on Freenode. Also by e-mail at contact@osgjs.org. Follow @trigrou on twitter to get news and updates.

Examples / Tutorials
-----------------------
- using osgjs with typescript http://marino.dk/mproject/ with sourcecode https://github.com/Crisium/mproject
- examples http://osgjs.org/#examples
- tutorials on codepen http://codepen.io/collection/CbvIg/


How to build your own osgjs
----------------------------

First, clone a copy of the main git repo by running:

    git clone git://github.com/cedricpinson/osgjs.git
    cd osgjs

Install required node dependencies:

    # if you dont have grunt-cli installed, use sudo on linux
    # npm install -g grunt-cli
    npm install

Compile:

    grunt build

Compile whenever watched files change:

    grunt watch

The built version of osgjs will be put in the `build/` subdirectory.

Running the examples
--------------------

Download the osgjs-data submodule repository. It will be added to the examples/media folder:

    grunt sync

Then simply type in the command-line:

    grunt serve

You can now test some real examples http://localhost:9000/examples http://localhost:9000/tutorial

Executing unitary tests
-----------------------

Launch:

    grunt test

Convert file to osgjs
---------------------

You can easily convert 3D file with osgconv tool. To do that you can get the docker image here https://hub.docker.com/r/trigrou/osg/ and use it to convert a 3d file into osgjs file format. There is more infos on [wiki](https://github.com/cedricpinson/osgjs/wiki/Convert-model-with-OSG)
