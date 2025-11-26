import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(__filename);

// Tái sử dụng logic Whisper từ speech-module (CommonJS)
// Đường dẫn: SourceCode/backend/services -> SourceCode/speech-module/backend
const speechService = require("../../speech-module/backend/speechService.js");

export default speechService;


