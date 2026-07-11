import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { detectAudio } from "../detector.js";
import { convertToWav } from "../audioConverter.js";

const router = express.Router();

const storage = multer.diskStorage({
    destination: "uploads/",

    filename: (req, file, cb) => {
        cb(
            null,
            Date.now() + path.extname(file.originalname)
        );
    }
});

const upload = multer({ storage });

router.post("/", upload.single("audio"), async (req, res) => {

    let filePath = null;

    try {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "No audio uploaded."
            });

        }

        console.log("========== Uploaded File ==========");
        console.log(req.file);

        filePath = req.file.path;

        const extension = path
            .extname(req.file.originalname)
            .toLowerCase();

        if (extension === ".webm") {

            console.log("🎤 Live recording detected.");

            console.log("Converting WebM to WAV...");

            filePath = await convertToWav(req.file.path);

            console.log("Converted File:", filePath);

        }

        console.log("Sending file to Reality Defender...");

        const result = await detectAudio(filePath);

        console.log("Detection Finished.");

        return res.status(200).json({

            success: true,

            ...result

        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

    finally {

        try {

            if (req.file && fs.existsSync(req.file.path)) {

                fs.unlinkSync(req.file.path);

                console.log("Original file deleted.");

            }

            if (
                filePath &&
                req.file &&
                filePath !== req.file.path &&
                fs.existsSync(filePath)
            ) {

                fs.unlinkSync(filePath);

                console.log("Converted WAV deleted.");

            }

        }

        catch (cleanupError) {

            console.log("Cleanup Error:", cleanupError.message);

        }

    }

});

export default router;