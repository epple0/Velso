// ============================================
// CONFIGURATION - EDIT THESE VALUES
// ============================================
const CONFIG = {
// Supabase - Get from supabase.com/dashboard > Settings > API
    SUPABASE_URL: 'https://lbbayixblmmachvddqdn.supabase.co', // e.g., 'https://xxxxx.supabase.co'
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiYmF5aXhibG1tYWNodmRkcGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjI0MTIsImV4cCI6MjA4Nzk5ODQxMn0.NCvXBC2PXqJepKAuI3aiXq9CcHC2FdQrEyQfw9tZbZs', // Your anon/public key

// Gemini API - Get from aistudio.google.com. if you want a shared key for all users, put it below
    GEMINI_API_KEY: localStorage.getItem('geminiApiKey') || '',
    GEMINI_MODEL: 'gemini-3-flash-preview'
};
// optional: public/shared key fallback
const PUBLIC_GEMINI_KEY = '';

// ensure CONFIG.GEMINI_API_KEY has something useful
if (!CONFIG.GEMINI_API_KEY && PUBLIC_GEMINI_KEY) {
    CONFIG.GEMINI_API_KEY = PUBLIC_GEMINI_KEY;
}
// ============================================

// Initialize Supabase
const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
    }
});

// State
let currentUser = null;
let tasks = [];
let currentFilter = 'all';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
});

async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
            window.location.href = 'index.html';
            return;
        }
        
        currentUser = session.user;
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('loadingScreen').style.display = 'none';
        
        // Auth state listener
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                window.location.href = 'index.html';
            }
        });
        
        initTheme();
        setupEventListeners();
        await loadTasks();
    } catch (err) {
        console.error('Auth error:', err);
        window.location.href = 'index.html';
    }
}

// ============================================
// THEME
// ============================================
function initTheme() {
    const saved = localStorage.getItem('taskflow-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('taskflow-theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (theme === 'dark') {
        icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else {
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('addTaskBtn').addEventListener('click', () => openTaskModal());
    document.getElementById('saveTaskBtn').addEventListener('click', saveTask);
    document.getElementById('taskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveTask();
    });

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // AI Schedule
    document.getElementById('aiScheduleBtn').addEventListener('click', openScheduleModal);
    document.getElementById('generateScheduleBtn').addEventListener('click', generateSchedule);
    document.getElementById('backToConfigBtn').addEventListener('click', showScheduleConfig);

    // Modal close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        }
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// ============================================
// TASKS
// ============================================
async function loadTasks() {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        tasks = data || [];
        updateStats();
        renderTasks();
    } catch (error) {
        console.error('Load error:', error);
        showToast('Failed to load tasks', 'error');
    }
}

function renderTasks() {
    const container = document.getElementById('taskList');
    let filtered = [...tasks];
    const today = new Date().toISOString().split('T')[0];

    switch (currentFilter) {
        case 'pending': filtered = tasks.filter(t => !t.completed); break;
        case 'completed': filtered = tasks.filter(t => t.completed); break;
        case 'today': filtered = tasks.filter(t => t.due_date === today); break;
        case 'high': filtered = tasks.filter(t => t.priority === 'high' && !t.completed); break;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="12" y1="18" x2="12" y2="12"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                </div>
                <h3>No tasks found</h3>
                <p>Create a new task to get started</p>
                <button class="btn btn-primary" onclick="openTaskModal()">Add Task</button>
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(task => `
        <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-header">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')">
                    ${task.completed ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        ${task.due_date ? `<span class="task-tag">${formatDate(task.due_date)}</span>` : ''}
                        ${task.due_time ? `<span class="task-tag">${formatTime(task.due_time)}</span>` : ''}
                        <span class="task-tag">${task.duration_minutes} min</span>
                        <span class="task-tag priority-${task.priority}">${capitalize(task.priority)}</span>
                        ${task.location ? `<span class="task-tag">${escapeHtml(task.location)}</span>` : ''}
                        <span class="task-tag">${capitalize(task.category)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action" onclick="openTaskModal('${task.id}')" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="task-action delete" onclick="deleteTask('${task.id}')" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openTaskModal(taskId = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    form.reset();

    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('taskModalTitle').textContent = 'Edit Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskDueDate').value = task.due_date || '';
            document.getElementById('taskDueTime').value = task.due_time || '';
            document.getElementById('taskDuration').value = task.duration_minutes;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskLocation').value = task.location || '';
            document.getElementById('taskCategory').value = task.category;
        }
    } else {
        document.getElementById('taskModalTitle').textContent = 'Add Task';
        document.getElementById('taskId').value = '';
        document.getElementById('taskDueDate').value = new Date().toISOString().split('T')[0];
    }

    modal.classList.add('active');
    setTimeout(() => document.getElementById('taskTitle').focus(), 100);
}

async function saveTask() {
    const id = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();

    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }

    const taskData = {
        user_id: currentUser.id,
        title,
        description: document.getElementById('taskDescription').value.trim() || null,
        due_date: document.getElementById('taskDueDate').value || null,
        due_time: document.getElementById('taskDueTime').value || null,
        duration_minutes: parseInt(document.getElementById('taskDuration').value) || 30,
        priority: document.getElementById('taskPriority').value,
        location: document.getElementById('taskLocation').value.trim() || null,
        category: document.getElementById('taskCategory').value
    };

    const btn = document.getElementById('saveTaskBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';

    try {
        if (id) {
            const { error } = await supabase.from('tasks').update(taskData).eq('id', id);
            if (error) throw error;
            showToast('Task updated', 'success');
        } else {
            const { error } = await supabase.from('tasks').insert([taskData]);
            if (error) throw error;
            showToast('Task created', 'success');
        }
        closeModal('taskModal');
        await loadTasks();
    } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Task';
    }
}

async function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
        const { error } = await supabase.from('tasks').update({ completed: !task.completed }).eq('id', id);
        if (error) throw error;
        await loadTasks();
    } catch (error) {
        showToast('Failed to update', 'error');
    }
}

async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;

    try {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
        showToast('Task deleted', 'success');
        await loadTasks();
    } catch (error) {
        showToast('Failed to delete', 'error');
    }
}

// ============================================
// STATS
// ============================================
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const totalMinutes = tasks.filter(t => !t.completed).reduce((sum, t) => sum + (t.duration_minutes || 0), 0);

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statCompleted').textContent = completed;

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    document.getElementById('statTime').textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// ============================================
// AI SCHEDULING
// ============================================
function openScheduleModal() {
    const pendingTasks = tasks.filter(t => !t.completed);

    if (pendingTasks.length === 0) {
        showToast('No pending tasks to schedule', 'error');
        return;
    }

    document.getElementById('scheduleTaskSelect').innerHTML = pendingTasks.map(task => `
        <label class="schedule-task-item">
            <input type="checkbox" value="${task.id}" checked>
            <span>${escapeHtml(task.title)} (${task.duration_minutes} min)</span>
        </label>
    `).join('');

    showScheduleConfig();
    document.getElementById('scheduleModal').classList.add('active');
}

function showScheduleConfig() {
    document.getElementById('scheduleConfig').classList.remove('hidden');
    document.getElementById('schedulePreview').classList.add('hidden');
    document.getElementById('backToConfigBtn').classList.add('hidden');
}

async function generateSchedule() {
    const selectedIds = Array.from(document.querySelectorAll('#scheduleTaskSelect input:checked')).map(cb => cb.value);

    if (selectedIds.length === 0) {
        showToast('Select at least one task', 'error');
        return;
    }

    const selectedTasks = tasks.filter(t => selectedIds.includes(t.id));
    const btn = document.getElementById('generateScheduleBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Generating...';

    try {
        const schedule = await callGeminiAPI(selectedTasks, {
            startTime: document.getElementById('scheduleStart').value,
            endTime: document.getElementById('scheduleEnd').value,
            workStyle: document.getElementById('workStyle').value,
            energyLevel: document.getElementById('energyLevel').value,
            freeTime: parseInt(document.getElementById('freeTime').value) || 0
        });
        displaySchedule(schedule);
    } catch (error) {
        console.error('AI error:', error);
        showToast('Schedule generation failed: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Generate Schedule';
    }
}

async function callGeminiAPI(selectedTasks, preferences) {
    if (!CONFIG.GEMINI_API_KEY) {
        // fallback to public key if configured
        if (PUBLIC_GEMINI_KEY) {
            CONFIG.GEMINI_API_KEY = PUBLIC_GEMINI_KEY;
        }
    }
    const keySnippet = CONFIG.GEMINI_API_KEY ? CONFIG.GEMINI_API_KEY.slice(0,4) + '...' + CONFIG.GEMINI_API_KEY.slice(-4) : '(none)';
    console.log('[debug] callGeminiAPI using key', keySnippet, 'model', CONFIG.GEMINI_MODEL);
    if (!CONFIG.GEMINI_API_KEY) {
        throw new Error('Missing Gemini API key (set via settings or environment)');
    }

    const taskList = selectedTasks.map(t =>
        `- "${t.title}": ${t.duration_minutes} min, Priority: ${t.priority}, Category: ${t.category}${t.due_date ? `, Due: ${t.due_date}` : ''}${t.location ? `, Location: ${t.location}` : ''}`
    ).join('\n');

    const workStyles = {
        'pomodoro': 'Pomodoro: 25 min work, 5 min break, 15-30 min break after 4 cycles',
        'deep': 'Deep Work: 50 min focused work, 10 min break',
        'sprint': 'Sprint: 90 min intense work, 20 min break',
        'flexible': 'Flexible: Adjust breaks based on task length'
    };

    const prompt = `You are a productivity expert. Create an optimal schedule.

TASKS:
${taskList}

SETTINGS:
- Time: ${preferences.startTime} to ${preferences.endTime}
- Style: ${workStyles[preferences.workStyle]}
- Energy: ${preferences.energyLevel}
- Buffer: ${preferences.freeTime} minutes

RULES:
1. High priority tasks during peak hours (morning)
2. Group similar categories
3. Include breaks per work style
4. Leave buffer time unscheduled
5. Account for context switching

OUTPUT (JSON only, no markdown):
{
    "schedule": [{"time":"HH:MM","endTime":"HH:MM","duration":number,"type":"task|break","taskId":"id or null","title":"name","tip":"productivity tip"}],
    "summary": "strategy overview",
    "tips": ["3 tips for the day"],
    "totalWorkTime": number,
    "totalBreakTime": number,
    "freeTimeKept": number
}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
            })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        let msg = error.error?.message || 'API failed';
        if (response.status === 401 || response.status === 403 || msg.toLowerCase().includes('key')) {
            msg += ' (check your API key & permissions)';
        }
        throw new Error(msg);
    }

    const data = await response.json();
    let text = data.candidates[0]?.content?.parts[0]?.text || '';
    if (text.includes('```')) text = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
}

function displaySchedule(schedule) {
    document.getElementById('scheduleConfig').classList.add('hidden');
    document.getElementById('schedulePreview').classList.remove('hidden');
    document.getElementById('backToConfigBtn').classList.remove('hidden');

    document.getElementById('scheduleResult').innerHTML = schedule.schedule.map(item => `
        <div class="schedule-item ${item.type === 'break' ? 'break' : ''}">
            <div class="schedule-time">${item.time}</div>
            <div class="schedule-details">
                <strong>${item.type === 'break' ? 'Break: ' : ''}${item.title}</strong>
                <div class="schedule-duration">${item.duration} min (until ${item.endTime})</div>
                ${item.tip ? `<div class="schedule-tip">${item.tip}</div>` : ''}
            </div>
        </div>
    `).join('');

    document.getElementById('scheduleSummary').innerHTML = `
        <h4>Summary</h4>
        <p>${schedule.summary}</p>
        <h4 style="margin-top:12px">Tips</h4>
        <ul>${schedule.tips.map(t => `<li>${t}</li>`).join('')}</ul>
        <div class="schedule-stats">
            <span>Work: ${schedule.totalWorkTime} min</span>
            <span>Breaks: ${schedule.totalBreakTime} min</span>
            <span>Buffer: ${schedule.freeTimeKept} min</span>
        </div>
    `;
}

// ============================================
// UTILITIES
// ============================================
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' 
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    
    toast.innerHTML = icon + message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// Global functions
window.openTaskModal = openTaskModal;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.closeModal = closeModal;