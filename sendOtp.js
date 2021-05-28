const https = require('https');
const superagent = require('superagent');
const readline = require("readline");
const sha256 = require('crypto-js/sha256');


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const bodyData = {
    "mobile": "9373510107"
};



async function sendOTP(duplicateMobile) {

    bodyData.mobile = duplicateMobile;
    const body = JSON.stringify(bodyData);
    const options = {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Content-Length': body.length
        }
    }
    let txn = '';

    const req = https.request("https://cdn-api.co-vin.in/api/v2/auth/public/generateOTP", options, (res) => {
        console.log(`statusCode: ${res.statusCode}`);
        res.on('data', (d) => {
            txn += d;
            process.stdout.write(d)
        })
        res.on('end',()=>{
            txn = JSON.parse(txn);
            try{
                confirmOtp(txn.txnId)
            }catch(err){
                console.log(err);
            }
        })
    })

    req.on('error', (error) => {
        console.error(error)
    })
    req.write(body)
    req.end(()=>{
       
    })
}
async function confirmOtp(txnId) {

    rl.question("Enter OTP ? ", function(otp) {
        const otpbody = JSON.stringify({
            "otp": sha256(otp).toString(),
            "txnId": txnId
        });
        console.log(otpbody)
        const options = {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Content-Length': otpbody.length
            }
        }
        const req = https.request("https://cdn-api.co-vin.in/api/v2/auth/public/confirmOTP", options, (res) => {
            console.log(`statusCode: ${res.statusCode}`)
            res.on('data', (d) => {
                process.stdout.write(d)
            })
        })
    
        req.on('error', (error) => {
            console.error(error)
        })
        req.write(otpbody)
        req.end()
        rl.close();
    });
    
}
sendOTP();
module.exports = sendOTP;