import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, Loader2, X, Check } from 'lucide-react';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ACCEPTED_EXTENSIONS = [
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
  // Documents
  '.pdf', '.txt', '.md', '.json', '.csv',
  // Audio
  '.mp3', '.wav', '.ogg', '.m4a',
  // Video
  '.mp4', '.webm', '.mov',
];

const ACCEPT_ATTR =
  'image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain,text/markdown,application/json,text/csv,audio/mpeg,audio/wav,audio/ogg,audio/x-m4a,video/mp4,video/webm,video/quicktime,.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.md,.json,.csv,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.mov';

export const FileUploader = ({ onUpload, isUploading = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return false;

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`File exceeds the 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return false;
    }

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const isAcceptedExt = ACCEPTED_EXTENSIONS.includes(ext);
    const isAcceptedMime =
      file.type.startsWith('image/') ||
      file.type.startsWith('audio/') ||
      file.type.startsWith('video/') ||
      file.type.includes('pdf') ||
      file.type.includes('text') ||
      file.type.includes('json');

    if (!isAcceptedExt && !isAcceptedMime) {
      setErrorMessage('Unsupported file format. Please select an image, PDF, audio, video, or text file.');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleTriggerUpload = async () => {
    if (!selectedFile || isUploading) return;
    try {
      await onUpload(selectedFile);
      // Reset selected file after successful upload
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      // Error handled by parent or displayed
    }
  };

  const handleClearSelected = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_ATTR}
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {/* Drop area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer select-none ${
          isDragging
            ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
            : selectedFile
            ? 'border-purple-500/50 bg-gray-900/80 cursor-default'
            : 'border-gray-700/80 hover:border-purple-500/60 bg-gray-900/40 hover:bg-gray-900/70'
        }`}
      >
        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">
                <span className="text-purple-400 underline underline-offset-2">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Images, PDFs, Audio, Video, Text (max 50MB)
              </p>
            </div>
          </div>
        ) : (
          /* File Preview / Selected state */
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 bg-gray-800/80 p-3 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-[250px]" title={selectedFile.name}>
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              {!isUploading && (
                <button
                  type="button"
                  onClick={handleClearSelected}
                  className="p-1 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-gray-700 transition"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={handleTriggerUpload}
              disabled={isUploading}
              className="w-full py-2 px-4 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-md shadow-purple-600/30"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Uploading & Processing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload & Analyze</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mt-2.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
