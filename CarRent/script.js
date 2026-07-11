/* ==========================================================================
   RENTA — shared front-end behaviour
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
      var isOpen = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });
  }

  /* ---------- Set sensible date defaults / minimums ---------- */
  var today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(function (input) {
    input.setAttribute('min', today);
  });

  /* ---------- Generic form validation (login, register, contact, payment) ---------- */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msgBox = form.querySelector('.form-msg');
      var required = form.querySelectorAll('[required]');
      var valid = true;

      required.forEach(function (field) {
        if (field.type === 'checkbox' && !field.checked) valid = false;
        if (field.type !== 'checkbox' && !field.value.trim()) valid = false;
      });

      if (!msgBox) return;
      msgBox.classList.remove('error', 'success');
      if (!valid) {
        msgBox.textContent = 'Please fill in every required field before continuing.';
        msgBox.classList.add('show', 'error');
      } else {
        msgBox.textContent = form.dataset.successMsg || 'Success! Redirecting…';
        msgBox.classList.add('show', 'success');
        form.reset();
      }
    });
  });

  /* ---------- Booking price calculator ---------- */
  var pickupDate = document.getElementById('pickup-date');
  var returnDate = document.getElementById('return-date');
  var rateInput = document.getElementById('daily-rate');
  var daysOut = document.getElementById('rental-days');
  var totalOut = document.getElementById('rental-total');

  function calcTotal() {
    if (!pickupDate || !returnDate || !rateInput) return;
    var start = new Date(pickupDate.value);
    var end = new Date(returnDate.value);
    var rate = parseFloat(rateInput.value) || 0;
    var days = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (isNaN(days) || days <= 0) days = 0;
    var total = days * rate;
    if (daysOut) daysOut.textContent = days;
    if (totalOut) totalOut.textContent = '$' + total.toFixed(2);
  }
  [pickupDate, returnDate].forEach(function (el) {
    if (el) el.addEventListener('change', calcTotal);
  });
  calcTotal();

  /* ---------- Testimonial slider (home page) ---------- */
  var slides = document.querySelectorAll('.testimonial');
  var dots = document.querySelectorAll('.dots button');
  if (slides.length) {
    var current = 0;
    function show(i) {
      slides.forEach(function (s, idx) { s.classList.toggle('active', idx === i); });
      dots.forEach(function (d, idx) { d.classList.toggle('active', idx === i); });
      current = i;
    }
    dots.forEach(function (dot, idx) {
      dot.addEventListener('click', function () { show(idx); });
    });
    setInterval(function () {
      show((current + 1) % slides.length);
    }, 5000);
  }

  /* ---------- Animated stat counters (dashboard) ---------- */
  var counters = document.querySelectorAll('[data-count-to]');
  counters.forEach(function (el) {
    var target = parseFloat(el.dataset.countTo);
    var prefix = el.dataset.prefix || '';
    var duration = 900;
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var value = Math.floor(progress * target);
      el.textContent = prefix + value;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target;
    }
    requestAnimationFrame(step);
  });

  /* ---------- Car listing filters (cars.html) ---------- */
  var filterForm = document.getElementById('car-filters');
  var carGrid = document.getElementById('car-grid');
  var priceRange = document.getElementById('price-range');
  var resetBtn = document.getElementById('reset-filters');
  var resultsCount = document.getElementById('results-count');
  var noResults = document.getElementById('no-results');

  function applyCarFilters() {
    if (!filterForm || !carGrid) return;

    var checkedTypes = Array.prototype.map.call(
      filterForm.querySelectorAll('input[name="type"]:checked'),
      function (el) { return el.value; }
    );
    var checkedFuels = Array.prototype.map.call(
      filterForm.querySelectorAll('input[name="fuel"]:checked'),
      function (el) { return el.value; }
    );
    var seatsChoice = filterForm.querySelector('input[name="seats"]:checked');
    var seatsValue = seatsChoice ? seatsChoice.value : 'any';
    var maxPrice = priceRange ? parseFloat(priceRange.value) : Infinity;

    var cards = carGrid.querySelectorAll('.car-card');
    var visibleCount = 0;

    cards.forEach(function (card) {
      var type = card.dataset.type;
      var fuel = card.dataset.fuel;
      var seats = parseInt(card.dataset.seats, 10);
      var price = parseFloat(card.dataset.price);

      var typeOk = checkedTypes.length === 0 || checkedTypes.indexOf(type) !== -1;
      var fuelOk = checkedFuels.length === 0 || checkedFuels.indexOf(fuel) !== -1;
      var seatsOk = seatsValue === 'any' ||
        (seatsValue === '7' ? seats >= 7 : seats === parseInt(seatsValue, 10));
      var priceOk = isNaN(maxPrice) || price <= maxPrice;

      var show = typeOk && fuelOk && seatsOk && priceOk;
      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    if (resultsCount) {
      resultsCount.textContent = visibleCount + (visibleCount === 1 ? ' car matches your filters' : ' cars match your filters');
    }
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  if (filterForm) {
    filterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      applyCarFilters();
    });
  }
  if (resetBtn && filterForm) {
    resetBtn.addEventListener('click', function () {
      filterForm.reset();
      if (priceRange) {
        priceRange.value = priceRange.max || 150;
        var priceOut = document.getElementById('price-range-val');
        if (priceOut) priceOut.textContent = priceRange.value;
      }
      applyCarFilters();
    });
  }
  // Run once on page load so the count/empty-state reflect the unfiltered list
  if (carGrid) applyCarFilters();

  /* ---------- Payment method toggling card fields ---------- */
  var payRadios = document.querySelectorAll('input[name="payment-method"]');
  var cardBlock = document.getElementById('card-details');
  if (payRadios.length && cardBlock) {
    payRadios.forEach(function (r) {
      r.addEventListener('change', function () {
        cardBlock.style.display = (r.value === 'card' && r.checked) ? 'block' : cardBlock.style.display;
        if (r.checked) cardBlock.style.display = (r.value === 'card') ? 'block' : 'none';
      });
    });
  }

});