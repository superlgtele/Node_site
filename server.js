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

app.delete("/delete", function (req, res) {});

app.post("/add", function (req, res) {
  res.send("전송완료");
  // 콜렉션: counter, name: boardnumber인 데이터 = result
  db.collection("counter").findOne(
    { name: "boardnumber" },
    function (err, result) {
      // practice 콜렉션에 id: result의 totalPost값, title/date는 사용자 입력값을 넣음
      const allboardnum = result.totalPost;
      db.collection("practice").insertOne(
        { _id: allboardnum + 1, title: req.body.title, date: req.body.date },
        function (err, result) {
          console.log("저장완료");
          // 위의 코드가 성공하면 collection: counter 에서 name:boardnumber 인 데이터의 totalPost 값에 1을 더함($increase)
          db.collection("counter").updateOne(
            { name: "boardnumber" },
            { $inc: { totalPost: 1 } },
            function (err, result) {
              if (err) {
                return console.log(err);
              }
            }
          );
        }
      );
    }
  );
});
