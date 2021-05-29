const https = require('https');
const fs = require('fs');
const csvWriter = require('csv-write-stream');
const sms = require('./testSmsApi');
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 5000

let clearTrackerInterval;
express()
  .use(bodyParser.urlencoded({ extended: false }))
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index', { mobileNo: "HEY" }))
  .post('/', (req, res) => {
    if(clearTrackerInterval){
      clearInterval(clearTrackerInterval);
    }
    vaccineTracker(req.body.mobileNo, req.body.feeLimit);
    clearTrackerInterval=setInterval(()=>{vaccineTracker(req.body.mobileNo)}, 30000);
    return res.render('pages/index', { mobileNo: req.body.mobileNo ? req.body.mobileNo : "No mobileNo input 😥" });
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))



const body = JSON.stringify({
  "sender_id": "TXTIND",
  "message": "This is a test message",
  "route": "v3",
  "numbers": "9616202185"
})

async function vaccineTracker(mobileNo, feeLimit) {
  console.log("working")
  const today = new Date();
  const date = today.toLocaleDateString('en-IN');
  https.get('https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?Accept-Language=hi_IN&district_id=363&date=' + date, (resp) => {
    // https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?Accept-Language=hi_IN&district_id=363&date=26/05/2021  
    let data = '';

    // A chunk of data has been received.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      try {
        data = JSON.parse(data);
        if (data && data["sessions"]) {
          console.log("sessions available -", data["sessions"].length)

          data["sessions"].forEach(session => {
            if (session["min_age_limit"] < 43 && session["available_capacity_dose1"] > 0) {
              let vaccine_data = {
                CENTER: session["name"],
                ADDRESS: session["address"],
                PINCODE: session["pincode"],
                DOSE1: session["available_capacity_dose1"],
                DOSE2: session["available_capacity_dose2"],
                AVAILABILIY_DATE: session["date"],
                DATE: date,
                TIME: today.toLocaleTimeString(),
                FEE: session["fee"]
              }
              sms(vaccine_data,mobileNo,feeLimit);
              writeToCSVFile(vaccine_data);
              console.log(`\t slots - ${session["available_capacity_dose1"]}\n pincode ${session["pincode"]}\n - date - ${session["date"]}\n\t  ${session["name"]}, ${session["address"]} on ${session["date"]}`);
            }
          })
        }
      } catch (err) {
        console.log(err);
        console.log("Continuing");
      }
    });

  }).on("error", (err) => {
    //console.log("Error: " + err.message);
  });
};

async function writeToCSVFile(vaccine_data) {

  let writer;
  if (!fs.existsSync('vaccineTracker.csv'))
    writer = csvWriter({ headers: ["CENTER", "ADDRESS", "PINCODE", "DOSE1", "DOSE2", "AVAILABILIY_DATE", "DATE", "TIME", "FEE"] });
  else
    writer = csvWriter({ sendHeaders: false });

  writer.pipe(fs.createWriteStream('vaccineTracker.csv', { flags: 'a' }))
  writer.write(vaccine_data)
  writer.end();

}