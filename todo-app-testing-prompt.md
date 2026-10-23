# Todo App Full Website Testing Prompt

Copy the prompt below and give it to the AI agent that has access to your project. The agent should read the code, write the test cases, run them, and report the results. The target is an **85% pass rate or higher**.

---

## PROMPT

You are a senior QA engineer. Test the entire todo app website in this project and produce a test report. The goal is to reach a success rate of **at least 85%** of test cases passing. If the pass rate is below 85%, identify the failing cases, fix the bugs in the code, and re-run the tests until the target is met.

### Step 1: Understand the project
- Read all project files (HTML, CSS, JavaScript or React components, and any storage logic).
- List the features you find (add, edit, complete, delete, filter, save, theme, and so on).
- Note the test tools already in the project (for example Jest, Vitest, Cypress, or Playwright). If none exist, use Playwright or Jest and explain your choice.

### Step 2: Write test cases
Create test cases in these categories. Give each test a unique ID (TC-001, TC-002, and so on).

1. **Adding tasks**
   - Add a task with valid text
   - Try to add an empty task (should be blocked or show a message)
   - Try to add a task with only spaces
   - Add a task by pressing Enter
   - Add a very long task (200+ characters)
   - Add a task with special characters (for example `<b>bold</b>`, `"quotes"`, `&`, emojis)
   - Add multiple tasks in a row and check the order

2. **Completing tasks**
   - Mark a task as complete
   - Mark a completed task as incomplete again
   - The completed style (strikethrough or muted text) appears and disappears correctly
   - The remaining-task count updates

3. **Editing tasks**
   - Edit a task's text and save
   - Cancel an edit and confirm the original text remains
   - Save an edit with empty text (should be blocked or should delete, based on the design)
   - Double-clicking or the edit button opens edit mode

4. **Deleting tasks**
   - Delete a single task
   - Delete the last remaining task and check the empty state message
   - Delete a completed task

5. **Filters**
   - "All" shows every task
   - "Active" shows only incomplete tasks
   - "Completed" shows only completed tasks
   - The selected filter is visually highlighted
   - Filters still work after adding, editing, or deleting a task

6. **Data persistence**
   - Tasks remain after a page refresh
   - Completed state is saved
   - Edited text is saved
   - Deleted tasks do not come back after refresh
   - Corrupted or empty storage data does not crash the app

7. **Clear completed (if available)**
   - Removes only completed tasks
   - Does nothing when there are no completed tasks

8. **Theme and UI (if available)**
   - Light and dark mode switch correctly
   - The theme choice is remembered after refresh
   - Layout is usable at 320px, 768px, and 1280px widths

9. **Responsiveness and accessibility**
   - All buttons and inputs can be reached with the Tab key
   - Inputs and buttons have labels or accessible names
   - Focus outline is visible
   - Text contrast is readable

10. **Performance and errors**
    - The page loads without console errors
    - Adding 100 tasks does not freeze the page
    - Rapid clicking on buttons does not create duplicate tasks

11. **Edge cases**
    - Two tasks with the same text
    - Reloading during an edit
    - Very fast add-and-delete actions

### Step 3: Run the tests
- Run all tests using the project's test command, or the tool you chose.
- Record each result as **PASS** or **FAIL**.
- For each failed test, record the expected result, the actual result, and the likely cause.

### Step 4: Fix and retest
- If the pass rate is below 85%, fix the bugs in the code (not the tests, unless a test is clearly wrong).
- Re-run the full test suite.
- Repeat until the pass rate is 85% or higher.

### Step 5: Final report
Create a file named **test-report.md** with these sections:

1. **Summary:** Total tests, passed, failed, and pass rate percentage. State clearly whether the 85% target was met.
2. **Test environment:** Browser, operating system, Node version, and test tool used.
3. **Test results table:** Test ID, category, test name, status (PASS/FAIL), and notes.
4. **Failed tests:** For each failure, the expected result, actual result, cause, and fix applied.
5. **Bugs fixed:** A short list of every code change made during testing.
6. **Remaining issues:** Any known problems that were not fixed, and why.
7. **How to run the tests:** Exact commands to run the test suite.

### Rules
- Do not delete or skip tests just to raise the pass rate. Every test must be honest.
- Only count a test as PASS if it actually ran and confirmed the expected behavior.
- Keep the existing features working when you fix bugs.
- Save all test files in a `tests/` folder in the project.

---

## Optional add-ons (add to the prompt if you want them)
- "Also write a short manual testing checklist I can follow myself in the browser."
- "Generate an HTML version of the test report that I can open in a browser."
- "Test on Chrome, Firefox, and Safari, and show results for each browser."
