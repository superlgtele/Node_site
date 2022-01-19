const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
require("dotenv").config();

const db = mongoose.connection;
mongoose.connect(process.env.DB_URL);
db.once("open", function () {
  console.log("DB connected");
});
db.on("error", function (err) {
  console.log("DB ERROR : ", err);
});

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public", express.static("public"));
app.use(methodOverride("_method"));
app.use(
  session({ secret: "superlgtele", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.listen(process.env.PORT, function () {
  console.log("Start 5000 Server!");
});

app.get("/", function (req, res) {
  res.render("index.ejs");
});

app.get("/write", function (req, res) {
  res.render("write.ejs");
});

app.get("/login", function (req, res) {
  res.render("login.ejs");
});

app.get("/edit/:id", function (req, res) {
  db.collection("practice").findOne(
    { _id: parseInt(req.params.id) },
    function (err, result) {
      res.render("edit.ejs", { updatepost: result });
    }
  );
});

app.get("/list", function (req, res) {
  db.collection("practice")
    .find()
    .toArray(function (err, result) {
      res.render("list.ejs", { posts: result });
    });
});

app.get("/detail/:id", function (req, res) {
  db.collection("practice").findOne(
    { _id: parseInt(req.params.id) },
    function (err, result) {
      res.render("detail.ejs", { iddata: result });
    }
  );
});

app.get("/mypage", checklogin, function (req, res) {
  res.render("mypage.ejs", { 사용자: req.user });
});

function checklogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send("로그인을 먼저 해주세요.");
  }
}

app.delete("/delete", function (req, res) {
  req.body._id = parseInt(req.body._id);
  db.collection("practice").deleteOne(req.body, function (err, result) {
    console.log("삭제완료!");
    res.status(200).send({ message: "success!" });
  });
});

app.put("/edit", function (req, res) {
  db.collection("practice").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    function (err, result) {
      console.log("수정완료!");
      res.redirect("/list");
    }
  );
});

app.post("/add", function (req, res) {
  res.redirect("/list");
  // 콜렉션: counter, name: boardnumber인 데이터 = result
  db.collection("counter").findOne(
    { name: "boardnumber" },
    function (err, result) {
      // practice 콜렉션에 id: result의 totalPost값, title/date는 사용자 입력값을 넣음
      const allboardnum = result.totalPost;
      db.collection("practice").insertOne(
        { _id: allboardnum + 1, title: req.body.title, date: req.body.date },
        function (err, result) {
          console.log("저장완료!");
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

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/fail",
  }),
  function (req, res) {
    res.redirect("/");
  }
);

passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (inputid, inputpw, done) {
      db.collection("login").findOne({ id: inputid }, function (err, result) {
        if (err) return done(err);

        if (!result)
          return done(null, false, { message: "존재하지 않는 아이디입니다" });
        if (inputpw == result.pw) {
          return done(null, result);
        } else {
          return done(null, false, { message: "비밀번호가 틀렸습니다" });
        }
      });
    }
  )
);
// done 함수 파라미터 기능(서버에러담당, 성공시의 사용자DB데이터, 에러메세지)

// id를 이용해서 세션을 저장시키는 코드(로그인 성공시)
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

// 이 세션 데이터를 가진 사람을 DB에서 찾는 코드(마이페이지 접속시)
passport.deserializeUser(function (serialuser, done) {
  db.collection("login").findOne({ id: serialuser }, function (err, result) {
    done(null, result);
  });
});
