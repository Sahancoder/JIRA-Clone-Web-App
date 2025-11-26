'use client';

import { useState } from 'react';

interface AIAssistantProps {
  workspaceId: string;
}

export function AIAssistant({ workspaceId }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'oracle'>('description');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-4 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('description')}
              className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'description'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Task Description Generator
            </button>
            <button
              onClick={() => setActiveTab('oracle')}
              className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'oracle'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Project Oracle
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'description' ? (
            <DescriptionGenerator workspaceId={workspaceId} />
          ) : (
            <ProjectOracle workspaceId={workspaceId} />
          )}
        </div>
      </div>
    </div>
  );
}

function DescriptionGenerator({ workspaceId }: { workspaceId: string }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, workspaceId }),
      });

      if (!response.ok) throw new Error('Failed to generate description');

      const data = await response.json();
      setDescription(data.description);
    } catch (error) {
      console.error('Failed to generate description:', error);
      alert('Failed to generate description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-navy mb-2">
          Generate Task Description with AI
        </h3>
        <p className="text-sm text-gray-600">
          Enter a task title and let AI create a detailed description for you.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Task Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Implement user authentication"
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={!title.trim() || loading}
        className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Generating...' : 'Generate Description'}
      </button>

      {description && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Generated Description
          </label>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: description.replace(/\n/g, '<br>') }}
            />
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(description);
              alert('Description copied to clipboard!');
            }}
            className="mt-2 text-sm text-primary hover:text-primary-hover font-medium"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}

function ProjectOracle({ workspaceId }: { workspaceId: string }) {
  const [projectId, setProjectId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ question: string; answer: string }>>([]);

  const handleAsk = async () => {
    if (!question.trim() || !projectId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/project-oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, projectId }),
      });

      if (!response.ok) throw new Error('Failed to get answer');

      const data = await response.json();
      setAnswer(data.answer);
      setHistory((prev) => [...prev, { question, answer: data.answer }]);
      setQuestion('');
    } catch (error) {
      console.error('Failed to get answer:', error);
      alert('Failed to get answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-navy mb-2">Project Oracle</h3>
        <p className="text-sm text-gray-600">
          Ask questions about your project and get AI-powered insights.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project ID
        </label>
        <input
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Enter project ID"
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Chat History */}
      {history.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-navy mb-1">You:</p>
                <p className="text-sm text-gray-700">{item.question}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-navy mb-1">Project Oracle:</p>
                <p className="text-sm text-gray-700">{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Question
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What are the high-priority tasks due this week?"
          rows={3}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <button
        onClick={handleAsk}
        disabled={!question.trim() || !projectId || loading}
        className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Thinking...' : 'Ask Oracle'}
      </button>
    </div>
  );
}
