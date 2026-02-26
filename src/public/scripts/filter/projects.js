const container = document.querySelector('[data-list]');
const initialView = container.innerHTML;
const template = document.querySelector('[data-project-template]');

let allProjects = [];

const getParams = () => new URLSearchParams(window.location.search);

const setParam = (key, value) => {
  const params = getParams();
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
  window.history.pushState({}, '', `?${params.toString()}`);
  filterItems();
};

const filterItems = () => {
  const params = getParams();

  if (!params.size) {
    container.innerHTML = initialView;
    return;
  }

  const filtered = allProjects.filter(item => {
    for (const [key, value] of params.entries()) {
      const field = item.acf[key];
      if (!Array.isArray(field) || !field.includes(value)) return false;
    }
    return true;
  });

  container.innerHTML = '';
  filtered.forEach(item => {
    const clone = template.content.cloneNode(true);
    const link = clone.querySelector('a');
    link.href = item.permalink;
    link.textContent = item.title.rendered;
    container.appendChild(clone);
  });
};

fetch('/api/projects.json')
  .then(res => res.json())
  .then(data => {
    allProjects = data;
    document.querySelectorAll('[data-filter]').forEach(input => {
      input.addEventListener('change', e => {
        setParam(e.target.dataset.filter, e.target.checked ? e.target.value : '');
      });
    });
    filterItems();
  });