const express = require('express')
const app = express()
const knex = require('knex')
const bodyParser = require('body-parser')

app.use(require('express-promise')())
app.use(bodyParser.text())

const k = knex({
  client: 'sqlite3',
  connection: {
    filename: './db/persea.db'
  },
  useNullAsDefault: true
})

const corsAndJson = res => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "X-Requested-With")
}

app.get('/', function (req, res) {
  res.send('Hello World!')
})


app.post('/', function(request, response){
  corsAndJson(response)

  console.log(request.body);      // your JSON
  response.send(request.body);    // echo the result back
})

app.post('/final', function (req, res) {
  corsAndJson(res)

  const data = JSON.parse(req.body)

  res.json({
    result: k.schema.createTableIfNotExists('Results', table => {
      table.increments('Id').primary()

      table.string('lang')
      table.string('lekta')
      table.json('person')
      table.string('finalAnswer')
      table.string('profileId')
      table.string('scenarioName')

      table.timestamps()
    }).then(_ => k('Results').insert(data).then(x => x))
  })
})

const port = 3000

app.listen(port, function () {
  console.log(`Data server listening on port ${port}!`)
})
