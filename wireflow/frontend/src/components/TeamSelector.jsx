import React, { useState, useEffect } from 'react';
import apiFetch from '../api';

const TeamSelector = ({ selectedTeam, onTeamChange, onManageTeams, token }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, [token]);

  const loadTeams = async () => {
    try {
      const teamsData = await apiFetch('/api/teams', { method: 'GET' }, token);
      setTeams(teamsData || []);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = (teamId) => {
    // Exclusive selection: if same team is clicked, deselect it
    if (selectedTeam === teamId) {
      onTeamChange(null);
    } else {
      onTeamChange(teamId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Loading teams...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Filter by Team</h3>
        <button
          onClick={onManageTeams}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Manage Teams
        </button>
      </div>
      
      <div className="space-y-2">
        {/* Clear selection option */}
        <button
          onClick={() => onTeamChange(null)}
          className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
            selectedTeam === null
              ? 'bg-gray-100 border-gray-400 text-gray-900'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded border border-gray-400" />
            <span className="text-sm">All Teams</span>
          </div>
        </button>

        {/* Team options */}
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => handleTeamSelect(team.id)}
            className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
              selectedTeam === team.id
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: team.color }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{team.name}</span>
                {team.description && (
                  <p className="text-xs text-gray-500 truncate">{team.description}</p>
                )}
              </div>
              {selectedTeam === team.id && (
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedTeam && (
        <div className="text-xs text-gray-500 italic">
          Showing workflows for: {teams.find(t => t.id === selectedTeam)?.name}
        </div>
      )}
    </div>
  );
};

export default TeamSelector;