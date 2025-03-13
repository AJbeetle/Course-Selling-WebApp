const {Router} = require("express");
const courseRouter = Router();
const {handleContentUpdates, handleAboutUpdates} = require("../../controllers/admin");

// admin can make changes in the content of the course : like adding lectures, notes etc.
courseRouter.patch("/content",handleContentUpdates);

// admin can make changes to the information page of the course i.e. not internal content but just outer layer of it like : title, price or description is updated
courseRouter.patch("/about",handleAboutUpdates);



module.exports = {
    courseRouter
}