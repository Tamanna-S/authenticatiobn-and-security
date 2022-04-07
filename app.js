require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express(); 

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false, 
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/secretUserDB");

const secretSchema = new mongoose.Schema({
    secret: String
});

const Secret = mongoose.model("Secret", secretSchema);

const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    secret: [secretSchema]
}); 
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
    res.render("home");
});
 
app.get("/login", function(req, res){
    res.render("login");
}); 

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    User.find({secret: {$ne: null}}, function(err, users){
        if(err){
            console.log(err);
        } else{
            if(users){
                res.render("secrets", {users: users});
            }
        }
    });
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else{
        res.redirect("/login")
    }
});

app.post("/submit", function(req, res){
    if(req.isAuthenticated()){
        User.findById(req.user.id, function(err, user){
            if(err){
                console.log(err);
                res.redirect("/submit");
            } else{
                if(user){
                    const nSecret = new Secret({
                        secret: req.body.secret
                    });
                    user.secret.push(nSecret);
                    user.save(function(err){
                        if(err){
                            console.log(err);
                            res.redirect("/submit");
                        } else{
                            res.redirect("/secrets");
                        }
                    });
                }
            }
        });
    } else{
        res.redirect("/login");
    }
    
});

app.post("/register", function(req, res){
   User.register({username: req.body.username}, req.body.password, function(err, user){
       if(err){
           console.log(err);
           res.redirect("/register");
       } else{

        //    passport.authenticate("local")(req, res, function(){
        //        res.redirect("/secrets");
        //    });

        req.login(user, function(err){
            if(!err){
                res.redirect("/secrets");
            } else{
                console.log(err);
            }
        })
       }
   });
});
 
app.post("/login", function(req, res){  
  
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
      if(err){
        console.log(err);
      } else{
            res.redirect("/secrets");
      }
  });
});



app.listen(3000, function(){console.log("server is up and running on port 3000.");});
