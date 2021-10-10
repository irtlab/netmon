import axios from 'axios';


export const backendURL =  process.env.NODE_ENV === 'development' ?
  'http://localhost:3001' : window.location.origin;

export const apiURL = `${backendURL}/api`;
export const api = axios.create({baseURL: apiURL, withCredentials: true});
