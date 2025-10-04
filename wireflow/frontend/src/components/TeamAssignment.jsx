import React, { useState, useEffect } from 'react';
import apiFetch from '../api';

const TeamAssignment = ({ workflow, onTeamUpdate, token }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  const handleTeamChange = async (teamId) => {
    setUpdating(true);
    try {
      const updatedWorkflow = {
        ...workflow,
        teamId: teamId
      };

      try {
        const savedWorkflow = await apiFetch(`/api/workflows/${workflow.id}`, { method: 'PUT', body: updatedWorkflow }, token);
        if (onTeamUpdate) onTeamUpdate(savedWorkflow);
        console.log('Team assignment updated:', teamId);
      } catch (err) {
        console.error('Failed to update team assignment', err);
      }
    } catch (error) {
      console.error('Error updating team assignment:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getCurrentTeam = () => {
    const currentTeamId = workflow.teamId || workflow.team?.id;
    return teams.find(team => team.id === currentTeamId);
  };

  if (loading) {
    return (
      <div className="text-xs text-gray-500">
        Loading teams...
      </div>
    );
  }

  const currentTeam = getCurrentTeam();

  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-gray-600">Team:</span>
      <select
        value={workflow.teamId || workflow.team?.id || ''}
        onChange={(e) => handleTeamChange(e.target.value)}
        disabled={updating}
        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        title="Assign workflow to team"
      >
        <option value="">No Team</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
      
      {currentTeam && (
        <div
          className="w-3 h-3 rounded-full border border-gray-300"
          style={{ backgroundColor: currentTeam.color }}
          title={currentTeam.name}
        />
      )}
      
      {updating && (
        <div className="text-xs text-blue-600">
          Updating...
        </div>
      )}
    </div>
  );
};

export default TeamAssignment;