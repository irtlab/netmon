function getColor(color) {
  const colors_dic = {
    green: '#00a65a',
    light_green: '#35bb00',
    yellow: '#f39c12',
    red: '#dd4b39',
  };

  return colors_dic[color];
}



function getEdgeStyleData(key) {
  const getLinkColorStyle = function (link_status) {
    let color = getColor('green');
    switch (link_status) {
      case 'up':
        color = getColor('green');
        break;
      case 'low':
        color = getColor('yellow');
        break;
      case 'down':
        color = getColor('red');
        break;
      default:
        color = getColor('green');
    }

    return {
      color,
      highlight: color,
      hover: color,
      inherit: false
    };
  };

  const link_arrow_style = {
    middle: {
      enabled: true,
      scaleFactor: 0.8
    }
  };

  const link_style_data = {
    link_up: {
      color: getLinkColorStyle('up'),
      width: 1.5,
      arrows: link_arrow_style
    },

    link_low: {
      color: getLinkColorStyle('low'),
      width: 1.5,
      arrows: link_arrow_style
    },

    link_down: {
      color: getLinkColorStyle('down'),
      width: 1.5,
      arrows: link_arrow_style
    },

    // This is to show line between Node and device
    visible_devs: {
      color: {
        color: getColor('light_green'),
        highlight: getColor('light_green'),
        hover: getColor('light_green')
      },
      width: 1.5,
      arrows: ''
    }
  };

  return link_style_data[key];
}

export { getEdgeStyleData };
export default getEdgeStyleData;
