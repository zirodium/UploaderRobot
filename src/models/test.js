const vid = require("./video");

let msg = new vid({
  id: "testID",
  fileId: "myFileId",
});

msg.save((err) => {
  if (err) return "Error When Save Data!";
  return true;
});
