import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { detectAudio } from "../detector.js";

const router = express.Router();

const storage = multer.diskStorage({

    destination:"uploads/",

    filename:(req,file,cb)=>{

        cb(

            null,

            Date.now() +

            path.extname(file.originalname)

        );

    }

});

const upload = multer({

    storage

});

router.post(

    "/",

    upload.single("audio"),

    async(req,res)=>{

        try{

            if(!req.file){

                return res.status(400).json({

                    success:false,

                    message:"No Audio Uploaded"

                });

            }

            console.log(req.file);

            const result=

            await detectAudio(req.file.path);

            if(

                fs.existsSync(req.file.path)

            ){

                fs.unlinkSync(req.file.path);

            }

            return res.status(200).json({

                success:true,

                ...result

            });

        }

        catch(err){

            console.log(err);

            return res.status(500).json({

                success:false,

                message:err.message

            });

        }

    }

);

export default router;