define( [ 'tests/vendors/benchmark',
    'tests/mockup/mockup',
    'osg/Matrix',
    'osg/Quat',
    'osgAnimation/StackedRotateAxis',
    'osgAnimation/StackedTranslate',
    'osgAnimation/StackedScale'

], function ( Benchmark, mockup, Matrix, Quat, StackedRotateAxis, StackedTranslate, StackedScale ) {

    'use strict';

    return function () {

        //'osgAnimation'
        var suite = new Benchmark.Suite();

        // Additional options for the test
        var options = {
            'setup': function () {

                var matrix = this.options.Matrix.create();
                var st = new this.options.StackedScale( 'scale', 0.5 );

            },
            'teardown': function () {

            },
            // access to class at benchmark scope
            Matrix: Matrix,
            StackedScale: StackedScale
        };

        suite.add(
            'StackedScale#1',
            function () {

                //console.log( 'aaa', st );
                st.applyToMatrix( matrix );
                st.applyToMatrix( matrix );
                //console.log( 'aaaend', st );

            },
            options
        );

        suite.add(
            'StackedScale#2',
            function () {

                //console.log( 'aaa', st );
                st.applyToMatrix( matrix );
                //console.log( 'aaaend', st );

            },
            options
        );

        suite.on( 'start', function ( n ) {
            console.log( 'start', n );
        } );
        /*        suite.on( 'cycle', function ( n ) {

                    console.log( 'cycle', n );
                } );
        */
        // add listeners
        suite.on( 'complete', function ( n ) {
            console.log( 'complete', n );
            console.log( 'Fastest is ' + this.filter( 'fastest' ).pluck( 'name' ) );
        } );
        // add listeners
        suite.on( 'error', function ( n ) {
            console.log( 'error', n );
        } );

        // run async
        suite.run( {
            'async': true
        } );


    };
} );
