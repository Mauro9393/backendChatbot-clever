require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Timeout for OpenAI on Vercel waiting for the response from OpenAI
const API_TIMEOUT = 320000; // 5 min

// Configure axios with a timeout for OpenAI
const axiosInstance = axios.create({
    timeout: API_TIMEOUT // Set the maximum timeout for all requests to OpenAI
});

// Endpoint to call different APIs chatbot and elevenlab
app.post("/api/:service", async (req, res) => {
    try {
        const { service } = req.params;
        console.log("🔹 Servizio ricevuto:", service);
        console.log("🔹 Dati ricevuti:", JSON.stringify(req.body));
        let apiKey, apiUrl;

        /* if (service === "openaiSimulateur") {
             apiKey = process.env.OPENAI_API_KEY_SIMULATEUR;
             apiUrl = "https://api.openai.com/v1/chat/completions";
 
             // Make the request to OpenAI in stream mode
             const response = await axiosInstance.post(apiUrl, req.body, {
                 headers: {
                     "Authorization": `Bearer ${apiKey}`,
                     "Content-Type": "application/json"
                 },
                 responseType: 'stream'
             });
 
             // Set headers for SSE streaming
             res.setHeader("Content-Type", "text/event-stream");
             res.setHeader("Cache-Control", "no-cache");
 
             // Forward each chunk received from the OpenAI server
             response.data.on('data', (chunk) => {
                 res.write(chunk);
             });
 
             response.data.on('end', () => {
                 res.end();
             });
 
             response.data.on('error', (error) => {
                 console.error("Error in stream:", error);
                 res.end();
             });
 
             return; // Stop execution here to avoid sending further responses
 
         }*/
        if (service === "openaiSimulateur") {
            const apiKey = process.env.AZURE_OPENAI_KEY_SIMULATEUR;
            const endpoint = process.env.AZURE_OPENAI_ENDPOINT_SIMULATEUR;
            const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_SIMULATEUR;
            const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

            const apiUrl = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

            const response = await axiosInstance.post(apiUrl, req.body, {
                headers: {
                    "api-key": apiKey,
                    "Content-Type": "application/json"
                },
                responseType: 'stream'
            });

            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");

            response.data.on('data', (chunk) => {
                res.write(chunk);
            });

            response.data.on('end', () => {
                res.end();
            });

            response.data.on('error', (error) => {
                console.error("Error in stream:", error);
                res.end();
            });

            return;
        }
        else if (service === "elevenlabs") {
            apiKey = process.env.ELEVENLAB_API_KEY;

            if (!apiKey) {
                console.error("ElevenLabs API key missing!");
                return res.status(500).json({ error: "ElevenLabs API key missing" });
            }

            const { text, selectedLanguage } = req.body; // The frontend must pass this data
            console.log("Language received from frontend:", selectedLanguage);

            // Let's move `voiceMap` above `voiceId`
            const voiceMap = {
                "espagnol": "l1zE9xgNpUTaQCZzpNJa",
                "français": "1a3lMdKLUcfcMtvN772u",
                "anglais": "7tRwuZTD1EWi6nydVerp",
                "italien": "HuK8QKF35exsCh2e7fLT"
            };

            const cleanLanguage = selectedLanguage ? selectedLanguage.trim().toLowerCase() : "";
            console.log("Clean language:", cleanLanguage);

            const voiceId = voiceMap[cleanLanguage];

            if (!voiceId) {
                console.error(`Not supported language: ${cleanLanguage}`);
                return res.status(400).json({ error: "Not supported language" });
            }

            console.log(`Selected Voice ID: ${voiceId}`);

            apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

            const requestData = {
                text: text,
                model_id: "eleven_flash_v2_5",
                voice_settings: {
                    stability: 0.6,
                    similarity_boost: 0.7,
                    style: 0.1
                }
            };

            console.log("Data sent to ElevenLabs:", requestData);

            try {
                const response = await axios.post(apiUrl, requestData, {
                    headers: {
                        "xi-api-key": apiKey,
                        "Content-Type": "application/json"
                    },
                    responseType: "arraybuffer" // To return the audio as a file
                });

                console.log("Audio received from ElevenLabs!");
                res.setHeader("Content-Type", "audio/mpeg");
                return res.send(response.data);

            } catch (error) {
                if (error.response) {
                    try {
                        const errorMessage = error.response.data.toString(); // Decode the buffer into text
                        console.error("❌ Error with ElevenLabs:", errorMessage);
                        res.status(error.response.status).json({ error: errorMessage });
                    } catch (decodeError) {
                        console.error("❌ Error with ElevenLabs (not decodable):", error.response.data);
                        res.status(error.response.status).json({ error: "Unknown error with ElevenLabs" });
                    }
                } else {
                    console.error("Unknown error with ElevenLabs:", error.message);
                    res.status(500).json({ error: "Unknown error with ElevenLabs" });
                }
            }
        } /* else if (service === "openaiAnalyse") {
            apiKey = process.env.OPENAI_API_KEY_ANALYSE;
            apiUrl = "https://api.openai.com/v1/chat/completions";

            const response = await axiosInstance.post(apiUrl, req.body, {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                }
            });

            return res.json(response.data);

        }*/else if (service === "openaiAnalyse") {
            const apiKey = process.env.AZURE_OPENAI_KEY_SIMULATEUR;
            const endpoint = process.env.AZURE_OPENAI_ENDPOINT_SIMULATEUR;
            const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_SIMULATEUR;
            const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

            const apiUrl = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

            console.log("➡️ Azure Analyse URL:", apiUrl);
            console.log("➡️ Request body:", JSON.stringify(req.body, null, 2));

            try {
                const response = await axiosInstance.post(apiUrl, req.body, {
                    headers: {
                        "api-key": apiKey,
                        "Content-Type": "application/json"
                    }
                });

                return res.json(response.data);
            } catch (error) {
                console.error("❌ Azure Analyse Error:");
                if (error.response) {
                    console.error("Status:", error.response.status);
                    console.error("Data:", JSON.stringify(error.response.data, null, 2));
                    return res.status(error.response.status).json(error.response.data);
                } else {
                    console.error("Message:", error.message);
                    return res.status(500).json({ error: "Errore interno Azure Analyse" });
                }
            }
        }
        else {
            return res.status(400).json({ error: "Invalid service" });
        }
    } catch (error) {
        // Timeout error handling for OpenAI Analyse
        if (error.code === 'ECONNABORTED' && service === "openaiAnalyse") {
            console.error("OpenAI Analyse API request timeout.");
            return res.status(504).json({ error: "Timeout in the request to OpenAI Analyse." });
        }

        console.error(`API error ${req.params.service}:`, error.response?.data || error.message);
        res.status(500).json({ error: "API request error" });
    }
});

// Secure endpoint to obtain a temporary Azure Speech token.
app.get("/get-azure-token", async (req, res) => {
    const apiKey = process.env.AZURE_SPEECH_API_KEY;
    const region = process.env.AZURE_REGION;

    if (!apiKey || !region) {
        return res.status(500).json({ error: "Azure keys missing in the backend" });
    }

    try {
        const tokenRes = await axios.post(
            `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
            null,
            {
                headers: {
                    "Ocp-Apim-Subscription-Key": apiKey
                }
            }
        );

        // We send the token and the region to the frontend.
        res.json({
            token: tokenRes.data,
            region
        });
    } catch (error) {
        console.error("Failed to generate Azure token:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to generate token" });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});