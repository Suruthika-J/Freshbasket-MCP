// backend/routes/voiceRoute.js
import express from 'express';
import multer from 'multer';
import { transcribeAudio } from '../controllers/voiceController.js';

const router = express.Router();

// Configure multer for audio file uploads (in memory)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB max
    },
    fileFilter: (req, file, cb) => {
        // Accept common audio formats
        const allowedMimes = [
            'audio/webm',
            'audio/ogg',
            'audio/wav',
            'audio/mp3',
            'audio/mpeg',
            'audio/mp4',
            'audio/x-m4a',
        ];
        if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are accepted'), false);
        }
    },
});

/**
 * POST /api/voice/transcribe
 * Receives an audio blob and returns transcribed text.
 * Body (multipart/form-data):
 *   - audio: audio file blob
 *   - language: 'auto' | 'tamil' | 'english' (optional, default 'auto')
 */
router.post('/transcribe', upload.single('audio'), transcribeAudio);

export default router;
