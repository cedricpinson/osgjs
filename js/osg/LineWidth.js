/*global define */

define( [
    'osg/osg',
    'osg/StateAttribute',
], function ( osg, StateAttribute ) {

    var LineWidth = function ( lineWidth ) {
        StateAttribute.call( this );
        this.lineWidth = 1.0;
        if ( lineWidth !== undefined ) {
            this.lineWidth = lineWidth;
        }
    };
    LineWidth.prototype = osg.objectLibraryClass( osg.objectInehrit( StateAttribute.prototype, {
        attributeType: 'LineWidth',
        cloneType: function () {
            return new LineWidth();
        },
        getType: function () {
            return this.attributeType;
        },
        getTypeMember: function () {
            return this.attributeType;
        },
        apply: function ( state ) {
            state.getGraphicContext().lineWidth( this.lineWidth );
        }
    } ), 'osg', 'LineWidth' );

    return LineWidth;
} );