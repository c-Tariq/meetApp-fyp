const express = require("express")
const bcrypt = require('bcrypt')
const router = express.Router()


const users = [{name: 'name'}]

router.get("/:id",(req, res) => {
    res.send(`Get user with ID ${req.params.id}`)
})

router.get("/",(req, res) => {
    res.json(users)
})

router.post("/", async (req, res) => {
    try { 
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = { name: req.body.name, password: hashedPassword}
        users.push(user)
        res.status(201).send()
    } catch {
        res.status(500).send('')
    }
    
})

router.post("/login", async (req, res) => {
    const user = users.find(user => user.name === req.body.name)
    if (user == null) {
        return res.status(400).send("cannot find user")
    }
    try { 
        if (await bcrypt.compare(req.body.password, user.password)) {
            res.send('Success')
        } else {
            res.send('Not allowed')
        }
    } catch {
        res.status(500).send('ggg')
    }
    
})
module.exports = router