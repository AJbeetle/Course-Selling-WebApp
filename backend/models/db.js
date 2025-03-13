const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email : {type:String, require:true, unique:true},
    password : {type:String, require:true},
    firstName : {type:String, require:true},
    middleName : {type:String},
    lastName : {type:String}
})

const adminSchema = new Schema({
    email : {type:String, require:true, unique:true},
    password : {type:String, require:true},
    firstName : {type:String, require:true},
    middleName : {type:String},
    lastName : {type:String}
})


const courseSchema = new Schema({
    title : {type:String, require:true, unique:true},
    image : {type:String, require:true},
    description : {type:String, require:true, unique:true},
    price : {type:Number, require:true},
    creatorId : {type:mongoose.Schema.Types.ObjectId, ref:"admins", require:true}
})

const purchaseSchema = new Schema({
    userId : {type:mongoose.Schema.Types.ObjectId, ref:"users", require:true},
    courseId : {type:mongoose.Schema.Types.ObjectId, ref:"courses", require:true}
})


// Problem with schema which is defined below : As the course grows, the content array will incease in size get bloated, so slowing down queries. So it is not recommended to have single courseContent document for each course It is better you have multiple courseContent referenced to a course with timestamp in each of those. So, order of content added is also recognisable

/* const courseContentSchema = Schema({
    courseId : {type:mongoose.Schema.Types.ObjectId, ref:"courses", require:true, unique:true},
    content : [
        {
            title : {type:String, require:true},    //like week1, week2 ... 
            url : {type:String}                      // link to the files [audio, video, pdf, image etc]
        }
    ]

}) */

const courseContentSchema = Schema({
    courseId : {type:mongoose.Schema.Types.ObjectId, ref:"courses", require:true},
    title : {type:String, require:true},    //like week1, week2, week3 ...
    url : {type:String} 
},{timestamps:true})  //adds createdAt and updatedAt 

courseContentSchema.virtual("courseImage",
    {
        ref : "courses",
        localField: "courseId",
        foreignField : "_id",
        justOne:true,
        options : {select : "image"}  //only gets image field
    }
)

courseContentSchema.set("toJSON", { virtuals: true });  // ensures that when response to database query results in mongodb document and is converted to JSON via express, then virtual fields are also included
courseContentSchema.set("toObject", { virtuals: true });

// fetching data with populate
// const content = await CourseContent.findOne({ courseId: courseId }).populate("courseImage");
// console.log(content.courseImage.image); // Outputs: "https://example.com/react.jpg"


const userModel = mongoose.model("users",userSchema);
const adminModel = mongoose.model("admins",adminSchema);
const courseModel = mongoose.model("courses",courseSchema);
const purchaseModel = mongoose.model("purchases",purchaseSchema);
const courseContentModel = mongoose.model("courseContents",courseContentSchema);

module.exports = {
    userModel, adminModel, courseModel, purchaseModel, courseContentModel
}
