import axios from 'axios';

const HTTP = axios.create({
  baseURL: import.meta.env.VITE_TDM_API,
  headers: {
    Authorization: 'Bearer ' + localStorage.getItem('token'),
    Accept: 'application/json',
    ContentType: 'application/json'
  }
});

HTTP.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}, (err) => {
  return Promise.reject(err)
})

HTTP.interceptors.response.use((response) => {
  return response
}, (error) => {
  if (error.response.status === 401) {
    localStorage.clear()
    window.location = '/login'
  }

  return Promise.reject(error)
})

export default HTTP