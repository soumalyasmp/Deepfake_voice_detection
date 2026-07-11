import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import detectRoute from "./routes/detect.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/detect", detectRoute);

app.get("/", (req, res) => {

    res.json({

        success: true,

        message: "Reality Defender Backend Running"

    });

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`Server Running ${PORT}`);

});