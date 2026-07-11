import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_KEY;

const headers = {
    "X-API-KEY": API_KEY,
    "Content-Type": "application/json"
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function detectAudio(filePath) {

    try {

        console.log("========== STEP 1 ==========");
        console.log("Requesting Signed URL...");

        const signedResponse = await axios.post(

            "https://api.prd.realitydefender.xyz/api/files/aws-presigned",

            {
                fileName: path.basename(filePath)
            },

            {
                headers
            }

        );

        const signedUrl = signedResponse.data.response.signedUrl;

        const requestId = signedResponse.data.requestId;

        console.log("Signed URL Created");

        console.log("========== STEP 2 ==========");
        console.log("Uploading Audio...");

        const buffer = fs.readFileSync(filePath);

        await axios.put(

            signedUrl,

            buffer,

            {

                headers: {

                    "Content-Type":"application/octet-stream"

                },

                maxBodyLength:Infinity

            }

        );

        console.log("Upload Successful");

        console.log("========== STEP 3 ==========");
        console.log("Waiting for Analysis...");

        let attempts = 0;

        while(attempts < 20){

            await sleep(3000);

            const response = await axios.get(

                `https://api.prd.realitydefender.xyz/api/media/users/${requestId}`,

                {

                    headers

                }

            );

            const result = response.data;

            console.log(

                "Polling",

                attempts+1,

                result.resultsSummary?.status

            );

            if(

                result.resultsSummary &&

                result.models &&

                result.models.length>0

            ){

                return{

                    prediction:

                    result.resultsSummary.status,

                    score:

                    result.resultsSummary.metadata?.finalScore,

                    uploadedDate:

                    result.uploadedDate,

                    mediaType:

                    result.mediaType,

                    requestId,

                    models:

                    result.models.filter(

                        model=>

                        model.status!=="NOT_APPLICABLE"

                    )

                };

            }

            attempts++;

        }

        throw new Error(

            "Detection Timeout"

        );

    }

    catch(err){

        console.log(

            err.response?.data ||

            err.message

        );

        throw err;

    }

}