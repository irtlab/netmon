import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Grid, makeStyles } from '@material-ui/core';
import { useSnackbar } from 'notistack';
import { createAlert } from './utils';
import SpinnerPage from './components/spinner_page';


const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    borderRadius: '10px',
    color: theme.palette.text.secondary
  }
}));


export default function TrafficDataView() {
  const classes = useStyles();
  const params = useParams();
  const history = useHistory();
  const [runSpinningPage, setRunSpinningPage] = useState(false);
  const alert = createAlert(useSnackbar().enqueueSnackbar);


  return (
    <div className={classes.root} style={{ width: '100px' }}>
      { runSpinningPage ? (
        <SpinnerPage />
      ) : (
        <Grid container spacing={2}>
        </Grid>
      )
      }
    </div>
  );
}
