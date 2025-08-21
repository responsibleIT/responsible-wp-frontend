const list = document.querySelector(".post-links");
const linkList = list.querySelectorAll("a[href^='#']");
linkList.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = link.href.split("#")[1];
    const targetElement = document.getElementById(targetId);
    targetElement.scrollIntoView({ behavior: "smooth" });
  });
});