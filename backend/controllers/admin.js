const {adminModel, courseModel, purchaseModel, courseContentModel} = require("../models/db");

const {z} = require("zod");
const bcrypt = require("bcrypt");
require("dotenv").config({path : "../.env"});
const jwt = require("jsonwebtoken");

const jwtSign = process.env.JWT_ADMIN

//NON-AUTHENTICATED ENDPOINTS HANDLERS -----------------------------------------------------------------------------------------------------

async function handleAdminSignup(req,res,next){
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

        await adminModel.create({
            email,
            password : hashedPass,
            firstName,
            middleName,
            lastName
        })

        res.json({
            message : "Successfully Signed up. Now login to use our services",
            redirectTo : "/admin/login"
        })

    }
    catch(e){
        return res.json({
            err : `some error occured : ${e.message}`
        })
    }
    

}

async function handleAdminLogin(req,res,next){
    try{
        const {email, password} = req.body;
    
        const foundUser = await adminModel.findOne({email});
    
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


//AUTHENTICATED ENDPOINTS HANDLERS -----------------------------------------------------------------------------------------------------


// on admin dashboard we will show all the courses and the profile of who has published that course
async function handleAdminDashboard(req,res,next){
    try{
        const adminId = req.userId;     // authenticate middleware passes down
    
        const allContentsLive = await courseModel.find({
            status:true
        }).populate("creatorId");
    
        const yourContentLive = await courseModel.find({
            creatorId : adminId, status:true
        });

        res.json({
            allContentsLive,
            yourContentLive 
        })

    }
    catch(e){
        return res.status(500).json({
            err :  `Some error occured : ${e.message}`
        })
    }

}

// admin gives only courseDescription here : title, description, price, image [thumbnail] and status
async function handleAdminCourseAdd(req,res,next){
    try{
        const adminId = req.userId;    // authenticate middleware passes down
    
        const requiredBody = z.object({
            title : z.string().min(5).max(50),
            image : z.string().url(),
            description : z.string().max(500),
            price : z.number().positive(),
            status : z.boolean().optional()
            // creatorId : z.string.regex(/^[0-9a-fA-F]{24}$/, "invalid object") //ensures the string is exactly 24 hexadecimal characters, not needed to be defined here as this we recieve encoded in cookie 
        })
    
        const parseWithSuccess = requiredBody.safeParse(req.body);
    
        if(!parseWithSuccess.success){
            return res.status(403).json({
                err : `invalid input : ${parseWithSuccess.error}`
            })
        }
    
        const {title, description, price, image, status} = req.body;
        
        const course = await courseModel.create({
            title,
            description,
            price,
            image,
            status,
            creatorId : adminId
        })
    
        res.json({
            message : "Course Added to Database",
            courseId : course._id,
            statusOfCourse : course.status
        })
    }
    catch(e){
        res.status(500).json({
            err : `some error occured : ${e.message}`
        })
    }
}

// Admin deletes the course. It is completely deleted from the database all content related to it inside purchaseModel and courseContentModel is deleted
//HARD_DELETE
async function handleAdminCourseDelete(req,res,next){
    // so, what happens here is the course is removed from the courseModel and all its corresponding data is also removed
    /* 
       -> So, in order to do so, first you delete the related child data and then the main parent data
       -> So, courseModel is related to => courseContentModel and purchaseModel. 
       -> and now, purchaseModel takes data from courseContentModel
       So, parent to child [LTR] structure is :-
            CourseModel   ---->  courseContentModel --->  purchaseModel

        -> so, first we will delete corresponding purchases
        -> then, we will delte corresponding courseContent and
        -> finally we will delte the     
    */

    try{
        const adminId = req.userId;
        const courseId = req.body.courseId;

        const AuthorizedToUpdateCourse = await courseModel.findOne({
            _id : courseId, creatorId : adminId
        })

        if(!AuthorizedToUpdateCourse){
            return res.status(400).json({
                err : "YOU are not the owner of this course"
            })
        }

        const purchasesResult = await purchaseModel.deleteMany({
            courseId : AuthorizedToUpdateCourse._id
        })

        const courseContentResult = await courseContentModel.deleteMany({
            courseId : AuthorizedToUpdateCourse._id
        })

        const courseModelResult = await courseModel.findOneAndDelete({_id : AuthorizedToUpdateCourse._id});

        res.json({
            message : "course is permanently deleted from database. No relating content exists",
            purchasesDelelted : purchasesResult.deletedCount,
            courseContentsDeleted : courseContentResult.deletedCount,
            courseRemoved : courseModelResult
        })

    }
    catch(e){
        return res.status(500).json({
            err : `Some Error Occured : ${e.message}`
        })
    }

}

// Admin deletes the course. It is not completely removed from the database , only the status of course goes to false and hence users also cannot view the course and its contents but donot make anychanges to purchaseModel or courseContentModel [because this is not hardDelete]
//SOFT_DELETE or DISABLE => here the only work is to change course status from true to false, check for auhtorized access
async function handleAdminCourseSTATUS(req,res,next){

    try{
        
        const adminId = req.userId;
        const status = false;
        const courseId = req.body.courseId;
    
        const newCourse = await courseModel.findOneAndUpdate(
            {creatorId : adminId, _id : courseId},
            { $set : {status : status}},
            { new : true }
        )
    
        if(!newCourse){
            return res.status(400).json({
                err : "The course you are trying to update does not exist"
            })
        }
    
        res.json({
            message : `successfully made your course status to ${newCourse.status}`,
            courseId : newCourse._id
        })
    }
    catch(e){
        return res.status(500).json({
            err : `some error occured ${e.message}`
        })
    }


    


     
}

// this endpoint shows admin only his courses that he published
async function handleAdminCourses(req, res, next){
    try{
        const adminId = req.userId;
        const courses = await courseModel.find({
            creatorId : adminId
        })
    
        if(courses==[]){
            return res.json({
                message : "NO COURSES PUBLISHED YET",
                coursesPublished : false
            })
        }
    
        return res.json({
            message : "Fetched all your courses MetaData Only",
            courses
        })

    }
    catch(e){
        return res.status(500).json({
            err :  `some error occured : ${e.message}`
        })
    }

}

async function handleAdminCourseContent(req,res,next){
    try{
        const adminId = req.userId;
        const courseId = req.query.courseId;
        // console.log(courseId, adminId);
//         By default, Mongoose wraps MongoDB documents inside its own objects, which: ✔️ Add extra features (e.g., .save(),virtuals, getters/setters).
// But make queries slower (because of added overhead).
// When you don’t need these features, .lean() makes queries much faster by returning plain objects instead of Mongoose documents.
    
        const authorizedAdmin = await courseModel.findOne({
            _id : courseId , creatorId : adminId
        }).lean();
    
        if(!authorizedAdmin){
            return res.status(403).json({
                err : "YOU DONOT OWN THIS CONTENT"
            })
        }
    
        const courseContents = await courseContentModel.find({
            courseId 
        }).lean();
    
        return res.json({
            message : "All contents Served",
            courseContents
        })
    }
    catch(e){
        return res.status(500).json({
            err : `some error occured : ${e.message}`
        })
    }
}

// this function is used inside handleNewContentAddition
async function updatePurchaseCourseStatus(req,res,courseId, newContentId){
    try{
        const purchases = await purchaseModel.find({
            courseId
        });

        for(let purchase of purchases){

            purchase.courseStatus.push({
                contentId : newContentId
            })

            const totalContents = await courseContentModel.countDocuments({courseId});
            const completedContent = purchase.courseStatus.filter(c=>c.completed).length;

            purchase.courseCompletePercent = totalContents ? ((completedContent/totalContents) * 100) : 0;

            await purchase.save();
        }

        return;
    }
    catch(e){
        return res.status(500).json({
            err : `some error occured while updating purchaseModel : ${e.message}`
        })
    }

}

async function handleNewContentAddition(req,res,next){
    try{
        const adminId = req.userId;
        const requiredBody = z.object({
            courseId : z.string().regex(/^[0-9a-fA-F]{24}$/, "invalid object"),
            title : z.string(),
            url : z.string().optional()
        })
    
        const parseWithSuccess = requiredBody.safeParse(req.body);
    
        if(!parseWithSuccess.success){
            return res.status(403).json({
                err : `input validations failed : ${parseWithSuccess.error}`,
                error : parseWithSuccess.error.errors 
            })
        }
    
        const {courseId, title, url} = req.body;
    
        const authorizedAdmin = await courseModel.findOne({
            creatorId : adminId, _id: courseId
        }).lean();
    
        if(!authorizedAdmin){
            return res.status(403).json({
                err : `you are not owner of this course`
            })
        }
    
        const newContent = await courseContentModel.create({
            courseId,
            title,
            url
        })
        
        // after adding content to the courseContentModel
        
        /******************* MAKE SURE EVERY TIME admin adds content to courseContentModel the purchaseModel's courseStatus array is updated ************************* */

        // Using updatePurchaseCourseStatus function to do above task

        await updatePurchaseCourseStatus(req,res,courseId, newContent._id);
    
        return res.json({
            message : "new content added to database",
            newContent
        })

    }
    catch(e){
        return res.status(500).json({
            err : `some error occured : ${e.message}`
        })
    }


}


//admin can do updates in the content he posted for a course => things that can be changed are :-
/* 
              -> url,
              -> title
*/
async function handleContentUpdates(req,res,next){
    try{
        const adminId = req.userId;
        const requiredBody = z.object({
            contentId : z.string().regex(/^[0-9a-fA-F]{24}$/, "invalid object"),
            courseId : z.string().regex(/^[0-9a-fA-F]{24}$/, "invalid object"),
            title : z.string().optional(),
            url : z.string().optional()
        })
        
        const parseWithSuccess = requiredBody.safeParse(req.body);
        
        if(!parseWithSuccess.success){
            return res.status(403).json({
                err : `input validations failed : ${parseWithSuccess.error}`,
                error : parseWithSuccess.error.errors 
            })
        }
        const {contentId, courseId, title, url} = req.body;
    
        if(title==undefined && url==undefined){
            return res.status(400).json({
                err : "Send atLeast one data to update : either title or url"
            })
        }
        // zod already did following validation
       /*  else if(contentId==undefined || courseId == undefined){
            return res.status(403).json({
                err : "Send request correclty : cotnentId and courseId is undefined"
            })
        } */
    
        const authorizedAdmin = await courseModel.findOne({
            creatorId : adminId, _id : courseId
        }).lean();
    
        if(!authorizedAdmin){
            return res.status(400).json({
                err : "you donot own this course"
            })
        }
    
        const oldContent = await courseContentModel.findOne(
            {courseId, _id : contentId}
        ).lean();

        if(!oldContent){
            return res.status(404).json({
                err : "Content you are trying to update is missing : 404 not found"
            })
        }
    
        const updateField = {};
        if(title) updateField.title = title;
        if(url) updateField.url = url;
    
        const newContent = await courseContentModel.findOneAndUpdate(
            {courseId, _id:contentId},
            {$set : updateField},
            {new : true}
        )
    
        return res.json({
            message : "Content of this course is successfully updated",
            courseId,
            contentId,
            oldContent,
            newContent
            
        })
    }
    catch(e){
        return res.status(500).json({
            err : `Some error occured : ${e.message}`
        })
    }


}

// so here admin can update the metadata about the course i.e. making changes in the courseModel 
/* 
    -> The things that he can change are :      1. title
                                                2. image
                                                3. description
                                                4. price
                                                5. status :  only update that is possible here : false -> true
 */

async function handleAboutUpdates(req,res, next){
    try{
        const adminId = req.userId;  // passed down by authenticate middleware
    
        const requiredBody = z.object({
            title : z.string().min(5).max(50).optional(),
            image : z.string().url().optional(),
            description : z.string().max(500).optional(),
            price : z.number().positive().optional(),
            status : z.boolean().optional(),
            courseId : z.string().regex(/^[0-9a-fA-F]{24}$/, "invalid object")//ensures the string is exactly 24 hexadecimal characters, not needed to be defined here as this we recieve encoded in cookie 
        })

        const parseWithSuccess = requiredBody.safeParse(req.body);   //either parses or throws an error

        if(!parseWithSuccess.success){
            return res.status(403).json({
                err : `invalid input : ${parseWithSuccess.error}`,
                error : parseWithSuccess.error.errors
            })
        }
        
        const {title, image, description, price, status, courseId} = req.body;

        if(status===false){
            return res.status(400).json({
                err : "course cannot be disabled from this endpoint"
            })
        }

        // following query is just for debugging purposes to see if update happens correctly or not
        const oldData = await courseModel.findOne({
            _id : courseId,
            creatorId : adminId
        });

        if(!oldData){
            return res.status(404).json({
                err : "YOU ARE NOT THE OWNER OF THIS COURSE !!",
                authorized : false
            })
        }

        //only update fields that are provided
        const updateField = {};
        if(title) updateField.title = title;
        if(image) updateField.image = image;
        if(description) updateField.description = description;
        if(price) updateField.price = price;
        if(status !== undefined) updateField.status = status;

        if(Object.keys(updateField).length===0){
            return res.status(400).json({
                err : "At least one field (title, image, description, price, status) must be provided."
            })
        }
        
        //performing the update
        const newData = await courseModel.findOneAndUpdate(
            { _id : oldData._id },
            { $set : updateField},
            { new : true}
        ) 

        res.json({
            message : "Successfully Updated",
            oldData,
            newData
        })

    }
    catch(e){
        return res.status(500).json({
            err : `some error occured : ${e.message}`
        })
    }
}

module.exports={
    handleAdminSignup,
    handleAdminLogin,
    handleAdminDashboard,
    handleAdminCourseAdd,
    handleAdminCourseDelete,
    handleAdminCourseSTATUS,
    handleAdminCourses,
    handleAdminCourseContent,
    handleNewContentAddition,
    handleContentUpdates,
    handleAboutUpdates
}