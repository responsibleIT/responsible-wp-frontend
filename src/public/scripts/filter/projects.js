const container = document.querySelector("[data-list]");
const initialView = container.innerHTML;
const template = document.querySelector("[data-project-template]");

let allProjects = [];

const getParams = () => new URLSearchParams(window.location.search);

const setParam = (key, value, checked) => {
  const params = getParams();

  if (checked) {
    params.append(key, value);
  } else {
    // remove only this specific value, keep others
    const existing = params.getAll(key).filter((v) => v !== value);
    params.delete(key);
    existing.forEach((v) => params.append(key, v));
  }

  window.history.pushState({}, "", `?${params.toString()}`);
  filterItems();
};

const filterItems = () => {
  const params = getParams();

  if (!params.size) {
    container.innerHTML = initialView;
    return;
  }

  const filtered = allProjects.filter((item) => {
    for (const key of new Set(params.keys())) {
      const values = params.getAll(key);
      const field = item.acf[key];
      if (!Array.isArray(field)) return false;
      if (!values.every((v) => field.includes(v))) return false;
    }
    return true;
  });

  container.innerHTML = "";
  filtered.forEach((item) => {
    const clone = template.content.cloneNode(true);
    const link = clone.querySelector("a");
    link.href = item.permalink;
    link.textContent = item.title.rendered;
    container.appendChild(clone);
  });
};

fetch("/api/projects.json")
  .then((res) => res.json())
  .then((data) => {
    allProjects = data;
    document.querySelectorAll("[data-filter]").forEach((input) => {
      input.addEventListener("change", (e) => {
        setParam(e.target.dataset.filter, e.target.value, e.target.checked);
      });
    });
    filterItems();
  });

// sync checkboxes to current params
const params = getParams();
document.querySelectorAll("[data-filter]").forEach((input) => {
  if (input.type === "checkbox") {
    const values = params.getAll(input.dataset.filter);
    input.checked = values.includes(input.value);
  } else {
    input.value = params.get(input.dataset.filter) || "";
  }
});
