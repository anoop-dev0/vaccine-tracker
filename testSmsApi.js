const https = require('https');
const superagent = require('superagent');


const bodyData = {
    "sender_id": "TXTIND",
    "message": "This is a test message",
    "route": "v3",
    "numbers": "9616202185"
};


async function sms(smsData, mobileNo) {
    try {
        if (smsData["DOSE1"] < 10 || !mobileNo)
            return
        else {
            bodyData.message = `${smsData["DOSE1"]} slots available at ${smsData["CENTER"]}, ${smsData["PINCODE"]} on ${smsData["AVAILABILIY_DATE"]} ----- ${smsData["DATE"]}, ${smsData["TIME"]}`;
            if (mobileNo) {
                bodyData.numbers = mobileNo;
            }
            const body = JSON.stringify(bodyData);
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': 'QC7fXobpNK1waJUZjMlFukqs6TrBg93PviG5y2znIWxSRdmE8YjMJKiq3SWgl6DrXkEG0nHQRaINBcLh',
                    'Content-Length': body.length
                }
            }
            const req = https.request("https://www.fast2sms.com/dev/bulkV2", options, (res) => {
                console.log(`statusCode: ${res.statusCode}`)
                res.on('data', (d) => {
                    process.stdout.write(d)
                })
            })

            req.on('error', (error) => {
                console.error(error)
            })
            req.write(body)
            req.end()
        }
    } catch (errrr) {
        console.log(errrr)
    }
}

module.exports = sms;