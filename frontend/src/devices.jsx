import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import MaterialTable from 'material-table';
import moment from 'moment';
import NumberFormat from 'react-number-format';
import { useSnackbar } from 'notistack';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import IconButton from '@material-ui/core/IconButton';
import { Grid, Typography, Paper, InputBase, makeStyles } from '@material-ui/core';
import { api } from './api';
import SpinnerPage from './components/spinner_page';
import ScrollTop from './components/scroll_top';
import { tableIcons } from './table_icons';
import { createAlert  } from './utils';


const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    height: '85%'
  },
  input: {
    marginLeft: theme.spacing(1)
  },
  searchButton: {
    float: 'left',
    padding: 10
  },
  searchTypeDev: {
    minWidth: '10px'
  },
  searchTypeDevProp: {
    minWidth: '180px'
  }
}));


function stringMatching(string, value) {
  if (!value || !string) return false;

  const regex = new RegExp(value.toLowerCase(), 'g');
  const found = (string.toLowerCase()).match(regex);
  if (found) return true;
  return false;
}


function SearchComponent(props) {
  const classes = useStyles();
  const { data, setData } = props;
  const [originalData, setOriginalData] = useState([]);
  const [text, setText] = useState('');

  const customSearch = (search_obj, search_value) => {
    if (!search_obj || !search_value) return null;

    if (typeof (search_obj) !== 'object' && !Array.isArray(search_obj)) {
      const found = stringMatching(JSON.stringify(search_obj), search_value);
      if (found) return search_obj;
    }

    if (Array.isArray(search_obj)) {
      for (let i = 0; i < search_obj.length; i++) {
        const rv = customSearch(search_obj[i], search_value);
        if (rv) return rv;
      }
    }

    const object_values = Object.values(search_obj);
    for (let i = 0; i < object_values.length; i++) {
      const value = object_values[i];

      if (typeof (value) === 'object' || Array.isArray(value)) {
        if (typeof (value) === 'object') {
          const rv = customSearch(value, search_value);
          if (rv) return rv;
        } else {
          for (let j = 0; j < value.length; j++) {
            const rv = customSearch(value[j], search_value);
            if (rv) return rv;
          }
        }
      }

      const found = stringMatching(JSON.stringify(value), search_value);
      if (found) return value;
    }

    return null;
  };

  const handleSearchTyping = (event) => {
    const value = event.target.value.trim();
    setText(value);
    if (value) {
      const result = data.filter((dev) => customSearch(dev, value) !== null);
      setData(result);
    } else {
      setData(originalData);
    }
  };

  useEffect(() => {
    setOriginalData(props.data);
  }, []);

  return (
    <Paper component="form" className={classes.root}>
      <div className={classes.searchButton} aria-label="search">
        <SearchIcon />
      </div>
      <InputBase
        value={text}
        fullWidth
        className={classes.input}
        placeholder="Search"
        onChange={(event) => handleSearchTyping(event)}
        onBlur={(event) => setText(event.target.value.trim())}
      />
      <IconButton
        color="primary"
        className={classes.iconButton}
        aria-label="directions"
        onClick={() => {
          setText('');
          setData(originalData);
        }}
      >
        <ClearIcon />
      </IconButton>
    </Paper>
  );
}

SearchComponent.defaultProps = {
  data: []
};

SearchComponent.propTypes = {
  data: PropTypes.array,
  setData: PropTypes.func.isRequired
};


function RenderLastUpdate({ last_update }) {
  const convertLastupdateFormat = (lastUpdateMilliseconds) => {
    if (!lastUpdateMilliseconds) {
      return 'Unknown';
    }

    // Convert UTC milliseconds to some format.
    const thenUTC = moment.utc(lastUpdateMilliseconds).format('YYYY-MM-DD HH:mm:ss');

    let nowUTC = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss');
    nowUTC = moment(nowUTC);
    const diff = moment.duration(nowUTC.diff(thenUTC)).humanize();

    return `${diff} ago`;
  };

  return (
    <div>
      {convertLastupdateFormat(last_update)}
    </div>
  );
}

RenderLastUpdate.propTypes = {
  last_update: PropTypes.number
};


export default function DevicesView({ socket, props }) {
  const [devices, setDevices] = useState([]);
  const [runSpinningPage, setRunSpinningPage] = useState(false);
  const alert = createAlert(useSnackbar().enqueueSnackbar);

  async function fetchDevices() {
    try {
      const rv = await api.get('/devices');
      setDevices(rv.data);
    } catch (error) {
      alert('Error while fetching devices', error);
    }
  }

  useEffect(() => {
    (async () => {
      setRunSpinningPage(true);
      await fetchDevices();
      setRunSpinningPage(false);
    })();
  }, []);


  return (
    <div style={{flexGrow: 1}}>
      {
        runSpinningPage ? (
          <SpinnerPage />
        ) : (
          <>
            <div id="back-to-top-anchor" />
            <Grid container id="back-to-top-anchor" spacing={2}>
              <Grid item xs={12}>
                <SearchComponent data={devices} setData={setDevices} />
              </Grid>
              <Grid item xs={12}>
                <MaterialTable
                  style={{ borderRadius: '10px' }}
                  icons={tableIcons}
                  title=''
                  data={devices}
                  options={{
                    sorting: true,
                    search: false,
                    paging: false,
                    headerStyle: {
                      borderWidth: '1px',
                      borderColor: 'black',
                      color: '#848484'
                    }
                  }}
                  components={{
                    Toolbar: () => (
                      <div style={{padding: '5px'}}>
                      </div>
                    )
                  }}
                  columns={[
                    {
                      title: 'Hostname',
                      field: 'hostname'
                    }, {
                      title: 'MAC Address',
                      field: 'mac'
                    }, {
                      title: 'VLAN',
                      field: 'vlan'
                    }, {
                      title: 'IPv4',
                      field: 'ip'
                    }, {
                      title: 'Bandwidth',
                      field: 'bandwidth'
                    }, {
                      title: 'Last Update',
                      field: 'last_update',
                      render: (row) => <RenderLastUpdate
                        last_update={row.last_update}
                      />
                    }
                  ]}
                />
                <br />
              </Grid>
            </Grid>
            <ScrollTop {...props} />
          </>
        )
      }
    </div>
  );
}

DevicesView.defaultProps = {
  socket: null,
  props: undefined
};

DevicesView.propTypes = {
  socket: PropTypes.object,
  props: PropTypes.object
};
