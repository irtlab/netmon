<template>
  <div class="px-0 ">
    <div class=" px-0" v-if="vlanNames">
        <div class="bTab">
          <ul class="ulWrapper">
            <li class="li" v-for="itm in vlanNames" :class="{'activeLi': selectedVLAN === itm}">
              <a href="#" @click.prevent="$root.$emit('vlanSelected', itm); selectedVLAN = itm" class="nav-a">
                {{itm}}
              </a>
            </li>
          </ul>
        </div>
    </div>
    <div>
      <div class="infoWindow group" v-if="showNodesModal || showNodeModal">
        <div v-if="showNodesModal">
          <div class="closeInfoWindow position-absolute" @click="() => {showNodesModal = false; showNodeModal = false; infoIndex = null}">X</div>
          <h5 v-if="nodesInfo.title" class="text-center mt-1">{{ nodesInfo.title }}</h5>
          <p
            v-for="(info, index) in nodesInfo.data"
            :class="`device d-flex align-items-center ${index === infoIndex ? 'text-bold' : ''} ${info.Status}`"
            @click="showNodeInfo(index)">
            {{ info.Hostname }}
          </p>
        </div>
        <div class="position-relative">
          <div class="infoWindow one" v-if="showNodeModal && nodesInfo.data[infoIndex]">
            <div class="closeInfoWindow position-absolute" @click="() => {showNodeModal = false; infoIndex = null}">X</div>
            <h5 class="text-center mt-1">{{ nodesInfo.data[infoIndex]['Substation name'] || nodesInfo.data[infoIndex].Hostname }}</h5>
            <p v-for="(value, key) in nodesInfo.data[infoIndex]">
              <b>{{ key }}: </b> {{value}}
            </p>
          </div>
        </div>
      </div>

      <div class="infoWindow group" v-if="showLinksModal || showLinkModal">
        <div v-if="showLinksModal">
          <div class="closeInfoWindow position-absolute" @click="() => {showLinksModal = false; showLinkModal = false; linkInfoIndex = null}">X</div>
          <p
            v-for="(info, index) in linksInfo"
            :class="`link d-flex align-items-center ${index === linkInfoIndex ? 'text-bold' : ''}`"
            @click="showLinkInfo(index)">
            Source IPv4: {{ info['Source IPv4'] }}
          </p>
        </div>
        <div class="position-relative">
          <div class="infoWindow one" v-if="showLinkModal && linksInfo[linkInfoIndex]">
            <div class="closeInfoWindow position-absolute" @click="() => {showLinkModal = false; linkInfoIndex = null}">X</div>
            <p v-for="(value, key) in linksInfo[linkInfoIndex]">
              <b>{{ key }}: </b> {{value}}
            </p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'VlanColumn',
  data() {
    return {
      selectedVLAN: sessionStorage.getItem('activeTab'),
      info: null,
      showNodesModal: false,
      showNodeModal: false,
      showLinksModal: false,
      showLinkModal: false,
      infoIndex: null,
      linkInfoIndex: null,
      nodeID: null,
      edgeID: null,
      nodesInfo: {data: [], title: ''},
      linksInfo: []
    };
  },


  methods: {
    showNodesInfo(info, id, title) {
      info = info.sort((a, b) => (a.Status > b.Status ? 1 : -1));
      this.nodesInfo = {data: info, title};
      this.nodeID = id;
      this.showLinksModal = false;
      this.showLinkModal = false;
      if (info.length > 1) {
        this.showNodesModal = true;
      } else {
        this.showNodeInfo(0);
        this.showNodesModal = false;
        this.showNodeModal = true;
      }
    },

    showNodeInfo(index) {
      this.infoIndex = index;
      this.showNodeModal = true;
    },

    showLinksInfo(info, id) {
      this.linksInfo = info;
      this.edgeID = id;
      this.showNodeModal = false;
      this.showNodesModal = false;
      if (info.length > 1) {
        this.showLinksModal = true;
      } else {
        this.showLinkInfo(0);
        this.showLinksModal = false;
        this.showLinkModal = true;
      }
    },
    showLinkInfo(index) {
      this.linkInfoIndex = index;
      this.showLinkModal = true;
    },
  },


  mounted() {
    this.$root.$on('showInfoModal', (info, id, type, update, title) => {
      if (type === 'node' && update === 0) {
        this.showNodesInfo(info, id, title);
      } else if (type === 'edge' && update === 0) {
        this.showLinksInfo(info, id);
      }
    });
  },


  computed: {
    updateData() {
      this.$root.$on('showInfoModal', (info, id, type, update, title) => {
        if ((this.showNodesModal || this.showNodeModal) && type === 'node' && id === this.nodeID && update !== 0) {
          this.showNodesInfo(info, id, title);
        } else if ((this.showLinksModal || this.showLinkModal) && type === 'edge' && id === this.edgeID && update !== 0) {
          this.showLinksInfo(info, id);
        }
      });
    },

    vlanNames() {
      let vlansArr = Object.keys(this.$store.getters['networks']);
      // Sort VLANs in an array in descending order
      vlansArr = vlansArr.sort((a, b) => (a < b ? 1 : -1));
      if (vlansArr.length) {
        if (!this.selectedVLAN) {
          this.selectedVLAN = vlansArr[0];
        }
        return vlansArr;
      }
      return false;
    },

    networks() {
      return this.$store.getters['networks'];
    }
  },

  watch: {
    updateData() {}
  }
};
</script>

<style >
  .infoWindow {
    min-width: 290px;
    position:absolute;
    top:1px;
    right: 0;
    z-index: 5;
    background-color: #ccc;
    border-radius: 3px;
    padding: 0 10px;
  }

  .closeInfoWindow {
    right: 5px;
    top: 0;
    cursor:pointer;
    font-weight: bold;
    font-size: 15px;
  }

  .infoWindow p {
    color: black;
    margin: 0;
  }

  .infoWindow.group p.device, p.link {
    cursor: pointer;
  }

  .infoWindow p:nth-child(2) {
    margin-top: 15px;
  }
  .infoWindow p:last-child {
    margin-bottom: 5px;
  }

  .infoWindow.group p.device:before {
    content: '';
    display: inline-block;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    margin: 5px 9px 3px;
  }

  .infoWindow.group p.Offline:before {
    background-color: red;
  }

  .infoWindow.group p.Online:before {
    background-color: green;
  }

  .infoWindow.one {
    left: -10px;
    top: 15px;
  }

  .infoWindow.one p {
    font-size: 15px;
  }

  .infoWindow.one p:before, p.link:before {
    display: none;
  }


  .activeLi a{
    color: #21a8d8 !important;
  }
  .bTab{
    position: fixed;
    width: 98%;
    top: 0;
    left: 200px;
    z-index: 5;
    height: 44px;
  }
  .ulWrapper{
    display: flex;
    margin: 0;
  }
  .li{
    padding: 8px 10px;
    text-align: center;
  }
  .nav-a{
    padding: 5px 15px;
    color: #758291;
    transition: 0s !important;
    text-decoration: none !important;
  }
  .li:hover{
    text-decoration: none;
  }
  .li:hover a{
    color: #5d6063 !important;
  }
  .activeLi{
    color: #fff !important;
    border-bottom: 4px solid #21a8d8;
  }
</style>
