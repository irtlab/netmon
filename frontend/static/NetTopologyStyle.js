function getNodeStyle(node_status) {
  // By default color is green. A node is up.
  const color = {
    background: '#007b00',
    border: '#007b00',
    highlight: '#007b00',
    hover: {
      border: '#007b00',
      background: '#007b00'
    }
  };

  if (node_status === 'down') {
    color.background = '#FF0000';
    color.border = '#FF0000';
    color.highlight = '#FF0000';
    color.hover.border = '#FF0000';
    color.hover.background = '#FF0000';
  } else if (node_status === 'low') {
    color.background = '#FFA209';
    color.border = '#FFA209';
    color.highlight = '#FFA209';
    color.hover.border = '#FFA209';
    color.hover.background = '#FFA209';
  }

  const node_style = {
    shape: 'hexagon',
    size: 20,
    mass: 2,
    font: {
      size: 14
    },
    color: color
  };

  return node_style;
}



function getDeviceStyle(device_status) {
  // By default color is green. A device is up.
  const color = {
    background: '#35bb00',
    border: '#35bb00',
    highlight: '#35bb00',
    hover: {
      border: '#35bb00',
      background: '#35bb00'
    }
  };

  if (device_status === 'down') {
    color.background = '#CE2323';
    color.border = '#CE2323';
    color.highlight = '#CE2323';
    color.hover.border = '#CE2323';
    color.hover.background = '#CE2323';
  } else if (device_status === 'low') {
    color.background = '#FFA500';
    color.border = '#FFA500';
    color.highlight = '#FFA500';
    color.hover.border = '#FFA500';
    color.hover.background = '#FFA500';
  }

  const device_style = {
    shape: 'dot',
    size: 15,
    mass: 2,
    font: {
      size: 14
    },
    color: color
  };

  return device_style;
}



const NodeGroupStyles = {
  node_up: getNodeStyle('up'),
  node_down: getNodeStyle('down'),
  node_low: getNodeStyle('low'),
  device_up: getDeviceStyle('up'),
  device_down: getDeviceStyle('down'),
  device_low: getDeviceStyle('low')
};



const Layout = {
  improvedLayout: false,
  randomSeed: 1,
  hierarchical: {
    enabled: false,
    levelSeparation: 150,
    nodeSpacing: 100,
    treeSpacing: 200,
    blockShifting: true,
    edgeMinimization: true,
    parentCentralization: true,
    direction: 'UD',
    sortMethod: 'hubsize'
  }
};



const VisNodes = {
  borderWidthSelected: 1,
  color: {
    highlight: {},
    background: '#222bcc'
  },
  font: {
    size: 13
  },
  shapeProperties: {
    interpolation: false
  }
};



const VisPhysics = {
  stabilization: {
    enabled: true,
    iterations: 10, 
    updateInterval: 100,
    onlyDynamicEdges: false,
    fit: true
  },
  barnesHut: {
    avoidOverlap: 0.1
  },
  enabled: true
};

export { NodeGroupStyles, Layout, VisNodes, VisPhysics };

