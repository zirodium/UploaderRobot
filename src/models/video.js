const mongoose = require("mongoose");
const videoSchema = new mongoose.Schema({
  id: String,
  fileId: String,
});

module.exports = mongoose.model("Video", videoSchema);
