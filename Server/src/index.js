import server from "./app.js";
import connectDb from "./db/index.js";

connectDb()
.then(()=>{
    server.listen(process.env.PORT || 3000, ()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.error('MongoDb Connection Field !!! ', err.message)
})