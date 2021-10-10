/**
 * common/constants.js
 *
 * Authors:
 *   Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.
 *
 * Description:
 * File provides constant values of project.
 *
 */

const default_db_url = 'mongodb://127.0.0.1:27017';

const db_name = 'radics_db';

// MongoDB collections' names.
const agents_col = 'agents_col';
const notifications_col = 'notifications_col';
const ifaces_data_col = 'ifaces_data_col';
const node_traffic_ts_col = 'node_traffic_ts_col';
const vlan_traffic_ts_col = 'vlan_traffic_ts_col';
const ids_data_col = 'ids_data_col';

// This column just provides one document.
const ids_notifications_col = 'ids_notifications_col';

// Open ports.
const open_udp_ports = [53, 67, 68, 123, 698];
const open_tcp_ports = [22, 53, 443];

const data_sending_time_interval = Number(8000);

const tls_certificate_file = '/etc/ssl/certs/phxnet.pem';
const tls_private_key_file = '/etc/ssl/private/phxnet.key';

module.exports = {
  default_db_url,
  db_name,
  agents_col,
  notifications_col,
  ifaces_data_col,
  node_traffic_ts_col,
  vlan_traffic_ts_col,
  ids_data_col,
  ids_notifications_col,
  open_udp_ports,
  open_tcp_ports,
  data_sending_time_interval,
  tls_certificate_file,
  tls_private_key_file
};

