let fs = require('fs');

module.exports = {
  index: function (req, res, next) {
    fs.readFile("./API-projects/file-meta.html", (err, data) => {
      if (err) {
        res.status(500);
        res.set({'Content-Type': 'text/plain'});
        res.end(JSON.stringify(err));

        throw err;
      }

      res.status(200);
      res.set({'Content-Type': 'text/html'});
      res.end(data);
    });
  },

  size: function (req, res, next) {
    let size = req.file.size;
    let units = "Bytes";
    if (size > 1000) {
      size /= 1000;
      units = "KB";
    }

    if (size > 1000) {
      size /= 1000;
      units = "MB";
    }

    res.status(200);
    res.set({'Content-Type': 'text/plain'});
    res.end(size.toFixed(2) +" "+ units);
  }
};