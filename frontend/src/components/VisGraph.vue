<template>
  <div class=" row no-gutters position-relative">
    <div class="text-danger text-bold mapLoader" v-if="map_loader">
      <span class="align-middle spinner-border mr-3"></span> Loading...
    </div>
    <div class="col-12">
      <div class="netBox with-border relative">
        <div class="box-body relative">
          <div class="graph" style="height: calc(100vh - 43px)"></div>
        </div>
      </div>
    </div>
    <div class="checkboxes_nested d-inline-block">
      <div>
        <input id="nestedEdges" type="checkbox" v-model="nested_items.edges" @change="changedNestedItems">
        <label for="nestedEdges" class="mb-0">
          Merge Links
        </label>
      </div>
      <div>
        <input id="nestedNodes" type="checkbox" v-model="nested_items.nodes" @change="changedNestedItems">
        <label for="nestedNodes">
          Merge Devices
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import vis from 'vis-network';
import 'vis-network/dist/vis-network.min.css';
import { NetworkTopology } from './NetworkTopology';
import { getNetworkOptions } from './NetworkSetup';
import {
  getEdgesToBeUpdated,
  getNodesToBeUpdated
} from '../utils/utils';

export default {
  props: ['columnDeviceSelected'],
  name: 'VisGraph',
  data() {
    return {
      isDrawing: false,
      map_loader: false,
      selectedDevice: null,
      prevVLAN: null,
      selectedVLAN: null,
      canvasLoader: null,
      linksInfoArea: null,
      nodesInfoArea: null,
      loaded: false,
      infoObject: {},
      nodes: {},
      edges: {},
      tooltipDelay: 300,
      dataSets: {
        nodes: [],
        edges: []
      },
      nested_items: {
        nodes: true,
        edges: true
      }
    };
  },

  // This must be static, otherwise I will have a network data updating issue.
  graph: null,

  computed: {
    networkData() {
      return this.$store.getters['networks'];
    },

    currentDeviceInfo() {
      return this.$store.getters['deviceInfo'];
    },

    socketStatus() {
      return this.$store.getters['socketStatus'];
    },

    constructGraphData() {
      const nodes_coordinates = this.getSessionGraph(this.selectedVLAN);
      this.networkList = { ...this.networkData};
      const net_options = getNetworkOptions();
      const plumIsland = new NetworkTopology(this.networkData, net_options, this.selectedVLAN, 0, nodes_coordinates, this.nested_items);
      return {
        nodes: plumIsland.getNodes,
        edges: plumIsland.getEdges
      };
    },
  },

  beforeMount() {
    const stored = localStorage.getItem('nestedItems');
    if (stored) {
      this.nested_items = JSON.parse(stored);
    }
  },

  mounted() {
    document.querySelector('.wrapper.content-wrapper').classList.add('p-0');
    this.$store.dispatch('getNetworkTopology').then(() => {
      this.canvasLoader = document.getElementById('canvasLoader');
      const savedVlan = this.getActiveTab();
      if (savedVlan) {
        this.selectedVLAN = savedVlan;
        this.$store.commit('setActiveTab', savedVlan);
      }
      this.drawGraph();
      this.$root.$on('vlanSelected', (vlan) => {
        this.prevVLAN = this.selectedVLAN;
        this.selectedVLAN = vlan;
        sessionStorage.setItem('activeTab', vlan);
        this.$store.commit('setActiveTab', vlan);
      });
    });

    this.$root.$on('tabChanged', () => {
      console.log('Tab Changed', this.selectedVLAN);
    });
  },

  methods: {
    processSocketStatus() {
      console.log('Socket status:', this.socketStatus);
    },

    storeGraphInSession(graph, vlan) {
      let local_vlan_data = {};
      if (sessionStorage.getItem('localVlanData')) {
        local_vlan_data = JSON.parse(sessionStorage.getItem('localVlanData'));
      }
      local_vlan_data[vlan] = graph.getPositions();
      sessionStorage.setItem('localVlanData', JSON.stringify(local_vlan_data));
    },

    getSessionGraph(vlan) {
      if (sessionStorage.getItem('localVlanData')) {
        const local_vlan_data = JSON.parse(sessionStorage.getItem('localVlanData'));
        if (local_vlan_data.hasOwnProperty(vlan)) {
          return local_vlan_data[vlan];
        }
        return null;
      }
      return null;
    },

    stabilizeGraph() {
      if (this.$options.graph) {
        this.$options.graph.stabilize();
      }
    },

    redrawGraph() {
      if (this.$options.graph) {
        this.storeGraphInSession(this.$options.graph, this.prevVLAN);
        this.$options.graph.destroy();
      }
      this.drawGraph();
    },

    drawGraph() {
      const graphData = this.constructGraphData;
      if (!graphData) {
        return;
      }
      this.nodes = graphData.nodes;
      this.edges = graphData.edges;
      this.initNetwork();
      window._graph = this.$options.graph;
    },

    initNetwork() {
      this.map_loader = true;
      this.dataSets.nodes = new vis.DataSet(Object.values(this.nodes));
      this.dataSets.edges = new vis.DataSet(Object.assign(this.edges));
      if (Object.keys(this.infoObject).length) this.infoObject = {};
      this.infoObject['nodes'] = {};
      this.infoObject['edges'] = {};
      Object.keys(this.dataSets.edges._data).map((key) => {
        this.infoObject.edges[key] = this.dataSets.edges._data[key].titleObject;
        this.dataSets.edges._data[key].title = undefined;
      });
      Object.keys(this.dataSets.nodes._data).map((key) => {
        this.infoObject.nodes[key] = this.dataSets.nodes._data[key].title;
        this.dataSets.nodes._data[key].title = undefined;
      });
      this.$store.commit('setInfo', this.infoObject);
      const network_data = {nodes: this.dataSets.nodes, edges: this.dataSets.edges};
      const network_options = getNetworkOptions();
      this.$options.graph = new vis.Network(document.querySelector('.graph'), network_data, network_options);
      this.$options.graph.on('hoverNode', () => {
        this.$options.graph.canvas.body.container.style.cursor = 'pointer';
      });

      this.$options.graph.on('blurNode', () => {
        this.$options.graph.canvas.body.container.style.cursor = 'default';
      });

      this.$options.graph.on('stabilized', () => {
        this.map_loader = false;
      });

      setTimeout(() => {
        this.stabilizeGraph();
        this.loaded = true;
      }, 50);
      this.$options.graph.on('click', (e) => {
        this.clickOnVertex(e);
      });
    },

    getActiveTab() {
      const tab = sessionStorage.getItem('activeTab');
      if (!tab || tab === 'null') {
        return Object.keys(this.networkData)[0];
      }
      return tab;
    },

    clickOnVertex(e) {
      const currentNode = e.nodes;
      const currentEdge = e.edges;
      if (!currentNode && !currentEdge) {
        return;
      }
      if (!currentNode.length && !currentEdge.length) {
        return;
      }
      if (currentNode.length) {
        const id = currentNode[0];
        let label = '';
        // Checking if selected node is device
        if (this.isDevice(this.dataSets.nodes._data[id])) {
          Object.values(this.dataSets.edges._data).map((connection) => {
            if (connection.from === id || connection.to === id) {
              label = this.dataSets.nodes._data[connection.to].label;
            }
          });
        } else {
          label = this.dataSets.nodes._data[id].label;
        }

        this.$root.$emit('showInfoModal', this.currentDeviceInfo.nodes[id], id, 'node', 0, label);
      } else if (currentEdge.length) {
        const id = currentEdge[0];
        this.$root.$emit('showInfoModal', this.currentDeviceInfo.edges[id], id, 'edge', 0);
      }

      this.selectedDevice = currentNode[0];
    },

    isDevice(node) {
      return node.group.split('_')[0] === 'device';
    },



    updateNetworkMap() {
      // I have to update all nodes and edges (only links), otherwise last
      // update will show incorrect data.
      // If an edge or a node does not exist, it will be created.

      const net_options = getNetworkOptions();
      const plumIsland = new NetworkTopology(({ ...this.networkData}), net_options, this.selectedVLAN, 1, null, this.nested_items);

      const edges = plumIsland.getEdges;
      if (edges.length > 1) {
        for (let i = 0; i < edges.length; i++) {
          const id = edges[i].id;
          this.infoObject.edges[id] = edges[i].titleObject;
          // Update data of edge (link) window if it is opened.
          this.$root.$emit('showInfoModal', this.infoObject.edges[id], id, 'edge', 1);
        }

        // As edge updating operation is an expensive it make sense to check if
        // it is needed to update. I update only a color. It is better to get all
        // current edges' color, compare, then update if it is needed
        const edges_to_update = getEdgesToBeUpdated(this.dataSets.edges, edges);
        this.dataSets.edges.update(edges_to_update);
      }

      const nodes = plumIsland.getNodes;
      if (nodes.length > 1) {
        for (let i = 0; i < nodes.length; i++) {
          const id = nodes[i].id;
          this.infoObject.nodes[id] = nodes[i].title;
          let label = '';
          if (this.isDevice(this.dataSets.nodes._data[id])) {
            Object.values(this.dataSets.edges._data).map((connection) => {
              if (connection.from === id || connection.to === id) {
                label = this.dataSets.nodes._data[connection.to].label;
              }
            });
          } else {
            label = this.dataSets.nodes._data[id].label;
          }
          // Update data of node window if it is opened.
          this.$root.$emit('showInfoModal', this.infoObject.nodes[id], id, 'node', 1, label);
        }

        // As node updating operation is an expensive it make sense to check if
        // it is needed to update. I update only a color. Better to get all current
        // nodes' color, compare, then update if it is needed
        const nodes_to_update = getNodesToBeUpdated(this.dataSets.nodes, nodes);
        // Wait for ~1 seconds until edge updating is done. Updating egdes and nodes at the same time may slow process.
        setTimeout((dataSetsNodes, arg_nodes) => { dataSetsNodes.update(arg_nodes); }, 1000, this.dataSets.nodes, nodes_to_update);
        // this.dataSets.nodes.update(nodes)
      }
    },
    changedNestedItems() {
      localStorage.setItem('nestedItems', JSON.stringify(this.nested_items));
      sessionStorage.removeItem('localVlanData');
      window.location.reload();
    }
  },


  watch: {
    selectedVLAN() {
      if (this.loaded) {
        this.redrawGraph();
      }
    },

    networkData() {
      if (!this.networkList) {
        return false;
      }
      this.updateNetworkMap();
    },

    socketStatus() {
      this.processSocketStatus();
    }
  },

  destroyed() {
    document.querySelector('.wrapper.content-wrapper').classList.remove('p-0');
  }
};
</script>

<style>
.box-body{
  padding: 0;
}

.mapLoader {
  width: 100%;
  display: flex;
  height: calc(100vh - 43px);
  position: fixed;
  align-items: center;
  vertical-align: middle;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.49);
  justify-content: center;
}

.vis-network{
  outline: none;
}
.vis-network canvas{
  min-height: 70vh;
}
  .vis-configuration-wrapper{
    max-height:500px;
    overflow:scroll;
  }
  .traffic-alert-container{
    position: absolute;
    left:0;
    width:600px;
    max-width:100%;
    z-index:5;
  }

.dropdown-toggle::after {
  top: 53%;
  right: 3px;
}
#nav_dropdown_collapse>ul>li>a{
  padding-right: 23px;
  padding-left: 23px;
}
#canvasLoader {
  right: 10px;
  bottom: 10px;
  z-index: 5;
  background-color: white;
  background-size: contain;
  background-repeat: no-repeat;
  left: 10px;
  top: 10px;

}
.netBox{
  position: relative;
  background: #ffffff;
  width: 100%;
  border-radius: 0;
  border: 1px solid #c8ced4;
  height: calc(100vh - 43px);
}
.graph {
  height: calc(100vh - 43px);
}
.box-header {
  color: #444;
  display: block;
  padding: 10px;
  position: relative;
  background-color: #f0f3f5;
}
.box-header.with-border {
  border-bottom: 1px solid #c8ced4 !important;
}
  .checkboxes_nested {
    position: absolute;
    bottom: 0;
    left: 10px;
  }
</style>
