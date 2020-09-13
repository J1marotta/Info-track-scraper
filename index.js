const express = require('express')
const app = express()
const cheerio = require('cheerio')
const axios = require('axios')
const cors = require('cors')
app.use(cors())

async function main({ engine, mode, searchQuery }) {
  const pages = ['Page01', 'Page02', 'Page03', 'Page04', 'Page05']

  const engineTypes = {
    google: 'Google',
    bing: 'Bing'
  }

  const selectors = {
    google: ['.r a', '.g'],
    bing: ['.b_algo h2 a', '#b_results']
  }

  // const urls = {
  //   google: `https://google.com/search?q=${searchQuery}`,
  //   bing: `https://bing.com/search?q=${searchQuery}`
  // }

  const currentEngine = engineTypes[engine]

  // Can't convert the nodelist to an Array correctly for real urls
  // const fancyUrl = urls[engine]

  const data = Promise.all(
    pages.map(async page => {
      const url = `https://infotrack-tests.infotrack.com.au/${currentEngine}/${page}.html`

      const currentSelector = selectors[engine]
      try {
        const res = await axios.get(url)
        const $ = cheerio.load(res.data)
        const selectors = $(currentSelector[0], currentSelector[1]).get()

        const href = 'https://www.infotrack.com.au'

        const targets = selectors.flatMap((x, i) =>
          $(x).attr('href').startsWith(href) ? [i] : []
        )

        return { [page.slice(-2)]: String(targets) }
      } catch (e) {
        console.error('FAILED', { status: e.status, msg: e.message })
      }
    })
  )
  return data
}

// https://expressjs.com/en/starter/basic-routing.html
app.get('/:engine/:mode/:searchQuery', async (request, response) => {
  const { engine, mode, searchQuery } = request.params
  console.log({ engine, mode, searchQuery })
  const x = await main({ engine, mode, searchQuery })
  response.send(x)
})

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// testing
// const fn = async () => {
//   const engine = 'google'
//   const mode = 'fancy'
//   const searchQuery = 'online title search'

//   console.log(await main({ engine, mode, searchQuery }))
// }

// fn()
