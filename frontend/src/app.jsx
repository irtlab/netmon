import React, { useState, useContext } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { makeStyles } from '@material-ui/core';

import NetworkTopologyView from './network_topology';
import DevicesView from './devices';
import TrafficDataView from './traffic_data';
import IntrusionDetectionView from './intrusion_detection';
import NotificationsView from './notifications';
import AppBarComponent from './components/app_bar';
import ListDrawer from './components/list_drawer';


const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex'
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(0.5),
    paddingTop: '90px',
    background: '#eef4f9'
  }
}));


// TODO not finished
function NotFoundPage() {
  return (
    <div>
      Page Not Found
    </div>
  );
}


export default function App() {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [selectedListItem, setSelectedListItem] = useState('');

  return (
    <div className={classes.root}>
      <>
        <AppBarComponent
          selectedItem={selectedListItem}
          open={open}
          setOpen={setOpen}
        />
        <ListDrawer
          open={open}
          setOpen={setOpen}
          selectedListItem={selectedListItem}
          setSelectedListItem={setSelectedListItem}
        />
      </>

      <Switch>
        <Route exact path="/" component={NetworkTopologyView} />
        <Route exact path="/network_topology" component={NetworkTopologyView} />
        <CustomRoute exact path="/devices" component={DevicesView} />
        <Route exact path="/traffic" component={TrafficDataView} />
        <Route exact path="/intrusion_detection" component={IntrusionDetectionView} />
        <Route exact path="/notifications" component={NotificationsView} />
        <Route exact component={NotFoundPage} />
      </Switch>
    </div>
  );
}


function CustomRoute({ component: Component, ...rest }) {
  const classes = useStyles();
  const socket = null;

  return (
    <Route
      {...rest}
      render={(props) => (
        <main className={classes.content}>
          <div className={classes.toolbar} >
            <Component {...props} socket={socket} />
          </div>
        </main>
      )
      }
    />
  );
}
