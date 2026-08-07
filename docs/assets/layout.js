// Layout injection: pages declare <div data-layout></div> and <main>.
// The topbar, sidebar and footer are injected from a shared template so
// every page stays in sync without a build step.
(function () {
  var page = document.body.dataset.page || '';

  var nav = [
    { href: 'index.html', label: 'Home' },
    { href: 'getting-started.html', label: 'Getting Started' },
    { href: 'cli.html', label: 'CLI Reference' },
    { href: 'typescript-api.html', label: 'TypeScript API' },
    { href: 'python-api.html', label: 'Python API' },
    { href: 'relational-data.html', label: 'Families' },
    { href: 'enrichment.html', label: 'Enrichment' },
    { href: 'data-accuracy.html', label: 'Data & Accuracy' },
    { href: 'faq.html', label: 'FAQ' },
    { href: 'playground.html', label: 'Playground' },
  ];

  function link(href, label, container) {
    var a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    if (href === page) a.classList.add('active');
    container.appendChild(a);
    return a;
  }

  function inject() {
    var host = document.querySelector('[data-layout]');
    if (!host) return;

    var topbar = document.createElement('header');
    topbar.className = 'topbar';
    var brand = document.createElement('a');
    brand.className = 'brand';
    brand.href = 'index.html';
    brand.innerHTML = 'indian<span>-fakedata</span>';
    topbar.appendChild(brand);
    var navEl = document.createElement('nav');
    nav.forEach(function (item) {
      if (item.href !== 'index.html') link(item.href, item.label, navEl);
    });
    topbar.appendChild(navEl);
    host.appendChild(topbar);

    var layout = document.createElement('div');
    layout.className = 'layout';

    var sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    var groups = [
      { title: 'Guides', items: nav.slice(0, 3) },
      { title: 'API', items: nav.slice(3, 5) },
      { title: 'Advanced', items: nav.slice(5, 9) },
      { title: 'Tools', items: nav.slice(9) },
    ];
    groups.forEach(function (g) {
      var h = document.createElement('h4');
      h.textContent = g.title;
      sidebar.appendChild(h);
      g.items.forEach(function (item) {
        link(item.href, item.label, sidebar);
      });
    });
    layout.appendChild(sidebar);

    var content = document.createElement('main');
    content.className = 'content';
    var main = document.querySelector('main[data-content]');
    main.className = 'content';
    content = main;
    layout.appendChild(content);

    var footer = document.createElement('footer');
    footer.className = 'footer';
    footer.innerHTML =
      '<span>MIT Licensed · Synthetic data, no real individuals</span>' +
      '<span><a href="https://github.com/abhay557/indian-fakedata">GitHub</a> · <a href="https://www.npmjs.com/package/@abhay557/indian-fakedata">npm</a> · <a href="https://pypi.org/project/indian-fakedata/">PyPI</a></span>';
    content.appendChild(footer);

    host.appendChild(layout);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
