const express = require('express');
const request = require('request');
const app = express();
const path = require('path');
const jwt = require('jsonwebtoken');
const auth = require('./lib/auth');
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, 'public')));

var mysql      = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '비번',
  database : 'fintech'
});

connection.connect();
app.get('/signup',function(req,res){
    res.render('signup');
})

app.get('/authResult',function(req,res){
    var authCode = req.query.code;
    var option = {
        method : "POST",
        url : "https://testapi.openbanking.or.kr/oauth/2.0/token",
        header : {
            'Content-Type' : 'application/x-www-form-urlencoded'
        },
        form : {
            code : authCode,
            client_id : "키",
            client_secret : "키",
            redirect_uri : "http://localhost:8080/authResult",
            grant_type : "authorization_code"
        }
    }
    request(option,function(error,response,body){
        var requestResultJSON = JSON.parse(body);
        res.render('resultChild',{data : requestResultJSON})
    });
})

app.post('/signup',function(req,res){
    var userName = req.body.userName;
    var userEmail = req.body.userEmail;
    var userPassword = req.body.userPassword;
    var userAccessToken = req.body.userAccessToken;
    var userRefreshToken = req.body.userRefreshToken;
    var userSeqNo = req.body.userSeqNo;

    var sql = "INSERT INTO user (name, email, password, accesstoken, refreshtoken, userseqno) VALUES (?, ?, ?, ?, ?, ?)";
    connection.query(sql,[userName,userEmail,userPassword,userAccessToken,userRefreshToken,userSeqNo], function(error,results,fields) {
        if(error) throw error;
        res.json('가입완료');
    });

})


app.get('/login',function(req,res){
    res.render('login');
})

app.post('/login', function(req, res){
    var userEmail = req.body.userEmail;
    var userPassword = req.body.userPassword;

    var sql = "SELECT * FROM user WHERE email = ?";
    connection.query(sql,[userEmail],function(err,result){
        if(err) throw err;
        if(result.length == 0){
            res.json('이메일을 확인해주세요.');
        }
        else{
            var dbPassword = result[0].password;
            if(dbPassword == userPassword){
                jwt.sign({
                    userId : result[0].id,
                    userName : result[0].name
                },//payload부분
                'fintechservice!1234#',
                {
                    expiresIn : '1d',
                    issuer : 'fintech.admin',
                    subject : 'user.login.info'
                },
                function(err,token){
                    res.json(token);
                });
            }
            else{
                res.json('비밀번호를 확인해주세요.');
            }
        }
    })
})

app.get('/authTest',auth, function(req,res){
    res.json(req.decoded);
})

app.get('/main',function(req,res){
    res.render('main');
})

app.post('/list',auth,function(req,res){
    var userId = req.decoded.userId;
    var accessToken;
    var userSeqNo;
    var sql = "SELECT * FROM user where id = ?";
    connection.query(sql,[userId],function(err,result){
        if(err) throw err;
        accessToken = result[0].accesstoken;
        userSeqNo = result[0].userseqno;
        var option = {
            method : 'GET',
            url : "https://testapi.openbanking.or.kr/v2.0/user/me",
            headers : {
                'Authorization' : "Bearer " + accessToken
            },
            qs : {
                user_seq_no : userSeqNo
            }
        }
        request(option, function (error, response, body){
            var requestResultJSON = JSON.parse(body);
            res.json(requestResultJSON);
        })
    })
})
app.listen(8080)