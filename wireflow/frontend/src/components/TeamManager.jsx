import React, { useState, useEffect } from 'react';
import apiFetch from '../api';

const TeamManager = ({ isOpen, onClose, token, inline = false, hideHeader = false }) => {
  const [teams, setTeams] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen || inline) {
      loadTeams();
    }
  }, [isOpen, inline, token]);

  const loadTeams = async () => {
    try {
      const teamsData = await apiFetch('/api/teams', { method: 'GET' }, token);
      setTeams(teamsData || []);
    } catch (error) {
      console.error('Error loading teams:', error);
      setError('Failed to load teams');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#3b82f6' });
    setEditingTeam(null);
    setError('');
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      color: team.color || '#3b82f6'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name.trim()) {
        throw new Error('Team name is required');
      }

      const method = editingTeam ? 'PUT' : 'POST';
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : '/api/teams';
      
      await apiFetch(url, { method, body: formData }, token);
      await loadTeams();
      resetForm();
    } catch (error) {
      console.error('Error saving team:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teamId) => {
    if (teamId === 'team-default') {
      setError('Cannot delete the default team');
      return;
    }

    if (!confirm('Are you sure you want to delete this team?')) {
      return;
    }

    setLoading(true);
    try {
      await apiFetch(`/api/teams/${teamId}`, { method: 'DELETE' }, token);
      await loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Inline rendering option: return interior content without modal/backdrop
  if (inline) {
    return (
      <div className="bg-white rounded-lg shadow-sm w-full mb-6">
        {!hideHeader && (
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Manage Teams</h2>
          </div>
        )}

        <div className="flex flex-col lg:flex-row h-full">
          {/* Team Form */}
          <div className="lg:w-1/3 p-6 border-r border-gray-200">
            <h3 className="text-lg font-medium mb-4">
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Team name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Team description (optional)"
                  rows="3"
                />
              </div>



              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
                {editingTeam && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Teams List */}
          <div className="lg:w-2/3 p-6">
            <h3 className="text-lg font-medium mb-4">Existing Teams</h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: team.color }}
                    />
                    <div>
                      <h4 className="font-medium">{team.name}</h4>
                      {team.description && (
                        <p className="text-sm text-gray-600">{team.description}</p>
                      )}
                      <p className="text-xs text-gray-400">ID: {team.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(team)}
                      className="px-3 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    {team.id !== 'team-default' && (
                      <button
                        onClick={() => handleDelete(team.id)}
                        disabled={loading}
                        className="px-3 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default modal rendering when not inline
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Manage Teams</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Team Form */}
          <div className="lg:w-1/3 p-6 border-r border-gray-200">
            <h3 className="text-lg font-medium mb-4">
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Team name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Team description (optional)"
                  rows="3"
                />
              </div>



              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
                {editingTeam && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Teams List */}
          <div className="lg:w-2/3 p-6">
            <h3 className="text-lg font-medium mb-4">Existing Teams</h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: team.color }}
                    />
                    <div>
                      <h4 className="font-medium">{team.name}</h4>
                      {team.description && (
                        <p className="text-sm text-gray-600">{team.description}</p>
                      )}
                      <p className="text-xs text-gray-400">ID: {team.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(team)}
                      className="px-3 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    {team.id !== 'team-default' && (
                      <button
                        onClick={() => handleDelete(team.id)}
                        disabled={loading}
                        className="px-3 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManager;