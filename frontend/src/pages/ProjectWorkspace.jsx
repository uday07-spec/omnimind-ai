import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FileUploader from '../components/FileUploader';
import MediaCard from '../components/MediaCard';
import ChatMessage from '../components/ChatMessage';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Files,
  FileCheck2,
  FolderOpen,
  Loader2,
  FileSpreadsheet,
  CheckSquare,
  Square,
  MessageSquare,
  RefreshCw,
  Info
} from 'lucide-react';

export const ProjectWorkspace = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState([]);

  // Loading states
  const [loadingProject, setLoadingProject] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Chat input
  const [inputMessage, setInputMessage] = useState('');
  const chatBottomRef = useRef(null);

  // Mobile active tab: 'library' | 'chat'
  const [activeMobileTab, setActiveMobileTab] = useState('library');

  // Load project details, media items, and chat history
  const fetchProjectData = async () => {
    setLoadingProject(true);
    try {
      const response = await api.get(`/projects/${id}`);
      const data = response.data?.project || response.data?.data || response.data;
      setProject(data);

      const items = data?.mediaItems || data?.media || data?.files || [];
      setMediaList(Array.isArray(items) ? items : []);

      const chats = data?.chatHistory || data?.messages || [];
      setChatHistory(Array.isArray(chats) ? chats : []);
    } catch (error) {
      console.error('Failed to load project details:', error);
      showToast('Error loading project details. Please try again.', 'error');
    } finally {
      setLoadingProject(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isSendingMessage, isSynthesizing]);

  // Toggle selection for a media file
  const handleToggleSelectMedia = (mediaId) => {
    setSelectedMediaIds((prev) =>
      prev.includes(mediaId)
        ? prev.filter((mId) => mId !== mediaId)
        : [...prev, mediaId]
    );
  };

  const handleSelectAllMedia = () => {
    if (selectedMediaIds.length === mediaList.length) {
      setSelectedMediaIds([]);
    } else {
      setSelectedMediaIds(mediaList.map((m) => m._id || m.id));
    }
  };

  // Upload file
  const handleFileUpload = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/projects/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newMedia =
        response.data?.mediaItem ||
        response.data?.media ||
        response.data?.file ||
        response.data?.data;

      if (newMedia) {
        if (Array.isArray(newMedia)) {
          setMediaList((prev) => [...prev, ...newMedia]);
        } else {
          setMediaList((prev) => [newMedia, ...prev]);
        }
      } else {
        // Refresh project data if payload structure is custom
        await fetchProjectData();
      }

      showToast(`"${file.name}" uploaded and processed successfully!`, 'success');
    } catch (error) {
      console.error('File upload failed:', error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to upload file. Please try again.';
      showToast(msg, 'error');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Delete media item
  const handleDeleteMedia = async (mediaId) => {
    try {
      await api.delete(`/projects/${id}/media/${mediaId}`);
      setMediaList((prev) => prev.filter((m) => (m._id || m.id) !== mediaId));
      setSelectedMediaIds((prev) => prev.filter((mId) => mId !== mediaId));
      showToast('Media item removed.', 'success');
    } catch (error) {
      console.error('Failed to delete media:', error);
      const msg =
        error.response?.data?.message || 'Failed to remove media item.';
      showToast(msg, 'error');
    }
  };

  // Send Chat message
  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isSendingMessage) return;

    const referencedNames = mediaList
      .filter((m) => selectedMediaIds.includes(m._id || m.id))
      .map((m) => m.originalName || m.filename || m.name);

    const userMessageObj = {
      id: Date.now().toString(),
      sender: 'user',
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toISOString(),
      referencedMedia: referencedNames.length > 0 ? referencedNames : undefined,
    };

    setChatHistory((prev) => [...prev, userMessageObj]);
    if (!customText) setInputMessage('');
    setIsSendingMessage(true);

    try {
      const payload = {
        message: textToSend.trim(),
        mediaIds: selectedMediaIds.length > 0 ? selectedMediaIds : undefined,
      };

      const response = await api.post(`/projects/${id}/chat`, payload);
      const aiReply =
        response.data?.reply ||
        response.data?.message ||
        response.data?.response ||
        response.data?.answer ||
        (typeof response.data === 'string' ? response.data : 'I have analyzed the provided context.');

      const aiMessageObj = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        role: 'assistant',
        text: typeof aiReply === 'object' ? aiReply.text || JSON.stringify(aiReply) : aiReply,
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => [...prev, aiMessageObj]);
    } catch (error) {
      console.error('Chat error:', error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error generating AI response. Please try again.';

      setChatHistory((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          role: 'assistant',
          text: `⚠️ **Error:** ${msg}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      showToast(msg, 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Synthesize All Files
  const handleSynthesizeAll = async () => {
    if (mediaList.length === 0) {
      showToast('Please upload files before synthesizing.', 'info');
      return;
    }

    setIsSynthesizing(true);
    setActiveMobileTab('chat');

    try {
      const targetIds =
        selectedMediaIds.length > 0
          ? selectedMediaIds
          : mediaList.map((m) => m._id || m.id);

      const response = await api.post(`/projects/${id}/synthesize`, {
        mediaIds: targetIds,
      });

      const synthesisContent =
        response.data?.synthesis ||
        response.data?.summary ||
        response.data?.result ||
        response.data?.message ||
        'Synthesis completed for selected files.';

      const aiMessageObj = {
        id: Date.now().toString(),
        sender: 'ai',
        role: 'assistant',
        isSynthesis: true,
        text: typeof synthesisContent === 'object' ? synthesisContent.text || JSON.stringify(synthesisContent) : synthesisContent,
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => [...prev, aiMessageObj]);
      showToast('Multimodal synthesis generated!', 'success');
    } catch (error) {
      console.error('Synthesize error:', error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to synthesize files.';
      showToast(msg, 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Generate Executive Summary
  const handleExecutiveSummary = async () => {
    handleSendMessage('Please generate a concise Executive Summary combining all key insights, risks, and action items from the uploaded media.');
    setActiveMobileTab('chat');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const userInitials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-gray-100">
      <Navbar />

      {/* Project Subheader */}
      <div className="bg-gray-900/60 border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-3.5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/dashboard"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <h1 className="text-lg font-bold text-white truncate">
                  {loadingProject ? 'Loading project...' : project?.title || 'Project Workspace'}
                </h1>
              </div>
              {project?.description && (
                <p className="text-xs text-gray-400 truncate mt-0.5 max-w-xl">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleSynthesizeAll}
              disabled={isSynthesizing || mediaList.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
            >
              {isSynthesizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Synthesize All</span>
            </button>

            <button
              onClick={handleExecutiveSummary}
              disabled={isSendingMessage || mediaList.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-50 transition hidden md:flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
              <span>Executive Summary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-gray-800 bg-gray-900/40">
        <button
          onClick={() => setActiveMobileTab('library')}
          className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition flex items-center justify-center gap-2 ${
            activeMobileTab === 'library'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Files className="w-4 h-4" />
          <span>Library ({mediaList.length})</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('chat')}
          className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition flex items-center justify-center gap-2 ${
            activeMobileTab === 'chat'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat ({chatHistory.length})</span>
        </button>
      </div>

      {/* Workspace Two-Panel Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6 h-[calc(100vh-8.5rem)] overflow-hidden">
        {/* Left Panel - Multimodal Library (40% width) */}
        <section
          className={`w-full lg:w-[40%] flex flex-col bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden shadow-xl ${
            activeMobileTab === 'library' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Library Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/80">
            <div className="flex items-center gap-2.5">
              <Files className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">Media Library</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                {mediaList.length}
              </span>
            </div>

            {mediaList.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllMedia}
                className="text-xs font-medium text-gray-400 hover:text-purple-300 flex items-center gap-1.5 transition"
              >
                {selectedMediaIds.length === mediaList.length ? (
                  <>
                    <Square className="w-3.5 h-3.5 text-purple-400" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Select All</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Upload Area & File List Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <FileUploader
              onUpload={handleFileUpload}
              isUploading={isUploading}
            />

            {/* Media Items List */}
            {mediaList.length === 0 ? (
              <div className="text-center py-10 px-4">
                <FileCheck2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-400">
                  No media uploaded yet
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Drag and drop documents, audio, video, or images above to parse and synthesize.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                  <span>Uploaded Files</span>
                  <span>{selectedMediaIds.length} selected for query</span>
                </div>
                {mediaList.map((media) => (
                  <MediaCard
                    key={media._id || media.id}
                    media={media}
                    isSelected={selectedMediaIds.includes(media._id || media.id)}
                    onToggleSelect={handleToggleSelectMedia}
                    onDelete={handleDeleteMedia}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Left Panel Footer: Synthesize All Button */}
          <div className="p-4 border-t border-gray-800 bg-gray-900/80">
            <button
              type="button"
              onClick={handleSynthesizeAll}
              disabled={isSynthesizing || mediaList.length === 0}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-50 transition shadow-md shadow-purple-600/25 flex items-center justify-center gap-2"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing All Files...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize All</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Right Panel - OmniMind Chat (60% width) */}
        <section
          className={`w-full lg:w-[60%] flex flex-col bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden shadow-xl ${
            activeMobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/80">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-violet-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                  OmniMind Assistant
                </h2>
              </div>
            </div>

            {/* Context Badge */}
            <div className="text-xs text-gray-400 flex items-center gap-1.5 bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-700">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>
                {selectedMediaIds.length > 0
                  ? `${selectedMediaIds.length} files selected`
                  : 'All files in context'}
              </span>
            </div>
          </div>

          {/* Chat Message Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-purple-900/30 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  How can OmniMind help you today?
                </h3>
                <p className="text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">
                  Ask questions across all uploaded documents, transcripts, and multimedia. Select specific files or analyze everything together.
                </p>

                {/* Quick Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md text-left">
                  <button
                    onClick={() => handleSendMessage('Give me a high-level summary of all uploaded materials.')}
                    className="p-3 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/80 hover:border-purple-500/50 text-xs text-gray-300 transition text-left"
                  >
                    💡 <span className="font-medium text-white">High-level summary</span> of all uploaded materials
                  </button>
                  <button
                    onClick={() => handleSendMessage('What are the critical risks and discrepancies identified across these files?')}
                    className="p-3 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/80 hover:border-purple-500/50 text-xs text-gray-300 transition text-left"
                  >
                    ⚠️ <span className="font-medium text-white">Identify risks & discrepancies</span> in context
                  </button>
                  <button
                    onClick={() => handleSendMessage('Extract all action items, assignees, and deadlines mentioned.')}
                    className="p-3 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/80 hover:border-purple-500/50 text-xs text-gray-300 transition text-left"
                  >
                    ✅ <span className="font-medium text-white">Extract action items</span> and deadlines
                  </button>
                  <button
                    onClick={() => handleExecutiveSummary()}
                    className="p-3 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/80 hover:border-purple-500/50 text-xs text-gray-300 transition text-left"
                  >
                    📊 <span className="font-medium text-white">Generate Executive Summary</span>
                  </button>
                </div>
              </div>
            ) : (
              chatHistory.map((message) => (
                <ChatMessage
                  key={message.id || message._id || Math.random().toString()}
                  message={message}
                  userInitials={userInitials}
                />
              ))
            )}

            {/* Thinking / Synthesizing Indicator */}
            {(isSendingMessage || isSynthesizing) && (
              <div className="flex items-center gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                  <Sparkles className="w-4 h-4 text-purple-200 animate-spin" />
                </div>
                <div className="p-3.5 rounded-2xl rounded-tl-none bg-gray-800 border border-gray-700 text-xs text-purple-300 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>
                    {isSynthesizing ? 'Synthesizing knowledge across media...' : 'OmniMind is reasoning...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Box */}
          <div className="p-4 border-t border-gray-800 bg-gray-900/80">
            {selectedMediaIds.length > 0 && (
              <div className="mb-2 flex items-center justify-between text-xs text-purple-300 bg-purple-950/40 border border-purple-500/20 px-3 py-1 rounded-lg">
                <span>
                  Query focused on {selectedMediaIds.length} selected {selectedMediaIds.length === 1 ? 'file' : 'files'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMediaIds([])}
                  className="text-gray-400 hover:text-white underline text-[11px]"
                >
                  Clear selection
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center gap-2"
            >
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask OmniMind about your documents, transcripts, or media... (Enter to send)"
                disabled={isSendingMessage || isSynthesizing}
                className="w-full pl-4 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none leading-relaxed"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isSendingMessage || isSynthesizing}
                className="absolute right-2 p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-purple-600/30"
                title="Send message"
              >
                {isSendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProjectWorkspace;
