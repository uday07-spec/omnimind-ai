import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Returns an instance of the gemini-1.5-flash model
 */
export function getModel() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

/**
 * Summarize an uploaded file using Google Gemini
 * @param {Buffer} fileBuffer - The binary buffer of the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @param {string} filename - Original file name
 * @returns {Promise<string>} Summary text
 */
export async function summarizeFile(fileBuffer, mimeType, filename) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return `File "${filename}" (${mimeType}) uploaded successfully. Set a valid GEMINI_API_KEY in .env to enable AI summaries.`;
    }

    const model = getModel();
    const prompt = `Analyze and summarize the content of this file named ${filename}. Provide a concise summary in 3-5 sentences.`;

    const isMediaOrDoc =
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf' ||
      mimeType.startsWith('audio/') ||
      mimeType.startsWith('video/');

    const parts = [];

    if (isMediaOrDoc) {
      parts.push({
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType
        }
      });
      parts.push(prompt);
    } else {
      // Plain text, markdown, csv, json, etc.
      const textContent = fileBuffer.toString('utf-8');
      parts.push(`${prompt}\n\nFile Content:\n${textContent.slice(0, 30000)}`);
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error(`Gemini summarization failed for ${filename}:`, error.message);
    return `Summary generation encountered an error: ${error.message}`;
  }
}

/**
 * Interactive Q&A chat grounded in the project's media items context and chat history
 * @param {string} userMessage - User question
 * @param {Array} mediaItems - Array of MediaItem documents
 * @param {Array} chatHistory - Array of previous ChatMessage documents
 * @returns {Promise<string>} Assistant response
 */
export async function chatWithContext(userMessage, mediaItems = [], chatHistory = []) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return `I received your message: "${userMessage}". Please configure GEMINI_API_KEY in your backend .env file to enable intelligent responses.`;
    }

    const model = getModel();
    const parts = [];

    let systemPrompt = `You are OmniMind AI, an intelligent assistant designed to analyze multi-modal project knowledge and answer user questions accurately based on the provided context.\n\n`;

    if (mediaItems && mediaItems.length > 0) {
      systemPrompt += `=== PROJECT MEDIA CONTEXT ===\n`;
      mediaItems.forEach((item, index) => {
        systemPrompt += `[File ${index + 1}: ${item.originalName} (${item.fileType})]\n`;
        if (item.aiSummary) {
          systemPrompt += `AI Summary: ${item.aiSummary}\n`;
        }
        if (item.extractedText && item.extractedText !== item.aiSummary) {
          systemPrompt += `Extracted Details:\n${item.extractedText.slice(0, 4000)}\n`;
        }
        systemPrompt += '\n';
      });
    }

    if (chatHistory && chatHistory.length > 0) {
      systemPrompt += `=== RECENT CHAT HISTORY ===\n`;
      chatHistory.slice(-10).forEach((msg) => {
        const sender = msg.sender === 'user' ? 'User' : 'OmniMind AI';
        systemPrompt += `${sender}: ${msg.content}\n`;
      });
      systemPrompt += '\n';
    }

    parts.push(systemPrompt);
    parts.push(`User Message: ${userMessage}`);

    const result = await model.generateContent(parts);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini chat failed:', error.message);
    return `Unable to generate AI response: ${error.message}`;
  }
}

/**
 * Synthesizes all media items in a project into an executive summary report
 * @param {Array} mediaItems - Array of project MediaItem documents
 * @returns {Promise<string>} Markdown synthesis report
 */
export async function synthesizeAll(mediaItems = []) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return `# Executive Summary\n\n## Overview\nProject contains ${mediaItems.length} media items. Configure a valid GEMINI_API_KEY in .env to generate live executive synthesis.\n\n## Key Themes\n- Multi-modal Information Synthesis\n- Project Knowledge Base\n\n## Detailed Findings\nMedia items are loaded and indexed. Live synthesis requires an active Gemini API key.\n\n## Recommendations\nAdd GEMINI_API_KEY to your environment variables and rerun synthesis.`;
    }

    const model = getModel();
    let mediaContext = '';

    mediaItems.forEach((item, index) => {
      mediaContext += `### File ${index + 1}: ${item.originalName} (${item.fileType})\n`;
      if (item.aiSummary) {
        mediaContext += `**Summary:** ${item.aiSummary}\n`;
      }
      if (item.extractedText && item.extractedText !== item.aiSummary) {
        mediaContext += `**Extracted Content:** ${item.extractedText.slice(0, 4000)}\n`;
      }
      mediaContext += '\n';
    });

    const prompt = `You are OmniMind AI. Analyze all the provided project media items below and create a comprehensive executive summary synthesis report.

Format your response in clean GitHub-flavored Markdown with the following exact section headers:
# Executive Summary
## Overview
## Key Themes
## Detailed Findings
## Recommendations

Project Media Items:
${mediaContext}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini synthesis failed:', error.message);
    return `# Executive Summary Generation Error\n\nFailed to synthesize project media items: ${error.message}`;
  }
}
