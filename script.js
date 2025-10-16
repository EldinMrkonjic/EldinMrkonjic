// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Contact integration config
// method: 'formspree' | 'emailjs' | 'mailto'
const CONTACT = {
  method: 'formspree',
  formspreeFormId: 'xgvnrdqq',
  emailjs: {
    publicKey: 'REPLACE_WITH_PUBLIC_KEY',
    serviceId: 'REPLACE_WITH_SERVICE_ID',
    templateId: 'REPLACE_WITH_TEMPLATE_ID',
  }
};

// Theme toggle
const themeBtn = document.getElementById('theme-toggle');
function setTheme(mode) {
  const m = mode === 'dark' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', m);
  localStorage.setItem('theme', m);
  if (themeBtn) themeBtn.textContent = m === 'dark' ? '🌙' : '☀️';
}
// Init theme (after elements exist)
(() => {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved || (prefersDark ? 'dark' : 'light'));
})();
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });
}

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navList = document.getElementById('nav-list');
if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  navList.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => {
    navList.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));
}

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    if (targetId.length > 1) {
      const el = document.querySelector(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', targetId);
      }
    }
  });
});

// Reveal on scroll
const revealTargets = [
  '.section .container',
  '.card',
  '.project',
  '.timeline-item'
];
revealTargets.forEach(sel => {
  document.querySelectorAll(sel).forEach(el => el.classList.add('reveal'));
});
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// GitHub Projects loader (safe no-op if grid removed)
async function loadGithubProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  const user = grid.getAttribute('data-github-user') || 'EldinMrkonjic';
  grid.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const ph = document.createElement('div');
    ph.className = 'project card';
    ph.innerHTML = '<div class="project-media shimmer"></div><div class="project-body"><h3>Lade…</h3><p>Repos werden geladen</p></div>';
    grid.appendChild(ph);
  }
  try {
    const res = await fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=6`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let repos = await res.json();
    repos = repos.filter(r => !r.fork).slice(0, 6);
    if (!repos.length) throw new Error('Keine Repos gefunden');
    grid.innerHTML = '';
    for (const r of repos) {
      const lang = r.language || 'Code';
      const demo = r.homepage && r.homepage.trim().length > 0 ? r.homepage : null;
      const card = document.createElement('article');
      card.className = 'project card';
      card.innerHTML = `
        <div class="project-media shimmer" aria-hidden="true"></div>
        <div class="project-body">
          <h3>${r.name}</h3>
          <p>${r.description ? escapeHtml(r.description) : 'Repository ohne Beschreibung.'}</p>
          <div class="tags"><span>${lang}</span><span>⭐ ${r.stargazers_count}</span><span>⬇ ${r.forks_count}</span></div>
          <div class="project-actions">
            ${demo ? `<a class=\"btn btn-ghost\" href=\"${demo}\" target=\"_blank\" rel=\"noopener\">Live Demo</a>` : ''}
            <a class="btn btn-primary" href="${r.html_url}" target="_blank" rel="noopener">Code</a>
          </div>
        </div>`;
      grid.appendChild(card);
    }
  } catch (e) {
    grid.innerHTML = `<div class="card"><p>Konnte Repositories nicht laden. <a href="https://github.com/${user}" target="_blank" rel="noopener">Zum GitHub‑Profil</a></p></div>`;
  }
}
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
loadGithubProjects();

// Back-to-top button show/hide
const backToTop = document.querySelector('.back-to-top');
const toggleBackToTop = () => {
  if (window.scrollY > 400) backToTop.classList.add('show');
  else backToTop.classList.remove('show');
};
toggleBackToTop();
window.addEventListener('scroll', toggleBackToTop, { passive: true });

// Contact form
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');
form.addEventListener('submit', async (e) => {
  const method = CONTACT.method;
  const emailTo = form.dataset.email || 'eldinmrkonjic@pm.me';
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();

  if (!name || !email || !message) {
    statusEl.textContent = 'Bitte alle Felder ausfüllen.';
    e.preventDefault();
    return;
  }

  if (method === 'formspree') {
    const subj = document.getElementById('fs-subject');
    if (subj) subj.value = `Kontakt via Portfolio: ${name}`;
    const reply = document.getElementById('fs-replyto');
    if (reply) reply.value = email;
    statusEl.textContent = 'Sende über Formspree…';
    return; // native submit
  }

  if (method === 'emailjs') {
    e.preventDefault();
    statusEl.textContent = 'Sende über EmailJS…';
    const { publicKey, serviceId, templateId } = CONTACT.emailjs;
    if (!publicKey || publicKey.startsWith('REPLACE_')) {
      statusEl.textContent = 'EmailJS Schlüssel fehlen. Bitte in script.js setzen.';
      return;
    }
    if (!window.emailjs) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
        s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
      }).catch(() => null);
    }
    if (!window.emailjs) {
      statusEl.textContent = 'Konnte EmailJS SDK nicht laden.';
      return;
    }
    window.emailjs.init({ publicKey });
    try {
      await window.emailjs.send(serviceId, templateId, {
        to_email: emailTo,
        from_name: name,
        reply_to: email,
        message
      });
      statusEl.textContent = 'Danke! Nachricht erfolgreich gesendet.';
      form.reset();
    } catch (err) {
      statusEl.textContent = 'Senden fehlgeschlagen. Bitte E-Mail direkt nutzen.';
    }
    return;
  }

  // Fallback: mailto
  e.preventDefault();
  const subject = `Kontakt via Portfolio: ${name}`;
  const body = `Name: ${name}%0D%0AE-Mail: ${email}%0D%0A%0D%0ANachricht:%0D%0A${encodeURIComponent(message)}`;
  const mailto = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${body}`;
  statusEl.textContent = 'Öffne dein E-Mail Programm…';
  try {
    window.location.href = mailto;
    setTimeout(() => statusEl.textContent = 'Danke! Wenn dein Mailprogramm geöffnet wurde, kannst du die Nachricht senden.', 1200);
    form.reset();
  } catch (err) {
    statusEl.textContent = 'Konnte E-Mail Programm nicht öffnen. Schreibe mir direkt an: ' + emailTo;
  }
});

