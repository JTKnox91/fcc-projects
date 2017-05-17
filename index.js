var express = require('express')
var app = express()

// API PROJECTS
  //Timestamp Micro Service
app.use("/timestamp-microservice", require("./API-projects/timestamps.js"));
app.use("/request-header-parser", require("./API-projects/req-parser.js"));

app.listen(process.env.PORT || 3000, function () {
  console.log('Example app listening on port', process.env.PORT || 3000);
})