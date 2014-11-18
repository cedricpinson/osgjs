define( [
    'osg/Utils',
    'osg/StateAttribute',
], function ( MACROUTILS, StateAttribute ) {

    var LineWidth = function ( lineWidth ) {
        StateAttribute.call( this );
        this.lineWidth = 1.0;
        if ( lineWidth !== undefined ) {
            this.lineWidth = lineWidth;
        }
    };
    LineWidth.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( StateAttribute.prototype, {
        attributeType: 'LineWidth',
        cloneType: function () {
            return new LineWidth();
        },
        apply: function ( state ) {
            state.getGraphicContext().lineWidth( this.lineWidth );
        }
    } ), 'osg', 'LineWidth' );

    return LineWidth;
} );
