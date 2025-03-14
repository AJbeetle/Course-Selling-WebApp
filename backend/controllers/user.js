const {userModel, courseModel, purchaseModel, courseContentModel} =require("../models/db");
const mongoose = require("mongoose");
const {z} = require("zod");
const bcrypt = require("bcrypt");
require("dotenv").config({path : "../.env"});
const jwt = require("jsonwebtoken");
const jwtSign = process.env.JWT_USER;

//NON-AUTHENTICATED ENDPOINTS HANDLERS -----------------------------------------------------------------------------------------------------

async function handleUserSignup(req, res, next){
    try{
        const requiredBody = z.object({
            email : z.string().email(),
            password : z.string()
                        .min(8)
                        .max(15)
                        .regex(/[A-Z]/,{mess : "pass must contain a Uppercase letter"})
                        .regex(/[a-z]/, {mess : "password must contain a lowercase letter"})
                        .regex(/[0-9]/,{mess : "password must contain atleast one numeric"})
                        .regex(/[!@#$%^&*():"?><]/,{mess : "password must contain atleast one special cha"}),
            firstName : z.string(),
            middleName : z.string().optional(),
            lastName : z.string().optional() 
        })
    
        const parseWithSuccess = requiredBody.safeParse(req.body);
    
        if(!parseWithSuccess.success){
            return res.status(403).json({
                err : `some errors in input credentials : ${parseWithSuccess.error}`
            })
        }

        const {email, password, firstName, middleName, lastName} = req.body;

        hashedPass = await bcrypt.hash(password, 5);

        await userModel.create({
            email,
            password : hashedPass,
            firstName,
            middleName,
            lastName
        })

        res.json({
            message : "Successfully Signed up. Now login to use our services",
            redirectTo : "/user/login"
        })

    }
    catch(e){
        return res.json({
            err : `some error occured : ${e.message}`
        })
    }
    


}

async function handleUserLogin(req, res, next){

    try{
        const {email, password} = req.body;
    
        const foundUser = await userModel.findOne({email});
    
        const comparePass = await bcrypt.compare(password, foundUser.password);

        if(foundUser){
            if(comparePass){
                const token  = jwt.sign({
                    id : foundUser._id
                },jwtSign,{expiresIn:"1h"})

                CookieExpiryInOneHour = new Date(new Date().getTime() + 60*60*1000);

                res.cookie("AuthCookie",`Bearer ${token}`,{
                    sameSite : "None",
                    httpOnly: true,
                    secure: false,
                    expires : CookieExpiryInOneHour
                })

                return res.json({
                    message : "You are successfully loged in : cookie sent"
                })
            }
            else{
                return res.status(403).json({
                    err : "WRONG PASSWORD ENTERED"
                })
            }
        }
        else{
            return res.status(403).json({
                err : "no such user exists"
            })
        }
    }
    catch(e){
        return res.json({
            err : `some error occured : ${e.message}`
        })
    }

}


//AUTHENTICATED ENDPOINTS HANDLERS  -----------------------------------------------------------------------------------------------------

// Show user the courses that he is actively learning in [User can be enrolled in 10 courses but might be actively taking lectures from only some of them, so this dashboard will preview only those courses which user has completed upto 30% or more]
async function handleDashboard(req, res, next){
    try{
        const userId = req.userId;  //as passed down by authenticate middleware
        const coursesBought = await purchaseModel.find({
            userId,
            enrolled : true,
            courseCompletePercent : {$gte:30}    // $gte means greater than equal : here we are doing mongodb filtering instead of doing filter later . So, more efficient
        }).populate("courseId");
        
        // const coursesToShow = coursesBought.filter(course => course.courseCompletePercent>=30);
        const courseData = coursesBought.map(purchase => purchase.courseId);
    
        res.json(courseData);
    }
    catch(e){
        res.status(500).json({
            err : `some error occured : ${e.message}`
        })
    }
}


// Show user all courses that he is enrolled in [that is paid for] and hide courses that he is no longer enrolled in [the data regarding it will still persist in database but the user will not be seeing it in his all courses tab]
async function handleUserCourses(req, res, next){
    try{
        const userId = req.userId;            //as passed down by authenticate middleware
        const allCourses = await purchaseModel.find({
            userId,
            enrolled:true
        }).populate("courseId");
    
        const courseData = allCourses.map(course => course.courseId );
    
        res.json(courseData)
    }
    catch(e){
        res.status(500).json({
            err : `Some error Occured : ${e.message}`
        })
    }
}


// this endpoint exposes all the courses that user has bought inclusing enrolled and unenrolled ones
async function handleUserCoursesAll(req,res,next){
    try{
        const userId = req.userId;            //as passed down by authenticate middleware
        const allCourses = await purchaseModel.find({
            userId,
        }).populate("courseId");
    
        const courseData = allCourses.map(course => course.courseId );
    
        res.json(courseData)
    }
    catch(e){
        res.status(500).json({
            err : `Some error Occured : ${e.message}`
        })
    }
}



// either enrolls or unenrolls from a course : DONOT CONFUSE ENROLLING into a course to BUYING A COURSE
async function handleUserAccess(req,res, next){
    try{
        const userId = req.userId;                    //as passed down by authenticate middleware
        const {courseId, enrollmentStatus} = req.body;
        
        
        const purchaseEnrollmentToggle = await purchaseModel.findOneAndUpdate(
            {userId,courseId},
            {$set : {enrolled: enrollmentStatus}},
            {new : true}
        )
    
        if(!purchaseEnrollmentToggle){
            return res.status(404).json({
                err : "no purchase found for this user and course"
            })
        }
    
        return res.json({
            courseId : courseId,        
            enrollmentStatus : purchaseEnrollmentToggle.enrolled
        })

    }
    catch(e){
        return res.status(500).json({
            err : `Some error occured : ${e.message}`
        })
    }
}


// send request to this following endpoint on every refresh and after every 10 mins and donot forget to send localStorage progress item and when this request resolves delete the progress localStorage item from the client side and keep populating this localStorage progress item when user completes some part of course
async function handleUserProgressUptoDate(req,res,next){
    try{    
    const userId = req.userId;    //as passed down by authenticate middleware

    // Some frontend brainstorming

    /* // assuming that frontend will send array of objects containing contentId for which user completed the content study. Assuming req.body directly contains the JSON.stringify version of progressStored localStorage Item and express.json() pareses it into JSON data

    // so localStorage of frontend will store a item like this :- */
/* 
    progressStored = [
                          { "this will be course id string" : ["contentIdString","contentIdString","contentIdString"] },
                          { "this will be other course id string" : ["contentIdString","contentIdString","contentIdString"] },
                          { "this will be another course id string" : ["contentIdString","contentIdString","contentIdString"] },
                          { "this will be another course id string" : ["contentIdString","contentIdString","contentIdString"] },
                     ]
     */
        
    

    // some frontend logic
   /*
   progrssStored -> variable as shown above
   localStorage.setItem("progressStored",JSON.stringify(progressStored));

   const progressStored = JSON.parse(localStorage.getItem("progressStored")) || []; // Convert back to array   //or just don't do JSON.parse in this line
   // and just send body : progressStored
   
   fetch("http://localhost:5000/user/updateCourse/progressUptoDate", {
       method: "POST",
       headers: {
           "Content-Type": "application/json",
       },
       body: JSON.stringify({
           progress: progressStored, // ✅ Send as array
       })
   }); */


   const progress = req.body.progress;  //now because of app.use(express.json()) our data is already parsed to JSON, So progress is array as shown below

    if(!Array.isArray(progress) || progress.length === 0) {
        if(progress.length===0){
            // empty progress array : its ok since user must have not studied anything
            return res.status(200).end;
        }
        return res.status(403).json({
            err : "Incorrect Progress body sent from client side"
        })
    }

   /* progress = [
                     { "this will be course id string" : ["contentIdString","contentIdString","contentIdString"] },
                     { "this will be other course id string" : ["contentIdString","contentIdString","contentIdString"] },
                     { "this will be another course id string" : ["contentIdString","contentIdString","contentIdString"] },
                     { "this will be another course id string" : ["contentIdString","contentIdString","contentIdString"] },
                    ]   */


    /* POSTMAN REQUEST GOES IN THiS FORMAT
        {
            "progress": [
                { "67d414058c26a33588355d3c": ["c67d455b0f1ee9e57e2c7014d", "67d455c3f1ee9e57e2c70157", "67d455caf1ee9e57e2c70162"] },  //contentId is given here [which user completed]
                { "65f2e3c4a9b87d12d4c9f013": ["contentX", "contentY"] },  //invalid courseID
                { "65f2e3c4a9b87d12d4c9f014": ["contentP", "contentQ", "contentR", "contentS"] }  //invalid courseId
            ]
        }
    */

   //MY CODE

/* 
   progress.forEach((course) => {
    const courseId = Object.keys(course)[0];
    const contentIds = course[courseId];
    const hashSet = new Set(contentIds);

    const foundPurchase = await purchaseModel.findOne({
        userId, courseId
    })

    if(!foundPurchase){
        return res.status(404).json({
            err : "SOME ERROR OCCURED : this purchase cannot be found"
        })
    }
    
    foundPurchase.courseStatus.forEach((content) =>{
        if(hashSet.has(content.contentId)){
            await purchaseModel.updateOne(
                {userId, courseId, "courseStatus.contentId":content.contentId},
                {
                    $set : {"courseStatus.$.complete" : true }
                }
            )
        }
    })

   })

   const purchaseElement =  */


   //HELPER CODE

   const progressMap = new Map();

//    console.log(progress);

// Normal Loop 
/* 
   for(const course of progress){
       const courseId = Object.keys(course)[0];
       progressMap.set(courseId, new Set(course[courseId]));
   }

   const purchases = await purchaseModel.find({
    userId, 
    courseId : {$in : [...progressMap.keys()]}
   });

   if(purchases.length===0){
    return res.status(404).json({
        err : "no matching course found for courseId given in progress from client"
    })
   }

   for(const purchase of purchases){
    let updated = false;  // Track if we made changes
    for(const content of purchase.courseStatus){
        // Check if the contentId exists in progressMap for this courseId
        if(progressMap.get(purchase.courseId)?.has(content.contentId.toString())){
            content.completed = true;
            updated = true;
        }
    }
    if(updated){
        await purchase.save();
    }
   }

   return res.json({
    message : "progress updated successfully"
   })
 */
   
   // mongoFilter and conditionals  : STILL NOT WORKING CORRECTLY : Need to clean this code
   progress.forEach((course)=>{
       const courseId = Object.keys(course)[0];
       progressMap.set(courseId, new Set(course[courseId]));
   })

   await purchaseModel.updateMany(
     {
        userId,
        courseId : {$in : [...progressMap.keys()].map(id => new mongoose.Types.ObjectId(id) )},
        "courseStatus.contentId" : {$in : [...progressMap.values()]
                                                    .flatMap(set => [...set])
                                                    .map(id => new mongoose.Types.ObjectId(id))
                                   }
     },
     {
        $set : {"courseStatus.$.completed" : true}
     }
   )

    return res.json({
    message : "prgoress updated succesfully"
   })

   }
   catch(e){
    return res.status(500).json({
        err : `some error occured : ${e.message}`
    })
   }
}


async function handleUserCourseContent(req,res,next){
    try{
        const userId = req.userId;
        const courseId = req.query.courseId;
    
        const courseLiveOrNot = await courseModel.findOne({_id:courseId, status:true }).lean();
    
        if(!courseLiveOrNot){
            return res.status(403).json({
                err : "BAD REQUEST : This course is not live"
            })
        }
    
        const userAuthorized = await purchaseModel.findOne({courseId, userId}).lean();
    
        if(!userAuthorized){
            return res.status(403).json({
                err : "YOU HAVE NO ACCESS TO CONTENT : This is paid course, buy it to see more",
                courseId : courseId
            })
        }
    
        const courseContents = await courseContentModel.find({
            courseId
        }).populate("courseImage")
    
        return res.json({
            message : `all contents for course : ${courseLiveOrNot.title} fetched`,
            courseName : courseLiveOrNot.title,
            courseId : courseId,
            courseContents,
            progress : userAuthorized.courseCompletePercent
        })
    }
    catch(e){
        return res.status(500).json({
            err : `some error occured : ${e.message}`
        })
    }


    
}

module.exports = {
    handleDashboard, 
    handleUserCourses, 
    handleUserCoursesAll,
    handleUserCourseContent,
    handleUserSignup, 
    handleUserLogin,
    handleUserAccess,
    handleUserProgressUptoDate
}