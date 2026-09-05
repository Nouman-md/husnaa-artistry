/* =========================================================
   HUSNA ARTISTRY
   PREMIUM MOTION.JS
   Works with the existing HTML + script.js
   ========================================================= */

(() => {
  "use strict";

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;


  /* =========================================================
     PAGE LOAD
     ========================================================= */

  document.addEventListener("DOMContentLoaded", () => {
    initPageLoader();
    initScrollProgress();
    initHeaderMotion();
    initCursor();
    initHeroMotion();
    initScrollReveal();
    initProductMotion();
    initSidebarMotion();
    initDrawerMotion();
    initModalMotion();
    initFAQMotion();
    initMagneticButtons();
    initSmoothLinks();
    initParallax();
    initMarquee();
  });


  /* =========================================================
     PAGE LOADER
     ========================================================= */

  function initPageLoader() {

    const loader =
      $("#loadingScreen") ||
      $(".loading-screen");

    if (!loader) return;

    if (reduceMotion) {
      loader.classList.add("hidden");
      return;
    }

    window.addEventListener("load", () => {

      setTimeout(() => {
        loader.classList.add("hidden");
      }, 700);

    });

    setTimeout(() => {
      loader.classList.add("hidden");
    }, 3500);
  }


  /* =========================================================
     SCROLL PROGRESS
     ========================================================= */

  function initScrollProgress() {

    let progress =
      $(".scroll-progress span") ||
      $("#scrollProgress");

    if (!progress) return;

    const updateProgress = () => {

      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop;

      const documentHeight =
        document.documentElement.scrollHeight -
        window.innerHeight;

      const value =
        documentHeight > 0
          ? scrollTop / documentHeight
          : 0;

      if (progress.style) {
        progress.style.transform =
          `scaleX(${Math.max(0, Math.min(1, value))})`;
      }
    };

    updateProgress();

    window.addEventListener(
      "scroll",
      updateProgress,
      { passive: true }
    );
  }


  /* =========================================================
     HEADER
     ========================================================= */

  function initHeaderMotion() {

    const header =
      $(".site-header") ||
      $("header");

    if (!header) return;

    const updateHeader = () => {

      if (window.scrollY > 45) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }

    };

    updateHeader();

    window.addEventListener(
      "scroll",
      updateHeader,
      { passive: true }
    );
  }


  /* =========================================================
     CURSOR
     ========================================================= */

  function initCursor() {

    if (reduceMotion) return;

    if (window.innerWidth <= 850) return;

    let glow =
      $(".cursor-glow");

    let dot =
      $(".cursor-dot");

    if (!glow) {

      glow =
        document.createElement("div");

      glow.className =
        "cursor-glow";

      document.body.appendChild(glow);
    }

    if (!dot) {

      dot =
        document.createElement("div");

      dot.className =
        "cursor-dot";

      document.body.appendChild(dot);
    }

    let mouseX =
      window.innerWidth / 2;

    let mouseY =
      window.innerHeight / 2;

    let glowX = mouseX;
    let glowY = mouseY;

    let dotX = mouseX;
    let dotY = mouseY;


    document.addEventListener(
      "mousemove",
      (event) => {

        mouseX = event.clientX;
        mouseY = event.clientY;

        glow.style.opacity = "1";
        dot.style.opacity = "1";

      },
      { passive: true }
    );


    document.addEventListener(
      "mouseleave",
      () => {

        glow.style.opacity = "0";
        dot.style.opacity = "0";

      }
    );


    const animateCursor = () => {

      glowX +=
        (mouseX - glowX) * 0.08;

      glowY +=
        (mouseY - glowY) * 0.08;

      dotX +=
        (mouseX - dotX) * 0.25;

      dotY +=
        (mouseY - dotY) * 0.25;


      glow.style.left =
        `${glowX}px`;

      glow.style.top =
        `${glowY}px`;

      dot.style.left =
        `${dotX}px`;

      dot.style.top =
        `${dotY}px`;


      requestAnimationFrame(
        animateCursor
      );
    };

    animateCursor();


    const interactive =
      $$("a, button, input, textarea, select");


    interactive.forEach((element) => {

      element.addEventListener(
        "mouseenter",
        () => {

          dot.style.transform =
            "translate(-50%, -50%) scale(2)";

        }
      );


      element.addEventListener(
        "mouseleave",
        () => {

          dot.style.transform =
            "translate(-50%, -50%) scale(1)";

        }
      );

    });

  }


  /* =========================================================
     HERO
     ========================================================= */

  function initHeroMotion() {

    const hero =
      $(".hero-section") ||
      $("#hero");

    if (!hero) return;

    if (reduceMotion) return;


    const content =
      $(".hero-content", hero);

    const visual =
      $(".hero-visual", hero);


    if (content) {

      content.animate(
        [
          {
            opacity: 0,
            transform:
              "translateY(45px)"
          },
          {
            opacity: 1,
            transform:
              "translateY(0)"
          }
        ],
        {
          duration: 1100,
          delay: 250,
          easing:
            "cubic-bezier(.2,.8,.2,1)",
          fill: "both"
        }
      );
    }


    if (visual) {

      visual.animate(
        [
          {
            opacity: 0,
            transform:
              "translate3d(70px,30px,0) scale(.92)"
          },
          {
            opacity: 1,
            transform:
              "translate3d(0,0,0) scale(1)"
          }
        ],
        {
          duration: 1400,
          delay: 450,
          easing:
            "cubic-bezier(.2,.8,.2,1)",
          fill: "both"
        }
      );
    }


    /* Floating hero particles */

    $$(".hero-particle", hero)
      .forEach((particle, index) => {

        particle.animate(
          [
            {
              transform:
                "translate3d(0,0,0)"
            },
            {
              transform:
                `translate3d(${10 + index * 4}px,-${20 + index * 5}px,0)`
            },
            {
              transform:
                "translate3d(0,0,0)"
            }
          ],
          {
            duration:
              4000 + index * 700,
            delay:
              index * -500,
            iterations:
              Infinity,
            easing:
              "ease-in-out"
          }
        );

      });

  }


  /* =========================================================
     SCROLL REVEAL
     ========================================================= */

  function initScrollReveal() {

    const elements =
      $$(".reveal-item");

    if (!elements.length) return;


    if (reduceMotion) {

      elements.forEach((element) => {
        element.classList.add("visible");
      });

      return;
    }


    const observer =
      new IntersectionObserver(
        (entries) => {

          entries.forEach((entry) => {

            if (!entry.isIntersecting) return;

            entry.target.classList.add(
              "visible"
            );

            entry.target.classList.add(
              "is-visible"
            );

            observer.unobserve(
              entry.target
            );

          });

        },
        {
          threshold: 0.12,
          rootMargin:
            "0px 0px -50px 0px"
        }
      );


    elements.forEach((element) => {

      observer.observe(element);

    });

  }


  /* =========================================================
     PRODUCT COLLECTION MOTION
     ========================================================= */

  function initProductMotion() {

    const grid =
      $("#productsGrid");

    if (!grid) return;

    if (reduceMotion) return;


    const animateProducts = () => {

      const cards =
        $$(".product-card", grid);

      cards.forEach(
        (card, index) => {

          if (
            card.dataset.motionInitialized
          ) {
            return;
          }

          card.dataset.motionInitialized =
            "true";


          /* Entry */

          card.animate(
            [
              {
                opacity: 0,
                transform:
                  "translateY(35px) scale(.97)"
              },
              {
                opacity: 1,
                transform:
                  "translateY(0) scale(1)"
              }
            ],
            {
              duration: 650,
              delay:
                Math.min(index * 70, 500),
              easing:
                "cubic-bezier(.2,.8,.2,1)",
              fill: "both"
            }
          );


          /* 3D tilt */

          if (window.innerWidth > 850) {

            card.addEventListener(
              "mousemove",
              (event) => {

                const rect =
                  card.getBoundingClientRect();

                const x =
                  event.clientX -
                  rect.left;

                const y =
                  event.clientY -
                  rect.top;

                const rotateX =
                  ((y / rect.height) - 0.5) *
                  -4;

                const rotateY =
                  ((x / rect.width) - 0.5) *
                  4;


                card.style.transform =
                  `perspective(900px)
                   rotateX(${rotateX}deg)
                   rotateY(${rotateY}deg)
                   translateY(-5px)`;


                card.style.setProperty(
                  "--mx",
                  `${x}px`
                );

                card.style.setProperty(
                  "--my",
                  `${y}px`
                );

              }
            );


            card.addEventListener(
              "mouseleave",
              () => {

                card.style.transform = "";

              }
            );

          }

        }
      );

    };


    animateProducts();


    /*
      script.js dynamically creates the products.
      MutationObserver catches newly rendered cards.
    */

    const observer =
      new MutationObserver(() => {

        animateProducts();

      });


    observer.observe(
      grid,
      {
        childList: true,
        subtree: true
      }
    );

  }


  /* =========================================================
     MOBILE SIDEBAR
     ========================================================= */

  function initSidebarMotion() {

    const sidebar =
      $("#sidebar");

    const overlay =
      $("#sidebarOverlay");

    const hamburger =
      $("#hamburgerBtn");

    if (!sidebar) return;


    /*
      Existing script.js controls the actual
      sidebar functionality.
      We only add motion classes.
    */


    const watchSidebar =
      new MutationObserver(() => {

        const isOpen =
          sidebar.classList.contains("active") ||
          sidebar.classList.contains("open") ||
          sidebar.getAttribute("aria-hidden") === "false";


        if (isOpen) {

          sidebar.classList.add(
            "motion-open"
          );

          overlay?.classList.add(
            "motion-open"
          );

        } else {

          sidebar.classList.remove(
            "motion-open"
          );

          overlay?.classList.remove(
            "motion-open"
          );

        }

      });


    watchSidebar.observe(
      sidebar,
      {
        attributes: true,
        attributeFilter: [
          "class",
          "aria-hidden"
        ]
      }
    );


    hamburger?.addEventListener(
      "click",
      () => {

        setTimeout(() => {

          sidebar.classList.add(
            "motion-open"
          );

        }, 20);

      }
    );

  }


  /* =========================================================
     CART / WISHLIST DRAWERS
     ========================================================= */

  function initDrawerMotion() {

    const drawers = [
      $("#cartDrawer"),
      $("#wishlistDrawer")
    ].filter(Boolean);


    if (!drawers.length) return;


    drawers.forEach((drawer) => {

      const observer =
        new MutationObserver(() => {

          const isOpen =
            drawer.classList.contains("active") ||
            drawer.classList.contains("open") ||
            drawer.getAttribute("aria-hidden") === "false";


          if (isOpen) {

            drawer.classList.add(
              "motion-open"
            );

          } else {

            drawer.classList.remove(
              "motion-open"
            );

          }

        });


      observer.observe(
        drawer,
        {
          attributes: true,
          attributeFilter: [
            "class",
            "aria-hidden"
          ]
        }
      );


      /* Animate newly added items */

      const itemObserver =
        new MutationObserver(() => {

          const items =
            $$(".cart-item, .wishlist-item", drawer);

          items.forEach(
            (item, index) => {

              if (
                item.dataset.motionReady
              ) {
                return;
              }

              item.dataset.motionReady =
                "true";


              item.animate(
                [
                  {
                    opacity: 0,
                    transform:
                      "translateX(25px)"
                  },
                  {
                    opacity: 1,
                    transform:
                      "translateX(0)"
                  }
                ],
                {
                  duration: 400,
                  delay:
                    index * 60,
                  easing:
                    "cubic-bezier(.2,.8,.2,1)"
                }
              );

            }
          );

        });


      itemObserver.observe(
        drawer,
        {
          childList: true,
          subtree: true
        }
      );

    });

  }


  /* =========================================================
     MODALS
     ========================================================= */

  function initModalMotion() {

    const modals =
      $$(".modal-overlay");

    if (!modals.length) return;


    modals.forEach((overlay) => {

      const observer =
        new MutationObserver(() => {

          const active =
            overlay.classList.contains("active");


          const modal =
            $(".modal", overlay);


          if (!modal) return;


          if (active) {

            modal.animate(
              [
                {
                  opacity: 0,
                  transform:
                    "translateY(35px) scale(.96)"
                },
                {
                  opacity: 1,
                  transform:
                    "translateY(0) scale(1)"
                }
              ],
              {
                duration: 450,
                easing:
                  "cubic-bezier(.2,.8,.2,1)",
                fill: "both"
              }
            );

          }

        });


      observer.observe(
        overlay,
        {
          attributes: true,
          attributeFilter: [
            "class"
          ]
        }
      );

    });

  }


  /* =========================================================
     FAQ
     ========================================================= */

  function initFAQMotion() {

    const questions =
      $$(".faq-question");

    questions.forEach((question) => {

      question.addEventListener(
        "click",
        () => {

          const item =
            question.closest(".faq-item");

          if (!item) return;


          const answer =
            $(".faq-answer", item);

          if (!answer) return;


          const isOpen =
            item.classList.contains("open");


          if (!isOpen) {

            answer.animate(
              [
                {
                  opacity: 0,
                  transform:
                    "translateY(-8px)"
                },
                {
                  opacity: 1,
                  transform:
                    "translateY(0)"
                }
              ],
              {
                duration: 350,
                easing:
                  "ease-out"
              }
            );

          }

        }
      );

    });

  }


  /* =========================================================
     MAGNETIC BUTTONS
     ========================================================= */

  function initMagneticButtons() {

    if (reduceMotion) return;

    if (window.innerWidth <= 850) return;


    const elements =
      $$(".magnetic, .btn");


    elements.forEach((element) => {

      element.addEventListener(
        "mousemove",
        (event) => {

          const rect =
            element.getBoundingClientRect();

          const x =
            event.clientX -
            rect.left -
            rect.width / 2;

          const y =
            event.clientY -
            rect.top -
            rect.height / 2;


          element.style.transform =
            `translate(
              ${x * 0.08}px,
              ${y * 0.08}px
            )`;

        }
      );


      element.addEventListener(
        "mouseleave",
        () => {

          element.style.transform = "";

        }
      );

    });

  }


  /* =========================================================
     SMOOTH ANCHOR LINKS
     ========================================================= */

  function initSmoothLinks() {

    $$("a[href^='#']").forEach(
      (link) => {

        link.addEventListener(
          "click",
          (event) => {

            const href =
              link.getAttribute("href");

            if (
              !href ||
              href === "#"
            ) {
              return;
            }


            const target =
              $(href);

            if (!target) return;


            event.preventDefault();


            const header =
              $(".site-header") ||
              $("header");


            const offset =
              header
                ? header.offsetHeight + 15
                : 20;


            const top =
              target.getBoundingClientRect()
                .top +
              window.scrollY -
              offset;


            window.scrollTo({
              top,
              behavior:
                reduceMotion
                  ? "auto"
                  : "smooth"
            });

          }
        );

      }
    );

  }


  /* =========================================================
     PARALLAX
     ========================================================= */

  function initParallax() {

    if (reduceMotion) return;


    const heroVisual =
      $(".hero-visual");

    if (!heroVisual) return;


    let ticking = false;


    window.addEventListener(
      "scroll",
      () => {

        if (ticking) return;

        ticking = true;


        requestAnimationFrame(() => {

          const scroll =
            window.scrollY;

          const movement =
            Math.min(scroll * 0.08, 50);


          heroVisual.style.setProperty(
            "--parallax-y",
            `${movement}px`
          );


          heroVisual.style.transform =
            `translate3d(
              0,
              ${movement}px,
              0
            )`;


          ticking = false;

        });

      },
      { passive: true }
    );

  }


  /* =========================================================
     MARQUEE
     ========================================================= */

  function initMarquee() {

    const track =
      $(".marquee-track");

    if (!track) return;

    if (reduceMotion) return;


    track.style.willChange =
      "transform";

  }


  /* =========================================================
     DYNAMIC CONTENT REVEAL
     ========================================================= */

  const dynamicObserver =
    new MutationObserver(() => {

      $$(".reveal-item:not(.motion-observed)")
        .forEach((element) => {

          element.classList.add(
            "motion-observed"
          );

          if (
            element.getBoundingClientRect()
              .top <
            window.innerHeight
          ) {

            element.classList.add(
              "visible"
            );

          }

        });

    });


  dynamicObserver.observe(
    document.body,
    {
      childList: true,
      subtree: true
    }
  );


  /* =========================================================
     BUTTON PRESS EFFECT
     ========================================================= */

  document.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "button, .btn"
        );

      if (!button) return;

      if (reduceMotion) return;


      button.animate(
        [
          {
            transform: "scale(1)"
          },
          {
            transform: "scale(.96)"
          },
          {
            transform: "scale(1)"
          }
        ],
        {
          duration: 180,
          easing: "ease-out"
        }
      );

    }
  );


  /* =========================================================
     ESCAPE KEY
     ========================================================= */

  document.addEventListener(
    "keydown",
    (event) => {

      if (event.key !== "Escape") {
        return;
      }


      $$(".motion-open").forEach(
        (element) => {

          element.classList.remove(
            "motion-open"
          );

        }
      );

    }
  );


})();

/* =========================================================
   HUSNA ARTISTRY — FAQ ACCORDION
   ========================================================= */

(function initFAQ() {

  function setupFAQ() {

    const faqItems = document.querySelectorAll('.faq-item');

    if (!faqItems.length) {
      console.warn('Husna Artistry: FAQ items not found.');
      return;
    }

    faqItems.forEach((item) => {

      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      const plus = item.querySelector('.plus');

      if (!question || !answer) return;

      /* Prevent duplicate listeners */
      if (question.dataset.faqReady === 'true') return;
      question.dataset.faqReady = 'true';

      /* Initial state */
      answer.style.maxHeight = '0px';
      answer.style.overflow = 'hidden';
      answer.style.opacity = '0';

      answer.style.transition =
        'max-height 0.45s ease, opacity 0.3s ease';

      question.style.cursor = 'pointer';

      question.setAttribute('aria-expanded', 'false');

      /* CLICK */
      question.addEventListener('click', () => {

        const isOpen = item.classList.contains('open');

        /* Close every other FAQ */
        faqItems.forEach((otherItem) => {

          if (otherItem === item) return;

          otherItem.classList.remove('open');

          const otherQuestion =
            otherItem.querySelector('.faq-question');

          const otherAnswer =
            otherItem.querySelector('.faq-answer');

          if (otherQuestion) {
            otherQuestion.setAttribute(
              'aria-expanded',
              'false'
            );
          }

          if (otherAnswer) {
            otherAnswer.style.maxHeight = '0px';
            otherAnswer.style.opacity = '0';
          }

        });

        /* OPEN */
        if (!isOpen) {

          item.classList.add('open');

          question.setAttribute(
            'aria-expanded',
            'true'
          );

          answer.style.maxHeight =
            answer.scrollHeight + 'px';

          answer.style.opacity = '1';

        }

        /* CLOSE */
        else {

          item.classList.remove('open');

          question.setAttribute(
            'aria-expanded',
            'false'
          );

          answer.style.maxHeight = '0px';
          answer.style.opacity = '0';

        }

      });

    });

    console.log(
      `Husna Artistry: ${faqItems.length} FAQ items initialized.`
    );

  }


  /* DOM ready */
  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      setupFAQ,
      { once: true }
    );

  } else {

    setupFAQ();

  }


  /* Recalculate open answer if browser size changes */
  window.addEventListener('resize', () => {

    document
      .querySelectorAll('.faq-item.open .faq-answer')
      .forEach((answer) => {

        answer.style.maxHeight =
          answer.scrollHeight + 'px';

      });

  });

})();