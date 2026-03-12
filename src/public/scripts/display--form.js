const list = $("[data-list]");
const items = $$("[name=weergave]");
const hasSupport = CSS.supports("selector(:has(*))");
let initialItem;

items.forEach((item) => {
  item.addEventListener("change", (e) => {
    const view = e.target.value;
    storeItem("view", view);
    list.dataset.list = view;
    list.setView?.(view);

    if (!hasSupport) {
      initialItem.parentElement.classList.toggle("selected");
      initialItem = e.target;
      initialItem.parentElement.classList.toggle("selected");
    }
  });
});

const initialView = () => {
  const currentView = retrieveItem("view");
  if (currentView === null) return;
  initialItem = Array.from(items).find((item) => item.value === currentView);

  if (!initialItem) {
    storeItem("view", items[0].value);
    initialItem = items[0];
  } else {
    list.dataset.list = currentView;
    list.setView?.(currentView);
  }

  if (!hasSupport) {
    initialItem.parentElement.classList.add("selected");
  } else {
    initialItem.checked = true;
  }
};

initialView();