const jwt = require("jsonwebtoken");

function authenticate(req, res, next, jwt_us){
    try{
        const cook = req.cookies?.AuthCookie;
        
        if(cook){
            const token = cook.split(" ")[1];
            if(token.length>0){
                const tokenVal = jwt.verify(token,jwt_us);
                req.userId = tokenVal.id;
                next();
        
            }else{
                return res.status(403).json({
                    err : "Using Corrupted Cookie"
                })
            }
        }
        else{
            return res.status(403).json({
                err : "Kindly login to use our services"
            })
        }
    
        

    }
    catch(e){
        return res.status(500).json({
            err : `INTERNAL SERVER ERROR  : ${e.message}`
        })
    }
    
}


module.exports = {
    authenticate
}