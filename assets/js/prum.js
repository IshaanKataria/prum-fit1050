// prum.js — filter chips for the events section + modal that opens with the
// full briefing when a card is clicked. The two share state so the modal only
// opens for cards currently visible after filtering.

'use strict';

// briefing data for each event card, keyed by data-event-id
const eventDetails = {
	'ev-infernal': {
		tag: 'One-shot',
		date: 'Thursday 5 June 2026, 6:00pm to 11:00pm',
		location: 'Campus Centre, Building 10, Room 1.04',
		brief: 'A one-night space-piracy adventure following Lady Blackbird and the crew of The Owl as they slip past Imperial cruisers, broker uneasy alliances and try to keep their cargo bay from depressurising. Pre-generated characters provided. Pizza is on the club.',
		facts: {
			'System': 'Lady Blackbird (Free League)',
			'Players': '4 seats remaining of 6',
			'Skill level': 'Total beginners welcome',
			'Bring': 'Yourself. Dice and snacks provided.'
		}
	},
	'ev-autumn-camp': {
		tag: 'Camp',
		date: 'Friday 13 to Sunday 15 June 2026',
		location: 'Healesville Retreat Centre, Dandenong Ranges',
		brief: 'Three days of nonstop tabletop across twelve concurrent tables, organised across four time blocks per day. Tables run 5e, Pathfinder 2e, Mausritter, Call of Cthulhu, and a homebrew Western. Bunkhouse accommodation included.',
		facts: {
			'System mix': '5e, Pathfinder, Mausritter, CoC, homebrew',
			'Capacity': '48 attendees, 32 remaining',
			'Cost': 'A$85 members, A$110 non-members',
			'Includes': 'Bunk, three meals daily, all materials'
		}
	},
	'ev-weekly': {
		tag: 'Weekly',
		date: 'Every Thursday, 6:00pm to 10:00pm',
		location: 'Campus Centre, Rooms 1.04 through 1.08',
		brief: 'Our flagship weekly. Five tables run concurrently with a mix of long-running campaigns and walk-up one-shots. Drop in to a system you have never tried. We will pair you with a friendly group and a GM who knows the rules.',
		facts: {
			'Format': 'Five parallel tables, walk-ins welcome',
			'Players': 'Approximately 25 per session',
			'Skill level': 'Mixed, GMs adjust to the table',
			'Bring': 'A character sheet if you have one'
		}
	},
	'ev-tournament': {
		tag: 'Tournament',
		date: 'Saturday 19 July 2026, 10:00am to 6:00pm',
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
		date: 'Thursday 26 June 2026, 6:30pm to 9:00pm',
		location: 'Building T, Room ST1',
		brief: 'For anyone who has ever wanted to run a game and not known where to start. Three veteran Dungeon Masters walk you through session zero, then through the first thirty minutes of a fresh campaign, then debrief on what went right and wrong.',
		facts: {
			'Format': 'Workshop, working in pairs',
			'Capacity': '16 spots, 9 remaining',
			'Skill level': 'No GMing experience needed',
			'Bring': 'A notebook and three open questions'
		}
	},
	'ev-pathfinder': {
		tag: 'Weekly',
		date: 'Every Thursday, 6:00pm start',
		location: 'Campus Centre, Room 1.02',
		brief: 'Our longest-running campaign, currently in chapter four of The Bonewood. The party is investigating a series of disappearances along the Carrowmore Road and seems to have annoyed something old in the trees. Two seats open for new players this term.',
		facts: {
			'System': 'Pathfinder 2e',
			'Players': '2 open seats of 6',
			'Story arc': 'The Bonewood, chapter 4 of 7',
			'GM': 'Marigold Vass, three years GMing'
		}
	}
};

// grab everything once
const nav = document.querySelector('.prum-nav');
const filterButtons = document.querySelectorAll('.prum-filter-chip');
const eventCards = document.querySelectorAll('.prum-event');
const emptyState = document.getElementById('prum-empty');
const modal = document.getElementById('event-modal');
const modalTag = document.getElementById('modal-tag');
const modalTitle = document.getElementById('modal-title');
const modalDate = document.getElementById('modal-date');
const modalLocation = document.getElementById('modal-location');
const modalDescription = document.getElementById('modal-description');
const modalFacts = document.getElementById('modal-facts');

// shared state for filter + modal. lastFocused lets us send focus back
// to the card you came from when the modal closes.
let activeFilter = 'all';
let lastFocused = null;


// add a class to the nav once the page scrolls down a bit
function handleNavScroll() {
	if (window.scrollY > 16) {
		nav.classList.add('is-scrolled');
	} else {
		nav.classList.remove('is-scrolled');
	}
}
window.addEventListener('scroll', handleNavScroll);
handleNavScroll();


// hide every event card whose category doesn't match the chosen filter
function applyFilter(filter) {
	activeFilter = filter;
	let visibleCount = 0;

	eventCards.forEach(card => {
		const cat = card.getAttribute('data-category');
		const show = filter === 'all' || cat === filter;
		card.hidden = !show;
		if (show) visibleCount++;
	});

	// mark the active chip (aria-pressed for screen readers)
	filterButtons.forEach(btn => {
		const isActive = btn.getAttribute('data-filter') === filter;
		btn.classList.toggle('is-active', isActive);
		btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
	});

	emptyState.hidden = visibleCount !== 0;
}

filterButtons.forEach(btn => {
	btn.addEventListener('click', () => {
		applyFilter(btn.getAttribute('data-filter'));
	});
});


// open the modal with the details for the clicked card
function openModal(card) {
	const id = card.getAttribute('data-event-id');
	const details = eventDetails[id];
	if (!details) return;

	lastFocused = card;

	modalTag.textContent = details.tag;
	modalTitle.textContent = card.querySelector('h3').textContent;
	modalDate.textContent = details.date;
	modalLocation.textContent = details.location;
	modalDescription.textContent = details.brief;

	// rebuild the dl from the facts map
	modalFacts.textContent = '';
	for (const key in details.facts) {
		const dt = document.createElement('dt');
		dt.textContent = key;
		const dd = document.createElement('dd');
		dd.textContent = details.facts[key];
		modalFacts.appendChild(dt);
		modalFacts.appendChild(dd);
	}

	modal.hidden = false;
	document.body.classList.add('prum-modal-open');
	modal.querySelector('.prum-modal-close').focus();
}

function closeModal() {
	if (modal.hidden) return;
	modal.hidden = true;
	document.body.classList.remove('prum-modal-open');
	if (lastFocused) lastFocused.focus();
	lastFocused = null;
}

// cards open on click + Enter/Space (since they're <article> not <button>)
eventCards.forEach(card => {
	card.addEventListener('click', () => openModal(card));
	card.addEventListener('keydown', e => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openModal(card);
		}
	});
});

// anything with data-modal-close closes the modal
document.querySelectorAll('[data-modal-close]').forEach(el => {
	el.addEventListener('click', closeModal);
});

// ESC closes the modal too
document.addEventListener('keydown', e => {
	if (e.key === 'Escape' && !modal.hidden) closeModal();
});


// focus trap: keep Tab cycling inside the modal while it's open
// (pattern from MDN / W3C docs on modal dialogs)
document.addEventListener('keydown', e => {
	if (e.key !== 'Tab' || modal.hidden) return;

	const focusable = modal.querySelectorAll(
		'a[href], button, input, [tabindex]:not([tabindex="-1"])'
	);
	const first = focusable[0];
	const last = focusable[focusable.length - 1];

	if (e.shiftKey && document.activeElement === first) {
		e.preventDefault();
		last.focus();
	} else if (!e.shiftKey && document.activeElement === last) {
		e.preventDefault();
		first.focus();
	}
});


// start with everything visible
applyFilter('all');
