define( [
    'osg/Utils',
    'osg/Notify',
    'osg/Object',
    'osgAnimation/FindNearestParentSkeleton'
], function ( MACROUTILS, Notify, ObjectBase, FindNearestParentSkeleton ) {

    'use strict';

    // converted from C++ probably it could be merged into RigGeometry
    // it could probably inlined into RigGeometry code
    var UpdateRigGeometry = function () {
        ObjectBase.call( this );
    };

    UpdateRigGeometry.prototype = MACROUTILS.objectInherit( ObjectBase.prototype, {

        init: function ( geom ) {

            var finder = new FindNearestParentSkeleton();
            if ( geom.getParents().length > 1 )
                Notify.warn( 'A RigGeometry should not have multi parent ( ' + geom.getName() + ' )' );

            geom.getParents()[ 0 ].accept( finder );

            if ( !finder._root ) {
                Notify.warn( 'A RigGeometry did not find a parent skeleton for RigGeometry ( ' + geom.getName() + ' )' );
                return;
            }

            geom.setSkeleton( finder._root );
        },

        update: function ( node /*, nv*/ ) {

            // Circular ref
            if ( node && node.className() !== 'RigGeometry' ) return true;

            var geom = node;

            // maybe this code could simpler
            if ( !geom.getSkeleton() && geom.getParents().length !== 0 ) this.init( geom );
            if ( !geom.getSkeleton() ) return true;

            if ( geom.getNeedToComputeMatrix() ) geom.computeMatrixFromRootSkeleton();

            geom.update();

            return true;
        }

    } );


    /* virtual void update(osg::NodeVisitor*, osg::Drawable* drw) {
     RigGeometry* geom = dynamic_cast<RigGeometry*>(drw);
     if(!geom)
     return;
     if(!geom->getSkeleton() && !geom->getParents().empty())
     {
     RigGeometry::FindNearestParentSkeleton finder;
     if(geom->getParents().size() > 1)
     osg::notify(osg::WARN) << "A RigGeometry should not have multi parent ( " << geom->getName() << " )" << std::endl;
     geom->getParents()[0]->accept(finder);

     if(!finder._root.valid())
     {
     osg::notify(osg::WARN) << "A RigGeometry did not find a parent skeleton for RigGeometry ( " << geom->getName() << " )" << std::endl;
     return;
     }
     geom->buildVertexInfluenceSet();
     geom->setSkeleton(finder._root.get());
     }

     if(!geom->getSkeleton())
     return;

     if(geom->getNeedToComputeMatrix())
     geom->computeMatrixFromRootSkeleton();

     geom->update();
     }*/


    return UpdateRigGeometry;

} );
