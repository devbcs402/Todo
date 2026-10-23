import React, { useState, useEffect, useRef } from 'react';
import { sendAiChat } from '../api/todoService';

const AiChatModal = ({ onTasksUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! How can I help you manage your tasks?',
      showQuickActions: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [_pendingConfirmation, setPendingConfirmation] = useState(null); // { token, taskTitle, taskId }
  const [awaitingTaskTitle, setAwaitingTaskTitle] = useState(false);
  const [inlineCreateTitle, setInlineCreateTitle] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  // Send message to AI
  const handleSendMessage = async (textToSend = null) => {
    let text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    // If we were awaiting task title from the create prompt and user just typed title
    if (awaitingTaskTitle && !textToSend) {
      if (!text.toLowerCase().startsWith('create')) {
        text = `Create task: ${text}`;
      }
      setAwaitingTaskTitle(false);
    }

    const userMsgId = Date.now().toString();
    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Prepare conversation history
    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await sendAiChat({
        message: text,
        conversationHistory: historyPayload,
      });

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.message || 'I processed your request.',
        action: res.action,
        task: res.task,
        tasks: res.tasks,
        candidateTasks: res.candidateTasks,
        confirmationRequired: res.confirmationRequired,
        confirmationToken: res.confirmationToken,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If a destructive action needs confirmation, save pending state
      if (res.confirmationRequired && res.confirmationToken) {
        setPendingConfirmation({
          token: res.confirmationToken,
          taskTitle: res.task?.title,
          taskId: res.task?.id,
        });
      }

      // If the action modified the database, refresh the main task list!
      if (['createTask', 'completeTask', 'updateTask', 'deleteTask'].includes(res.action)) {
        if (typeof onTasksUpdated === 'function') {
          onTasksUpdated();
        }
      }
    } catch (err) {
      console.error('AI chat error:', err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        isError: true,
        content: `⚠️ ${err.message || 'Failed to communicate with AI service. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Action Click Handler
  const handleQuickAction = (actionKey) => {
    if (isLoading) return;

    if (actionKey === 'completed') {
      handleSendMessage('Show me all completed tasks');
    } else if (actionKey === 'pending') {
      handleSendMessage('Show me all pending tasks');
    } else if (actionKey === 'all') {
      handleSendMessage('Show all my tasks');
    } else if (actionKey === 'create') {
      setAwaitingTaskTitle(true);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'What task would you like to create?',
          isCreatePrompt: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Handle explicit confirmation for task deletion
  const handleConfirmationAction = async (token, confirm) => {
    setIsLoading(true);
    setPendingConfirmation(null);

    const userConfirmText = confirm ? 'Yes, delete this task.' : 'No, cancel deletion.';
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: userConfirmText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      const res = await sendAiChat({
        confirmationToken: token,
        confirm,
      });

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.message,
        action: res.action,
        task: res.task,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (res.action === 'deleteTask' && typeof onTasksUpdated === 'function') {
        onTasksUpdated();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          isError: true,
          content: `⚠️ ${err.message || 'Failed to process confirmation.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicking on an ambiguous candidate task
  const handleSelectCandidate = (candidate) => {
    handleSendMessage(`Select task: "${candidate.title}"`);
  };

  // Handle clear conversation history
  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: 'Hello! How can I help you manage your tasks?',
        showQuickActions: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setPendingConfirmation(null);
    setAwaitingTaskTitle(false);
    setInlineCreateTitle('');
  };

  const quickActionItems = [
    { id: 'completed', label: 'Show completed tasks', icon: '✅' },
    { id: 'pending', label: 'Show pending tasks', icon: '⏳' },
    { id: 'all', label: 'Show all my tasks', icon: '📋' },
    { id: 'create', label: 'Create task', icon: '✨' },
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        type="button"
        className={`ai-fab-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close AI Assistant' : 'Open AI Task Assistant'}
        aria-label="Toggle AI Task Assistant"
        id="ai-assistant-toggle-btn"
      >
        <div className="ai-fab-icon-wrapper">
          <span className="ai-fab-sparkle">✨</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <span className="ai-fab-label">AI Assistant</span>
        <span className="ai-fab-pulse-dot" />
      </button>

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div className="ai-chat-panel glass-panel" role="dialog" aria-labelledby="ai-chat-title" id="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-title">
              <span className="ai-sparkle-icon">✨</span>
              <div>
                <h3 id="ai-chat-title">AI Task Assistant</h3>
                <span className="ai-model-tag">minimax-m3.1-flash:free</span>
              </div>
            </div>
            <div className="ai-header-actions">
              <button
                type="button"
                className="ai-btn-ghost"
                onClick={handleClearHistory}
                title="Clear conversation"
                aria-label="Clear chat history"
              >
                🔄
              </button>
              <button
                type="button"
                className="ai-btn-ghost"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close chat window"
                id="ai-close-chat-btn"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="ai-chat-body" role="log" aria-live="polite">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-message-row ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                {msg.role === 'assistant' && (
                  <div className="ai-avatar" aria-hidden="true">
                    🤖
                  </div>
                )}
                <div className={`ai-message-bubble ${msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'} ${msg.isError ? 'error-bubble' : ''}`}>
                  <div className="ai-message-text">{msg.content}</div>

                  {/* Welcome Message Quick-Action Menu Options */}
                  {msg.showQuickActions && (
                    <div className="ai-welcome-actions-menu">
                      {quickActionItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`ai-menu-chip ${item.id === 'create' ? 'ai-menu-chip-create' : ''}`}
                          onClick={() => handleQuickAction(item.id)}
                          disabled={isLoading}
                        >
                          <span className="ai-chip-icon">{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Inline Task Creation Form inside Prompt */}
                  {msg.isCreatePrompt && (
                    <form
                      className="ai-inline-create-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const titleVal = inlineCreateTitle.trim();
                        if (!titleVal) return;
                        handleSendMessage(`Create task: ${titleVal}`);
                        setInlineCreateTitle('');
                        setAwaitingTaskTitle(false);
                      }}
                    >
                      <input
                        type="text"
                        className="ai-inline-input"
                        placeholder="Task title (e.g. Study MongoDB)..."
                        value={inlineCreateTitle}
                        onChange={(e) => setInlineCreateTitle(e.target.value)}
                        disabled={isLoading}
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="btn btn-primary ai-inline-btn"
                        disabled={isLoading || !inlineCreateTitle.trim()}
                      >
                        ✨ Create
                      </button>
                    </form>
                  )}

                  {/* Task Action Result Preview */}
                  {msg.task && msg.action && (
                    <div className="ai-task-card">
                      <span className="ai-task-tag">
                        {msg.action === 'createTask' && '✨ Created Task'}
                        {msg.action === 'completeTask' && '✅ Status Updated'}
                        {msg.action === 'updateTask' && '✏️ Updated'}
                        {msg.action === 'deleteTask' && '🗑️ Deleted Task'}
                      </span>
                      <strong className="ai-task-title">{msg.task.title}</strong>
                      {msg.task.description && (
                        <p className="ai-task-desc">{msg.task.description}</p>
                      )}
                    </div>
                  )}

                  {/* Render Actual Retrieved Task Records from MongoDB */}
                  {Array.isArray(msg.tasks) && msg.tasks.length > 0 && (
                    <div className="ai-tasks-container">
                      {msg.tasks.map((task, idx) => (
                        <div
                          key={task._id || task.id || idx}
                          className={`ai-task-item-card ${task.completed ? 'is-done' : 'is-pending'}`}
                        >
                          <div className="ai-task-item-header">
                            <span className={`ai-task-status-pill ${task.completed ? 'done' : 'pending'}`}>
                              {task.completed ? '✅ Completed' : '⏳ Pending'}
                            </span>
                            {task.createdAt && (
                              <span className="ai-task-date">
                                {new Date(task.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                          <div className="ai-task-item-title">{task.title}</div>
                          {task.description && (
                            <div className="ai-task-item-desc">{task.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty State when no tasks match query */}
                  {Array.isArray(msg.tasks) && msg.tasks.length === 0 && (
                    <div className="ai-empty-tasks-card">
                      <span className="ai-empty-tasks-icon">ℹ️</span>
                      <span>{msg.content || 'No matching tasks found.'}</span>
                    </div>
                  )}

                  {/* Clarification candidate choices */}
                  {msg.candidateTasks && msg.candidateTasks.length > 0 && (
                    <div className="ai-candidate-list">
                      <p className="ai-candidate-label">Select one of the matching tasks:</p>
                      {msg.candidateTasks.map((candidate) => (
                        <button
                          key={candidate.id || candidate._id}
                          type="button"
                          className="ai-candidate-btn"
                          onClick={() => handleSelectCandidate(candidate)}
                        >
                          <span>👉</span>
                          <strong>{candidate.title}</strong>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Destructive Action Confirmation Dialog Card */}
                  {msg.confirmationRequired && msg.confirmationToken && (
                    <div className="ai-confirm-card">
                      <p className="ai-confirm-prompt">
                        ⚠️ Please confirm permanent deletion of <strong>"{msg.task?.title}"</strong>:
                      </p>
                      <div className="ai-confirm-actions">
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleConfirmationAction(msg.confirmationToken, true)}
                          disabled={isLoading}
                          id="ai-confirm-delete-btn"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleConfirmationAction(msg.confirmationToken, false)}
                          disabled={isLoading}
                          id="ai-cancel-delete-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <span className="ai-timestamp">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="ai-message-row assistant">
                <div className="ai-avatar" aria-hidden="true">🤖</div>
                <div className="ai-message-bubble assistant-bubble ai-typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', marginLeft: '6px' }}>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips Bar */}
          <div className="ai-quick-prompts">
            {quickActionItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="ai-prompt-chip"
                onClick={() => handleQuickAction(item.id)}
                disabled={isLoading}
              >
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </div>

          {/* Custom Message Input Footer */}
          <form
            className="ai-chat-footer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="ai-chat-input"
              placeholder={awaitingTaskTitle ? 'What task would you like to create?...' : 'Type your message...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              maxLength={1000}
              autoComplete="off"
              id="ai-chat-input"
            />
            <button
              type="submit"
              className="ai-chat-send-btn"
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message to AI"
              id="ai-chat-send-btn"
            >
              {isLoading ? (
                <span className="spinner" style={{ width: '14px', height: '14px' }} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AiChatModal;
