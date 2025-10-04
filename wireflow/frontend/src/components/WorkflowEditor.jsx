import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position
} from 'react-flow-renderer';
import NodePalette from './NodePalette';
import apiFetch from '../api';
import TagManager from './TagManager';
import 'react-flow-renderer/dist/style.css';

const initialNodes = [
  { id: '1', type: 'input', data: { label: 'Start' }, position: { x: 250, y: 25 } },
];

// Helper function to check if a string is a URL
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

// Component to render description (either as text or link icon)
const DescriptionDisplay = ({ description, className = "text-xs text-gray-600 mt-1" }) => {
  if (!description) return null;
  
  if (isValidUrl(description)) {
    return (
      <div className={className}>
        <a
          href={description}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 nodrag"
          onClick={(e) => e.stopPropagation()}
          title={description}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" 
            />
          </svg>
          <span className="text-xs">Link</span>
        </a>
      </div>
    );
  }
  
  return <div className={className}>{description}</div>;
};

// Custom node components with handles and editing
export const InputNode = ({ data, id, setNodes, setEdges, editingNodeId, setEditingNodeId }) => {
  const [isHovered, setIsHovered] = useState(false);
  const labelRef = useRef(null);
  const descriptionRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const isEditing = editingNodeId === id;

  const handleEdit = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Edit button clicked for InputNode:', id);
    setEditingNodeId(id);
  };

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Save clicked, setting editingNodeId to null');
    const newLabel = labelRef.current?.value || data.label || 'Start';
    const newDescription = descriptionRef.current?.value || data.description || '';
    
    setEditingNodeId(null);
    
    // Update node data
    setNodes((nds) => 
      nds.map((node) => 
        node.id === id 
          ? { ...node, data: { ...node.data, label: newLabel, description: newDescription } }
          : node
      )
    );
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Cancel clicked, setting editingNodeId to null');
    setEditingNodeId(null);
  };

  console.log('InputNode render - isEditing:', isEditing, 'id:', id);

  if (isEditing) {
    return (
      <div className="p-3 bg-blue-200 rounded border-2 border-blue-400 min-w-48">
        <h3 className="font-bold mb-2 text-green-800">Edit Start Node</h3>
        <input
          ref={labelRef}
          defaultValue={data.label || 'Start'}
          className="w-full mb-2 p-2 text-sm border-2 border-gray-300 rounded focus:border-blue-500"
          placeholder="Node name"
          autoFocus
        />
        <textarea
          ref={descriptionRef}
          defaultValue={data.description || ''}
          className="w-full mb-3 p-2 text-xs border-2 border-gray-300 rounded resize-none focus:border-blue-500"
          rows="3"
          placeholder="Description (optional)"
        />
        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 nodrag"
            type="button"
          >
            Save
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 nodrag"
            type="button"
          >
            Delete
          </button>
          <button 
            onClick={handleCancel}
            className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 nodrag"
            type="button"
          >
            Cancel
          </button>
        </div>
        <Handle type="source" position={Position.Right} />
        {showDeleteConfirm && (
          <div className="mt-2 bg-white p-2 rounded border shadow-sm">
            <div className="text-sm mb-2">Delete this node?</div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // delete node and its connected edges
                  setNodes((nds) => nds.filter(n => n.id !== id));
                  setEdges((eds) => eds.filter(e => e.source !== id && e.target !== id));
                  setShowDeleteConfirm(false);
                }}
                className="px-2 py-1 bg-red-500 text-white rounded text-sm"
              >
                Confirm
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-2 py-1 bg-gray-200 rounded text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="relative p-3 bg-green-200 rounded border-2 border-green-400 min-w-24 nodrag"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="font-semibold text-sm">{data.label || 'Start'}</div>
      <DescriptionDisplay description={data.description} />
      <button 
        onMouseDown={handleEdit}
        className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 nodrag flex items-center justify-center"
        title="Edit node"
      >
        ✏
      </button>
      {/* Delete control removed from node UI; deletion is available inside Edit mode only */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export const DefaultNode = ({ data, id, setNodes, setEdges }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const labelRef = useRef(null);
  const descriptionRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  
  const handleSave = () => {
    const newLabel = labelRef.current?.value || data.label || 'Task';
    const newDescription = descriptionRef.current?.value || data.description || '';
    
    setIsEditing(false);
    setNodes((nds) => 
      nds.map((node) => 
        node.id === id 
          ? { ...node, data: { ...node.data, label: newLabel, description: newDescription } }
          : node
      )
    );
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-blue-200 rounded border-2 border-blue-400 min-w-48">
        <input
          ref={labelRef}
          defaultValue={data.label || 'Task'}
          className="w-full mb-2 p-1 text-sm border rounded"
          placeholder="Node name"
          autoFocus
        />
        <textarea
          ref={descriptionRef}
          defaultValue={data.description || ''}
          className="w-full mb-2 p-1 text-xs border rounded resize-none"
          rows="2"
          placeholder="Description (optional)"
        />
        <div className="flex gap-1">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
            }} 
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded nodrag"
            type="button"
          >
            Save
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded nodrag"
            type="button"
          >
            Delete
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(false);
            }} 
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded nodrag"
            type="button"
          >
            Cancel
          </button>
        </div>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
        {showDeleteConfirm && (
          <div className="mt-2 bg-white p-2 rounded border shadow-sm">
            <div className="text-sm mb-2">Delete this node?</div>
            <div className="flex gap-2">
              <button
                onClick={() => { setNodes((nds) => nds.filter(n => n.id !== id)); setEdges((eds) => eds.filter(e => e.source !== id && e.target !== id)); setShowDeleteConfirm(false); }}
                className="px-2 py-1 bg-red-500 text-white rounded text-sm"
              >Confirm</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-2 py-1 bg-gray-200 rounded text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="relative p-3 bg-blue-200 rounded border-2 border-blue-400 min-w-24"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="font-semibold text-sm">{data.label || 'Task'}</div>
      <DescriptionDisplay description={data.description} />
      <button 
        onMouseDown={handleEdit}
        className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 nodrag flex items-center justify-center"
        title="Edit node"
      >
        ✏
      </button>
      {/* Delete control removed from node UI; deletion is available inside Edit mode only */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export const DecisionNode = ({ data, id, setNodes, setEdges }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const labelRef = useRef(null);
  const descriptionRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const contentRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 80, height: 80 });

  useEffect(() => {
    if (contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      // Add some padding for aesthetics
      const minWidth = 80;
      const minHeight = 80;
      setDimensions({
        width: Math.max(rect.width + 32, minWidth),
        height: Math.max(rect.height + 32, minHeight)
      });
    }
  }, [data.label, data.description, isEditing]);

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  
  const handleSave = () => {
    const newLabel = labelRef.current?.value || data.label || 'Decision';
    const newDescription = descriptionRef.current?.value || data.description || '';
    
    setIsEditing(false);
    setNodes((nds) => 
      nds.map((node) => 
        node.id === id 
          ? { ...node, data: { ...node.data, label: newLabel, description: newDescription } }
          : node
      )
    );
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-yellow-200 rounded border-2 border-yellow-400 min-w-48">
        <input
          ref={labelRef}
          defaultValue={data.label || 'Decision'}
          className="w-full mb-2 p-1 text-sm border rounded"
          placeholder="Decision question"
          autoFocus
        />
        <textarea
          ref={descriptionRef}
          defaultValue={data.description || ''}
          className="w-full mb-2 p-1 text-xs border rounded resize-none"
          rows="2"
          placeholder="Decision criteria (optional)"
        />
        <div className="flex gap-1">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
            }} 
            className="px-2 py-1 text-xs bg-yellow-500 text-white rounded nodrag"
            type="button"
          >
            Save
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded nodrag"
            type="button"
          >
            Delete
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(false);
            }} 
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded nodrag"
            type="button"
          >
            Cancel
          </button>
        </div>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Top} id="yes" style={{ background: '#10b981' }} />
        <Handle type="source" position={Position.Bottom} id="no" style={{ background: '#ef4444' }} />
        {showDeleteConfirm && (
          <div className="mt-2 bg-white p-2 rounded border shadow-sm">
            <div className="text-sm mb-2">Delete this node?</div>
            <div className="flex gap-2">
              <button onClick={() => { setNodes((nds) => nds.filter(n => n.id !== id)); setEdges((eds) => eds.filter(e => e.source !== id && e.target !== id)); setShowDeleteConfirm(false); }} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Confirm</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-2 py-1 bg-gray-200 rounded text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <div
        className="bg-yellow-200 border-2 border-yellow-400 transform rotate-45 flex items-center justify-center"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <div
          className="transform -rotate-45 text-center"
          ref={contentRef}
        >
          <div className="font-semibold text-xs break-words whitespace-pre-wrap">{data.label || 'Decision'}</div>
          <DescriptionDisplay description={data.description} className="text-xs text-gray-600 mt-1 break-words whitespace-pre-wrap" />
        </div>
      </div>
      <button
        onMouseDown={handleEdit}
        className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 nodrag flex items-center justify-center"
        title="Edit node"
      >
        ✏
      </button>
      {/* Delete control removed from node UI; deletion is available inside Edit mode only */}
      <Handle type="target" position={Position.Left} style={{ left: '-6px', top: '50%' }} />
      <Handle type="source" position={Position.Top} id="yes" style={{ background: '#10b981', top: '-6px', left: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="no" style={{ background: '#ef4444', bottom: '-6px', left: '50%' }} />
    </div>
  );
};

export const OutputNode = ({ data, id, setNodes, setEdges }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const labelRef = useRef(null);
  const descriptionRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  
  const handleSave = () => {
    const newLabel = labelRef.current?.value || data.label || 'End';
    const newDescription = descriptionRef.current?.value || data.description || '';
    
    setIsEditing(false);
    setNodes((nds) => 
      nds.map((node) => 
        node.id === id 
          ? { ...node, data: { ...node.data, label: newLabel, description: newDescription } }
          : node
      )
    );
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-blue-200 rounded border-2 border-blue-400 min-w-48">
        <input
          ref={labelRef}
          defaultValue={data.label || 'End'}
          className="w-full mb-2 p-1 text-sm border rounded"
          placeholder="Node name"
          autoFocus
        />
        <textarea
          ref={descriptionRef}
          defaultValue={data.description || ''}
          className="w-full mb-2 p-1 text-xs border rounded resize-none"
          rows="2"
          placeholder="Description (optional)"
        />
        <div className="flex gap-1">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
            }} 
            className="px-2 py-1 text-xs bg-red-500 text-white rounded nodrag"
            type="button"
          >
            Save
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded nodrag"
            type="button"
          >
            Delete
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(false);
            }} 
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded nodrag"
            type="button"
          >
            Cancel
          </button>
        </div>
        {showDeleteConfirm && (
          <div className="mt-2 bg-white p-2 rounded border shadow-sm">
            <div className="text-sm mb-2">Delete this node?</div>
            <div className="flex gap-2">
              <button onClick={() => { setNodes((nds) => nds.filter(n => n.id !== id)); setEdges((eds) => eds.filter(e => e.source !== id && e.target !== id)); setShowDeleteConfirm(false); setIsEditing(false); }} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Confirm</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-2 py-1 bg-gray-200 rounded text-sm">Cancel</button>
            </div>
          </div>
        )}
        <Handle type="target" position={Position.Left} />
      </div>
    );
  }

  return (
    <div 
      className="relative p-3 bg-red-200 rounded border-2 border-red-400 min-w-24"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="font-semibold text-sm">{data.label || 'End'}</div>
      <DescriptionDisplay description={data.description} />
      <button 
        onMouseDown={handleEdit}
        className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 nodrag flex items-center justify-center"
        title="Edit node"
      >
        ✏
      </button>
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

export const WorkflowReferenceNode = ({ data, id, setNodes }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleNavigate = (e) => {
    e.stopPropagation();
    // Navigate to the referenced workflow
    window.open(`/editor/${data.workflowId}`, '_blank');
  };

  return (
    <div 
      className="relative p-3 bg-purple-200 rounded border-2 border-purple-400 min-w-32"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center">
        <div className="text-purple-600 mr-2">🔗</div>
        <div>
          <div className="font-semibold text-sm text-purple-800">{data.label}</div>
    <div className="text-xs text-purple-600"></div>
        </div>
      </div>
      {isHovered && (
        <button 
          onClick={handleNavigate}
          className="absolute top-1 right-1 w-5 h-5 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 nodrag flex items-center justify-center"
          title="Open workflow"
        >
          ↗
        </button>
      )}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};


const initialEdges = [];

function WorkflowEditor({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState((id && id !== 'new') ? [] : initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState((id && id !== 'new') ? [] : initialEdges);
  const [name, setName] = useState('');
  const [tags, setTags] = useState([]);
  const [team, setTeam] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [owner, setOwner] = useState(null);
  const [ownerId, setOwnerId] = useState(null);
  const [availableOwners, setAvailableOwners] = useState([]);
  const [rfInstance, setRfInstance] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [selectedElements, setSelectedElements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  // Edge type selector for new edges
  const [edgeType, setEdgeType] = useState('smoothstep');

  console.log('WorkflowEditor render - id:', id, 'editingNodeId:', editingNodeId, 'nodes:', nodes.length);

  // If there is no authenticated session, do not load or allow editing.
  if (!token) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center text-gray-700">
        <h2 className="text-xl font-semibold mb-2">Please sign in to edit workflows</h2>
        <p className="text-sm">You must be logged in to open the workflow editor.</p>
      </div>
    );
  }

  // Create node components with access to setNodes and setEdges and editing state
  const nodeTypes = useMemo(() => ({
    input: (props) => <InputNode {...props} setNodes={setNodes} setEdges={setEdges} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />,
    default: (props) => <DefaultNode {...props} setNodes={setNodes} setEdges={setEdges} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />,
    decision: (props) => <DecisionNode {...props} setNodes={setNodes} setEdges={setEdges} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />,
    output: (props) => <OutputNode {...props} setNodes={setNodes} setEdges={setEdges} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} />,
    workflowReference: (props) => <WorkflowReferenceNode {...props} setNodes={setNodes} />
  }), [setNodes, setEdges, editingNodeId, setEditingNodeId]);

  // Use default edge types (no deletable)

  // Use user-selected edge type and always animated: true for new edges
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, type: edgeType, animated: true }, eds));
  }, [setEdges, edgeType]);



  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    if (!rfInstance) return;
    
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');
    const position = rfInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    
    let newNode;
    
    if (type === 'workflowReference') {
      // Handle workflow reference nodes
      const workflowDataString = event.dataTransfer.getData('application/workflow-data');
      const workflowData = workflowDataString ? JSON.parse(workflowDataString) : null;
      
      newNode = {
        id: `${+new Date()}`,
        type: 'workflowReference',
        position,
        data: { 
          label: workflowData?.name || '',
          workflowId: workflowData?.id
        },
      };
    } else {
      // Handle regular nodes
      const typeLabels = {
        input: 'Start',
        default: 'Task',
        decision: 'Decision',
        output: 'End'
      };
      
      newNode = {
        id: `${+new Date()}`,
        type,
        position,
        data: { label: typeLabels[type] || `${type} Node` },
      };
    }
    
    setNodes((nds) => nds.concat(newNode));
  }, [rfInstance, setNodes]);

  const saveWorkflow = async () => {
    if (!token) {
      alert('You must be signed in to save workflows.');
      return;
    }
    // Convert tag objects to tag IDs for storage
    const tagIds = tags.map(tag => typeof tag === 'object' ? tag.id : tag);
    const workflow = { 
      id: id || `wf-${Date.now()}`, 
      name, 
      nodes, 
      edges, 
      tags: tagIds,
      teamId: teamId || null,
      ownerId: ownerId || null
    };
    try {
      await apiFetch(id ? `/api/workflows/${id}` : '/api/workflows', { method: id ? 'PUT' : 'POST', body: workflow }, token);
      navigate('/');
    } catch (err) {
      console.error('Failed to save workflow', err);
    }
  };
  const loadWorkflow = useCallback(async () => {
    if (!token) return;
    if (!id || id === 'new') return;
    setLoading(true);
    try {
      console.log('Loading workflow with id:', id);
      const workflow = await apiFetch(`/api/workflows/${id}`, { method: 'GET' }, token);
      if (workflow) {
        const { name: wfName, nodes: wfNodes, edges: wfEdges, tags: wfTags, team: wfTeam, teamId: wfTeamId, owner: wfOwner, ownerId: wfOwnerId } = workflow;
        console.log('Loaded workflow:', { wfName, wfNodes, wfEdges, wfTags, wfTeam, wfTeamId, wfOwner, wfOwnerId });
        setName(wfName);
        setTags(wfTags || []); // Tags are now resolved objects from backend
        setTeam(wfTeam || null); // Team object from backend
        setTeamId(wfTeamId || null); // Team ID for saving
        setOwner(wfOwner || null); // Owner object from backend
        setOwnerId(wfOwnerId || null); // Owner ID for saving
        setNodes(wfNodes || []);
        // Normalize edge types: some stored workflows use 'bezier' which may not be
        // registered in the current React Flow build. Map 'bezier' to 'smoothstep'
        // to avoid repeated console warnings and to preserve a curved appearance.
        setEdges((wfEdges || []).map(e => {
          if (e.type === 'deletable') return { ...e, type: undefined };
          if (e.type === 'bezier') return { ...e, type: 'smoothstep' };
          return e;
        }));
      } else {
        console.error('Failed to load workflow: empty response');
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
    } finally {
      setLoading(false);
    }
  }, [id, setNodes, setEdges, token]);

  useEffect(() => { 
    loadWorkflow(); 
  }, [loadWorkflow]);

  // Load available tags
  const loadTags = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/api/tags', { method: 'GET' }, token);
      setAvailableTags(data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }, [token]);

  // Load available teams
  const loadTeams = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/api/teams', { method: 'GET' }, token);
      setAvailableTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  }, [token]);

  // Load available owners
  const loadOwners = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/api/owners', { method: 'GET' }, token);
      setAvailableOwners(data || []);
    } catch (error) {
      console.error('Error loading owners:', error);
    }
  }, [token]);

  useEffect(() => {
    loadTags();
    loadTeams();
    loadOwners();
  }, [loadTags, loadTeams, loadOwners]);

  // Tag management functions
  const handleTagToggle = (tag) => {
    console.log('Toggling tag:', tag);
    setTags(prev => {
      const exists = prev.some(t => t.id === tag.id);
      if (exists) {
        return prev.filter(t => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Team management functions
  const handleTeamChange = (selectedTeamId) => {
    console.log('Changing team to:', selectedTeamId);
    if (selectedTeamId === '') {
      setTeamId(null);
      setTeam(null);
    } else {
      const selectedTeam = availableTeams.find(t => t.id === selectedTeamId);
      setTeamId(selectedTeamId);
      setTeam(selectedTeam);
    }
  };

  // Owner management functions
  const handleOwnerChange = (selectedOwnerId) => {
    console.log('Changing owner to:', selectedOwnerId);
    if (selectedOwnerId === '') {
      setOwnerId(null);
      setOwner(null);
    } else {
      const selectedOwner = availableOwners.find(o => o.id === selectedOwnerId);
      setOwnerId(selectedOwnerId);
      setOwner(selectedOwner);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading workflow...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
  <NodePalette token={token} />
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges.map(({ style, ...e }) => e)}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onSelectionChange={(elements) => setSelectedElements(elements)}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          fitView
        >
          <Controls />
          <Background />
          <MiniMap />
        </ReactFlow>
        <div className="absolute top-4 left-4 flex flex-col space-y-2 z-10 bg-white p-2 rounded shadow-md">
          <div className="flex space-x-2 items-center">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Workflow Name"
              className="p-2 border rounded"
            />
            <button onClick={saveWorkflow} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Save</button>
            <button onClick={() => navigate('/')} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Back</button>
            

            {/* Edge Type Selection */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Edge Type:</span>
              <select
                value={edgeType}
                onChange={e => setEdgeType(e.target.value)}
                className="p-2 border rounded bg-white min-w-32"
              >
                {/* Use 'smoothstep' for curved option to ensure compatibility */}
                <option value="smoothstep">Curved (smoothstep)</option>
                <option value="step">Right-angle (step)</option>
                <option value="straight">Straight</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Team:</span>
              <select
                value={teamId || ''}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="p-2 border rounded bg-white min-w-32"
              >
                <option value="">No Team</option>
                {availableTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {team && (
                <div
                  className="w-4 h-4 rounded border border-gray-300"
                  style={{ backgroundColor: team.color }}
                  title={team.name}
                />
              )}
            </div>
            
            {/* Owner Selection */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Owner:</span>
              <select
                value={ownerId || ''}
                onChange={(e) => handleOwnerChange(e.target.value)}
                className="p-2 border rounded bg-white min-w-32"
              >
                <option value="">No Owner</option>
                {availableOwners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
              {owner && (
                <div
                  className="w-4 h-4 rounded border border-gray-300"
                  style={{ backgroundColor: owner.color }}
                  title={owner.name}
                />
              )}
            </div>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 max-w-md">
              {tags.filter(tag => tag && tag.name).map(tag => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  onClick={() => handleTagToggle(tag)}
                  title="Click to remove tag"
                >
                  {tag.name}
                  <span className="ml-1 text-xs">×</span>
                </span>
              ))}
            </div>
          )}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1 max-w-md">
              <span className="text-xs text-gray-500 mr-2">Available tags:</span>
              {availableTags.filter(tag => tag && tag.name && !tags.some(t => t.id === tag.id)).map(tag => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer border"
                  style={{ borderColor: tag.color, color: tag.color }}
                  onClick={() => handleTagToggle(tag)}
                  title="Click to add tag"
                >
                  {tag.name}
                  <span className="ml-1 text-xs">+</span>
                </span>
              ))}
            </div>
          )}
        </div>
        
        {isTagManagerOpen && (
          <TagManager
            isOpen={isTagManagerOpen}
            onClose={() => setIsTagManagerOpen(false)}
            onTagsChange={loadTags}
            token={token}
          />
        )}
      </div>
    </div>
  );
}

const WorkflowEditorWithProvider = (props) => (
  <ReactFlowProvider>
    <WorkflowEditor {...props} />
  </ReactFlowProvider>
);

export default WorkflowEditorWithProvider;