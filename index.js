require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var _ = require('lodash');
const fast2sms = require("fast-two-sms");
const mongoose = require('mongoose');
const session = require('express-session');
const { convertCSVToArray } = require('convert-csv-to-array');
const converter = require('convert-csv-to-array');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const localStrategy = require('passport-local').Strategy;
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const { parse } = require("csv-parse");

var fs = require('fs');






const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "mylevelupsecret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    balance: Number
});

userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);


// Passport Local Strategy
passport.use(User.createStrategy());
// To use with sessions
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get('/', (req, res) => {
    res.render("landingPage");
});
app.get("/login", (req, res) => {
    res.render('login');
});
app.get("/register", (req, res) => {
    res.render('register');
});
app.get("/addmoney", (req, res) => {
    res.render('addmoney');
});
app.get("/home", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("home");
    } else {
        res.redirect("/login");
    }
});
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err)
        } else {
            res.redirect('/');
        }
    })
});




app.post("/register", (req, res) => {

    User.register(new User({ username: req.body.username, balance: 0 }), req.body.password, function (err, user) {
        if (!user) {

            
            res.send(`<h1>Email allready Exist</h1>`)
            // stop further execution in this callback
            
            return;
           
        } else {
            passport.authenticate("local")(req, res, function () {

                res.redirect("/home");
            })
        }
    })
})












// const newUser = new User({
//     email: req.body.username,
//     password: req.body.password
// })

// newUser.save((err)=>{
//     if (err) {
//         console.log(err);
//     } else{
//         res.render('home');
//     }
// })




app.post('/login', (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.logIn(user, (err) => {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/home');
            })
        }
    })


    // const userName = req.body.username;
    // const password = req.body.password;
    // User.findOne({email:userName},(err,foundUser)=>{
    //     if (err) {
    //         console.log(err)
    //     } else {
    //         if (foundUser) {
    //             if (foundUser.password=== password) {
    //                 res.render('home');
    //             }
    //         }
    //     }
    // })
});


app.post('/sendmessage', upload.single('avatar'),(req, res) => {
    const otpnText = req.body.text;
    let phNumber = req.body.number;
    const file = req.file;
    API_KEY = process.env.API_KEY

    if(!phNumber){
        phNumber = []
        fs.createReadStream(file.path)
        .pipe(parse({ delimiter: ",", from_line: 2 }))
        .on("data", function (row) {
        //    console.log(row[row.length - 1])
           phNumber.push(row[row.length -9])
        }).addListener('end',()=>{
            console.log( phNumber)
            var options = { authorization: API_KEY, message: otpnText, numbers: phNumber }
            // fast2sms.sendMessage(options)
        })
    }else{
        console.log( phNumber)
        var options = { authorization: API_KEY, message: otpnText, numbers: [phNumber] }
        fast2sms.sendMessage(options)
    }
    
    res.send("success")
    
     
    

    fast2sms.sendMessage(options) //Asynchronous Function.
    // const userId = req.user._id;

    // User.findById(userId, function (err, docs) {
    //     if (err) {
    //         console.log(err);
    //     }
    //     else {
    //         console.log("Result : ", docs.balance);
    //     }

    // })


    // User.findByIdAndUpdate(userId, { balance: 10 }, (err, docs) => {
    //     if (err) {
    //         console.log(err)
    //     }
    //     else {
    //         console.log("Updated User : ", docs.email);
    //     }
    // });



    // fast2sms.sendMessage(options).then(response => {
    //     res.send("message sent successfully");
    // })

        
});

app.post('/addmoney', (req, res) => {
    const aemail = req.body.Aemail;
    const newBalance = req.body.addmoney

    User.findOne({ username: aemail }, function (err, docs) {
        if (!docs) {
            res.send('<h2>Not a valid Id</h2>');
        }
        else {
            const uid = docs._id;


            User.findByIdAndUpdate(uid, { $inc: { balance: newBalance } }, (err, docs) => {
                if (err) {
                    console.log(err)
                }
                else {

                    res.send(`<h2>Money added to your account</h2>`)
                }

            });

        }
    });


    // User.findOne({email:aemail }, function (docs) {
    //     if (docs){
    //         const id =  docs.id;
    //         console.log(id);
    //         User.findByIdAndUpdate(id, { balance: 10 },  (err,docs)=>{
    //             if (err){
    //                 console.log(err)
    //             }
    //             else{
    //                 console.log("Updated User : ", docs.email);
    //             }
    //         });

    //     } else{
    //         res.send("not a valid user");
    //     } 
    // });


})



app.listen(2000, function () {
    console.log("Server started on port 2000");
});