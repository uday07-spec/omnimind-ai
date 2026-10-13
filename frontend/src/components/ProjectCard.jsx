import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Trash2, Calendar, FileText, Loader2, AlertTriangle } from 'lucide-react';

export const ProjectCard = ({ project, onDelete }) => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const projectId = project._id || project.id;
  const mediaCount =
    project.mediaCount !== undefined
      ? project.mediaCount
      : project.mediaItems
      ? project.mediaItems.length
      : project.files
      ? project.files.length
      : 0;

  const formattedDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const handleClick = () => {
    navigate(`/projects/${projectId}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmDelete = async (e) => {
    e.stopPropagation();
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(projectId);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-gray-800/90 hover:bg-gray-800 border border-gray-700/80 hover:border-purple-500 rounded-xl p-5 shadow-md hover:shadow-xl hover:shadow-purple-900/20 transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 group-hover:bg-purple-900/50 transition-all">
            <FolderOpen className="w-5 h-5 text-purple-400" />
          </div>

          {/* Delete Action with In-Card Confirmation */}
          <div className="relative">
            {!showConfirm ? (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all focus:opacity-100"
                title="Delete project"
                aria-label="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 bg-gray-900 border border-rose-500/50 rounded-lg p-1 animate-fade-in shadow-lg"
              >
                <span className="text-xs text-rose-300 flex items-center gap-1 px-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  Delete?
                </span>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleCancelDelete}
                  className="px-2 py-0.5 text-xs font-medium rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1 mb-1.5">
          {project.title || 'Untitled Project'}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-4">
          {project.description || 'No description provided for this project.'}
        </p>
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">
          <FileText className="w-3.5 h-3.5 text-purple-400" />
          <span>
            {mediaCount} {mediaCount === 1 ? 'file' : 'files'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
