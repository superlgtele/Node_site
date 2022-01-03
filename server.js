const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const db = mongoose.connection;
mongoose.connect("mongodb://localhost:27017/test");
db.once("open", function () {
  console.log("DB connected");
});
db.on("error", function (err) {
  console.log("DB ERROR : ", err);
});

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.listen(5000, function () {
  console.log("Start 5000 Server!");
});

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/write", function (req, res) {
  res.sendFile(__dirname + "/write.html");
});

app.get("/list", function (req, res) {
  db.collection("practice")
    .find()
    .toArray(function (err, result) {
      res.render("list.ejs", { posts: result });
    });
});

app.post("/add", function (req, res) {
  res.send("전송완료");
  db.collection("practice").insertOne(
    { title: req.body.title, date: req.body.date },
    function (err, result) {
      console.log("저장완료");
    }
  );
});
