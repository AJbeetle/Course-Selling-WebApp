http://localhost:3000/user : 
   -> /user/signup                            ✅: POST 
   -> /user/login                             ✅: POST 
   -> /user/dashboard                         ✅: GET     | Authenticated
   -> /user/myCourses                         ✅: GET     | Authenticated
   -> /user/updateCourse/access               ✅: PATCH   | Authenticated
   -> /user/updateCourse/progressUptoDate     ✅: PATCH   | Authenticated
   -> /user/buyCourse/:courseName/            ✅: POST    | Authenticated
   


http://localhost:3000/admin : 
   -> /admin/signup                            ✅: POST    
   -> /admin/login                             ✅: POST   
   -> /admin/dashboard                         : GET    | Authenticated
   -> /admin/addCourse                         : POST   | Authenticated
   -> /admin/deleteCourse/:courseName          : DELETE | Authenticated
   -> /admin/myCourses                         : GET    | Authenticated
   -> /admin/courseUpdate/content              : PATCH  | Authenticated
   -> /admin/courseUpdate/about                : PATCH  | Authenticated





   There are several types of server requests : 
     -> GET      :  to request the data from the backend without sending the req body
     -> POST     :  to request/add or update the data with req body
     -> DELETE   :  to delete something from the backend
     -> PUT      :  to update the entire resource in backend with the data provided in req body 
     -> PATCH    :  to update the partial parts of backend with the specific parts send in req body


