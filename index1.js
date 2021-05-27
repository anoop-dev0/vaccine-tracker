const https = require('https');
const fs  = require('fs');
const csvWriter = require('csv-write-stream');


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
  const date = today.toLocaleDateString('en-IN').replace('/','-0').replace('/','-');
  https.get('https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?Accept-Language=hi_IN&district_id=363&date=' + date, (resp) => {
    let data = '';

    // A chunk of data has been received.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      if (data) {
        data = JSON.parse(data);
        if (data && data["centers"]) {
          console.log("centers available \t", data["centers"].length)
          data["centers"].forEach(center => {
            let vaccine_data = {
              CENTER: center["name"],
              ADDRESS: center["address"],
              PINCODE: center["pincode"],
              DATE: date,
              TIME: today.toLocaleTimeString(),
            };
            let writer;
            if (!fs.existsSync('vaccineTracker.csv'))
              writer = csvWriter({ headers: ["CENTER", "ADDRESS", "PINCODE", "DATE", "TIME"]});
          else
              writer = csvWriter({sendHeaders: false});

            writer.pipe(fs.createWriteStream('vaccineTracker.csv',{flags:'a'}))
            writer.write(vaccine_data)
            writer.end();

            if (center["sessions"]) {
              center["sessions"].forEach(session => {
                if (session["min_age_limit"] < 27 && session["available_capacity_dose1"] > 0) {
                  // let vaccine_data = [{
                  //   Center: center["name"],
                  //   Address: center["address"],
                  //   PinCode: center["pincode"],
                  //   Dose1: session["available_capacity_dose1"],
                  //   Dose2: session["available_capacity_dose2"],
                  //   AvailabilityDate: session["date"],
                  //   Date: date,
                  //   Time: today.toLocaleTimeString(),
                  // }]

                  // const ws = reader.utils.json_to_sheet(vaccine_data)

                  // reader.utils.sheet_add_json(file, ws, "Sheet1")

                  // Writing to our file
                  console.log(`${session["available_capacity_dose1"]} slots available at ${center["name"]}, ${center["address"]} on ${session["date"]}`);
                  // player.play('goes-without-saying-608.mp3',(err)=>{
                  //   console.log("Player Error - ",err);
                  // })
                  body.message = `${session["available_capacity_dose1"]} slots available at ${center["name"]}, ${center["address"]} on ${session["date"]}`;
                  options.headers['Content-Length'] = body.length
                  const req = https.request(options, resp => {
                    console.log(`statusCode: ${resp.statusCode}`)
                    const respData = '';

                    resp.on('data', d => {
                      respData += d;
                    })
                    resp.on('end', () => {
                      console.log(respData);
                    })
                  })

                  req.on('error', error => {
                    //console.log(error);
                  })
                  req.end();
                }
              })
            }
          });
        }
      }
      });

  }).on("error", (err) => {
    //console.log("Error: " + err.message);
  });
};
vaccineTracker();
//setInterval(vaccineTracker, 30000);