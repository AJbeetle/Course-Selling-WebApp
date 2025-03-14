const {purchaseModel, userModel, courseModel} = require("../models/db");


// here I need to integrate razorpay or some other payments gateway to actually ensure person buys a course
async function handleUserPurchase(req, res, next){
    try{
        const userId = req.userId;
        const courseName = req.params.courseName;
    
        const foundCourse = await courseModel.findOne({
            title : courseName
        });
    
        if(!foundCourse){
            return res.status(500).json({
                err : "This course does not exist, you gave wrong courseName"
            })
        }
    
        // payments gateway logic
    
        await purchaseModel.create({
            courseId : foundCourse._id,
            userId : userId
        }).populate("courseContents");
    
        return res.json({
            message : "Course is added to your list. LEARN and SHINE",
            courseId : foundCourse._id 
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