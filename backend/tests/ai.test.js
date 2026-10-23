/**
 * Automated Verification Suite for AI Chat Assistant Integration
 * Tests: Natural language CRUD, Safe Task Updates, List Completed/Pending Queries, Destructive Action Confirmation
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

const runAiTests = async () => {
  console.log('--- Starting AI Assistant Integration Verification Suite ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition, name) => {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  };

  const originalFetch = global.fetch;
  let sessionCookie = '';
  global.fetch = (url, options = {}) => originalFetch(url, {
    ...options,
    headers: { ...options.headers, Cookie: sessionCookie },
  });

  try {
    const authRes = await originalFetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'AI Test User',
        email: `ai-test-${Date.now()}@example.test`,
        password: 'valid-test-password',
      }),
    });
    sessionCookie = authRes.headers.get('set-cookie')?.split(';')[0] || '';
    assert(authRes.status === 201 && Boolean(sessionCookie), 'AI test account receives an authenticated session');

    // 1. Validation: Empty message
    console.log('\n[Test 1] Input Validation (Empty message)');
    const emptyRes = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   ' }),
    });
    const emptyJson = await emptyRes.json();
    assert(emptyRes.status === 400 && emptyJson.success === false, 'POST /api/ai/chat with blank message returns 400');

    // 2. Natural language task creation
    console.log('\n[Test 2] AI Task Creation via Natural Language');
    const uniqueTitle = `Study MongoDB Automation ${Date.now()}`;
    const createPrompt = `Create a task to ${uniqueTitle} with high priority`;
    const createRes = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: createPrompt }),
    });
    const createJson = await createRes.json();
    assert(createRes.status === 200 && createJson.success === true, 'AI create task returns 200 OK');
    assert(createJson.action === 'createTask', 'AI identifies action as createTask');
    assert(Boolean(createJson.task && createJson.task._id), 'Task is created and persisted with MongoDB _id');

    const createdId = createJson.task?._id;

    // 3. Natural language task listing - Option B: "Show me all pending tasks"
    console.log('\n[Test 3] Option B: "Show me all pending tasks"');
    const pendingRes = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Show me all pending tasks' }),
    });
    const pendingJson = await pendingRes.json();
    assert(pendingRes.status === 200 && pendingJson.success === true, 'Show me all pending tasks returns 200 OK');
    assert(pendingJson.action === 'listTasks', 'Action identified as listTasks');
    assert(Array.isArray(pendingJson.tasks), 'Returns tasks array');
    const allPendingAreIncomplete = pendingJson.tasks.every((t) => t.completed === false);
    assert(allPendingAreIncomplete, 'Every task in pending tasks list has completed: false');

    // 4. Natural language task completion
    console.log('\n[Test 4] AI Task Completion via Natural Language');
    console.log("Test done")
    const completePrompt = `Mark task named ${uniqueTitle} as done`;
    const completeRes = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: completePrompt }),
    });
    const completeJson = await completeRes.json();
    assert(completeRes.status === 200 && completeJson.success === true, 'AI complete task returns 200 OK');
    assert(completeJson.action === 'completeTask', 'AI identifies action as completeTask');
    assert(completeJson.task && completeJson.task.completed === true, 'Task completed status set to true in MongoDB');

    // 5. Option A: "Show me all completed tasks" (Verifies actual MongoDB records returned)
    console.log('\n[Test 5] Option A: "Show me all completed tasks"');
    const doneRes = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Show me all completed tasks' }),
    });
    const doneJson = await doneRes.json();
    assert(doneRes.status === 200 && doneJson.success === true, 'Show me all completed tasks returns 200 OK');
    assert(doneJson.action === 'listTasks', 'Action identified as listTasks');
    assert(Array.isArray(doneJson.tasks) && doneJson.tasks.length > 0, 'Returns non-empty array of real MongoDB tasks');
    const allDoneAreCompleted = doneJson.tasks.every((t) => t.completed === true);
    assert(allDoneAreCompleted, 'Every task in done tasks list has completed: true');
    const containsOurCompletedTask = doneJson.tasks.some((t) => t._id === createdId || t.title.includes(uniqueTitle));
    assert(containsOurCompletedTask, 'Completed task appears in the retrieved completed tasks list');

    // 6. Query: "Show all my tasks"
    console.log('\n[Test 6] Query: "Show all my tasks"');
    const allRes = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Show all my tasks' }),
    });
    const allJson = await allRes.json();
    assert(allRes.status === 200 && allJson.success === true, 'Show all tasks returns 200 OK');
    assert(Array.isArray(allJson.tasks), 'Returns array of all tasks');

    // 7. Destructive Action Safety: AI Deletion requires confirmation
    console.log('\n[Test 7] Safe Deletion: Confirmation Token Required');
    const deletePrompt = `Delete the task named ${uniqueTitle}`;
    const deleteReqRes = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: deletePrompt }),
    });
    const deleteReqJson = await deleteReqRes.json();
    assert(deleteReqRes.status === 200, 'AI delete request returns 200 OK');
    assert(deleteReqJson.confirmationRequired === true, 'Deletions require explicit confirmation');
    assert(Boolean(deleteReqJson.confirmationToken), 'Confirmation token provided');

    // Verify task is NOT deleted yet
    const verifyStillExists = await fetch(`${BASE_URL}/todos/${createdId}`);
    assert(verifyStillExists.status === 200, 'Task still exists in MongoDB prior to confirmation');

    // 8. Confirm Deletion with Token
    console.log('\n[Test 8] Confirm Deletion with Valid Token');
    const token = deleteReqJson.confirmationToken;
    const confirmRes = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        confirmationToken: token,
        confirm: true,
      }),
    });
    const confirmJson = await confirmRes.json();
    assert(confirmRes.status === 200 && confirmJson.action === 'deleteTask', 'Confirmed deletion executes successfully');

    // Verify task is now deleted from MongoDB
    const verifyGone = await fetch(`${BASE_URL}/todos/${createdId}`);
    assert(verifyGone.status === 404, 'Task is permanently deleted from MongoDB after confirmation');

    // 9. Prevent Replay of Confirmation Token
    console.log('\n[Test 9] Reject Replayed / Expired Confirmation Token');
    const replayRes = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        confirmationToken: token,
        confirm: true,
      }),
    });
    assert(replayRes.status !== 200, 'Replayed confirmation token is rejected');

    console.log('\n=============================================');
    console.log(`AI Assistant Results: ${passed} Passed, ${failed} Failed`);
    console.log('=============================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    global.fetch = originalFetch;
  }
};

runAiTests();
