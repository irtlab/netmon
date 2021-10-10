import {
  processNode,
  processEdge,
  getNodeTitle,
  getLinkTitle,
  getCombinedLinks,
  getCombinedDevices
} from '../utils/ProcessNodeAndEdgeData.js';
import { getEdgeStyleData } from './style';
import { HasKey } from '../utils/utils.js';


class NetworkTopology {
  constructor(network_data, network_options, selected_vlan, only_links = 0,
    node_coordinates = null, nested_items = {}) {
    this.nested_items = nested_items;
    this.only_links = only_links;
    this.node_coordinates = node_coordinates;
    this.network_data = network_data[selected_vlan];
    this.network_options = network_options;
    this.nodes = [];
    this.edges = [];
    this.info_object = {nodes: {}, edges: {}};
    this.vlan = selected_vlan;
    this.generateData();
  }

  get getNodes() {
    return this.nodes;
  }

  get getEdges() {
    return this.edges;
  }

  get deviceInfo() {
    return this.info_object;
  }

  generateData() {
    let nodes = [];
    let edges = [];
    let iterator = Number(0);
    let sorted_network_ids = {};

    const new_nodes = this.network_data.nodes;
    for (const current_node of Object.values(new_nodes)) {
      const modified_name = processNode(current_node);
      const node_object = this.generateNodeObject(current_node.id, modified_name, current_node);
      node_object.hostname = NetworkTopology.parseHostname(node_object.hostname);

      if (this.node_coordinates && HasKey(this.node_coordinates, node_object.id)) {
        const x_y_data = this.node_coordinates[node_object.id];
        node_object['x'] = x_y_data.x;
        node_object['y'] = x_y_data.y;
      }

      nodes.push(node_object);
      sorted_network_ids[node_object.id] = {id: node_object.id, idx: iterator};
      iterator++;
    }


    // I do this because there are more than two connected devices to one node and drawing
    // is slow. It is better to have one device and that contains all information. If I want
    // to see all connected devices on the map I just comment following 4 lines.
    if (this.nested_items.nodes) {
      const ret_val = getCombinedDevices(this.network_data, nodes, this.node_coordinates);
      this.network_data = ret_val.network_data;
      nodes = ret_val.vis_updated_nodes;
      sorted_network_ids = ret_val.nodes_idx;
    }


    // Detecting connections
    this.network_options.groups[this.vlan] = {color: {background: 'red'}, margin: 10};
    if (this.network_data.links.length) {
      const links = this.network_data.links;
      for (let i = 0; i < links.length; i++) {
        const current_link = links[i];
        const idFrom = current_link.src_id;
        const idTo = current_link.dst_id;
        const connected_devs = {fromDev: null, toDev: null};
        let from = 0;
        let to = 0;
        for (let j = 0; j < nodes.length; j++) {
          if (nodes[j].id && nodes[j].id === idFrom) {
            to = nodes[j].id;
            connected_devs.toDev = nodes[j];
          } else if (nodes[j].id && nodes[j].id === idTo) {
            from = nodes[j].id;
            connected_devs.fromDev = nodes[j];
          }
        }

        const edge_group_name = processEdge(connected_devs, current_link);
        if (edge_group_name) {
          const edge_title = getLinkTitle(current_link);
          const edge_object = JSON.parse(JSON.stringify(getEdgeStyleData(edge_group_name)));
          edge_object['type'] = 'link';
          edge_object['titleObject'] = edge_title;
          edge_object['from'] = to;
          edge_object['to'] = from;
          edge_object['id'] = current_link.id;
          edge_object['timestamp'] = current_link.timestamp;
          edge_object['link_quality'] = current_link.attributes['linkQuality'];
          edges.push({ ...edge_object});
        }
      }
    }

    if (Object.keys(this.network_data.visible_devs).length && this.only_links === 0) {
      for (const [phoenixID, visibleDevs] of Object.entries(this.network_data.visible_devs)) {
        for (let i = 0; i < visibleDevs.length; i++) {
          const fromNode = sorted_network_ids[visibleDevs[i]];
          const toNode = sorted_network_ids[phoenixID];
          if (fromNode && toNode) {
            const edge_group_name =
              processEdge({fromDev: nodes[fromNode.idx], toDev: nodes[toNode.idx]});
            if (edge_group_name) {
              const edge_object = JSON.parse(JSON.stringify(getEdgeStyleData(edge_group_name)));
              edge_object['type'] = 'lan';
              edge_object['titleObject'] = [{status: 'This is Ethernet connection.'}];
              edge_object['from'] = fromNode.id;
              edge_object['to'] = toNode.id;
              edges.push({ ...edge_object});
            }
          }
        }
      }
    }

    // I do this because there are more than two edges between two nodes and it is confusing,
    // It is better to have one edge and that contains all information. If I want to see all
    // links on the map I just comment this line.
    if (this.nested_items.edges) {
      edges = getCombinedLinks(edges);
    }

    this.nodes = nodes;
    this.nodes.forEach((value) => {
      this.info_object.nodes[value.id] = value.title;
    });

    this.edges = edges;
    this.edges.forEach((value) => {
      this.info_object.edges[value.id] = value.title;
    });
  }

  generateNodeObject(id, group_name, node) {
    let label = NetworkTopology.parseHostname(node.hostname);
    if (node.type === 'Phoenix Box' && HasKey(node, 'substation_name') &&
        node.substation_name) {
      label = node.substation_name;
    }

    node.hostname = NetworkTopology.parseHostname(node.hostname);
    const node_title = getNodeTitle(node);
    this.info_object.nodes[id] = node_title;
    return {
      id,
      type: node.type,
      status: node.status,
      group: group_name,
      title: node_title,
      label
    };
  }

  // Remove evrything after the dot in hostname.
  static parseHostname(hostname) {
    if (hostname) {
      return hostname.split('.')[0];
    }
    return '';
  }
}

export { NetworkTopology };
export default NetworkTopology;
