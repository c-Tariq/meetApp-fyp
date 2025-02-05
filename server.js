const express = require("express")
const bcrypt = require('bcrypt')
const app = express() 

app.use(express.static("public"))
app.use(express.json())

app.get('/',(req, res) => {
  console.log('Here')
  res.send("Hi")
})

const userRouter = require('./routes/users')

app.use('/users', userRouter)

app.listen(3000)
