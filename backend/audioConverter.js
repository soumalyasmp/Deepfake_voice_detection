import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import path from "path";

export function convertToWav(inputPath) {
  return new Promise((resolve, reject) => {

    const outputPath = inputPath.replace(
      path.extname(inputPath),
      ".wav"
    );

    const ffmpeg = spawn(ffmpegPath, [
      "-y",                   // overwrite if exists
      "-i", inputPath,         // input file
      "-acodec", "pcm_s16le",  // WAV PCM 16-bit
      "-ac", "1",              // mono
      "-ar", "16000",          // 16 kHz
      outputPath
    ]);

    let errorOutput = "";

    ffmpeg.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    ffmpeg.on("close", (code) => {

      if (code === 0) {

        console.log("✅ WebM converted to WAV");

        resolve(outputPath);

      } else {

        console.log(errorOutput);

        reject(
          new Error("FFmpeg conversion failed.")
        );

      }

    });

    ffmpeg.on("error", (err) => {

      reject(err);

    });

  });
}