import { boot } from 'quasar/wrappers'
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3333',
})

export default boot(({ app }) => {
  app.config.globalProperties.$axios = api
})

export { api }
