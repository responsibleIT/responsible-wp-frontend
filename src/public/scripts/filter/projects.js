const container = document.querySelector("[data-list]");
const initialView = container.innerHTML;
const template = document.querySelector("[data-project-template]");
const clearButton = document.querySelector("[data-clear]");

let allProjects = [];
let projectColorMap = new Map();

const getParams = () => new URLSearchParams(window.location.search);

const setParam = (key, value, checked) => {
  const params = getParams();

  if (key === null || key === "clear") {
    params.forEach((_, k) => params.delete(k));
    resetFilters()
  } else if (value === "all") {
    params.delete(key);
  } else if (typeof checked === "boolean") {
    if (checked) {
      params.append(key, value);
    } else {
      const existing = params.getAll(key).filter((v) => v !== value);
      params.delete(key);
      existing.forEach((v) => params.append(key, v));
    }
  } else {
    if (!value && value !== 0) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  const newUrl = params.toString()
    ? `?${params.toString()}`
    : window.location.pathname;
  window.history.pushState({}, "", newUrl);
  filterItems();
};

const extractInitialColorData = () => {
  const initialItems = container.querySelectorAll(".project--item");
  initialItems.forEach((item) => {
    const link = item.querySelector("a");
    if (link && link.href) {
      const slug = link.href.split("/").pop();
      const colorData = {
        primary: item.getAttribute("data-primary"),
        secondary: item.getAttribute("data-secondary"),
        pattern: item.className.match(/pattern-(\d+)/)?.[1],
      };
      projectColorMap.set(slug, colorData);
    }
  });
};

const filterItems = () => {
  const params = getParams();

  if (!params.size) {
    container.innerHTML = initialView;
    return;
  }

  const exclusiveFields = new Set();
  document
    .querySelectorAll("[data-filter][data-exclusive]")
    .forEach((input) => {
      exclusiveFields.add(input.dataset.filter);
    });

  const filtered = allProjects.filter((item) => {
    const exclusiveMatches = [];
    const inclusiveFieldResults = {};

    for (const key of new Set(params.keys())) {
      const values = params.getAll(key);
      const field = item.acf[key];

      if (!values.length || (values.length === 1 && !values[0])) {
        continue;
      }

      let fieldArray = [];
      if (Array.isArray(field)) {
        fieldArray = field;
      } else if (field && field !== false && field !== null && field !== "") {
        fieldArray = [String(field)];
      }

      const matchesThisFilter =
        fieldArray.length > 0 &&
        values.some((filterValue) => fieldArray.includes(filterValue));

      if (exclusiveFields.has(key)) {
        exclusiveMatches.push(matchesThisFilter);
      } else {
        inclusiveFieldResults[key] = matchesThisFilter;
      }
    }

    // Apply filtering logic:
    // - ALL exclusive filters must match (AND logic)
    // - ALL inclusive filters must match (AND logic between fields, OR within field)
    const exclusiveResult =
      exclusiveMatches.length === 0 || exclusiveMatches.every((match) => match);

    // For inclusive fields: each field must match (AND), but within a field it's OR
    const inclusiveFieldNames = Object.keys(inclusiveFieldResults);
    const inclusiveResult =
      inclusiveFieldNames.length === 0 ||
      inclusiveFieldNames.every(
        (fieldName) => inclusiveFieldResults[fieldName],
      );

    const finalResult = exclusiveResult && inclusiveResult;

    return finalResult;
  });

  container.innerHTML = "";
  filtered.forEach((item) => {
    const clone = template.content.cloneNode(true);
    const projectItem = clone.querySelector(".project--item") || clone.querySelector("li") || clone.firstElementChild;
    const link = clone.querySelector("a");

    const colorData = projectColorMap.get(item.slug);

    if (projectItem && colorData && colorData.pattern) {
      projectItem.className = `project--item pattern-${colorData.pattern}`;
      projectItem.setAttribute("data-primary", colorData.primary);
      projectItem.setAttribute("data-secondary", colorData.secondary);
    } else if (projectItem) {
      if (!projectItem.className.includes("project--item")) {
        projectItem.className = (projectItem.className + " project--item").trim();
      }
    }

    if (link) {
      link.href = `./${item.slug}`;
      link.textContent = item.title.rendered;
    }

    container.appendChild(clone);
  });
};

fetch("/api/projects.json")
  .then((res) => res.json())
  .then((data) => {
    allProjects = data;

    extractInitialColorData();

    const params = getParams();
    document.querySelectorAll("[data-filter]").forEach((input) => {
      if (input.type === "checkbox") {
        const values = params.getAll(input.dataset.filter);
        input.checked = values.includes(input.value);
      } else if (input.type === "radio") {
        const value = params.get(input.dataset.filter);
        if (!value && input.value === "all") {
          input.checked = true;
        } else {
          input.checked = input.value === value;
        }
      } else {
        input.value = params.get(input.dataset.filter) || "";
      }
    });

    document.querySelectorAll("[data-filter]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const { target } = e;
        const { filter } = target.dataset;
        const value = target.value;

        if (target.type === "checkbox") {
          setParam(filter, value, target.checked);
        } else {
          setParam(filter, value);
        }
      });
    });

    filterItems();
  });

clearButton.addEventListener("click", (e) => {
  e.preventDefault();
  setParam("clear");
  
});

const resetFilters = () => {
  document.querySelectorAll('[data-filter][type="radio"]').forEach(radio => {
    if (radio.value === "" || radio.value === "all") {
      radio.checked = true;
    } else {
      radio.checked = false;
    }
  });

  document.querySelectorAll('[data-filter][type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
};