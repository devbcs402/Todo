/**
 * Automated Verification Script for TODO CRUD API
 * Tests all 10 criteria specified in AGENT.md
 */

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Todo = require('../src/models/Todo');
const User = require('../src/models/User');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/todo_crud_db';

const runTests = async () => {
  let passed = 0;
  let failed = 0;
  const assert = (condition, label) => {
    if (condition) {
      console.log(`  PASS: ${label}`);
      passed++;
    } else {
      console.error(`  FAIL: ${label}`);
      failed++;
    }
  };

  const request = async (path, { method = 'GET', body, cookie } = {}) => {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (cookie) headers.Cookie = cookie;
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { response, data: await response.json() };
  };

  const register = async (name, email, password) => {
    const result = await request('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    return {
      ...result,
      cookie: result.response.headers.get('set-cookie')?.split(';')[0],
    };
  };

  const testEmails = [];
  let cleanupTaskId;
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    const health = await request('/health');
    assert(health.response.status === 200 && health.data.status === 'healthy', 'health endpoint responds');

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const emailA = `owner-${suffix}@example.test`;
    const emailB = `other-${suffix}@example.test`;
    testEmails.push(emailA, emailB);
    const password = 'correct-horse-battery';

    const invalidRegister = await request('/auth/register', {
      method: 'POST',
      body: { name: '', email: 'invalid', password: 'short' },
    });
    assert(invalidRegister.response.status === 400, 'registration rejects invalid fields');

    const unauthenticatedTasks = await request('/todos');
    const unauthenticatedAi = await request('/ai/chat', { method: 'POST', body: { message: 'list tasks' } });
    assert(unauthenticatedTasks.response.status === 401, 'task routes reject missing authentication');
    assert(unauthenticatedAi.response.status === 401, 'AI task routes reject missing authentication');

    const owner = await register('Test Owner', emailA, password);
    assert(owner.response.status === 201 && Boolean(owner.cookie), 'registration creates an authenticated session');
    assert(!owner.data.user.passwordHash, 'auth responses never expose password hashes');

    const storedUser = await User.findOne({ email: emailA }).select('+passwordHash');
    assert(Boolean(storedUser?.passwordHash) && await bcrypt.compare(password, storedUser.passwordHash), 'password is stored as a bcrypt hash');

    const duplicate = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Duplicate', email: emailA, password },
    });
    assert(duplicate.response.status === 409, 'duplicate email is rejected');

    const wrongPassword = await request('/auth/login', {
      method: 'POST',
      body: { email: emailA, password: 'incorrect-password' },
    });
    assert(wrongPassword.response.status === 401 && wrongPassword.data.error === 'Invalid email or password.', 'login failure is generic');

    const secondUser = await register('Other Owner', emailB, password);
    assert(secondUser.response.status === 201 && Boolean(secondUser.cookie), 'a second user can register');

    const created = await request('/todos', {
      method: 'POST',
      cookie: owner.cookie,
      body: { title: `Private task ${suffix}`, description: 'Owner-only test' },
    });
    assert(created.response.status === 201 && Boolean(created.data.data?._id), 'authenticated user creates a task');
    const taskId = created.data.data?._id;
    cleanupTaskId = taskId;

    const secondList = await request('/todos', { cookie: secondUser.cookie });
    assert(secondList.response.status === 200 && secondList.data.data.length === 0, 'another user cannot see the task');

    const crossRead = await request(`/todos/${taskId}`, { cookie: secondUser.cookie });
    const crossUpdate = await request(`/todos/${taskId}`, {
      method: 'PUT', cookie: secondUser.cookie, body: { title: 'stolen' },
    });
    const crossDelete = await request(`/todos/${taskId}`, { method: 'DELETE', cookie: secondUser.cookie });
    assert(crossRead.response.status === 404, 'another user cannot read the task');
    assert(crossUpdate.response.status === 404, 'another user cannot update the task');
    assert(crossDelete.response.status === 404, 'another user cannot delete the task');

    const read = await request(`/todos/${taskId}`, { cookie: owner.cookie });
    assert(read.response.status === 200 && read.data.data._id === taskId, 'owner can read a task');
    const updated = await request(`/todos/${taskId}`, {
      method: 'PUT',
      cookie: owner.cookie,
      body: { title: `Updated ${suffix}`, completed: true },
    });
    assert(updated.response.status === 200 && updated.data.data.completed, 'owner can update a task');

    const deleted = await request(`/todos/${taskId}`, { method: 'DELETE', cookie: owner.cookie });
    assert(deleted.response.status === 200, 'owner can delete a task');
    const missing = await request(`/todos/${taskId}`, { cookie: owner.cookie });
    assert(missing.response.status === 404, 'deleted task is no longer available');

    const loggedOut = await request('/auth/logout', { method: 'POST', cookie: owner.cookie });
    const staleToken = await request('/auth/me', { cookie: owner.cookie });
    assert(loggedOut.response.status === 200, 'logout succeeds');
    assert(staleToken.response.status === 401, 'logout invalidates the previously issued token');

    const login = await request('/auth/login', {
      method: 'POST',
      body: { email: emailA, password },
    });
    assert(login.response.status === 200 && Boolean(login.response.headers.get('set-cookie')), 'valid credentials create a session');

    console.log(`\nAPI results: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exitCode = 1;
  } catch (error) {
    console.error('API test execution failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState === 1) {
      if (cleanupTaskId) await Todo.findByIdAndDelete(cleanupTaskId);
      for (const email of testEmails) await User.deleteOne({ email });
    }
    await mongoose.disconnect();
  }
};

runTests();
