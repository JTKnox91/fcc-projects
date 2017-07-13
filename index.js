var express = require('express')
var app = express()

// API PROJECTS
  //Timestamp Microservice
app.use("/timestamp-microservice", require("./API-projects/timestamps.js"));
  //Request Header Parser Microservice
app.use("/request-header-parser", require("./API-projects/req-parser.js"));
  //URL Shortener Microservice
app.use("/url-short", require("./API-projects/url-short.js"));
  //Image Search Abstraction Layer
app.use("/image-search", require("./API-projects/image-search.js"));
  //File Metadata Microservice
let upload = require('multer')();
app.get("/file-meta", require("./API-projects/file-meta.js").index);
app.post("/file-meta/size", upload.single('toBeSized'), require("./API-projects/file-meta.js").size);

app.listen(process.env.PORT || 3000, function () {
  console.log('Example app listening on port', process.env.PORT || 3000);
})