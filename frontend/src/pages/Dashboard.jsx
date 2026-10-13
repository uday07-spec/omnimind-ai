import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import ProjectCard from '../components/ProjectCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import {
  FolderPlus,
  Search,
  FolderOpen,
  Files,
  Sparkles,
  Loader2,
  X,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/projects');
      const data = response.data?.projects || response.data?.data || response.data || [];
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      showToast('Failed to load projects. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim()) {
      setFormError('Project title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/projects', {
        title: newTitle.trim(),
        description: newDescription.trim(),
      });
      const created =
        response.data?.project || response.data?.data || response.data;

      if (created) {
        setProjects((prev) => [created, ...prev]);
        showToast('Project created successfully!', 'success');
        setIsModalOpen(false);
        setNewTitle('');
        setNewDescription('');
      } else {
        await fetchProjects();
        setIsModalOpen(false);
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to create project.';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects((prev) =>
        prev.filter((p) => (p._id || p.id) !== projectId)
      );
      showToast('Project deleted successfully.', 'success');
    } catch (error) {
      const msg =
        error.response?.data?.message || 'Failed to delete project.';
      showToast(msg, 'error');
    }
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  // Aggregate stats
  const totalFiles = useMemo(() => {
    return projects.reduce((acc, curr) => {
      const count =
        curr.mediaCount !== undefined
          ? curr.mediaCount
          : curr.mediaItems
          ? curr.mediaItems.length
          : curr.files
          ? curr.files.length
          : 0;
      return acc + count;
    }, 0);
  }, [projects]);

  const displayName = user?.username || user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-gray-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">{displayName}</span>
              </h1>
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Organize, synthesize, and extract knowledge across your multimodal files.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Total Projects
              </p>
              <h4 className="text-2xl font-bold text-white mt-0.5">
                {projects.length}
              </h4>
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-900/40 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Files className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Uploaded Files
              </p>
              <h4 className="text-2xl font-bold text-white mt-0.5">
                {totalFiles}
              </h4>
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4 flex items-center gap-4 sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                OmniMind Engine
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-sm font-semibold text-gray-200">
                  Ready for Synthesis
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by title or description..."
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-gray-400 self-end sm:self-center">
            Showing {filteredProjects.length} of {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
            <p className="text-sm font-medium">Loading your projects...</p>
          </div>
        ) : projects.length === 0 ? (
          /* Empty State: No projects at all */
          <div className="bg-gray-900/40 border border-gray-800 border-dashed rounded-2xl p-12 text-center max-w-lg mx-auto my-12 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No projects yet</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Create your first project to upload documents, audio recordings, or videos and unleash multimodal intelligence.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create First Project</span>
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Search Empty State */
          <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-8 text-center my-8">
            <HelpCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <h4 className="text-base font-semibold text-gray-300">No matching projects found</h4>
            <p className="text-xs text-gray-500 mt-1">
              Try adjusting your search query "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-xs text-purple-400 hover:text-purple-300 underline font-medium"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project._id || project.id}
                project={project}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">Create New Project</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-200 p-1 rounded-lg hover:bg-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Project Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q3 Market Analysis & Transcripts"
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Description <span className="text-gray-500 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Briefly describe what this project contains and goals..."
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-600/30 transition flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
