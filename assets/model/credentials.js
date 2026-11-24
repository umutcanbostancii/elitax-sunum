const track = document.querySelector(".credentials-track");
if (track && "IntersectionObserver" in window) {
  const chapters = [...track.querySelectorAll("article")];
  const photos = [...track.querySelectorAll(".credentials-stage img")];
  const desktop = matchMedia("(min-width:48rem) and (min-height:32rem)");
  let frame = 0;
  let visible = false;
  function update() {
    frame = 0;
    const middle = innerHeight / 2;
    const distances = chapters.map(chapter => {
      const rect = chapter.getBoundingClientRect();
      return Math.abs(rect.top + rect.height / 2 - middle);
    });
    const active = distances.indexOf(Math.min(...distances));
    photos.forEach((photo, index) => photo.classList.toggle("is-active", index === active));
  }
  function schedule() {
    if (visible && desktop.matches && !frame) frame = requestAnimationFrame(update);
  }
  track.classList.add("is-enhanced");
  photos[0].classList.add("is-active");
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }).observe(track);
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
}
