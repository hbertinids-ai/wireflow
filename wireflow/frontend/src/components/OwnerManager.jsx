import React, { useState, useEffect } from 'react';
import apiFetch from '../api';

const OwnerManager = ({ isOpen, onClose, token, inline = false, hideHeader = false }) => {
  const [owners, setOwners] = useState([]);
  const [editingOwner, setEditingOwner] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#8b5cf6'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen || inline) {
      loadOwners();
    }
  }, [isOpen, inline, token]);

  const loadOwners = async () => {
    try {
      const ownersData = await apiFetch('/api/owners', { method: 'GET' }, token);
      setOwners(ownersData || []);
    } catch (error) {
      console.error('Error loading owners:', error);
      setError('Failed to load owners');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#8b5cf6' });
    setEditingOwner(null);
    setError('');
  };

  const handleEdit = (owner) => {
    setEditingOwner(owner);
    setFormData({
      name: owner.name,
      description: owner.description || '',
      color: owner.color || '#8b5cf6'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name.trim()) {
        throw new Error('Owner name is required');
      }

      const method = editingOwner ? 'PUT' : 'POST';
      const url = editingOwner ? `/api/owners/${editingOwner.id}` : '/api/owners';
      
      await apiFetch(url, { method, body: formData }, token);
      await loadOwners();
      resetForm();
    } catch (error) {
      console.error('Error saving owner:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ownerId) => {
    if (ownerId === 'owner-default') {
      setError('Cannot delete the default owner');
      return;
    }

    if (!confirm('Are you sure you want to delete this owner?')) {
      return;
    }

    setLoading(true);
    try {
      await apiFetch(`/api/owners/${ownerId}`, { method: 'DELETE' }, token);
      await loadOwners();
    } catch (error) {
      console.error('Error deleting owner:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // If rendering inline, return the interior layout without backdrop/modal chrome
  if (inline) {
    return (
      <div className="bg-white rounded-lg shadow-sm w-full mb-6">
        {!hideHeader && (
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Manage Owners</h2>
          </div>
        )}

        <div className="flex flex-col lg:flex-row h-full">
          {/* Owner Form */}
          <div className="lg:w-1/3 p-6 border-r border-gray-200">
            <h3 className="text-lg font-medium mb-4">
              {editingOwner ? 'Edit Owner' : 'Create New Owner'}
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
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Owner name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Owner description (optional)"
                  rows="3"
                />
              </div>



              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingOwner ? 'Update Owner' : 'Create Owner'}
                </button>
                {editingOwner && (
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

          {/* Owners List */}
          <div className="lg:w-2/3 p-6">
            <h3 className="text-lg font-medium mb-4">Existing Owners</h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {owners.map((owner) => (
                <div
                  key={owner.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: owner.color }}
                    />
                    <div>
                      <h4 className="font-medium">{owner.name}</h4>
                      {owner.description && (
                        <p className="text-sm text-gray-600">{owner.description}</p>
                      )}
                      <p className="text-xs text-gray-400">ID: {owner.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(owner)}
                      className="px-3 py-1 text-purple-600 border border-purple-300 rounded hover:bg-purple-50"
                    >
                      Edit
                    </button>
                    {owner.id !== 'owner-default' && (
                      <button
                        onClick={() => handleDelete(owner.id)}
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

  // Default modal-style rendering when not inline
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Manage Owners</h2>
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
          {/* Owner Form */}
          <div className="lg:w-1/3 p-6 border-r border-gray-200">
            <h3 className="text-lg font-medium mb-4">
              {editingOwner ? 'Edit Owner' : 'Create New Owner'}
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
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Owner name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Owner description (optional)"
                  rows="3"
                />
              </div>



              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingOwner ? 'Update Owner' : 'Create Owner'}
                </button>
                {editingOwner && (
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

          {/* Owners List */}
          <div className="lg:w-2/3 p-6">
            <h3 className="text-lg font-medium mb-4">Existing Owners</h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {owners.map((owner) => (
                <div
                  key={owner.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: owner.color }}
                    />
                    <div>
                      <h4 className="font-medium">{owner.name}</h4>
                      {owner.description && (
                        <p className="text-sm text-gray-600">{owner.description}</p>
                      )}
                      <p className="text-xs text-gray-400">ID: {owner.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(owner)}
                      className="px-3 py-1 text-purple-600 border border-purple-300 rounded hover:bg-purple-50"
                    >
                      Edit
                    </button>
                    {owner.id !== 'owner-default' && (
                      <button
                        onClick={() => handleDelete(owner.id)}
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

export default OwnerManager;