// backend/controllers/voiceController.js

/**
 * POST /api/voice/transcribe
 *
 * Fallback transcription endpoint for browsers that don't support
 * the Web Speech API. This controller receives an audio blob and
 * returns the transcribed text.
 *
 * Currently returns a placeholder response. To enable real transcription:
 * 1. Use Google Cloud Speech-to-Text API, or
 * 2. Use OpenAI Whisper API, or
 * 3. Any other Speech-to-Text service.
 *
 * Language codes supported:
 *   - auto: attempt to detect (defaults to ta-IN + en-IN)
 *   - tamil: ta-IN
 *   - english: en-IN
 */

const LANGUAGE_MAP = {
    auto: ['ta-IN', 'en-IN'],
    tamil: ['ta-IN'],
    english: ['en-IN'],
};

export const transcribeAudio = async (req, res) => {
    try {
        // Validate that an audio file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No audio file provided',
                transcript: '',
            });
        }

        const language = req.body.language || 'auto';
        const languageCodes = LANGUAGE_MAP[language] || LANGUAGE_MAP.auto;

        console.log(`🎤 Voice transcription request:`);
        console.log(`   - File size: ${(req.file.size / 1024).toFixed(1)} KB`);
        console.log(`   - MIME type: ${req.file.mimetype}`);
        console.log(`   - Language: ${language} → ${languageCodes.join(', ')}`);

        // ─────────────────────────────────────────────────────────
        // TO ENABLE REAL TRANSCRIPTION:
        // Uncomment ONE of the following integrations below.
        // ─────────────────────────────────────────────────────────

        // ── Option 1: Google Cloud Speech-to-Text ───────────────
        // const speech = require('@google-cloud/speech');
        // const client = new speech.SpeechClient();
        //
        // const audio = { content: req.file.buffer.toString('base64') };
        // const config = {
        //   encoding: 'WEBM_OPUS',
        //   sampleRateHertz: 48000,
        //   languageCode: languageCodes[0],
        //   alternativeLanguageCodes: languageCodes.slice(1),
        //   enableAutomaticPunctuation: true,
        // };
        //
        // const [response] = await client.recognize({ audio, config });
        // const transcript = response.results
        //   .map(r => r.alternatives[0].transcript)
        //   .join(' ');
        //
        // return res.json({
        //   success: true,
        //   transcript,
        //   language: languageCodes[0],
        //   confidence: response.results[0]?.alternatives[0]?.confidence || 0,
        // });

        // ── Option 2: OpenAI Whisper API ────────────────────────
        // const FormData = require('form-data');
        // const axios = require('axios');
        //
        // const formData = new FormData();
        // formData.append('file', req.file.buffer, {
        //   filename: 'audio.webm',
        //   contentType: req.file.mimetype,
        // });
        // formData.append('model', 'whisper-1');
        // formData.append('language', languageCodes[0].split('-')[0]); // 'ta' or 'en'
        //
        // const response = await axios.post(
        //   'https://api.openai.com/v1/audio/transcriptions',
        //   formData,
        //   {
        //     headers: {
        //       ...formData.getHeaders(),
        //       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        //     },
        //   }
        // );
        //
        // return res.json({
        //   success: true,
        //   transcript: response.data.text,
        //   language: language,
        // });

        // ── Default: Placeholder response ───────────────────────
        // When no AI API is configured, return a helpful message.
        return res.json({
            success: false,
            transcript: '',
            message:
                'Server-side transcription is not configured. ' +
                'Please use a browser that supports the Web Speech API (Chrome/Edge), ' +
                'or configure a Speech-to-Text API (Google Cloud / OpenAI Whisper) in voiceController.js.',
        });
    } catch (error) {
        console.error('❌ Voice transcription error:', error);
        return res.status(500).json({
            success: false,
            message: 'Transcription failed: ' + error.message,
            transcript: '',
        });
    }
};
