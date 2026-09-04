/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — TASKS MODULE
   Full task CRUD, drag-drop, subtasks, repeat engine
═══════════════════════════════════════════════════════════ */

const Tasks = {
    getVisibleToday() {
        const today = Utils.today();
        return State.data.tasks.filter(t =>
            !t.date ||
            t.date === today ||
            (t.date < today && !t.completed)
        );
    },

    getRepeatLabel(repeat) {
        const map = { none: '', daily: 'Daily', '2days': '2d', weekdays: 'Weekdays', weekly: 'Weekly' };
        if (map[repeat] !== undefined) return map[repeat];
        if (repeat?.startsWith('custom:')) return `${repeat.split(':')[1]}d`;
        return '';
    },

    taskHTML(task, index = 0) {
        const today = Utils.today();
        let metaHTML = '';

        if (task.date) {
            let label = '';
            if (task.date === today) label = 'Today';
            else if (task.date < today) label = 'Overdue';
            else {
                const d = new Date(task.date + 'T00:00:00');
                label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
            }
            const isOverdue = task.date < today && !task.completed;
            metaHTML += `<span class="task-badge ${isOverdue ? 'overdue' : ''}">${Icons.calendar(9)}${label}</span>`;
        }

        if (task.time) {
            metaHTML += `<span class="task-badge">${Icons.clock(9)}${Utils.formatTime12(task.time)}</span>`;
        }

        if (task.priority && task.priority !== 'none') {
            metaHTML += `<span class="task-badge priority-${task.priority}">${task.priority}</span>`;
        }

        const repeatLabel = this.getRepeatLabel(task.repeat);
        if (repeatLabel) {
            metaHTML += `<span class="task-badge repeat">${Icons.repeat(9)}${repeatLabel}</span>`;
        }

        let subtasksHTML = '';
        let subtasksProgressHTML = '';
        if (task.subtasks?.length) {
            const doneCount = task.subtasks.filter(s => s.done).length;
            const percent = Math.round((doneCount / task.subtasks.length) * 100);

            subtasksProgressHTML = `
            <div class="task-steps-progress" title="${doneCount}/${task.subtasks.length} steps completed">
                <div class="task-steps-progress-bar">
                    <div class="task-steps-progress-fill" style="width: ${percent}%"></div>
                </div>
                <span class="task-steps-progress-text">${doneCount}/${task.subtasks.length} steps</span>
            </div>`;

            subtasksHTML = `<div class="task-subtasks">` +
                task.subtasks.map((s, idx) => `
                    <div class="task-subtask">
                        <div class="subtask-checkbox ${s.done ? 'checked' : ''}" data-action="toggle-subtask" data-task-id="${task.id}" data-sub-idx="${idx}">
                            ${Icons.check(8)}
                        </div>
                        <span class="subtask-text ${s.done ? 'done' : ''}">${Utils.escape(s.text)}</span>
                    </div>
                `).join('') +
                `</div>`;
        }

        const priorityClass = task.priority && task.priority !== 'none' ? `priority-${task.priority}` : '';
        const hasDetails = task.notes || task.subtasks?.length;
        const expandChevronHTML = hasDetails ? `<span class="task-expand-chevron">${Icons.chevronDown(10)}</span>` : '';

        return `
        <div class="task-item ${priorityClass} ${task.completed ? 'completed' : ''}"
             data-id="${task.id}"
             draggable="true"
             data-action="drag-item"
             style="animation-delay:${index * CONFIG.TASK_ANIMATION_STAGGER}s">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-action="toggle-task" data-task-id="${task.id}">
                ${Icons.check(12)}
            </div>
            <div class="task-content" data-action="expand-task" data-task-id="${task.id}">
                <div class="task-title-row" style="display:flex; align-items:center; justify-content:space-between; gap: 8px;">
                    <div class="task-title">${Utils.escape(task.text)}</div>
                    ${expandChevronHTML}
                </div>
                ${task.notes ? `<div class="task-notes">${Utils.escape(task.notes)}</div>` : ''}
                <div class="task-meta">${metaHTML}</div>
                ${subtasksProgressHTML}
                ${subtasksHTML}
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit" data-action="edit-task" data-task-id="${task.id}" title="Edit">
                    ${Icons.edit(14)}
                </button>
                <button class="task-action-btn delete" data-action="delete-task" data-task-id="${task.id}" title="Delete">
                    ${Icons.trash(14)}
                </button>
            </div>
        </div>`;
    },

    /* ─── DRAG & DROP ─── */
    dragStart(e, id) {
        e.dataTransfer.setData('text/plain', id);
        e.currentTarget.classList.add('dragging');
        setTimeout(() => {
            const el = document.querySelector(`.task-item[data-id="${id}"]`);
            if (el) el.style.opacity = '0.3';
        }, 0);
    },

    dragOver(e) {
        e.preventDefault();
        const taskItem = e.currentTarget.closest('.task-item');
        if (taskItem && !taskItem.classList.contains('dragging')) {
            taskItem.classList.add('drag-over');
        }
    },

    dragLeave(e) {
        e.currentTarget.closest('.task-item')?.classList.remove('drag-over');
    },

    dragDrop(e, targetId) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (id === targetId) return;

        const tasks = State.data.tasks;
        const dragIndex   = tasks.findIndex(t => t.id === id);
        const targetIndex = tasks.findIndex(t => t.id === targetId);

        if (dragIndex !== -1 && targetIndex !== -1) {
            const [draggedTask] = tasks.splice(dragIndex, 1);
            tasks.splice(targetIndex, 0, draggedTask);
            Storage.save();
            this.render();
            const todayTasks = this.getVisibleToday();
            Home.renderTaskPreview(todayTasks);
            Sound.click();
        }
    },

    dragEnd(e) {
        document.querySelector('.task-item.dragging')?.classList.remove('dragging');
        document.querySelectorAll('.task-item.dragging').forEach(el => { el.style.opacity = ''; });
        document.querySelectorAll('.task-item.drag-over').forEach(el => el.classList.remove('drag-over'));

        // Clean up opacity on all items
        document.querySelectorAll('.task-item').forEach(el => { el.style.opacity = ''; });
    },

    toggleExpand(e, taskId) {
        if (e.target.closest('.task-checkbox') ||
            e.target.closest('.subtask-checkbox') ||
            e.target.closest('.task-actions') ||
            e.target.closest('.task-action-btn')) {
            return;
        }

        const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
        if (!taskItem) return;

        const hasDetails = taskItem.querySelector('.task-notes') || taskItem.querySelector('.task-subtasks');
        if (hasDetails) {
            e.stopPropagation();
            taskItem.classList.toggle('expanded');
            Sound.click();
        } else {
            this.openEdit(taskId);
        }
    },

    render() {
        const todayTasks = this.getVisibleToday();
        const listsWithTasks = State.data.lists.filter(l => todayTasks.some(t => t.list === l));
        const tabs = ['All', ...listsWithTasks];

        if (!tabs.includes(State.data.currentList)) State.data.currentList = 'All';

        const taskTabsEl = document.getElementById('taskTabs');
        if (taskTabsEl) {
            taskTabsEl.innerHTML = tabs.map(list => {
                const count = list === 'All'
                    ? todayTasks.filter(t => !t.completed).length
                    : todayTasks.filter(t => t.list === list && !t.completed).length;

                return `
                <button class="tab ${list === State.data.currentList ? 'active' : ''}" data-action="set-list" data-list="${Utils.escape(list)}">
                    ${Utils.escape(list)}
                    ${count ? `<span class="tab-count">${count}</span>` : ''}
                </button>`;
            }).join('');
        }

        const filtered = State.data.currentList === 'All'
            ? todayTasks
            : todayTasks.filter(t => t.list === State.data.currentList);

        const activeFilter = State.data.settings?.taskFilter || 'all';
        const totalCount = filtered.length;
        const completedCount = filtered.filter(t => t.completed).length;
        const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

        const toolsBar = document.getElementById('taskToolsBar');
        if (toolsBar) {
            toolsBar.innerHTML = `
            <div class="task-progress-kpi">
                <span class="task-progress-kpi-text">${completedCount}/${totalCount} Done</span>
                <div class="task-progress-kpi-bar-container">
                    <div class="task-progress-kpi-bar-fill" style="width: ${pct}%"></div>
                </div>
                <span class="task-progress-kpi-pct">${pct}%</span>
            </div>
            <div class="task-filter-group">
                <button class="task-filter-btn ${activeFilter === 'all' ? 'active' : ''}" data-action="set-filter" data-filter="all">All</button>
                <button class="task-filter-btn ${activeFilter === 'pending' ? 'active' : ''}" data-action="set-filter" data-filter="pending">Pending</button>
                <button class="task-filter-btn ${activeFilter === 'high' ? 'active' : ''}" data-action="set-filter" data-filter="high">High ${Icons.fire(12)}</button>
            </div>`;
        }

        let renderTasks = filtered;
        if (activeFilter === 'pending') renderTasks = filtered.filter(t => !t.completed);
        else if (activeFilter === 'high') renderTasks = filtered.filter(t => t.priority === 'high');

        const container = document.getElementById('tasksContainer');
        if (!container) return;

        if (!renderTasks.length) {
            const hour = new Date().getHours();
            let emptyMsg = 'Nothing here yet.<br>Tap + to add something meaningful.';
            if (hour < 10) emptyMsg = 'Fresh morning, fresh start.<br>Tap + to set your intentions.';
            else if (hour < 14) emptyMsg = 'Afternoon\'s wide open.<br>Tap + to capture what matters.';
            else if (hour < 20) emptyMsg = 'Evening clarity.<br>Tap + to plan tomorrow.';
            else emptyMsg = 'Night owl mode.<br>Tap + to dump tomorrow\'s thoughts.';
            container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${Icons.tasks(56)}</div>
                <p>${emptyMsg}</p>
            </div>`;
            return;
        }

        const openTasks = Utils.sortTasks(renderTasks.filter(t => !t.completed));
        const doneTasks = renderTasks.filter(t => t.completed);

        let hintHTML = '';
        if (openTasks.length > 1) {
            hintHTML = `
            <div class="sorting-hint">
                ${Icons.info(11)} Drag tasks to reorder manually (Overdue items stay pinned on top).
            </div>`;
        }

        container.innerHTML = hintHTML + [...openTasks, ...doneTasks].map((t, i) => this.taskHTML(t, i)).join('');

        // Attach drag events via delegation on the container
        this._attachDragEvents(container);
    },

    _attachDragEvents(container) {
        container.querySelectorAll('.task-item[draggable]').forEach(item => {
            const id = item.dataset.id;
            item.ondragstart = (e) => this.dragStart(e, id);
            item.ondragover  = (e) => this.dragOver(e);
            item.ondragleave = (e) => this.dragLeave(e);
            item.ondrop      = (e) => this.dragDrop(e, id);
            item.ondragend   = (e) => this.dragEnd(e);
        });
    },

    setList(list) {
        State.data.currentList = list;
        Storage.save();
        this.render();
        Sound.click();
    },

    setFilter(filter) {
        if (!State.data.settings) State.data.settings = {};
        State.data.settings.taskFilter = filter;
        Storage.save();
        this.render();
        Sound.click();
    },

    createList() {
        const input = document.getElementById('newListInput');
        const name = input?.value.trim();
        if (!name || State.data.lists.includes(name)) return;

        State.data.lists.push(name);
        State.data.currentList = name;
        if (input) input.value = '';
        Storage.save();
        this.render();
        Sound.success();
        Toast.show('List created');
    },

    openAddModal() {
        State.editingTaskId = null;
        document.getElementById('taskModalTitle').textContent = 'New Task';
        document.getElementById('taskSubmitBtn').textContent = 'Add Task';
        document.getElementById('taskDeleteBtn').style.display = 'none';

        document.getElementById('taskTitleInput').value = '';
        document.getElementById('taskNotesInput').value = '';
        document.getElementById('taskDateInput').value = Utils.today();
        document.getElementById('taskTimeInput').value = '';
        document.getElementById('taskPrioritySelect').value = 'none';
        document.getElementById('editingTaskId').value = '';

        State.selectedRepeat = 'none';
        State.tempSubtasks = [];

        this.populateListSelect();
        this.renderRepeatPills();
        this.renderSubtasks();
        document.getElementById('customRepeatRow')?.classList.remove('show');
        document.getElementById('addTaskModal')?.classList.add('on');
        setTimeout(() => document.getElementById('taskTitleInput')?.focus(), 300);
        Sound.open();
    },

    openEdit(taskId) {
        const task = State.data.tasks.find(t => t.id === taskId);
        if (!task) return;

        State.editingTaskId = taskId;
        document.getElementById('taskModalTitle').textContent = 'Edit Task';
        document.getElementById('taskSubmitBtn').textContent = 'Save Changes';
        document.getElementById('taskDeleteBtn').style.display = 'block';

        document.getElementById('taskTitleInput').value = task.text || '';
        document.getElementById('taskNotesInput').value = task.notes || '';
        document.getElementById('taskDateInput').value = task.date || '';
        document.getElementById('taskTimeInput').value = task.time || '';
        document.getElementById('taskPrioritySelect').value = task.priority || 'none';
        document.getElementById('editingTaskId').value = taskId;

        State.selectedRepeat = task.repeat || 'none';
        if (State.selectedRepeat.startsWith('custom:')) {
            const daysEl = document.getElementById('customRepeatDays');
            if (daysEl) daysEl.value = State.selectedRepeat.split(':')[1];
            State.selectedRepeat = 'custom';
        }

        State.tempSubtasks = task.subtasks ? Utils.clone(task.subtasks) : [];

        this.populateListSelect(task.list);
        this.renderRepeatPills();
        this.renderSubtasks();
        document.getElementById('customRepeatRow')?.classList.toggle('show', State.selectedRepeat === 'custom');
        document.getElementById('addTaskModal')?.classList.add('on');
        Sound.open();
    },

    populateListSelect(selected = null) {
        const select = document.getElementById('taskListSelect');
        if (!select) return;
        select.innerHTML = State.data.lists.map(l =>
            `<option value="${Utils.escape(l)}" ${l === selected ? 'selected' : ''}>${Utils.escape(l)}</option>`
        ).join('');
    },

    renderRepeatPills() {
        const options = [
            ['none', 'Never'], ['daily', 'Daily'], ['2days', '2 Days'],
            ['weekdays', 'Weekdays'], ['weekly', 'Weekly'], ['custom', 'Custom']
        ];

        const container = document.getElementById('repeatPills');
        if (!container) return;
        container.innerHTML = options.map(([val, label]) => `
            <button class="pill ${State.selectedRepeat === val ? 'active' : ''}" data-action="set-repeat" data-repeat="${val}">
                ${label}
            </button>
        `).join('');
    },

    setRepeat(repeat) {
        State.selectedRepeat = repeat;
        this.renderRepeatPills();
        document.getElementById('customRepeatRow')?.classList.toggle('show', repeat === 'custom');
        Sound.click();
    },

    addTempSubtask() {
        const input = document.getElementById('subtaskInput');
        const text = input?.value.trim();
        if (!text) return;

        State.tempSubtasks.push({ text, done: false });
        if (input) input.value = '';
        this.renderSubtasks();
        Sound.click();
    },

    renderSubtasks() {
        const container = document.getElementById('subtasksList');
        if (!container) return;
        container.innerHTML = State.tempSubtasks.map((s, i) => `
            <div class="subtask-item">
                <span>${Utils.escape(s.text)}</span>
                <button class="subtask-remove-btn" data-action="remove-subtask" data-idx="${i}">
                    ${Icons.close(12)}
                </button>
            </div>
        `).join('');
    },

    removeTempSubtask(i) {
        State.tempSubtasks.splice(i, 1);
        this.renderSubtasks();
        Sound.delete();
    },

    submitTask() {
        const titleEl = document.getElementById('taskTitleInput');
        const title = titleEl?.value.trim();
        if (!title) { titleEl?.focus(); return; }

        let repeat = State.selectedRepeat;
        if (repeat === 'custom') {
            repeat = 'custom:' + (parseInt(document.getElementById('customRepeatDays')?.value) || 3);
        }

        const taskData = {
            text:     title,
            notes:    document.getElementById('taskNotesInput')?.value.trim() || '',
            date:     document.getElementById('taskDateInput')?.value || '',
            time:     document.getElementById('taskTimeInput')?.value || '',
            priority: document.getElementById('taskPrioritySelect')?.value || 'none',
            list:     document.getElementById('taskListSelect')?.value || State.data.lists[0] || 'My Tasks',
            subtasks: Utils.clone(State.tempSubtasks),
            repeat
        };

        if (State.editingTaskId) {
            const task = State.data.tasks.find(t => t.id === State.editingTaskId);
            if (task) { Object.assign(task, taskData); Toast.show('Task updated'); }
        } else {
            State.data.tasks.unshift({
                id: Utils.generateId('task'),
                repeatGroupId: Utils.generateId('rg'),
                ...taskData,
                completed: false,
                completedAt: null,
                createdAt: Date.now()
            });
            Toast.show('Task added');
        }

        Storage.save();
        document.getElementById('addTaskModal')?.classList.remove('on');
        this.render();
        Home.render();
        Nav.updateBadges();
        Sound.success();
    },

    deleteFromModal() {
        if (State.editingTaskId) {
            this.remove(State.editingTaskId);
            document.getElementById('addTaskModal')?.classList.remove('on');
        }
    },

    toggle(id) {
        const task = State.data.tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? Date.now() : null;

        if (task.completed) {
            State.data.totalTasksCompleted = (State.data.totalTasksCompleted || 0) + 1;
        } else {
            State.data.totalTasksCompleted = Math.max(0, (State.data.totalTasksCompleted || 0) - 1);
        }
        Level.update();
        Storage.save();

        if (task.completed) {
            Sound.success();
            const el = document.querySelector(`[data-id="${id}"]`);
            if (el) {
                el.classList.add('completing');
                const rect = el.getBoundingClientRect();
                if (window.Particles) Particles.spawnExplosion(rect.left + 24, rect.top + 24, 25);
            }
            setTimeout(() => {
                this.render();
                Home.render();
                Nav.updateBadges();
                if (State.currentPage === 'report') Report.render();
            }, 350);
        } else {
            Sound.click();
            this.render();
            Home.render();
            Nav.updateBadges();
            if (State.currentPage === 'report') Report.render();
        }
    },

    toggleSubtask(taskId, subIndex) {
        const task = State.data.tasks.find(t => t.id === taskId);
        if (!task?.subtasks?.[subIndex]) return;

        task.subtasks[subIndex].done = !task.subtasks[subIndex].done;
        Storage.save();
        this.render();
        Sound.click();
    },

    remove(id) {
        const removedTask = State.data.tasks.find(t => t.id === id);
        State.data.tasks = State.data.tasks.filter(t => t.id !== id);
        Storage.save();
        this.render();
        Home.render();
        Nav.updateBadges();
        if (State.currentPage === 'report') Report.render();
        Sound.delete();

        if (removedTask) {
            Toast.showUndo('Task removed', () => {
                State.data.tasks.unshift(removedTask);
                Storage.save();
                this.render();
                Home.render();
                Nav.updateBadges();
                Sound.success();
                Toast.show('Task restored');
            });
        } else {
            Toast.show('Task removed');
        }
    },

    summonRepeats() {
        const today = Utils.today();

        // Assign repeatGroupId to legacy tasks without one
        State.data.tasks
            .filter(t => t.repeat && t.repeat !== 'none' && !t.repeatGroupId)
            .forEach(t => { t.repeatGroupId = Utils.generateId('rg'); });

        const allGroupIds = [...new Set(
            State.data.tasks
                .filter(t => t.repeat && t.repeat !== 'none' && t.repeatGroupId)
                .map(t => t.repeatGroupId)
        )];

        allGroupIds.forEach(gid => {
            const items  = State.data.tasks.filter(t => t.repeatGroupId === gid && t.repeat && t.repeat !== 'none');
            const active = items.filter(t => !t.completed);

            if (active.length > 0) {
                if (active[0].date && active[0].date < today) active[0].date = today;
                active.slice(1).forEach(extra => {
                    State.data.tasks = State.data.tasks.filter(t => t.id !== extra.id);
                });
            } else {
                const completed = items
                    .filter(t => t.completed && t.completedAt)
                    .sort((a, b) => b.completedAt - a.completedAt);

                if (completed.length > 0) {
                    const last = completed[0];
                    const doneDate = new Date(last.completedAt).toISOString().split('T')[0];

                    if (doneDate < today && !State.data.tasks.some(t =>
                        t.repeatGroupId === gid && t.date === today && !t.completed
                    )) {
                        State.data.tasks.unshift({
                            ...last,
                            id: Utils.generateId('task'),
                            date: today,
                            completed: false,
                            completedAt: null,
                            createdAt: Date.now(),
                            subtasks: last.subtasks ? last.subtasks.map(s => ({ ...s, done: false })) : []
                        });
                    }
                }
            }
        });

        Storage.save();
    }
};

/* ─────────────────────────────────────────────────────────
   TASKS EVENT DELEGATION (replaces inline onclick attrs)
───────────────────────────────────────────────────────── */
document.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    const el = e.target.closest('[data-action]');

    switch (action) {
        case 'toggle-task':
            Tasks.toggle(el.dataset.taskId);
            break;
        case 'expand-task':
            Tasks.toggleExpand(e, el.dataset.taskId);
            break;
        case 'edit-task':
            Tasks.openEdit(el.dataset.taskId);
            break;
        case 'delete-task':
            Tasks.remove(el.dataset.taskId);
            break;
        case 'toggle-subtask':
            Tasks.toggleSubtask(el.dataset.taskId, parseInt(el.dataset.subIdx));
            break;
        case 'set-list':
            Tasks.setList(el.dataset.list);
            break;
        case 'set-filter':
            Tasks.setFilter(el.dataset.filter);
            break;
        case 'set-repeat':
            Tasks.setRepeat(el.dataset.repeat);
            break;
        case 'remove-subtask':
            Tasks.removeTempSubtask(parseInt(el.dataset.idx));
            break;
    }
});
