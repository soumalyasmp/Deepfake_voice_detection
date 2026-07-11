import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_KEY;

async function testAPI() {

    const response = await fetch(
        "https://api.prd.realitydefender.xyz/api/files/aws-presigned",
        {
            method: "POST",

            headers: {
                "X-API-KEY": API_KEY,
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                fileName: "Recording (5).wav"
            })
        }
    );

    console.log("Status:", response.status);

    const data = await response.json();

    console.log(data);
}

testAPI();