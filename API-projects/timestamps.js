let fs = require("fs");

module.exports = function (req, res, next) {
  //express .use appears to strip off the "/timestamp-microservice" in the router before passing to here
  let dateStr = req.url.replace(/%20/g, " ").slice(1); //slice off the leading "/""
  console.log("Parsing time as:", dateStr); //remove after debugging

  //handler for loading the instruction page
  if (dateStr === "") {
    fs.readFile("./API-projects/timestamps.html", (err, data) => {
      if (err) {
        res.status(400);
        res.set({'Content-Type': 'text/plain'});
        res.end();

        throw err;
      }

      res.status(200);
      res.set({'Content-Type': 'text/html'});
      res.end(data);
    });

  //otherwise try to retun the date string
  } else {

    let result = {};

    //if dateStr is alldigits, convert it to an integer, otherwise leave it as string
    if ((/^\d+$/).test(dateStr)) {dateStr = +dateStr;}

    let date = new Date(dateStr);

    if (date.valueOf() === NaN) {
      res.status(400);

      result.unix === null;
      result.natural === null;

    //error handler if invalid date string passed
    } else {
      res.status(200)

      result.unix = date.valueOf();
      result.natural = date.toDateString();
    }

    //set headers and end the response
    res.set({'Content-Type': 'application/json'});
    res.end(JSON.stringify(result));
  }
};