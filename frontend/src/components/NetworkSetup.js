import {
  NodeGroupStyles,
  Layout,
  VisNodes,
  VisPhysics
} from '../../static/NetTopologyStyle.js';


function getNetworkOptions() {
  return {
    interaction: {
      hover: true
    },
    nodes: VisNodes,
    groups: NodeGroupStyles,
    layout: Layout,
    physics: VisPhysics
  };
}

export { getNetworkOptions };
export default getNetworkOptions;
