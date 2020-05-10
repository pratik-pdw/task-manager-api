const express = require("express");
const cors = require("cors");
//Connecting to MongoDB
require("../db/mongoose");

const userRouter = require("../routers/user");
const taskRouter = require("../routers/task");

const app = express();

const dotenv = require("dotenv");
dotenv.config();

//Using CORS and bodyparser middlewares
app.use(cors());
app.use(express.json());

app.use(userRouter);
app.use(taskRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is up and running on port ${process.env.PORT}`);
});
