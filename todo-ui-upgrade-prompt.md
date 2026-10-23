 # Todo Website UI Upgrade Prompt

Copy the prompt below and paste it into Claude (or any AI coding assistant) together with your current todo website code (HTML, CSS, JS, or React files).

---

## PROMPT

You are a senior frontend developer and UI designer. I have a todo website and I want to upgrade its UI. Please redesign it while keeping all existing functionality working.

### Current functionality to keep
- Add a new task
- Mark a task as complete / incomplete
- Edit a task
- Delete a task
- Filter tasks (All / Active / Completed)
- Save tasks (keep the current storage method, such as localStorage)

### What I want improved
1. **Visual design**: Give the app a clean, modern, and distinctive look. Avoid generic template styling. Choose a color palette (4 to 6 colors) and one or two typefaces with a clear type scale.
2. **Layout**: Center the main todo card on the page, with comfortable spacing and a clear visual hierarchy between the input, the task list, and the filters.
3. **Task items**: Make each task easy to scan. Show a custom checkbox, a clear completed state (for example, muted text with a strikethrough), and hover/focus states for the edit and delete actions.
4. **Input area**: Make the "add task" input prominent and friendly. Support pressing Enter to add a task. Show a helpful empty state when there are no tasks (plain, action-oriented text, such as "Add your first task to get started").
5. **Footer**: Show the count of remaining tasks and the filter controls.
6. **Motion**: Keep animations subtle. Use one smooth transition for adding or removing a task, and respect `prefers-reduced-motion`.
7. **Dark mode**: Add a light/dark theme toggle that remembers the user's choice.
8. **Responsiveness**: The layout must work well on mobile (320px and up), tablet, and desktop.
9. **Accessibility**: Use semantic HTML, proper labels for inputs and buttons, visible keyboard focus styles, and sufficient color contrast (WCAG AA).

### Design guidelines
- Be deliberate and avoid cliché choices (such as default gradient cards, identical rounded boxes everywhere, or all-caps labels).
- Keep the design minimal: remove any decoration that does not help the user.
- Write all UI text in plain, sentence-case language. Buttons should describe their action (for example, "Add task", "Delete", "Clear completed").

### Output format
1. Briefly explain your design plan (palette, typefaces, layout) in 5 to 8 lines.
2. Provide the complete updated code in one piece (HTML + CSS + JS, or the component files if I use React).
3. List the main changes you made in short bullet points.
4. Keep all existing features working. If you change how data is stored, explain why.

### My current code
[Paste your current code here]

---

## Optional add-ons (add to the prompt if you want them)
- "Add drag-and-drop to reorder tasks."
- "Add due dates with a date picker and show overdue tasks in a different color."
- "Add a priority level (low, medium, high) with a colored indicator."
- "Add a search box to filter tasks by text."
- "Add a 'Clear completed' button in the footer."
