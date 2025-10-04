import { useCallback, useState, useEffect } from 'react';
import apiFetch from '../api';
import { useParams } from 'react-router-dom';

function NodePalette({ token }) {
  const { id: currentWorkflowId } = useParams();
  const [workflows, setWorkflows] = useState([]);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const allWorkflows = await apiFetch('/api/workflows', { method: 'GET' }, token);
        const otherWorkflows = (allWorkflows || []).filter(workflow => 
          workflow.id !== currentWorkflowId && currentWorkflowId !== 'new'
        );
        setWorkflows(otherWorkflows);
      } catch (error) {
        console.error('Error fetching workflows:', error);
      }
    };

    fetchWorkflows();
  }, [currentWorkflowId]);

  const onDragStart = (event, nodeType, workflowData = null) => {
    if (workflowData) {
      // For workflow reference nodes, include the workflow data
      event.dataTransfer.setData('application/reactflow', 'workflowReference');
      event.dataTransfer.setData('application/workflow-data', JSON.stringify(workflowData));
    } else {
      event.dataTransfer.setData('application/reactflow', nodeType);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-gray-200 p-4 overflow-y-auto">
      <h2 className="font-bold mb-2">Nodes</h2>
      <div
        onDragStart={e => onDragStart(e, 'input')}
        draggable
        className="bg-green-300 p-2 mb-2 cursor-move rounded"
      >
        Start Node
      </div>
      <div
        onDragStart={e => onDragStart(e, 'default')}
        draggable
        className="bg-blue-300 p-2 mb-2 cursor-move rounded"
      >
        Task Node
      </div>
      <div
        onDragStart={e => onDragStart(e, 'decision')}
        draggable
        className="bg-yellow-300 p-2 mb-2 cursor-move rounded"
      >
        Decision Node
      </div>
      <div
        onDragStart={e => onDragStart(e, 'output')}
        draggable
        className="bg-red-300 p-2 mb-2 cursor-move rounded"
      >
        End Node
      </div>

      {workflows.length > 0 && (
        <>
          <h2 className="font-bold mb-2 mt-4">Links</h2>
          {workflows.map(workflow => (
            <div
              key={workflow.id}
              onDragStart={e => onDragStart(e, 'workflowReference', workflow)}
              draggable
              className="bg-purple-300 p-2 mb-2 cursor-move rounded border-l-4 border-purple-500"
            >
              <div className="flex items-center">
                <span className="mr-2">🔗</span>
                <div>
                  <div className="font-semibold text-sm">{workflow.name}</div>
                  <div className="text-xs text-gray-600">{/* Removed 'Workflow Link' label */}</div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="mt-4 text-xs text-gray-600">
        <p className="mb-2"><strong>Guidelines:</strong></p>
        <p className="mb-1"><strong>Workflow Naming:</strong></p>
        <p className="mb-1">• Use descriptive, business-oriented names</p>
        <p className="mb-1">• Avoid technical jargon in workflow titles</p>
        <p className="mb-1">• Include process type or department if relevant</p>
        <p className="mb-2"><strong>Node Naming:</strong></p>
        <p className="mb-1">• Use clear, action-oriented names</p>
        <p className="mb-1">• Keep names concise but descriptive</p>
        <p className="mb-1">• Use consistent terminology</p>
        <p className="mb-2"><strong>Linking:</strong></p>
        <p className="mb-1">• Connect related processes sequentially</p>
        <p className="mb-1">• Use decision nodes for branching logic</p>
        <p className="mb-1">• Avoid crossing connections when possible</p>
        <p className="mb-2"><strong>Inter-workflow:</strong></p>
        <p className="mb-1">• Reference other workflows for reusability</p>
        <p className="mb-1">• Use workflow links to reduce complexity</p>
        <p className="mb-1">• Document dependencies clearly</p>
      </div>
    </aside>
  );
}

export default NodePalette;