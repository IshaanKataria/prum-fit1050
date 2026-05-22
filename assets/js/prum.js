/* prum.js
   Vanilla JS for the PRUM homepage.
   Two combined interactive features sharing a single state model:
     1. Filter chips that narrow the visible set of events
     2. Modal that opens with the briefing for whichever event was clicked
   Both bind to the same filteredEvents collection so the modal only ever
   opens an event that is currently visible. ESC + backdrop + close button
   all dismiss. Focus is restored to the triggering card on close.

   Author: Ishaan Kataria, FIT1050 Assignment 3 (2026).
*/

(function () {
	'use strict';

	// -------- event data, kept in code rather than scattered through the DOM --------
	// Source of truth for the modal's expanded view. data-event-id on each
	// card pulls the matching entry out of this object.
	var EVENT_DETAILS = {
		'ev-infernal': {
			tag: 'One-shot',
			date: 'Thursday 5 June 2026 · 6:00pm to 11:00pm',
			location: 'Campus Centre, Building 10, Room 1.04',
			brief: 'A one-night space-piracy adventure following Lady Blackbird and the crew of The Owl as they slip past Imperial cruisers, broker uneasy alliances and try to keep their cargo bay from depressurising. Pre-generated characters provided. Pizza is on the club.',
			facts: {
				'System': 'Lady Blackbird (Free League)',
				'Players': '4 seats remaining of 6',
				'Skill level': 'Total beginners welcome',
				'Bring': 'Yourself. Dice, character sheets and snacks provided.'
			}
		},
		'ev-autumn-camp': {
			tag: 'Camp',
			date: 'Friday 13 to Sunday 15 June 2026',
			location: 'Healesville Retreat Centre, Dandenong Ranges',
			brief: 'Our autumn camp. Three days of nonstop tabletop across twelve concurrent tables, organised across four time blocks per day. Tables run 5e, Pathfinder 2e, Mausritter, Call of Cthulhu, and a homebrew Western that the committee has been working on for six months. Bunkhouse accommodation included.',
			facts: {
				'System mix': '5e, Pathfinder, Mausritter, CoC, homebrew',
				'Capacity': '48 attendees, 32 remaining',
				'Cost': 'A$85 members, A$110 non-members',
				'Includes': 'Bunk, three meals daily, all materials'
			}
		},
		'ev-weekly': {
			tag: 'Weekly',
			date: 'Every Thursday · 6:00pm to 10:00pm',
			location: 'Campus Centre, Rooms 1.04 through 1.08',
			brief: 'Our flagship weekly. Five tables run concurrently across the floor with a mix of long-running campaigns and walk-up one-shots. Drop in to a system you have never tried. We will pair you with a friendly group and a GM who knows the rules so you do not have to.',
			facts: {
				'Format': 'Five parallel tables, walk-ins welcome',
				'Players': 'Approximately 25 per session',
				'Skill level': 'Mixed, GMs adjust to the table',
				'Bring': 'A character sheet if you have one'
			}
		},
		'ev-tournament': {
			tag: 'Tournament',
			date: 'Saturday 19 July 2026 · 10:00am to 6:00pm',
			location: 'RMIT Storey Hall, 336 Swanston Street',
			brief: 'The second round of the Melbourne Tabletop League. Four-player teams play three two-hour rounds against teams from other Melbourne universities, judged on storytelling craft, team play and creative problem solving rather than win-loss outcomes. Pre-gen characters; no system mastery required.',
			facts: {
				'Format': 'Four-player teams, three rounds',
				'PRUM seats': '8 of 12 confirmed',
				'Prize pool': 'A$1,200 across podium teams',
				'Bring': 'A team name and a notebook'
			}
		},
		'ev-gmworkshop': {
			tag: 'One-shot',
			date: 'Thursday 26 June 2026 · 6:30pm to 9:00pm',
			location: 'Building T, Room ST1',
			brief: 'For anyone who has ever wanted to run a game and not known where to start. Three veteran Dungeon Masters walk you through session zero, then through the first thirty minutes of a fresh campaign, then debrief on what went right and wrong. Hands-on, low pressure, friendly.',
			facts: {
				'Format': 'Workshop, working in pairs',
				'Capacity': '16 spots, 9 remaining',
				'Skill level': 'No GMing experience needed',
				'Bring': 'A notebook and three open questions'
			}
		},
		'ev-pathfinder': {
			tag: 'Weekly',
			date: 'Every Thursday · 6:00pm start',
			location: 'Campus Centre, Room 1.02',
			brief: 'Our longest-running campaign, currently in chapter four of The Bonewood. The party is investigating a series of disappearances along the Carrowmore Road and seems to have annoyed something old in the trees. Two seats are open for new players this term. Existing-character integration welcome.',
			facts: {
				'System': 'Pathfinder 2e',
				'Players': '2 open seats of 6',
				'Story arc': 'The Bonewood, chapter 4 of 7',
				'GM': 'Marigold Vass, three years GMing'
			}
		}
	};

	// -------- DOM references --------
	var nav = document.querySelector('.prum-nav');
	var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.prum-filter__chip'));
	var eventCards = Array.prototype.slice.call(document.querySelectorAll('.prum-event'));
	var emptyState = document.getElementById('prum-empty');
	var modal = document.getElementById('event-modal');
	var modalTag = document.getElementById('modal-tag');
	var modalTitle = document.getElementById('modal-title');
	var modalDate = document.getElementById('modal-date');
	var modalLocation = document.getElementById('modal-location');
	var modalDescription = document.getElementById('modal-description');
	var modalFacts = document.getElementById('modal-facts');

	// -------- state --------
	// Single shared state object. Both interactions (filter + modal) read from
	// and write to this, which is what makes them composed rather than parallel.
	var state = {
		activeFilter: 'all',
		lastFocused: null
	};

	// -------- nav scroll behaviour --------
	function handleNavScroll() {
		if (!nav) return;
		if (window.scrollY > 16) {
			nav.classList.add('is-scrolled');
		} else {
			nav.classList.remove('is-scrolled');
		}
	}

	window.addEventListener('scroll', handleNavScroll, { passive: true });
	handleNavScroll();

	// -------- filter logic --------
	function getCardCategory(card) {
		return card.getAttribute('data-category') || 'all';
	}

	function updateCounts() {
		var counts = { all: eventCards.length };
		eventCards.forEach(function (card) {
			var cat = getCardCategory(card);
			counts[cat] = (counts[cat] || 0) + 1;
		});
		document.querySelectorAll('[data-count-for]').forEach(function (badge) {
			var key = badge.getAttribute('data-count-for');
			badge.textContent = counts[key] != null ? counts[key] : 0;
		});
	}

	function applyFilter(filter) {
		state.activeFilter = filter;

		var visibleCount = 0;
		eventCards.forEach(function (card) {
			var cat = getCardCategory(card);
			var shouldShow = (filter === 'all') || (cat === filter);

			if (shouldShow) {
				card.hidden = false;
				visibleCount++;
				card.classList.add('is-fading');
				requestAnimationFrame(function () {
					card.classList.remove('is-fading');
				});
			} else {
				card.hidden = true;
			}
		});

		filterButtons.forEach(function (btn) {
			var isActive = btn.getAttribute('data-filter') === filter;
			btn.classList.toggle('is-active', isActive);
			btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
		});

		if (emptyState) {
			emptyState.hidden = visibleCount !== 0;
		}
	}

	filterButtons.forEach(function (btn) {
		btn.addEventListener('click', function () {
			var filter = btn.getAttribute('data-filter') || 'all';
			applyFilter(filter);
		});
	});

	// -------- modal logic --------
	function clearChildren(node) {
		while (node.firstChild) {
			node.removeChild(node.firstChild);
		}
	}

	function openModal(card) {
		if (!card || !modal) return;
		var id = card.getAttribute('data-event-id');
		var details = EVENT_DETAILS[id];
		if (!details) return;

		// remember which card to send focus back to on close
		state.lastFocused = card;

		// populate modal content
		modalTag.textContent = details.tag;
		modalTitle.textContent = card.querySelector('h3').textContent;
		modalDate.textContent = details.date;
		modalLocation.textContent = details.location;
		modalDescription.textContent = details.brief;

		// build the dl from the facts map using safe DOM methods
		clearChildren(modalFacts);
		Object.keys(details.facts).forEach(function (key) {
			var dt = document.createElement('dt');
			dt.textContent = key;
			var dd = document.createElement('dd');
			dd.textContent = details.facts[key];
			modalFacts.appendChild(dt);
			modalFacts.appendChild(dd);
		});

		modal.hidden = false;
		document.body.classList.add('prum-modal-open');

		// move focus into the modal for keyboard + screen reader users
		var closeBtn = modal.querySelector('.prum-modal__close');
		if (closeBtn) closeBtn.focus();
	}

	function closeModal() {
		if (!modal || modal.hidden) return;
		modal.hidden = true;
		document.body.classList.remove('prum-modal-open');
		if (state.lastFocused && typeof state.lastFocused.focus === 'function') {
			state.lastFocused.focus();
		}
		state.lastFocused = null;
	}

	// open: click or Enter/Space on a card
	eventCards.forEach(function (card) {
		card.addEventListener('click', function () {
			openModal(card);
		});
		card.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				openModal(card);
			}
		});
	});

	// close: any element with data-modal-close
	document.querySelectorAll('[data-modal-close]').forEach(function (el) {
		el.addEventListener('click', function (e) {
			// the RSVP link is also a close trigger, but should still navigate
			if (el.tagName.toLowerCase() === 'a' && el.getAttribute('href')) {
				closeModal();
				return;
			}
			e.preventDefault();
			closeModal();
		});
	});

	// close on ESC anywhere
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && modal && !modal.hidden) {
			closeModal();
		}
	});

	// trap Tab inside the modal so screen reader / keyboard users do not
	// wander out into the hidden background while it is open
	document.addEventListener('keydown', function (e) {
		if (e.key !== 'Tab') return;
		if (!modal || modal.hidden) return;
		var focusable = modal.querySelectorAll(
			'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
		);
		if (!focusable.length) return;
		var first = focusable[0];
		var last = focusable[focusable.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	});

	// -------- smooth in-page scrolling for the nav --------
	document.querySelectorAll('.prum-nav__links a[href^="#"]').forEach(function (link) {
		link.addEventListener('click', function (e) {
			var target = document.querySelector(link.getAttribute('href'));
			if (!target) return;
			e.preventDefault();
			var top = target.getBoundingClientRect().top + window.scrollY - 72;
			window.scrollTo({ top: top, behavior: 'smooth' });
		});
	});

	// -------- init --------
	updateCounts();
	applyFilter('all');
})();
