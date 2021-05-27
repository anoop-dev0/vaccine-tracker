const https = require('https');
const fs = require('fs');
const csvWriter = require('csv-write-stream');
const sms = require('./testSmsApi');

const body = JSON.stringify({
  "sender_id": "TXTIND",
  "message": "This is a test message",
  "route": "v3",
  "numbers": "9616202185"
})

const options = {
  hostname: 'https://www.fast2sms.com',
  port: 443,
  path: '/dev/bulkV2',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': body.length
  }
}
function vaccineTracker() {
  console.log("working")
  const today = new Date();
  const date = today.toLocaleDateString('en-IN').replace('/', '-0').replace('/', '-');
  https.get('https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?Accept-Language=hi_IN&district_id=363&date=' + date, (resp) => {
    let data = '';

    // A chunk of data has been received.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      try {
        data = JSON.parse(data);
        if (data && data["centers"]) {
          console.log("centers available \t", data["centers"].length)
          data["centers"].forEach(center => {
            if (center["sessions"]) {
              center["sessions"].forEach(session => {
                if (session["min_age_limit"] < 27 && session["available_capacity_dose1"] > 0) {
                  let vaccine_data = {
                    CENTER: center["name"],
                    ADDRESS: center["address"],
                    PINCODE: center["pincode"],
                    DOSE1: session["available_capacity_dose1"],
                    DOSE2: session["available_capacity_dose2"],
                    AVAILABILIY_DATE: session["date"],
                    DATE: date,
                    TIME: today.toLocaleTimeString(),
                  }
                  writeToCSVFile(vaccine_data);
                  sms(vaccine_data);
                  console.log(`${session["available_capacity_dose1"]} slots available at ${center["name"]}, ${center["address"]} on ${session["date"]}`);
                }
              })
            }
          });
        }
      }catch(err){
        console.log(err);
        console.log("Continuing");
      }
    });

  }).on("error", (err) => {
    //console.log("Error: " + err.message);
  });
};

async function writeToCSVFile(vaccine_data){

  let writer;
  if (!fs.existsSync('vaccineTracker.csv'))
    writer = csvWriter({ headers: ["CENTER", "ADDRESS", "PINCODE", "DOSE1", "DOSE2", "AVAILABILIY_DATE", "DATE", "TIME"] });
  else
    writer = csvWriter({ sendHeaders: false });

  writer.pipe(fs.createWriteStream('vaccineTracker.csv', { flags: 'a' }))
  writer.write(vaccine_data)
  writer.end();

}
vaccineTracker();
setInterval(vaccineTracker, 30000);