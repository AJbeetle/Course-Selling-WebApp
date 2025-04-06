# KINDLY VIEW IN CODE FORMAT :) 

// Some Admins can provide free enrollment to the course for limited period of time => ending this time limit they might initiate automated payment. So, user might want to unenroll but still be seeing course contents to prevent transaction from their account [as soon as free trial time limit ends : courseContent will be revoked] ALSO when user unenrolls the course goes into archives and archives will have their own expiry time : 15 days . So, if archive time exceeds then also course content will be revoked 

http://localhost:3000/user : 
   -> /user/signup                            ✅: POST 
   -> /user/login                             ✅: POST 
   -> /user/dashboard                         ✅: GET     | Authenticated
   -> /user/myCourses                         ✅: GET     | Authenticated   //get all courses which user is enrolled in
   -> /user/myCoursesAll                      ✅: GET     | Authenticated   // get all courses enrolled and unenrolled both 
   -> /user/updateCourse/access               ✅: PATCH   | Authenticated
   -> /user/updateCourse/progressUptoDate     ✅: PATCH   | Authenticated           // 🔴this endpoint does not work as expected
   -> /user/buyCourse/                        ✅: POST    | Authenticated
   -> /user/myCourses/content                 ✅: GET     | Authenticated  
   


http://localhost:3000/admin : 
   -> /admin/signup                            ✅: POST    
   -> /admin/login                             ✅: POST   
   -> /admin/dashboard                         ✅: GET    | Authenticated
   -> /admin/addCourse                         ✅: POST   | Authenticated   : this instantiate a course with default false status
   -> /admin/deleteCourse/                     ✅: PATCH | Authenticated and Authorization checked    : SoftDelete/Disable : The status of course is set to false [so no user can view] but data related to that course persists in database i.e. purchaseModel and courseContentModel remains existing for corresponding courseName     
   -> /admin/deleteCourse/                     ✅: DELETE | Authenticated and Authorized  : hardDelete : The course is deleted from courseModel, its contents are deleted from purchaseModel and courseContentModel. Every corresponding data for this courseId is deleted 
   
   -> /admin/myCourses                          ✅: GET    | Authenticated
   -> /admin/myCourses/content                  ✅: GET    | Authenticated and Authorized : so, when user click on one of courses from his myCourses page he can see all the content he published
   -> /admin/courseUpdate/content               ✅: PATCH  | Authenticated and authorized
   -> /admin/courseUpdate/content               ✅: POST    | adding new contents in the course
   -> /admin/courseUpdate/about                 ✅: PATCH  | Authenticated and Authorization checked  : here you can update title, description, price, image for the course and updates status false -> true it CANNOT DO true -> false in STATUS key of courseModel



   There are several types of server requests : 
     -> GET      :  to request the data from the backend without sending the req body
     -> POST     :  to request/add or update the data with req body
     -> DELETE   :  to delete something from the backend
     -> PUT      :  to update the entire resource in backend with the data provided in req body 
     -> PATCH    :  to update the partial parts of backend with the specific parts send in req body


/*******************MAKE SURE EVERY TIME admin adds content to courseContentModel the purchaseModel's courseStatus array is updated************************************************* */



-> A course which is not live for users can be populated by admin. Maintaining content in advance for their users
-> All Admin Routes are working perfectly : handling all errors, input validation is working, unauthorized access is blocked
-> All User Routes


  >> When User unenrolls from a course, he can still view the courseContents  :  kind of auditing the course [So, handle this on frontend that when the enrollment variable is false give user two options : "audit" or "buy" ] & [ when enrollment status is true, give him one options "unenroll but keep auditing" and give a dialog box that  "access to this content will be revoked after 15 days. Re-enroll within this period to retain all content." ]   ------------but in this scenerio you need to give users partial access to the content when he/she is auditing and so many more functionalities to be encorporated

  SO

  letting users view the content when they are unenrolled [through the backend routes]but will not give this functionality on frontend .
  Users will be able to see content again once they enroll back, within time limit of 15 days [for this moment of time course will go into archives]
  -> you donot need to have archives as backend model or anything : frontend will handle it on the basis of enrollment variable in purchaseModel 

  =>____MAKE AN ENDPOINT WHERE USER CAN SEE ENROLLED AND UNENROLLED BOTH COURSES__
