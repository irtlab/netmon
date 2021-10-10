import React, { useEffect } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Drawer,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Divider,
  IconButton,
  makeStyles,
  useTheme
} from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import SettingsInputAntennaIcon from '@material-ui/icons/SettingsInputAntenna';
import DevicesIcon from '@material-ui/icons/Devices';
import InsertChartIcon from '@material-ui/icons/InsertChart';
import DescriptionIcon from '@material-ui/icons/Description';
import NotificationsIcon from '@material-ui/icons/Notifications';
import { listTabText } from '../utils';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  hide: {
    display: 'none'
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap'
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    overflowX: 'hidden',
    width: theme.spacing(7) + 1,
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9) + 1
    }
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar
  }
}));


function listTabIcon(idx) {
  return idx === 0 ? <SettingsInputAntennaIcon /> :
    idx === 1 ? <DevicesIcon /> :
      idx === 2 ? <InsertChartIcon /> :
        idx === 3 ? <DescriptionIcon /> :
          idx === 4 ? <NotificationsIcon /> : null;
}


export default function ListDrawer(props) {
  const classes = useStyles();
  const theme = useTheme();
  const location = useLocation();
  const history = useHistory();
  const {
    open, setOpen, selectedListItem, setSelectedListItem
  } = props;

  const setPath = (pathname) => {
    switch (pathname) {
    case '/':
      setSelectedListItem('network_topology');
      history.push('network_topology');
      break;
    case '/network_topology':
      setSelectedListItem('network_topology');
      break;
    case '/devices':
      setSelectedListItem('devices');
      break;
    case '/traffic':
      setSelectedListItem('traffic');
      break;
    case '/intrusion_detection':
      setSelectedListItem('intrusion_detection');
      break;
    case '/notifications':
      setSelectedListItem('notifications');
      break;
    default:
        // TODO what to do?
    }
  };

  useEffect(() => {
    setPath(`/${location.pathname.split('/')[1]}`);
  }, [location.pathname]);

  return (
    <Drawer
      variant="permanent"
      className={clsx(classes.drawer, {
        [classes.drawerOpen]: open,
        [classes.drawerClose]: !open
      })}
      classes={{
        paper: clsx({
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open
        })
      }}
    >
      <div className={classes.toolbar}>
        <Typography variant="h5">
        Netmon
        </Typography>
        <IconButton onClick={() => setOpen(false)}>
          {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </div>
      <Divider />
      <List>
        {['network_topology', 'devices', 'traffic', 'intrusion_detection', 'notifications'].map((text, index) => (
          <ListItem
            hover={text}
            button
            key={text}
            component={Link}
            to={`/${text}`}
            selected={selectedListItem === text}
            onClick={() => {
              setSelectedListItem(text);
              history.push(`/${text}`);
            }}
          >
            <Tooltip title={listTabText(text)}>
              <ListItemIcon >
                { listTabIcon(index) }
              </ListItemIcon>
            </Tooltip>
            <ListItemText primary={listTabText(text)} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

ListDrawer.defaultProps = {
  selectedListItem: ''
};

ListDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  selectedListItem: PropTypes.string,
  setSelectedListItem: PropTypes.func.isRequired
};
