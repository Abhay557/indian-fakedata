// Playground: live TypeScript generation (bundled lib.js) +
// pre-computed Python samples for seeds 7, 11, 13.
(function () {
  var output = document.getElementById('output');
  var errorBox = document.getElementById('error');
  var generateBtn = document.getElementById('generate');
  var tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tabs button'));
  var pythonSamples = {};

  function setError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = !msg;
  }

  function setOutput(text) {
    output.textContent = text;
  }

  function activeTab() {
    return (document.querySelector('.tabs button.active') || {}).dataset
      ? document.querySelector('.tabs button.active').dataset.tab
      : 'ts';
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderActive();
    });
  });

  function renderActive() {
    var tab = activeTab();
    if (tab === 'py') {
      var seed = document.getElementById('seed').value.trim() || '7';
      if (pythonSamples[seed]) {
        setOutput(JSON.stringify(pythonSamples[seed], null, 2));
      } else {
        setOutput('No pre-computed Python sample for seed "' + seed + '".\nAvailable: 7, 11, 13.');
      }
    } else {
      var current = output.textContent;
      if (current.indexOf('Press Generate') === 0) {
        setOutput('Press Generate to create a profile.');
      }
    }
  }

  generateBtn.addEventListener('click', function () {
    setError('');
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    setTimeout(function () {
      try {
        var seedValue = document.getElementById('seed').value.trim();
        var count = Math.max(1, Math.min(parseInt(document.getElementById('count').value || '1', 10), 25));
        var state = document.getElementById('state').value.trim();
        var gender = document.getElementById('gender').value;
        var religion = document.getElementById('religion').value;
        var family = document.getElementById('family').checked;

        var constraints = {};
        if (state) constraints.state = state;
        if (gender) constraints.gender = gender;
        if (religion) constraints.religion = religion;

        var lib = window.IndianFakeData;
        if (!lib) throw new Error('Library bundle failed to load.');

        var result;
        if (family) {
          result = lib.generateFamily({
            seed: seedValue || undefined,
            constraints: constraints,
          });
        } else {
          result = lib.generate({
            count: count,
            seed: seedValue || undefined,
            constraints: constraints,
          });
        }

        setOutput(JSON.stringify(result, null, 2));
        // switch to the TS tab so the result is visible
        tabButtons.forEach(function (b) {
          b.classList.toggle('active', b.dataset.tab === 'ts');
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate';
      }
    }, 0);
  });

  // Load pre-computed Python samples
  ['7', '11', '13'].forEach(function (s) {
    fetch('samples/python-' + s + '.json')
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { pythonSamples[s] = data; })
      .catch(function () { pythonSamples[s] = null; });
  });
})();
