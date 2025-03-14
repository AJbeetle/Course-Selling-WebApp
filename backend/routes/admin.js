const {Router} = require("express");
const adminRouter = Router();
const {
        handleAdminSignup, 
        handleAdminLogin, 
        handleAdminCourseAdd, 
        handleAdminCourses,
        handleAdminCourseContent, 
        handleAdminCourseDelete,
        handleAdminCourseSTATUS,
        handleAdminDashboard,
       } = require("../controllers/admin");

const {authenticate} = require("../middlewares/authenticate");
require("dotenv").config({
    path : "../.env"
})
const jwt = process.env.JWT_ADMIN;

const {courseRouter} = require("./adminMore/course");


adminRouter.post("/signup", handleAdminSignup);   //_DONE_
adminRouter.post("/login", handleAdminLogin);      //_DONE_

adminRouter.use((req, res, next)=>{
    authenticate(req, res, next, jwt);
})

adminRouter.get("/dashboard",handleAdminDashboard);           //_DONE_
adminRouter.post("/addCourse", handleAdminCourseAdd);          //_DONE_

adminRouter.delete("/deleteCourse", handleAdminCourseDelete);   //hardDelete                  : _DONE_
adminRouter.patch("/deleteCourse", handleAdminCourseSTATUS);    //softDelete OR Disable       : _DONE_

adminRouter.get("/myCourses", handleAdminCourses);                             // _DONE_
adminRouter.get("/myCourses/content", handleAdminCourseContent);                // _DONE_


//admin will need to hit an endpoint where he can add content to the course he added
adminRouter.use("/courseUpdate",courseRouter);           



module.exports = {
    adminRouter
}