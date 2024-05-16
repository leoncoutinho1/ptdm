import axios from 'axios';

const HTTP = axios.create({
  baseURL: import.meta.env.VITE_TDM_API,
  headers: {
    Authorization: 'Bearer ' + localStorage.getItem('token'),
    Accept: 'application/json',
    ContentType: 'application/json'
  }
});

export default HTTP