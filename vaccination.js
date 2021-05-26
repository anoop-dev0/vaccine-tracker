const https = require('https');
/* GET home page. */

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
function vaccination() {

  const date = new Date().toLocaleDateString('en-IN');
  https.get('https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=363&date=26-05-2021', (resp) => {
    let data = '';

    // A chunk of data has been received.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      data = JSON.parse(data);
      if(data && data["centers"]){
        console.log("centers - ", data["centers"].length);

        data["centers"].forEach(center => {
          if(center["sessions"]){
            center["sessions"].forEach(session =>{
              if(session["min_age_limit"] < 27 && session["available_capacity_dose1"]>0){
                body.message = `${session["available_capacity"]} slots available at ${center["name"]}, ${center["address"]} on ${session["date"]}`;
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
                  console.log(error);
                })
                req.end();
              }
            })
          }
        });
      }
      
    });

  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
}
//module.exports = vaccination;
vaccination();
