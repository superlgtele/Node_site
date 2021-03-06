const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const bcrypt = require("bcryptjs");
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
app.use(function (req, res, next) {
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

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

app.get("/register", function (req, res) {
  res.render("register.ejs");
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
  res.render("mypage.ejs", { ?????????: req.user });
});

app.get("/logout", function (req, res) {
  req.logOut();
  res.redirect("/");
});

app.get("/search", function (req, res) {
  db.collection("practice")
    .find({ title: req.query.value })
    .toArray((err, result) => {
      res.render("search.ejs", { posts: result });
    });
});

function checklogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send("???????????? ?????? ????????????.");
  }
}

app.put("/edit", function (req, res) {
  db.collection("practice").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    function (err, result) {
      console.log("????????????!");
      res.redirect("/list");
    }
  );
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
  // function (req, res) {
  //   res.redirect("/");
  // }
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
        const SamePw = bcrypt.compareSync(inputpw, result.pw);
        if (err) return done(err);

        if (result.id !== inputid)
          return done(null, false, { message: "???????????? ?????? ??????????????????" });
        if (SamePw) {
          return done(null, result);
        } else {
          return done(null, false, { message: "??????????????? ???????????????" });
        }
      });
    }
  )
);
// done ?????? ???????????? ??????(??????????????????, ???????????? ?????????DB?????????, ???????????????)

// id??? ???????????? ????????? ??????????????? ??????(????????? ?????????)
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

// ??? ?????? ???????????? ?????? ????????? DB?????? ?????? ??????(??????????????? ?????????)
passport.deserializeUser(function (serialuser, done) {
  db.collection("login").findOne({ id: serialuser }, function (err, result) {
    done(null, result);
  });
});

app.post("/register", function (req, res) {
  const HashPw = bcrypt.hashSync(req.body.pw);
  db.collection("login").insertOne(
    { id: req.body.id, pw: HashPw },
    function (err, result) {
      res.redirect("/login");
    }
  );
});

app.post("/add", function (req, res) {
  res.redirect("/list");
  // ?????????: counter, name: boardnumber??? ????????? = result
  db.collection("counter").findOne(
    { name: "boardnumber" },
    function (err, result) {
      // practice ???????????? id: result??? totalPost???, title/date??? ????????? ???????????? ??????
      const AllBoardNum = result.totalPost;
      const BoardData = {
        _id: AllBoardNum + 1,
        user: req.user.id,
        title: req.body.title,
        date: req.body.date,
      };
      db.collection("practice").insertOne(BoardData, function (err, result) {
        console.log("????????????!");
        // ?????? ????????? ???????????? collection: counter ?????? name:boardnumber ??? ???????????? totalPost ?????? 1??? ??????($increase)
        db.collection("counter").updateOne(
          { name: "boardnumber" },
          { $inc: { totalPost: 1 } },
          function (err, result) {
            if (err) {
              return console.log(err);
            }
          }
        );
      });
    }
  );
});

app.delete("/delete", function (req, res) {
  req.body._id = parseInt(req.body._id);
  const DeleteData = { _id: req.body._id, user: req.user.id };
  db.collection("practice").deleteOne(DeleteData, function (err, result) {
    // if (result.deletedCount == 0) {
    //   return err;
    // } else {
    //   res.status(200).send(result);
    // }
    res.status(200).send(result);
  });
});
