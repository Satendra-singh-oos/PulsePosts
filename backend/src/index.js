import dotenv from "dotenv";
import connectDb from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8579, () => {
      console.log(
        `Server is up adn runnig ar port :${process.env.PORT || 8579}`
      );
    });
  })
  .catch((err) => {
    console.log("Db/Server Connection Failed");
  });
