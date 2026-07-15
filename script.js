/* ==========================================================================
   TIMGOLD CYBERSECURITY SOLUTIONS — Unified Script
   Sections: Navigation | Scroll Reveal | Skill Bars | Academic Planner |
             Contact Form Validation
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollReveal();
  initSkillBars();
  initPlanner();
  initContactForm();
});

/* --------------------------------------------------------------------------
   NAVIGATION — mobile toggle + active link highlighting
   -------------------------------------------------------------------------- */
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu when a link is tapped (mobile)
    links.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Highlight the current page in the nav
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
}

/* --------------------------------------------------------------------------
   SCROLL REVEAL — fade/slide elements into view
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   SKILL BARS — animate width once visible (About page)
   -------------------------------------------------------------------------- */
function initSkillBars() {
  const bars = document.querySelectorAll('.skill-fill');
  if (!bars.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const value = target.getAttribute('data-value') || '0';
          requestAnimationFrame(() => {
            target.style.width = `${value}%`;
          });
          observer.unobserve(target);
        }
      });
    },
    { threshold: 0.4 }
  );

  bars.forEach((bar) => observer.observe(bar));
}

/* --------------------------------------------------------------------------
   ACADEMIC PLANNER — add / complete / delete tasks
   Array-based state management, persisted to localStorage
   -------------------------------------------------------------------------- */
function initPlanner() {
  const form = document.getElementById('taskForm');
  if (!form) return; // Not on the planner page

  const titleInput = document.getElementById('taskTitle');
  const courseInput = document.getElementById('taskCourse');
  const dueInput = document.getElementById('taskDue');
  const priorityInput = document.getElementById('taskPriority');

  const pendingList = document.getElementById('pendingList');
  const completedList = document.getElementById('completedList');

  const statTotal = document.getElementById('statTotal');
  const statPending = document.getElementById('statPending');
  const statDone = document.getElementById('statDone');

  const STORAGE_KEY = 'timgold_academic_tasks';

  /** @type {{id:number,title:string,course:string,due:string,priority:string,completed:boolean}[]} */
  let tasks = loadTasks();

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn('Could not read saved tasks:', err);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.warn('Could not save tasks:', err);
    }
  }

  function formatDue(dateStr) {
    if (!dateStr) return 'No due date';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function render() {
    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    const pending = tasks.filter((t) => !t.completed);
    const done = tasks.filter((t) => t.completed);

    if (pending.length === 0) {
      pendingList.innerHTML = '<li class="empty-state">No pending tasks — add one above to get started.</li>';
    } else {
      pending.forEach((task) => pendingList.appendChild(buildTaskEl(task)));
    }

    if (done.length === 0) {
      completedList.innerHTML = '<li class="empty-state">Completed tasks will appear here.</li>';
    } else {
      done.forEach((task) => completedList.appendChild(buildTaskEl(task)));
    }

    statTotal.textContent = tasks.length;
    statPending.textContent = pending.length;
    statDone.textContent = done.length;
  }

  function buildTaskEl(task) {
    const li = document.createElement('li');
    li.className = `task-item${task.completed ? ' completed' : ''}`;
    li.dataset.id = String(task.id);

    const checkBtn = document.createElement('button');
    checkBtn.className = 'check-btn';
    checkBtn.type = 'button';
    checkBtn.setAttribute('aria-label', task.completed ? 'Mark as pending' : 'Mark as complete');
    checkBtn.textContent = task.completed ? '✓' : '';
    checkBtn.addEventListener('click', () => toggleComplete(task.id));

    const info = document.createElement('div');
    info.className = 'task-info';

    const title = document.createElement('div');
    title.className = 't-title';
    title.textContent = task.title;

    const meta = document.createElement('div');
    meta.className = 't-meta';

    const dueSpan = document.createElement('span');
    dueSpan.textContent = `📅 ${formatDue(task.due)}`;

    const courseSpan = document.createElement('span');
    courseSpan.textContent = task.course ? `📘 ${task.course}` : '';

    const priSpan = document.createElement('span');
    priSpan.className = `priority-badge priority-${task.priority}`;
    priSpan.textContent = task.priority;

    meta.appendChild(dueSpan);
    if (task.course) meta.appendChild(courseSpan);
    meta.appendChild(priSpan);

    info.appendChild(title);
    info.appendChild(meta);

    const delBtn = document.createElement('button');
    delBtn.className = 'del-btn';
    delBtn.type = 'button';
    delBtn.setAttribute('aria-label', 'Delete task');
    delBtn.innerHTML = '&times;';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(checkBtn);
    li.appendChild(info);
    li.appendChild(delBtn);

    return li;
  }

  function addTask(title, course, due, priority) {
    tasks.push({
      id: Date.now(),
      title,
      course,
      due,
      priority,
      completed: false,
    });
    saveTasks();
    render();
  }

  function toggleComplete(id) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      return;
    }
    addTask(title, courseInput.value.trim(), dueInput.value, priorityInput.value || 'medium');
    form.reset();
    titleInput.focus();
  });

  render();
}

/* --------------------------------------------------------------------------
   CONTACT FORM — client-side validation, no page reload
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return; // Not on the contact page

  const fields = {
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    message: document.getElementById('message'),
  };

  const statusBox = document.getElementById('formStatus');

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_PATTERN = /^\d{7,15}$/;

  function setError(field, message) {
    const errorEl = document.getElementById(`${field.id}Error`);
    if (message) {
      field.classList.add('invalid');
      field.classList.remove('valid');
      if (errorEl) errorEl.textContent = message;
      return false;
    }
    field.classList.remove('invalid');
    field.classList.add('valid');
    if (errorEl) errorEl.textContent = '';
    return true;
  }

  function validateName() {
    const value = fields.name.value.trim();
    if (!value) return setError(fields.name, 'Please enter your full name.');
    if (value.length < 2) return setError(fields.name, 'Name looks too short.');
    return setError(fields.name, '');
  }

  function validateEmail() {
    const value = fields.email.value.trim();
    if (!value) return setError(fields.email, 'Please enter your email address.');
    if (!EMAIL_PATTERN.test(value)) return setError(fields.email, 'Enter a valid email, e.g. name@example.com');
    return setError(fields.email, '');
  }

  function validatePhone() {
    const value = fields.phone.value.trim();
    if (!value) return setError(fields.phone, 'Please enter your phone number.');
    if (!PHONE_PATTERN.test(value)) return setError(fields.phone, 'Phone number must contain digits only (7–15 digits).');
    return setError(fields.phone, '');
  }

  function validateMessage() {
    const value = fields.message.value.trim();
    if (!value) return setError(fields.message, 'Please enter a message.');
    if (value.length < 10) return setError(fields.message, 'Message should be at least 10 characters.');
    return setError(fields.message, '');
  }

  // Live validation on blur
  fields.name.addEventListener('blur', validateName);
  fields.email.addEventListener('blur', validateEmail);
  fields.phone.addEventListener('blur', validatePhone);
  fields.message.addEventListener('blur', validateMessage);

  // Restrict phone field to digits as the user types
  fields.phone.addEventListener('input', () => {
    fields.phone.value = fields.phone.value.replace(/[^\d]/g, '');
  });

  function showStatus(type, message) {
    statusBox.textContent = message;
    statusBox.className = `show ${type}`;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const validName = validateName();
    const validEmail = validateEmail();
    const validPhone = validatePhone();
    const validMessage = validateMessage();

    if (validName && validEmail && validPhone && validMessage) {
      showStatus('success', `✔ Thank you, ${fields.name.value.trim().split(' ')[0]}! Your message has been received. I'll respond to ${fields.email.value.trim()} shortly.`);
      form.reset();
      Object.values(fields).forEach((f) => f.classList.remove('valid', 'invalid'));
    } else {
      showStatus('error', '✖ Please fix the highlighted fields before submitting.');
    }
  });
}
