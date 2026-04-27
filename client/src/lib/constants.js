export const APP_NAME = 'planMe';

export const IDEA_STATUSES = /** @type {const} */ (['draft', 'archived']);

export const IDEA_STATUS_LABELS = {
  draft: 'Draft',
  archived: 'Archived',
};

export const SORT_OPTIONS = /** @type {const} */ ([
  { key: 'newest',  label: 'Newest' },
  { key: 'updated', label: 'Updated' },
  { key: 'a-z',     label: 'A–Z' },
  { key: 'manual',  label: 'Manual' },
]);

export const TAG_MIN_LENGTH = 2;
export const TAG_MAX_LENGTH = 32;
export const TITLE_MAX_LENGTH = 200;
export const DETAILS_MAX_LENGTH = 50_000;
export const IDEA_MAX_TAGS = 3;
export const WORKSPACE_MAX_TAGS = 10;
export const IDEA_LIMIT = 100;

export const SEARCH_MIN_LENGTH = 2;

export const PROMPT_TEMPLATES = [
  {
    title: 'A problem I keep noticing',
    key: 'problem',
    details: `<h2>What's the problem?</h2><p>Describe it in one clear sentence.</p><h3>Who's affected?</h3><p>You, your team, or users?</p><h3>Fixes to explore</h3><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Option A</p></li><li data-type="taskItem" data-checked="false"><p>Option B</p></li><li data-type="taskItem" data-checked="false"><p>Option C</p></li></ul>`,
  },
  {
    title: "Something I've been putting off",
    key: 'procrastination',
    details: `<h2>What is it?</h2><p>Name the thing you keep avoiding.</p><h3>Why haven't I started?</h3><ul><li><p>It feels too big</p></li><li><p>I'm not sure where to start</p></li></ul><h3>The one small step I could take today</h3><p>Something that takes under 10 minutes.</p><blockquote><p>Done is better than perfect.</p></blockquote>`,
  },
  {
    title: 'An idea I keep coming back to',
    key: 'recurring',
    details: `<h2>The idea in one line</h2><p>Write it here.</p><h3>Why it keeps coming back</h3><p>What makes it feel worth pursuing?</p><h3>Steps to make it real</h3><ol><li><p>Validate the core assumption</p></li><li><p>Talk to one person who'd benefit</p></li><li><p>Build the smallest version</p></li></ol>`,
  },
];
