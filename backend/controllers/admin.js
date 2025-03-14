const {adminModel, courseModel} = require("../models/db");

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

function handleAdminDashboard(req,res,next){

}

function handleAdminCourseAdd(req,res,next){

}

function handleAdminCourseDelete(req,res,next){

}

function handleAdminCourses(req, res, next){

}

function handleContentUpdates(req,res,next){

}

function handleAboutUpdates(req,res, next){

}

module.exports={
    handleAdminSignup,
    handleAdminLogin,
    handleAdminDashboard,
    handleAdminCourseAdd,
    handleAdminCourseDelete,
    handleAdminCourses,
    handleContentUpdates,
    handleAboutUpdates
}