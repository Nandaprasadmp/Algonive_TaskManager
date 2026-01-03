class ProTaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('nanda_tasks_pro')) || [];
        this.currentFilter = 'all';
        this.editingId = null;
        this.init();
    }

    init() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        
        // Check reminders every 10 seconds for better demo testing
        this.checkReminders();
        setInterval(() => this.checkReminders(), 10000);

        this.attachListeners();
        this.render();
    }

    updateClock() {
        const now = new Date();
        document.getElementById('time').innerText = now.toLocaleTimeString([], { hour12: false });
        document.getElementById('date').innerText = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    }

    attachListeners() {
        document.getElementById('taskForm').onsubmit = (e) => {
            e.preventDefault();
            this.handleTaskSubmit();
        };

        document.getElementById('search').oninput = (e) => this.render(e.target.value);

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelector('.nav-btn.active').classList.remove('active');
                e.currentTarget.classList.add('active');
                this.currentFilter = e.currentTarget.dataset.filter;
                this.render();
            };
        });
    }

    handleTaskSubmit() {
        const title = document.getElementById('taskTitle').value;
        const desc = document.getElementById('taskDesc').value;
        const date = document.getElementById('taskDate').value;
        const priority = document.getElementById('taskPriority').value;

        if (this.editingId) {
            const index = this.tasks.findIndex(t => t.id === this.editingId);
            this.tasks[index] = { ...this.tasks[index], title, desc, date, priority };
            this.editingId = null;
            document.getElementById('submitBtn').innerHTML = '<i class="fas fa-plus"></i><div class="btn-shine"></div>';
        } else {
            const task = {
                id: Date.now(),
                title, desc, date, priority,
                completed: false,
                reminded: false
            };
            this.tasks.unshift(task);
        }

        this.save();
        document.getElementById('taskForm').reset();
    }

    edit(id) {
        const task = this.tasks.find(t => t.id === id);
        this.editingId = id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDesc').value = task.desc;
        document.getElementById('taskDate').value = task.date;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i><div class="btn-shine"></div>';
        document.getElementById('taskTitle').focus();
    }

    delete(id) {
        if(confirm("Delete this task?")) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.save();
        }
    }

    toggle(id) {
        const task = this.tasks.find(t => t.id === id);
        task.completed = !task.completed;
        this.save();
    }

    checkReminders() {
        // Fix for local date timezone issues
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const localDate = new Date(now.getTime() - (offset * 60 * 1000));
        const today = localDate.toISOString().split('T')[0];

        this.tasks.forEach(t => {
            if (t.date === today && !t.completed && !t.reminded) {
                const sound = document.getElementById('reminderSound');
                if(sound) sound.play().catch(e => console.log("Audio waiting for user click"));
                
                alert(`⏰ DEADLINE TODAY: ${t.title}`);
                t.reminded = true;
                this.save();
            }
        });
    }

    save() {
        localStorage.setItem('nanda_tasks_pro', JSON.stringify(this.tasks));
        this.render();
    }

    render(query = '') {
        const grid = document.getElementById('taskGrid');
        grid.innerHTML = '';

        const filtered = this.tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(query.toLowerCase()) || 
                                 t.desc.toLowerCase().includes(query.toLowerCase());
            if (this.currentFilter === 'high') return t.priority === 'high' && matchesSearch;
            if (this.currentFilter === 'completed') return t.completed && matchesSearch;
            return matchesSearch;
        });

        filtered.forEach(t => {
            const isOverdue = new Date(t.date) < new Date().setHours(0,0,0,0) && !t.completed;
            const card = document.createElement('div');
            card.className = `task-card ${t.completed ? 'completed' : ''}`;
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px">
                    <span style="font-size:0.7rem; font-weight:800; color:${t.priority === 'high' ? 'var(--danger)' : 'var(--primary)'}">
                        ● ${t.priority.toUpperCase()}
                    </span>
                    <div style="display:flex; gap:10px">
                        <button onclick="manager.edit(${t.id})" class="action-btn"><i class="fas fa-edit"></i></button>
                        <button onclick="manager.delete(${t.id})" class="action-btn delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                <h3 style="margin-bottom:5px">${t.title}</h3>
                <p class="task-desc">${t.desc || 'No description provided.'}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--glass-border); padding-top:15px">
                    <span style="font-size:0.8rem; color:${isOverdue ? 'var(--danger)' : 'var(--text-dim)'}">
                        <i class="far fa-calendar-alt"></i> ${t.date}
                    </span>
                    <button onclick="manager.toggle(${t.id})" class="btn-pro-add" style="height:32px; width:100px; font-size:0.7rem; background:${t.completed ? 'var(--success)' : 'var(--primary)'}">
                        ${t.completed ? 'REOPEN' : 'DONE'}
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
        this.updateStats();
    }

    updateStats() {
        const done = this.tasks.filter(t => t.completed).length;
        const total = this.tasks.length;
        const perc = total ? Math.round((done / total) * 100) : 0;
        document.getElementById('progressBar').style.width = perc + '%';
        document.getElementById('percText').innerText = perc + '%';
    }
}
const manager = new ProTaskManager();