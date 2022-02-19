const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
// Initializing app
const app = express()

// Middlewares
app.use(express.json())
app.use(cors())
app.use(bodyParser.urlencoded({extended:true}))

// Connecting to database
mongoose.connect(process.env.MONGO_URI,()=>{
    console.log("DB is live ..")
})


// MongoDB Models
// Username Model
const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true
    }
})

const userName = mongoose.model('users',userSchema)

// Exercise Model
const exerciseSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    description:String,
    duration:Number,
    date:{
        type:Date,
        default:Date.now()
    }
})
const exerciseModel = mongoose.model('exercises',exerciseSchema);

// Routes
// POST a username
app.post('/api/users',async (req,res)=>{
    try{
       const result = await  userName.create({
           username:req.body.username
       })
       res.json(result)
    }catch(error){
        console.log(error)
    }
})

// Get all usernames
app.get('/api/users',async (req,res)=>{
    try{
        const result = await userName.find()
        res.json(result)
    }catch(err){
        console.log(err.message)
    }
})

// POST Exercise
app.post('/api/users/:id/exercises',async(req,res)=>{
    try{
        // Find the user
        const result = await userName.findById(req.params.id)
        if(!result){
            res.status(404).send("User does not exist")
        }else{
            const addExercise = new exerciseModel({
                userId : req.body._id,
                description : req.body.description,
                duration : req.body.duration,
                date : req.body.date || new Date()
            })
            addExercise.save((err,data)=>{
                if(err || !data){
                    res.status(404).send("Unable to add exercise")
                }else{
                    const {description,duration,date,_id} = data;
                    res.json({
                        username:result.username,
                        description,
                        duration,
                        date:date.toDateString(),
                        _id:result._id
                    })
                }
            })
        }
    }catch(error){
        console.log(error.message)
    }
})

// GET LOGS
app.get('/api/users/:id/logs',async(req,res)=>{
    try{
        let {from,to,limit} = req.query
        userName.findById(req.params.id,(err,userData)=>{
            if(err || !userData){
                res.send("User does not exist")
            }else{
                // Search in exercises
                let filter = {
                    userId:req.params.id
                }
                let dateObj = {}
                if(from){
                    dateObj['$gt'] = new Date(from)
                }
                if(to){
                    dateObj['$lt'] = new Date(to)
                }
                if(from || to){
                    filter.date = dateObj
                }
                if(limit==null){
                    limit=5000
                }
                exerciseModel.find(filter).limit(+limit).exec((err,exerciseDate)=>{
                    if(err || !exerciseDate){
                        res.status(404).send("Exercises could not be found")
                    }else{
                        let logs={
                            username:userData.username,
                            count:exerciseDate.length,
                            _id:req.params.id,
                            log:[]

                        }
                        exerciseDate.forEach(item=>{
                            let date = item.date.toDateString()
                            let {description,duration}=item
                            logs.log.push({description,duration,date})
                        })
                        // console.log(userData.username)
                        res.json(logs)
                    }
                })
            }
        })
    }catch(error){
        console.log(error.message)
    }
})


// Initializing server
app.listen(3000,()=>{
    console.log("Listening live on Port 3000....")
})
