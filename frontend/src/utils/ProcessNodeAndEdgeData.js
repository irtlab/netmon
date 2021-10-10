import moment from 'moment';
import { HasKey } from './utils.js';


function convertLastupdateFormat(inputFormat) {
  if (!inputFormat) {
    return 'Unknown';
  }

  const thenUTC = moment.utc(inputFormat).format('YYYY-MM-DD HH:mm:ss');
  let nowUTC = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss');
  nowUTC = moment(nowUTC);
  const diff = moment.duration(nowUTC.diff(thenUTC)).humanize();
  return diff + ' ago';
}



function getBandwidthValue(bandwidth) {
  if (bandwidth === undefined) {
    return 'unknown';
  }

  const unit = 1000;
  const byteUnits = [' kbit/s', ' Mbits/s', ' Gbits/s', ' Tbits/s', 'Pbits/s'];
  const exp = Math.log(bandwidth) / Math.log(unit) | 0;
  let result = (bandwidth / Math.pow(unit, exp)).toFixed(2);
  result += (exp === 0 ? ' bits/s' : byteUnits[exp - 1]);
  return result;
}



function processNode(node) {
  let value = '';
  switch (node.type) {
    case ('Phoenix Box'): value = 'node';
      break;
    case ('Device'): value = 'device';
      break;
    default:
  }

  let thenUTC = moment.utc(node.last_update).format('YYYY-MM-DD HH:mm:ss');
  thenUTC = moment(thenUTC);
  let nowUTC = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss');
  nowUTC = moment(nowUTC);

  const duration = moment.duration(nowUTC.diff(thenUTC));
  const diffMinutes = duration.asMinutes();

  // By default device status is up, if device last_update and current UTC
  // millisecond's difference is 1 minute, then set device status to down.
  if (diffMinutes > 1) {
    node.status = 'down';
  }

  switch (node.status) {
    case ('up'): value += '_up';
      break;
    case ('down'): value += '_down';
      break;
    default:
  }
  return value;
}



function processEdge({fromDev, toDev}, link) {
  let value = '';
  if (!toDev || !fromDev) {
    return false;
  }

  // In case if connection comes from links
  if (link) {
    switch (fromDev.type) {
      case ('Phoenix Box'): fromDev.type === toDev.type ? value = 'link' : value = 'node';
        break;
      case ('Device'): value = 'device';
        break;
      default:
    }

    // By deafult it is set 'up'.
    const linkQuality = Number(link.attributes['linkQuality']);
    if (Number(linkQuality) <= Number(0.75) && Number(linkQuality) >= Number(0.5)) {
      link.status = 'low';
    } else if (Number(linkQuality) < Number(0.5)) {
      link.status = 'down';
    }

    let thenUTC = moment.utc(link.timestamp).format('YYYY-MM-DD HH:mm:ss');
    thenUTC = moment(thenUTC);
    let nowUTC = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss');
    nowUTC = moment(nowUTC);

    const duration = moment.duration(nowUTC.diff(thenUTC));
    const diffMinutes = duration.asMinutes();
    if (diffMinutes > 1) {
      link.status = 'down';
    }

    switch (link.status) {
      case ('up'): value += '_up';
        break;
      case ('down'): value += '_down';
        break;
      case ('low'): value += '_low';
        break;
      default:
    }
  } else { // In case if connection comes from visible_devs
    // returning this value because we have no other info about connection in visible devs
    value = 'visible_devs';
  }
  return value;
}



function getNodeTitle(node) {
  const statusesInTitle = {
    up: 'Online',
    down: 'Offline',
    low: 'low',
    congested: 'congested'
  };

  if (node.type === 'Phoenix Box' && HasKey(node, 'substation_name')) {
    return [{
      Hostname: node.hostname || node.label,
      'Substation name': node.substation_name,
      IPv4: node.ip,
      MAC: node.mac,
      Status: statusesInTitle[node.status],
      VLAN: node.vlan,
      Bandwidth: getBandwidthValue(node.bandwidth),
      'Last update': convertLastupdateFormat(node.last_update)
    }];
  }

  return [{
    Hostname: node.hostname || node.label,
    IPv4: node.ip,
    MAC: node.mac,
    Status: statusesInTitle[node.status],
    VLAN: node.vlan,
    Bandwidth: getBandwidthValue(node.bandwidth),
    'Last update': convertLastupdateFormat(node.last_update)
  }];
}



function getLinkTitle(currentLink) {
  return [{
    'Source IPv4': currentLink.src_ip,
    'Source MAC': currentLink.src_mac,
    'Dest. IPv4': currentLink.dst_ip,
    'Link type': currentLink.attributes['_o'],
    'Link quality': currentLink.attributes['linkQuality'],
    'Last update': convertLastupdateFormat(currentLink.timestamp)
  }];
}



function getCombinedLinks(edges) {
  if (!edges.length) {
    return [];
  }

  // As I merge edges I have to sign them unique ID. Nodes always have unique ID.
  // So, I just sort TO and FROM IDs and then get value of md5sum function.
  const getUniqueID = function (edge) {
    let id_arr = [edge.from, edge.to];
    id_arr = id_arr.sort((a, b) => (a > b ? 1 : -1));
    // TODO currently it is going to be 2 x 24 hex digits.
    // If I use md5sum it will be 32 hex digits.
    return id_arr[0] + id_arr[1];
  };


  // Get minimum link quality of all links if FROM to TO. I do this in oder
  // to set link color.
  const getMinLinkQuality = function (link_quality, edge) {
    if (HasKey(link_quality, edge.id)) {
      if (link_quality[edge.id] > edge.link_quality) {
        link_quality[edge.id] = edge.link_quality;
      }
    } else {
      link_quality[edge.id] = edge.link_quality;
    }
    return link_quality;
  };


  // Modify edge if it is needed based on link quality.
  const ModifyEdgeData = function (edge, link_quality, arrow_direction) {
    // Set edge color based on link quality.
    if (HasKey(link_quality, edge.id)) {
      const link_q = link_quality[edge.id];
      if (link_q <= 0.75 && link_q >= 0.5) {
        // Set low
        edge.color = {color: '#f39c12', highlight: '#f39c12', hover: '#f39c12'};
      } else if (link_q < 0.5) {
        // Set down
        edge.color = {color: '#dd4b39', highlight: '#dd4b39', hover: '#dd4b39'};
      } else if (link_q > 0.75) {
        // Set up
        edge.color = {color: '#00a65a', highlight: '#00a65a', hover: '#00a65a'};
      }
    }

    let thenUTC = moment.utc(edge.timestamp).format('YYYY-MM-DD HH:mm:ss');
    thenUTC = moment(thenUTC);
    let nowUTC = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss');
    nowUTC = moment(nowUTC);

    const duration = moment.duration(nowUTC.diff(thenUTC));
    const diffMinutes = duration.asMinutes();
    if (diffMinutes > 1) {
      edge.color = {color: '#dd4b39', highlight: '#dd4b39', hover: '#dd4b39'};
    }

    // Set edge arrow. If it is both then remove arrow from edge.
    if (HasKey(arrow_direction, edge.id)) {
      const arrow = arrow_direction[edge.id];
      if (arrow === 'both') {
        edge.arrows.middle.enabled = false;
      }
    }

    return edge;
  };


  const tmp_data = {};
  let link_quality = {};
  const arrow_direction = {};
  const result = [];

  for (let i = 0; i < edges.length; i++) {
    const edgeObject = edges[i];
    if (edgeObject.type === 'lan') {
      result.push({ ...edgeObject});
    } else {
      edgeObject['id'] = getUniqueID(edgeObject);
      arrow_direction[edgeObject.id] = 'from_to';
      link_quality = getMinLinkQuality(link_quality, edgeObject);

      const FromToKey = String(edgeObject.from) + String(edgeObject.to);
      if (HasKey(tmp_data, FromToKey)) {
        const value = tmp_data[FromToKey];
        value.titleObject = value.titleObject.concat(edgeObject.titleObject);
        tmp_data[FromToKey] = value;
      } else {
        tmp_data[FromToKey] = edgeObject;
      }
    }
  }

  for (let i = 0; i < edges.length; i++) {
    const edgeObject = edges[i];
    if (edgeObject.type === 'link') {
      edgeObject['id'] = getUniqueID(edgeObject);
      link_quality = getMinLinkQuality(link_quality, edgeObject);

      const ToFromKey = String(edgeObject.to) + String(edgeObject.from);
      const FromToKey = String(edgeObject.from) + String(edgeObject.to);
      if (HasKey(tmp_data, ToFromKey) && HasKey(tmp_data, FromToKey) &&
          tmp_data[ToFromKey] !== null && tmp_data[FromToKey] !== null) {
        arrow_direction[edgeObject.id] = 'both';
        const value = tmp_data[FromToKey];
        value.titleObject = value.titleObject.concat(tmp_data[ToFromKey].titleObject);
        tmp_data[FromToKey] = value;
        tmp_data[ToFromKey] = null;
      }
    }
  }


  for (const data of Object.values(tmp_data)) {
    if (data) {
      const edge = ModifyEdgeData(data, link_quality, arrow_direction);
      result.push({ ...edge});
    }
  }

  return result;
}



function getCombinedDevices(vlan_data, nodes, nodes_coordinates) {
  const network_data = {};
  const net_updated_nodes = {};
  const vis_updated_nodes = [];
  const updated_visible_devs = {};
  const visible_devs = vlan_data.visible_devs;

  const curr_dev_data = {};
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === 'Device') {
      curr_dev_data[node.id] = node;
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === 'Phoenix Box') {
      vis_updated_nodes.push(node);
      const devs = visible_devs[node.id];
      if (devs && devs.length > 0) {
        const new_id = node.id + '_dev';
        let x_y_data = {x: undefined, y: undefined};
        if (nodes_coordinates && HasKey(nodes_coordinates, new_id)) {
          x_y_data = nodes_coordinates[new_id];
        }

        const new_node = {
          id: new_id,
          type: 'Device',
          status: 'up',
          group: 'device_up',
          title: [],
          label: 'Devices',
          x: x_y_data.x,
          y: x_y_data.y
        };

        for (let j = 0; j < devs.length; j++) {
          const dev_id = devs[j];
          const device_data = curr_dev_data[dev_id];

          new_node.title = new_node.title.concat(device_data.title);

          if (device_data.status === 'down') {
            new_node.status = device_data.status;
            new_node.group = device_data.group;
          }
        }

        vis_updated_nodes.push(new_node);
        updated_visible_devs[node.id] = [new_node.id];
        net_updated_nodes[new_node.id] = new_node;
      } else {
        updated_visible_devs[node.id] = [];
      }

      net_updated_nodes[node.id] = node;
    }
  }

  network_data['nodes'] = net_updated_nodes;
  network_data['links'] = vlan_data.links;
  network_data['visible_devs'] = updated_visible_devs;


  const nodes_idx = {};
  let iterator = 0;
  for (let i = 0; i < vis_updated_nodes.length; i++) {
    const node = vis_updated_nodes[i];
    nodes_idx[node.id] = {id: node.id, idx: iterator};
    iterator++;
  }


  return {
    vis_updated_nodes,
    network_data,
    nodes_idx
  };
}

export {
  processNode, processEdge, getNodeTitle, getLinkTitle, getCombinedLinks, getCombinedDevices, getBandwidthValue
};
