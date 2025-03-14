const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config({path : "./.env"});
const cors = require("cors");
const {adminRouter} = require("./routes/admin");
const {userRouter} = require("./routes/user");
// const {courseRouter} = require("./routes/course");
// const {purchaseRouter} = require("./routes/purchase");
const { rateLimiter } = require("./middlewares/rateLimiter");
const path = require("path");
const cookieParser = require("cookie-parser")

const app = express();
const PORT = process.env.PORT || 5000 ; 
const URL = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k8p8l.mongodb.net/${process.env.DB}`;

mongoose.connect(URL)
.then(()=>{
    console.log("DATABASE CONNECTED :) ");
    
    app.use(express.json());
    app.use(express.urlencoded({extended:true}));
    app.use(cors({
        origin : "http://localhost:5173",
        credentials : true
    }))
    app.use(rateLimiter);
    app.use(cookieParser());
    app.set("view engine","ejs");
    app.set("views",path.join(__dirname,"/views"))


    app.use("/user",userRouter);
    app.use("/admin",adminRouter);
    // app.use("/course",courseRouter);
    // app.use("/purchase",purchaseRouter);

    // UNKNOWN ROUTE REQUEST ERROR HANDLE
    app.use((req, res, next)=>{
        res.status(404).json({
            err : "no server endpoint found",
            status : false
        })
    })

    // GLOBAL ERROR HANDLER
    app.use((err, req, res, next)=>{
        res.status(500).redirect()
    })


    app.listen(PORT, ()=>{
        console.log(`SERVER STARTED at PORT : ${PORT} `);
    })

})
.catch((e)=>{
    console.log(`database connection error :( : ${e.message}`);
    process.exit(1);
})