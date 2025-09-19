import { createPartFromUri, createUserContent, GoogleGenAI } from "@google/genai";
import "dotenv/config";
import fs from "fs/promises";
import express from "express";
import multer from "multer";
import cors from "cors";

const app = express();
const upload = multer({
    dest: "uploads/",
});
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const geminiModels = {
    text: "gemini-2.5-flash-lite",
    image: "gemini-2.5-flash",
    audio: "gemini-2.5-flash",
    document: "gemini-2.5-flash-lite",
}

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/generate-text", async (req, res) => {
    const { body } = req;

    // guard clause --> satpam
    if (!body) {
        return res.status(400).send("Tidak ada payload yang dikirim!")
    }

    const { prompt } = body;
    if (!prompt) {
        return res.status(400).send("prompt tidak boleh kosong!")
    }

    const response = await ai.models.generateContent({
        model: geminiModels.text,
        contents: prompt,
    });

    res.status(200).json({
        reply: response.text,
    });
});

app.post("/generate-from-image", upload.single("image"), async (req, res) => {
    try {
        const { prompt = "Describe this image" } = req.body;

        const image = await ai.files.upload({
            file: req.file.path,
            config: {
                mimeType: req.file.mimetype,
            }
        });
        const response = await ai.models.generateContent({
            model: geminiModels.image,
            contents: [
                createUserContent([
                    prompt,
                    createPartFromUri(image.uri, image.mimeType)
                ])
            ]
        });
        res.status(200).json({ 
            reply: response.text,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        fs.unlink(req.file.path);
    }
});

app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
    try {
        const { prompt = "Describe this audio" } = req.body;
        const audio = await ai.files.upload({
            file: req.file.path,
            config: {
                mimeType: req.file.mimetype,
            }
        });
        const response = await ai.models.generateContent({
            model: geminiModels.audio,
            contents: [
                createUserContent([
                    prompt,
                    createPartFromUri(audio.uri, audio.mimeType)
                ]),
            ]
        });
        res.status(200).json({
            reply: response.text,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        fs.unlink(req.file.path);
    }
});

app.post("/generate-from-document", upload.single("document"), async (req, res) => {
    try {
        const { prompt = "Describe this document" } = req.body;
        const document = await ai.files.upload({
            file: req.file.path,
            config: {
                mimeType: req.file.mimetype,
            }
        });
        const response = await ai.models.generateContent({
            model: geminiModels.document,
            contents: [
                createUserContent([
                    prompt,
                    createPartFromUri(document.uri, document.mimeType)
                ]),
            ]
        });
        res.status(200).json({
            reply: response.text,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
    finally {
        fs.unlink(req.file.path);
    }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
})