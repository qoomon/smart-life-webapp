import express from 'express'
import request from 'request'
Object.setPrototypeOf(express.Router, {
  setup: function(block) {
    block(this)
    return this
  }
})

const app = express()
app.set('json spaces', 2)

app.use('/api/homeassistant', express.Router().setup(router => {  
  router.all('/*', async (req, res) => {
    try {
      const region = req.params.region || 'eu'
      const baseUrl = `https://px1.tuya${region}.com/homeassistant`
      // const baseUrl = `https://httpbin.org/anything`
      const targetPath = req.originalUrl.replace(req.baseUrl, '')
      const url = `${baseUrl}${targetPath}`
       
      //proxy request
      console.log(`${req.method} ${url}`)
      const target = request(url)
      req.pipe(target).pipe(res)
      
    } catch(err) {
      return res.status(500).json({
        title: "Internal server error",
        detail: err.message
      }) 
    }
  })
}))

export default app