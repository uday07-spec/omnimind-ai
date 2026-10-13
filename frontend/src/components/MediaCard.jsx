import React, { useState } from 'react';
import {
  Image,
  FileText,
  Music,
  Video,
  File,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Check
} from 'lucide-react';

export const MediaCard = ({
  media,
  isSelected = false,
  onToggleSelect,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const mediaId = media._id || media.id;
  const fileName = media.originalName || media.filename || media.name || 'Untitled File';
  const summary = media.summary || media.aiSummary || media.extractedSummary || '';

  // Determine media category
  const getMediaCategory = () => {
    const rawType = (media.fileType || media.type || media.mimeType || '').toLowerCase();
    const name = (media.originalName || media.filename || media.name || '').toLowerCase();

    if (rawType.includes('image') || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) {
      return 'image';
    }
    if (rawType.includes('pdf') || /\.pdf$/.test(name)) {
      return 'pdf';
    }
    if (rawType.includes('audio') || /\.(mp3|wav|ogg|m4a|aac)$/.test(name)) {
      return 'audio';
    }
    if (rawType.includes('video') || /\.(mp4|webm|mov|mkv)$/.test(name)) {
      return 'video';
    }
    return 'text';
  };

  const category = getMediaCategory();

  // Badge and icon configuration
  const categoryConfig = {
    image: {
      label: 'Image',
      badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      icon: Image,
    },
    pdf: {
      label: 'PDF',
      badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
      icon: FileText,
    },
    audio: {
      label: 'Audio',
      badge: 'bg-green-500/20 text-green-400 border border-green-500/30',
      icon: Music,
    },
    video: {
      label: 'Video',
      badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      icon: Video,
    },
    text: {
      label: 'Text',
      badge: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
      icon: File,
    },
  };

  const currentConfig = categoryConfig[category] || categoryConfig.text;
  const IconComponent = currentConfig.icon;

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(mediaId);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={() => onToggleSelect && onToggleSelect(mediaId)}
      className={`rounded-xl border p-4 transition-all duration-200 select-none cursor-pointer ${
        isSelected
          ? 'bg-purple-950/25 border-purple-500 ring-2 ring-purple-500/80 shadow-md shadow-purple-900/30'
          : 'bg-gray-800/90 hover:bg-gray-800 border-gray-700/80 hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Checkbox + Icon + Details */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Custom Checkbox */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect && onToggleSelect(mediaId);
            }}
            className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
              isSelected
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'border-gray-600 bg-gray-900/80 hover:border-purple-400'
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>

          {/* Media File Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${currentConfig.badge}`}
              >
                {currentConfig.label}
              </span>
              <span className="text-xs text-gray-400">
                {formatFileSize(media.size || media.fileSize)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <IconComponent className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <h4
                className="text-sm font-medium text-gray-200 truncate hover:text-white transition-colors"
                title={fileName}
              >
                {fileName}
              </h4>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
            title="Delete media"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* AI Summary Collapse/Expand */}
      {summary && (
        <div className="mt-3 pt-3 border-t border-gray-700/60">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center justify-between w-full text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {isExpanded ? 'Hide AI Summary' : 'View AI Summary'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {isExpanded && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-2 p-3 bg-gray-950/60 border border-gray-800 rounded-lg text-xs text-gray-300 leading-relaxed max-h-48 overflow-y-auto animate-fade-in"
            >
              {summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaCard;
