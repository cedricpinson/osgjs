### Installation

First, clone a copy of the main git repo by running:

    git clone git://github.com/cedricpinson/osgjs.git
    cd osgjs

    # if you dont have grunt-cli installed
    # npm install -g grunt-cli
    npm install

    grunt build
    # The built version of osgjs will be put in the `builds/` subdirectory

    # use 'webpack -w' when you are developing to rebuild automatically when a file change

    grunt serve
    # open http://localhost:9000/examples or http://localhost:9000/tutorial
