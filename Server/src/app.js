import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import compression from 'compression';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
});

app.use(express.json({ limit: "16kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(limiter);
app.use(cookieParser());
app.use(compression())

const server = http.createServer(app);

//Socket.IO Configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    method: ['GET', 'POST'],
    credentials: true
  },
});

let onlineUsers = {}; // Store online users (socket.id -> userId)
let messages = []; // strore all messages

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  //Track Online Users
  socket.on('userConnected', (userId)=>{
    onlineUsers[socket.id] = userId;
    io.emit('updateOnlineUsers',Object.values(onlineUsers)); //Notify all user

  })

  //Handling Group Chat Messages
  socket.on('sendGroupMessage', (data)=>{
    const message = {...data, read: false, type: "group"};
    message.push(message); //Store message
    io.emit('newGroupMessage', message)// send to all users
  })

  //Handling one to one Messages
  socket.on('sendPrivetMessage', ({senderId, receiverId, text})=>{
    //Find receiver's socket Id

    const receiverSocketId = Object.keys(onlineUsers).find(
        (key)=> onlineUsers[key] === receiverId
    )

    if(receiverId){
        const privatMessage = {
           id: Date.now(),
           senderId,
           receiverId,
           text,
           read: false,
           type: "private" 
        };
        messages.push(privatMessage); //store private message
        io.to(receiverId).emit("newPrivateMessage", privateMessage); //send to receiver
    }
  })
  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit('updateOnlineUsers', Object.values(onlineUsers)) // update client list
    console.log("User disconnected", socket.id);
  });
});

export default server;
