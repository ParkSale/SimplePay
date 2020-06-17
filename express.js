const express = require('express')
const request = require('request')
const app = express()
const path = require('path')

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
    console.log(req.body);
})
app.listen(8080)