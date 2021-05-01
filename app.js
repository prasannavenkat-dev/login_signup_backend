const express = require('express');
const app = express();


const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;
const bcrypt = require('bcrypt');
require('dotenv').config();
const bodyParser = require("body-parser");

const dbURL = process.env.DB_URL;




const nodemailer = require('nodemailer');

const { google } = require('googleapis');


const cors = require('cors')
app.use(cors())

app.use(express.json());

app.get('/', function (req, res) {

    res.send('hellothere');

});
app.use(bodyParser.urlencoded({ extended: false }));


//USER REGISTRATION

app.post('/signup', async function (req, res) {
 

    try {
        let clientInfo = await mongoClient.connect(dbURL);

        let db = clientInfo.db('login_signup');


        let fName = req.body.fName;
        let lName = req.body.lName;
        let email = req.body.email;
        let password = req.body.password;

   let checkExist = await db.collection('signup').find({ email: email }).toArray()
         console.log(checkExist);
        if (checkExist.length) {
            console.log('user existed');
            res.send('Login Unsuccefull user existed');

        }
        else if(checkExist.length===0) {
            //HASHING PASSWORD 
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt)

            let dataInfo = {
                fName: fName,
                lName: lName,
                email: email,
                password: hash
            }
            db.collection('signup').insertOne(dataInfo, function (err, res) {

                if (err) throw err;
                sendMail(fName,lName,email,1);
                console.log('inserted');
            })
            let data = await db.collection('signup').find().project({ password: 0 }).toArray();

            res.send('Registered successfully!')


        }

        clientInfo.close();


    }
    catch (error) {
        console.log(error)
    }


})

//SENDING MAIL
const CLIENT_ID = '886620775509-unc18l62pt1sa5c41egm2k516iqu6njf.apps.googleusercontent.com';

const CLIENT_SECRET = '6DLtcbCffSiZJJhIF_mpPlas';
const REDIRECT_URL = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04wbriEaoK4MeCgYIARAAGAQSNwF-L9IrXttEMdyhxXYe53_WVYImi0EzPEMDyv_KO917KAqtnF2rCtoWri-DJSDSCs_p-mmZa5s';
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN })


async function sendMail(fName,lName,email,flag) {
 console.log('my mail',email);
    try {

        //GET ACCESS TOKEN
        const accessToken = await oAuth2Client.getAccessToken();

        //TO SEND MAIL

        const transport = nodemailer.createTransport({

            service: 'gmail',
            auth: {
                type: 'oAuth2',
                user: 'prasannavenkat.dev@gmail.com',
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken
            }

        })


        //GENERATE MAIL OPTIONS
        let mailOptions;

        if(flag===1){
             mailOptions = {

                from: 'Prasanna Venkatesh<prasannavenkat.dev@gmail.com>',
                to: email,
                subject: 'Registration Successfull',
                text: `Hi ${fName} ${lName},You have successfully registered.Do more with DROPBOX!!`,
                html: `<h2>Hi ${fName} ${lName},</h2><h3>You have successfully logged in.Do more with DROPBOX!!</h3>`
            };
        }

        else if(flag===2){

             mailOptions = {

                from: 'Prasanna Venkatesh<prasannavenkat.dev@gmail.com>',
                to: email,
                subject: 'Login Successfull',
                text: `Hi ${fName} ${lName},You have successfully registered.Do more with DROPBOX!!`,
                html: `<h2>Hi ${fName} ${lName},</h2><h3>You have successfully logged in.Do more with DROPBOX!!</h3>`
            };

        }
       

        //SEND MAIL USING TRANSPORT
        const result = await transport.sendMail(mailOptions)

        console.log(result);

    }
    catch (error) {

    }



}




//USER LOGIN
app.post('/login', async function (req, res) {



    try {
        let clientInfo = await mongoClient.connect(dbURL);
        let db = clientInfo.db('login_signup');

        let email = req.body.email;
        let password = req.body.password;

        let data = await db.collection('signup').find({ email: email }).toArray();
       
      

        if (data.length) {
            let fName=data[0].fName;
            let lName=data[0].lName;

            let passMatch = await bcrypt.compare(password, data[0].password)
            console.log(passMatch);
            if (passMatch) {

                sendMail(fName,lName,email,2);
                res.send('Login Successfull')

            }
            else {
                console.log('Password Wrong');
                res.send('Login Unsuccessfull')

            }

        }
        else {
            console.log('User Not existed');
            res.send('Login Unsuccessfull')

        }
        clientInfo.close()

    }
    catch (error) {
        console.log(error);
    }







})

app.listen( process.env.PORT, function () {
    console.log(`server started at ${process.env.PORT}`);
})
