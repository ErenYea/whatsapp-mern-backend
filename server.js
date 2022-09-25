//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessage.js";
import Pusher from "pusher";
import cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 9000;
const pusher = new Pusher({
  appId: "1481682",
  key: "6c0ab72ab72aedfcac74",
  secret: "c34fba2092978fd555d7",
  cluster: "ap2",
  useTLS: true,
});
// middleware
app.use(express.json());
app.use(cors());
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Headers", "*");
//   next();
// });

// DB config
const url =
  "mongodb+srv://drstone:loveisone@cluster1.4kjziuf.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(url);

const db = mongoose.connection;

db.once("open", () => {
  console.log("Db is connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        received: messageDetails.received,
      });
    } else {
      console.log("Error trigerrring Pusher");
    }
  });
});

// api routes

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Hello World!",
  });
});

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

// listen
app.listen(port, () => {
  console.log(`Listening on localhost:${port}`);
});
