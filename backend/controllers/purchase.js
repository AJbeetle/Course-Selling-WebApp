const {purchaseModel, courseContentModel, courseModel} = require("../models/db");


// here I need to integrate razorpay or some other payments gateway to actually ensure person buys a course
//user sends course name or courseId in body
async function handleUserPurchase(req, res, next){
    try{
        const userId = req.userId;
        const courseName = req.body.courseName;
    
        const foundCourse = await courseModel.findOne({
            title : courseName
        });
    
        if(!foundCourse){
            return res.status(400).json({
                err : "This course does not exist OR you gave wrong courseName"
            })
        }
        
        else if(!foundCourse.status){
            //update the right status code later
            return res.status(400).json({
                err : "This course is not live right now"
            })
        }
    
        // ----------------------------------payments gateway logic--------------------------------------------------
    

        // add logic to added data into the courseStatus array of purchaseModel from courseContentModel in two steps :
        // STEP 1. fetching all contentIds for this course

        const courseContents = await courseContentModel.find({
            courseId : foundCourse._id
        });

        // STEP 2. prepare the courseStatus array 

        const courseStatus = courseContents.map(content => ({
            contentId : content._id
        }))

        /*******************MAKE SURE EVERY TIME admin adds content to courseContentModel the purchaseModel's courseStatus array is updated************************************************* */

        //FINALLY ADDING NEW PURCHASE

        // pupulate("courseContents") is done after create. Since it works on queries not on create. Also you populate on the basis of key the not the database Model, so use here the key that uses ref
        const newPurchase = await purchaseModel.create({
            courseId : foundCourse._id,
            userId : userId,
            courseStatus
        });/* .populate("courseContents");  */ 

        // populated courseDetails if needed to be viewed
        const populatedPurchase = await purchaseModel.findById(newPurchase._id).populate("courseStatus");   //not needed but used for debugging 

    
        return res.json({
            message : "Course is added to your list. LEARN and SHINE",
            courseId : foundCourse._id,
            purchaseDetail : populatedPurchase      //for debugging purpose , can be commented later
        })
    }
    catch(e){
        return res.status(500).json({
            message : `Some error occured : ${e.message} `
        })
    }

}

module.exports = {
    handleUserPurchase
} 