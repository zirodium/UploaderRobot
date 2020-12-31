const mongoose = require("mongoose");

const server = "127.0.0.1:27017";

const database = "uploader";

class Database {
  constructor() {
    this.connect();
  }
  connect() {
    mongoose
      .connect(`mongodb://${server}/${database}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log("Connected To Database!");
      })
      .catch((e) => console.log("Database Connection Error! ", e.message));
  }
}

module.exports = new Database();
