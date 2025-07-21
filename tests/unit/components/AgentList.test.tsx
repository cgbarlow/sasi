/**
 * Comprehensive Unit Tests for AgentList Component
 * Target: 90%+ coverage for React component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentList from '../../../src/components/AgentList';

// Mock the CSS import
jest.mock('../../../src/styles/AgentList.css', () => ({}));

// Mock agent data for testing
const mockAgents = [
  {
    id: 'agent-1',
    name: 'Research Agent 1',
    type: 'researcher',
    status: 'active',
    efficiency: 85.2,
    completedTasks: 12,
    currentTask: 'Analyzing documentation patterns',
    repository: 'test-repo',
    branch: 'main',
    progress: 75.5,
    position: { x: 0, y: 0, z: 0 },
    owner: 'system',
    neuralId: 'neural-1',
    capabilities: ['research', 'analysis', 'documentation'],
    meshConnection: {
      connected: true,
      meshId: 'mesh-1',
      nodeType: 'processor',
      layer: 1,
      synapses: 128,
      activation: 0.8,
      lastSpike: new Date(Date.now() - 30000)
    },
    realtime: {
      cpuUsage: 45.6,
      memoryUsage: 32.1,
      networkLatency: 45,
      wasmPerformance: 95.2,
      isProcessing: true,
      throughput: 1200
    }
  },
  {
    id: 'agent-2',
    name: 'Coder Agent 1',
    type: 'coder',
    status: 'idle',
    efficiency: 92.1,
    completedTasks: 8,
    currentTask: 'Code optimization',
    repository: 'test-repo',
    branch: 'feature-branch',
    progress: 45.0,
    position: { x: 1, y: 0, z: 0 },
    owner: 'system',
    neuralId: 'neural-2',
    capabilities: ['coding', 'debugging', 'optimization'],
    meshConnection: {
      connected: true,
      meshId: 'mesh-1',
      nodeType: 'processor',
      layer: 2,
      synapses: 96,
      activation: 0.9,
      lastSpike: new Date(Date.now() - 120000)
    },
    realtime: {
      cpuUsage: 38.2,
      memoryUsage: 28.7,
      networkLatency: 32,
      wasmPerformance: 92.5,
      isProcessing: false,
      throughput: 800
    }
  },
  {
    id: 'agent-3',
    name: 'Analyst Agent 1',
    type: 'neural',
    status: 'processing',
    efficiency: 78.9,
    completedTasks: 15,
    currentTask: 'Performance analysis',
    repository: 'analytics-repo',
    branch: 'analysis-branch',
    progress: 92.3,
    position: { x: 0, y: 1, z: 0 },
    owner: 'system',
    neuralId: 'neural-3',
    capabilities: ['analysis', 'reporting', 'metrics'],
    meshConnection: {
      connected: true,
      meshId: 'mesh-2',
      nodeType: 'analyzer',
      layer: 3,
      synapses: 64,
      activation: 0.7,
      lastSpike: new Date(Date.now() - 5000)
    },
    realtime: {
      cpuUsage: 52.1,
      memoryUsage: 41.3,
      networkLatency: 58,
      wasmPerformance: 88.7,
      isProcessing: true,
      throughput: 1500
    }
  }
];

const mockOnAgentSelect = jest.fn();
const mockOnAgentAction = jest.fn();

describe('AgentList Component - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render agent list with default props', () => {
      render(<AgentList agents={mockAgents} />);
      
      expect(screen.getByText('Active Agents')).toBeInTheDocument();
      expect(screen.getByText('3 of 3 agents')).toBeInTheDocument();
      expect(screen.getByText('researcher')).toBeInTheDocument();
      expect(screen.getByText('coder')).toBeInTheDocument();
      expect(screen.getByText('neural')).toBeInTheDocument();
    });

    test('should render empty state when no agents', () => {
      render(<AgentList agents={[]} />);
      
      expect(screen.getByText('No agents found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or spawn new agents.')).toBeInTheDocument();
    });

    test('should render with different agent counts', () => {
      render(<AgentList agents={[mockAgents[0]]} />);
      
      expect(screen.getByText('1 of 1 agents')).toBeInTheDocument();
    });

    test('should render all agent statuses', () => {
      render(<AgentList agents={mockAgents} />);
      
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('idle')).toBeInTheDocument();
      expect(screen.getByText('processing')).toBeInTheDocument();
    });
  });

  describe('Agent Display', () => {
    test('should display agent status correctly', () => {
      render(<AgentList agents={mockAgents} />);
      
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('idle')).toBeInTheDocument();
      expect(screen.getByText('busy')).toBeInTheDocument();
    });

    test('should display agent performance metrics', () => {
      render(<AgentList agents={mockAgents} />);
      
      expect(screen.getByText('85.2%')).toBeInTheDocument();
      expect(screen.getByText('92.1%')).toBeInTheDocument();
      expect(screen.getByText('78.9%')).toBeInTheDocument();
    });

    test('should display agent types', () => {
      render(<AgentList agents={mockAgents} />);
      
      expect(screen.getByText('researcher')).toBeInTheDocument();
      expect(screen.getByText('coder')).toBeInTheDocument();
      expect(screen.getByText('analyst')).toBeInTheDocument();
    });

    test('should display cognitive patterns', () => {
      render(<AgentList agents={mockAgents} />);
      
      expect(screen.getByText('divergent')).toBeInTheDocument();
      expect(screen.getByText('convergent')).toBeInTheDocument();
      expect(screen.getByText('systems')).toBeInTheDocument();
    });

    test('should display task counts', () => {
      render(<AgentList agents={mockAgents} />);
      
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    test('should display memory usage', () => {
      render(<AgentList agents={mockAgents} />);
      
      expect(screen.getByText('45.6 MB')).toBeInTheDocument();
      expect(screen.getByText('38.2 MB')).toBeInTheDocument();
      expect(screen.getByText('52.1 MB')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    test('should filter agents by status', () => {
      render(<AgentList agents={mockAgents} showFilter={true} />);
      
      const statusFilter = screen.getByRole('combobox', { name: /status/i });
      fireEvent.change(statusFilter, { target: { value: 'active' } });
      
      expect(screen.getByText('agent-1')).toBeInTheDocument();
      expect(screen.queryByText('agent-2')).not.toBeInTheDocument();
      expect(screen.queryByText('agent-3')).not.toBeInTheDocument();
    });

    test('should filter agents by type', () => {
      render(<AgentList agents={mockAgents} showFilter={true} />);
      
      const typeFilter = screen.getByRole('combobox', { name: /type/i });
      fireEvent.change(typeFilter, { target: { value: 'coder' } });
      
      expect(screen.queryByText('agent-1')).not.toBeInTheDocument();
      expect(screen.getByText('agent-2')).toBeInTheDocument();
      expect(screen.queryByText('agent-3')).not.toBeInTheDocument();
    });

    test('should search agents by name', () => {
      render(<AgentList agents={mockAgents} showFilter={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search agents...');
      fireEvent.change(searchInput, { target: { value: 'agent-2' } });
      
      expect(screen.queryByText('agent-1')).not.toBeInTheDocument();
      expect(screen.getByText('agent-2')).toBeInTheDocument();
      expect(screen.queryByText('agent-3')).not.toBeInTheDocument();
    });

    test('should clear filters when reset button clicked', () => {
      render(<AgentList agents={mockAgents} showFilter={true} />);
      
      // Apply a filter
      const statusFilter = screen.getByRole('combobox', { name: /status/i });
      fireEvent.change(statusFilter, { target: { value: 'active' } });
      
      // Click reset
      const resetButton = screen.getByText('Reset Filters');
      fireEvent.click(resetButton);
      
      // All agents should be visible again
      expect(screen.getByText('agent-1')).toBeInTheDocument();
      expect(screen.getByText('agent-2')).toBeInTheDocument();
      expect(screen.getByText('agent-3')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    test('should sort agents by performance', () => {
      render(<AgentList agents={mockAgents} showSort={true} />);
      
      const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
      fireEvent.change(sortSelect, { target: { value: 'efficiency' } });
      
      // Should sort in descending order (highest first)
      const agentElements = screen.getAllByTestId(/agent-item/);
      expect(agentElements[0]).toHaveTextContent('agent-2'); // 92.1%
      expect(agentElements[1]).toHaveTextContent('agent-1'); // 85.2%
      expect(agentElements[2]).toHaveTextContent('agent-3'); // 78.9%
    });

    test('should sort agents by name', () => {
      render(<AgentList agents={mockAgents} showSort={true} />);
      
      const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
      fireEvent.change(sortSelect, { target: { value: 'name' } });
      
      const agentElements = screen.getAllByTestId(/agent-item/);
      expect(agentElements[0]).toHaveTextContent('agent-1');
      expect(agentElements[1]).toHaveTextContent('agent-2');
      expect(agentElements[2]).toHaveTextContent('agent-3');
    });

    test('should sort agents by last active time', () => {
      render(<AgentList agents={mockAgents} showSort={true} />);
      
      const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
      fireEvent.change(sortSelect, { target: { value: 'lastActive' } });
      
      // Should sort by most recently active first
      const agentElements = screen.getAllByTestId(/agent-item/);
      expect(agentElements[0]).toHaveTextContent('agent-3'); // 5 seconds ago
      expect(agentElements[1]).toHaveTextContent('agent-1'); // 30 seconds ago
      expect(agentElements[2]).toHaveTextContent('agent-2'); // 2 minutes ago
    });
  });

  describe('Agent Selection', () => {
    test('should call onAgentSelect when agent is clicked', () => {
      render(<AgentList agents={mockAgents} onAgentSelect={mockOnAgentSelect} />);
      
      const agentElement = screen.getByTestId('agent-item-agent-1');
      fireEvent.click(agentElement);
      
      expect(mockOnAgentSelect).toHaveBeenCalledWith(mockAgents[0]);
    });

    test('should highlight selected agent', () => {
      render(<AgentList agents={mockAgents} selectedAgentId="agent-2" />);
      
      const selectedAgent = screen.getByTestId('agent-item-agent-2');
      expect(selectedAgent).toHaveClass('selected');
    });

    test('should allow multiple selection when enabled', () => {
      render(<AgentList agents={mockAgents} allowMultiSelect={true} />);
      
      // Select multiple agents
      const agent1 = screen.getByTestId('agent-item-agent-1');
      const agent2 = screen.getByTestId('agent-item-agent-2');
      
      fireEvent.click(agent1);
      fireEvent.click(agent2, { ctrlKey: true });
      
      expect(agent1).toHaveClass('selected');
      expect(agent2).toHaveClass('selected');
    });
  });

  describe('Agent Actions', () => {
    test('should show action buttons when enabled', () => {
      render(<AgentList agents={mockAgents} showActions={true} />);
      
      expect(screen.getAllByText('Terminate')).toHaveLength(3);
      expect(screen.getAllByText('View Details')).toHaveLength(3);
    });

    test('should call onAgentAction when action button is clicked', () => {
      render(<AgentList agents={mockAgents} showActions={true} onAgentAction={mockOnAgentAction} />);
      
      const terminateButton = screen.getAllByText('Terminate')[0];
      fireEvent.click(terminateButton);
      
      expect(mockOnAgentAction).toHaveBeenCalledWith('terminate', mockAgents[0]);
    });

    test('should show additional actions in dropdown', () => {
      render(<AgentList agents={mockAgents} showActions={true} />);
      
      const moreButton = screen.getAllByText('More')[0];
      fireEvent.click(moreButton);
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Clone')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    test('should update agent list when agents prop changes', () => {
      const { rerender } = render(<AgentList agents={mockAgents} />);
      
      expect(screen.getByText('Active Agents (3)')).toBeInTheDocument();
      
      const updatedAgents = [...mockAgents, {
        ...mockAgents[0],
        id: 'agent-4',
        type: 'optimizer'
      }];
      
      rerender(<AgentList agents={updatedAgents} />);
      
      expect(screen.getByText('Active Agents (4)')).toBeInTheDocument();
      expect(screen.getByText('agent-4')).toBeInTheDocument();
    });

    test('should show real-time status updates', async () => {
      const { rerender } = render(<AgentList agents={mockAgents} />);
      
      const updatedAgents = mockAgents.map(agent => 
        agent.id === 'agent-1' 
          ? { ...agent, status: 'busy', efficiency: 87.5 }
          : agent
      );
      
      rerender(<AgentList agents={updatedAgents} />);
      
      await waitFor(() => {
        expect(screen.getByText('87.5%')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Metrics', () => {
    test('should display performance indicators correctly', () => {
      render(<AgentList agents={mockAgents} showMetrics={true} />);
      
      // Check for performance bars
      expect(screen.getAllByRole('progressbar')).toHaveLength(3);
      
      // Check for memory usage indicators
      expect(screen.getByText('45.6 MB')).toBeInTheDocument();
      expect(screen.getByText('38.2 MB')).toBeInTheDocument();
      expect(screen.getByText('52.1 MB')).toBeInTheDocument();
    });

    test('should show connection strength indicators', () => {
      render(<AgentList agents={mockAgents} showMetrics={true} />);
      
      expect(screen.getByText('80%')).toBeInTheDocument(); // Connection strength for agent-1
      expect(screen.getByText('90%')).toBeInTheDocument(); // Connection strength for agent-2
      expect(screen.getByText('70%')).toBeInTheDocument(); // Connection strength for agent-3
    });

    test('should display latency information', () => {
      render(<AgentList agents={mockAgents} showMetrics={true} />);
      
      expect(screen.getByText('45ms')).toBeInTheDocument();
      expect(screen.getByText('32ms')).toBeInTheDocument();
      expect(screen.getByText('58ms')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<AgentList agents={mockAgents} />);
      
      expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Agent list');
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    test('should support keyboard navigation', () => {
      render(<AgentList agents={mockAgents} onAgentSelect={mockOnAgentSelect} />);
      
      const firstAgent = screen.getByTestId('agent-item-agent-1');
      firstAgent.focus();
      
      fireEvent.keyDown(firstAgent, { key: 'Enter' });
      expect(mockOnAgentSelect).toHaveBeenCalledWith(mockAgents[0]);
      
      fireEvent.keyDown(firstAgent, { key: ' ' });
      expect(mockOnAgentSelect).toHaveBeenCalledTimes(2);
    });

    test('should have proper heading structure', () => {
      render(<AgentList agents={mockAgents} />);
      
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Active Agents (3)');
    });
  });

  describe('Error Handling', () => {
    test('should handle agents with missing properties gracefully', () => {
      const incompleteAgents = [
        {
          id: 'incomplete-agent',
          type: 'unknown'
          // Missing other properties
        }
      ];
      
      expect(() => render(<AgentList agents={incompleteAgents as any} />)).not.toThrow();
      expect(screen.getByText('incomplete-agent')).toBeInTheDocument();
    });

    test('should handle null/undefined agent properties', () => {
      const agentsWithNulls = [
        {
          ...mockAgents[0],
          efficiency: null,
          meshConnection: null,
          neuralProperties: undefined
        }
      ];
      
      expect(() => render(<AgentList agents={agentsWithNulls as any} />)).not.toThrow();
    });

    test('should handle invalid performance values', () => {
      const invalidAgents = [
        {
          ...mockAgents[0],
          efficiency: NaN,
          memory: -1
        }
      ];
      
      expect(() => render(<AgentList agents={invalidAgents} />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty search results', () => {
      render(<AgentList agents={mockAgents} showFilter={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search agents...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      expect(screen.getByText('No agents match your search criteria')).toBeInTheDocument();
    });

    test('should handle agents with very long names', () => {
      const longNameAgent = {
        ...mockAgents[0],
        id: 'agent-with-very-long-name-that-might-cause-layout-issues',
        type: 'agent-type-with-extremely-long-name'
      };
      
      render(<AgentList agents={[longNameAgent]} />);
      
      expect(screen.getByText('agent-with-very-long-name-that-might-cause-layout-issues')).toBeInTheDocument();
    });

    test('should handle rapid updates without crashing', () => {
      const { rerender } = render(<AgentList agents={mockAgents} />);
      
      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        const updatedAgents = mockAgents.map(agent => ({
          ...agent,
          efficiency: Math.random() * 100,
          lastActive: Date.now()
        }));
        
        rerender(<AgentList agents={updatedAgents} />);
      }
      
      expect(screen.getByText('Active Agents (3)')).toBeInTheDocument();
    });

    test('should handle agents with special characters in names', () => {
      const specialAgent = {
        ...mockAgents[0],
        id: 'agent-with-special-chars-@#$%',
        type: 'type-with-unicode-😀🚀'
      };
      
      render(<AgentList agents={[specialAgent]} />);
      
      expect(screen.getByText('agent-with-special-chars-@#$%')).toBeInTheDocument();
      expect(screen.getByText('type-with-unicode-😀🚀')).toBeInTheDocument();
    });
  });
});