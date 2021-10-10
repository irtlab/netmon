import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import MaterialTable from 'material-table';
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

  const handleSearchTyping = (event) => {
    const value = event.target.value.trim();
    setText(value);
    if (value) {
      // TODO Implement custom search
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


export default function IntrusionDetectionView({ props }) {
  const [runSpinningPage, setRunSpinningPage] = useState(false);
  const alert = createAlert(useSnackbar().enqueueSnackbar);


  return (
    <div style={{flexGrow: 1}}>
      {
        runSpinningPage ? (
          <SpinnerPage />
        ) : (
          <>
            <div id="back-to-top-anchor" />
            <Grid container id="back-to-top-anchor" spacing={2}>
            </Grid>
            <ScrollTop {...props} />
          </>
        )
      }
    </div>
  );
}

IntrusionDetectionView.defaultProps = {
  props: undefined
};

IntrusionDetectionView.propTypes = {
  props: PropTypes.object
};
