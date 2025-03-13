    const {Router} = require("express");
    const courseRouter = Router();
    const {handleUserAccess, handleUserProgressUptoDate} = require("../../controllers/user");

    // for user enrolling or unenrolling from a course
    courseRouter.post("/access", handleUserAccess);

    // for users course progress syncing with database
    courseRouter.patch("/progressUptoDate",handleUserProgressUptoDate);



    module.exports = {
        courseRouter
    }