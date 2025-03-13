const {Router} = require("express");
const adminRouter = Router();
const {
        handleAdminSignup, 
        handleAdminLogin, 
        handleAdminCourseAdd, 
        handleAdminCourses, 
        handleAdminCourseDelete,
        handleAdminDashboard
       } = require("../controllers/admin");

const {authenticate} = require("../middlewares/authenticate");
require("dotenv").config({
    path : "../.env"
})
const jwt = process.env.JWT_ADMIN;

const {courseRouter} = require("./adminMore/course");


adminRouter.post("/signup", handleAdminSignup);
adminRouter.post("/login", handleAdminLogin);

adminRouter.use((req, res, next)=>{
    authenticate(req, res, next, jwt);
})

adminRouter.get("/dashboard",handleAdminDashboard);
adminRouter.post("/addCourse", handleAdminCourseAdd);
adminRouter.delete("/deleteCourse/:courseName", handleAdminCourseDelete);
adminRouter.get("/myCourses", handleAdminCourses);


//admin will need to hit an endpoint where he can add content to the course he added
adminRouter.use("/courseUpdate",courseRouter);



module.exports = {
    adminRouter
}