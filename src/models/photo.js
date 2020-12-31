const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
  id: String,
  fileId: String,
});

module.exports = mongoose.model("Photo", photoSchema);
