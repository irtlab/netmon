function HasKey(obj, key) {
  const has = Object.prototype.hasOwnProperty;
  return has.call(obj, String(key));
}


function getEdgesToBeUpdated(dataset, edges) {
  const current_edges = {};
  dataset.forEach((curr_edge) => {
    if (curr_edge.type === 'link') {
      current_edges[curr_edge.id] = curr_edge.color.color;
    }
  });

  const edges_to_update = [];
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    if (edge.type === 'link') {
      if (HasKey(current_edges, edge.id)) {
        if (current_edges[edge.id] !== edge.color.color) {
          edges_to_update.push({ ...edge});
        }
      } else {
        // This is a new edge and will be added by update() method.
        edges_to_update.push({ ...edge});
      }
    } else if (!HasKey(current_edges, edge.id)) {
      // This can happen if there is a new device and I have to show
      // a line between node and device.
      edges_to_update.push({ ...edge});
    }
  }

  return edges_to_update;
}



function getNodesToBeUpdated(dataset, nodes) {
  const current_nodes = {};
  dataset.forEach((curr_node) => {
    current_nodes[curr_node.id] = curr_node;
  });

  const nodes_to_update = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (HasKey(current_nodes, node.id)) {
      if (current_nodes[node.id].status !== node.status) {
        nodes_to_update.push({ ...node});
      }
    } else {
      // This is a new node and will be added by update() method.
      nodes_to_update.push({ ...node});
    }
  }

  return nodes_to_update;
}


export { HasKey, getEdgesToBeUpdated, getNodesToBeUpdated };
