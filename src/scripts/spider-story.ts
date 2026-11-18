let activeStory: HTMLElement | null = null;
let disposeStory: (() => void) | undefined;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function mountSpiderStory() {
  const story = document.querySelector<HTMLElement>('.spider-story');
  if (story === activeStory) return;
  disposeStory?.();
  activeStory = story;
  if (!story) return;

  const progressBar = document.querySelector<HTMLElement>('.reading-fill');
  const scenes = Array.from(story.querySelectorAll<HTMLElement>('.story-scene'), element => ({
    element,
    stage: element.querySelector<HTMLElement>('.story-stage')!,
    start: 0,
    distance: 0,
    previous: -1,
  }));
  const swing = story.querySelector<HTMLElement>('.swing')!;
  const bursts = [
    { element: swing.querySelector<HTMLElement>('.thwip')!, start: .12 },
    { element: swing.querySelector<HTMLElement>('.whoosh')!, start: .58 },
  ];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  let frame = 0;
  let pageTravel = 1;

  function draw() {
    frame = 0;
    const top = window.scrollY;
    progressBar?.style.setProperty('--reading', String(clamp(top / pageTravel)));
    if (preference.matches) return;

    for (const scene of scenes) {
      const progress = clamp((top - scene.start) / scene.distance);
      if (progress === scene.previous) continue;
      scene.previous = progress;
      scene.element.style.setProperty('--p', String(progress));

      if (scene.element === swing) {
        // The arc peaks at mid-swing, and the bursts overshoot before settling.
        swing.style.setProperty('--arc', `${Math.sin(progress * Math.PI) * 27}svh`);
        for (const { element, start } of bursts) {
          const elapsed = (progress - start) / .26;
          const entry = clamp(elapsed * 3.8);
          const overshoot = 1 + 2.45 * (entry - 1) ** 3 + 1.45 * (entry - 1) ** 2;
          element.style.setProperty('--burst-alpha', String(clamp(Math.min(elapsed * 10, (1 - elapsed) * 3.5))));
          element.style.setProperty('--burst-scale', String(overshoot));
        }
      }
    }
  }

  function queueDraw() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function measure() {
    const scrollTop = window.scrollY;
    pageTravel = Math.max(1, document.documentElement.scrollHeight - document.documentElement.clientHeight);
    for (const scene of scenes) {
      scene.start = scene.element.getBoundingClientRect().top + scrollTop;
      scene.distance = Math.max(1, scene.element.offsetHeight - scene.stage.offsetHeight);
    }
    if (frame) cancelAnimationFrame(frame);
    draw();
  }

  function applyMotionPreference() {
    story!.toggleAttribute('data-motion', !preference.matches);
    measure();
  }

  story.querySelector('[data-story-replay]')?.addEventListener('click', event => {
    if (event instanceof MouseEvent && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    event.preventDefault();
    const title = story.querySelector<HTMLElement>('h1');
    title?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: preference.matches ? 'instant' : 'smooth' });
  }, { signal: events.signal });

  window.addEventListener('scroll', queueDraw, { passive: true, signal: events.signal });
  window.addEventListener('resize', measure, { passive: true, signal: events.signal });
  preference.addEventListener('change', applyMotionPreference, { signal: events.signal });
  const sizes = new ResizeObserver(measure);
  sizes.observe(story);
  for (const scene of scenes) sizes.observe(scene.stage);

  applyMotionPreference();
  disposeStory = () => {
    events.abort();
    sizes.disconnect();
    cancelAnimationFrame(frame);
  };
}
