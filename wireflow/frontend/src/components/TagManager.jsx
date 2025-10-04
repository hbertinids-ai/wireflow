import { useState, useEffect } from 'react';
import apiFetch from '../api';

function TagManager({ isOpen, onClose, onTagsUpdate, token }) {
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [editingTag, setEditingTag] = useState(null);

  const predefinedColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#f97316', '#6366f1', '#14b8a6', '#eab308'
  ];

  useEffect(() => {
    loadTags();
  }, [token]);

  const loadTags = async () => {
    try {
      const tagsData = await apiFetch('/api/tags', { method: 'GET' }, token);
      setTags(tagsData || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const saveTag = async () => {
    if (!newTagName.trim()) return;

    const tagData = {
      id: editingTag?.id || `tag-${Date.now()}`,
      name: newTagName.trim(),
      color: newTagColor
    };

    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : '/api/tags';
      const method = editingTag ? 'PUT' : 'POST';
      
      await apiFetch(url, { method, body: tagData }, token);
      loadTags();
      resetForm();
      onTagsUpdate && onTagsUpdate();
    } catch (error) {
      console.error('Error saving tag:', error);
    }
  };

  const deleteTag = async (tagId) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      await apiFetch(`/api/tags/${tagId}`, { method: 'DELETE' }, token);
      loadTags();
      onTagsUpdate && onTagsUpdate();
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const editTag = (tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
  };

  const resetForm = () => {
    setEditingTag(null);
    setNewTagName('');
    setNewTagColor('#3b82f6');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Manage Tags</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Add/Edit Tag Form */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">
            {editingTag ? 'Edit Tag' : 'Add New Tag'}
          </h3>
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name"
            className="w-full p-2 border rounded mb-2"
            maxLength={20}
          />

          <div className="flex gap-2">
            <button
              onClick={saveTag}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {editingTag ? 'Update' : 'Add'}
            </button>
            {editingTag && (
              <button
                onClick={resetForm}
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Tags List */}
        <div>
          <h3 className="font-semibold mb-2">Existing Tags</h3>
          {tags.length === 0 ? (
            <p className="text-gray-500 text-sm">No tags created yet</p>
          ) : (
            <div className="space-y-2">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm font-medium">{tag.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => editTag(tag)}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTag(tag.id)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TagManager;