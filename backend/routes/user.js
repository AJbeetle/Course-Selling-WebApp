const {Router} = require("express");
const userRouter = Router();
const {handleDashboard, handleUserCourses, handleUserSignup, handleUserLogin, handleUserCourseContent, handleUserCoursesAll } = require("../controllers/user");
const {authenticate} = require("../middlewares/authenticate");
const {courseRouter} = require("./userMore/course");
const {purchaseRouter} = require("./userMore/purchase");
require("dotenv").config({
    path : "../.env"
})
const jwt_us = process.env.JWT_USER;


userRouter.post("/signup", handleUserSignup);
userRouter.post("/login", handleUserLogin);


userRouter.use((req, res, next)=>{
    authenticate(req,res,next,jwt_us);
})

userRouter.get("/dashboard", handleDashboard);
userRouter.get("/myCourses", handleUserCourses);
userRouter.get("/myCoursesAll", handleUserCoursesAll);
userRouter.get("/myCourses/content", handleUserCourseContent);

// there are multiple things that can be happening in courseUpdate section of user : either they are enrolling or unenrolling , second thing can be they their progress updates in each course
userRouter.use("/updateCourse", courseRouter);


//user sends course name or courseId in body
userRouter.use("/buyCourse/", purchaseRouter);



module.exports = {
    userRouter
}