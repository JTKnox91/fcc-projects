module.exports = function (req, res, next) {
  
  let ipaddress = req.ip;

  let language = req.headers["accept-language"];
  language = language.split(",")[0];

  let software = req.headers["user-agent"];
  //capture first item in parns
  software = software.replace(/^.*?\(/, "").replace(/\).*$/, "");

  let result = {
    ipaddress: ipaddress,
    language: language,
    software: software,
  };

  res.status(200);
  res.set({'Content-Type': 'application/json'});
  res.end(JSON.stringify(result));
};