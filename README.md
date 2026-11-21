# Meals

Plan the week, keep recipes, and get a grocery list that builds itself. Part of Pixora.
Live at https://spoolsync.github.io/meals/

## What it does
- **Plan:** breakfast, lunch, dinner and snacks for each day, from your recipes or a quick note
  ("pizza night"). Copy last week in one tap.
- **Recipes:** paste an ingredient list and it's understood line by line ("1 1/2 cups rice").
  Scale servings, favourite, tag, search. Ten starter recipes to begin with.
- **Groceries:** everything planned for the next 3, 7 or 14 days, scaled to servings, added up,
  and grouped by store aisle. Staples you always have stay off the list. Add extra items, tick
  as you shop, share the list as text.
- Pixora Today card: today's meals and what's left to buy.

## Privacy
Uses the Pixora kit (`pixora-kit.js`): one Pixora account and one Pixora passcode shared with
other Pixora apps. Everything is encrypted on the phone with a key derived from that passcode
before it syncs to `apps/meals/users/<uid>`. The server, the project owner and any AI see only
ciphertext. Works offline, and fully without an account if you prefer.

## Files
`meals-core.js` holds the logic (ingredient parsing, grocery maths) with tests in
`test/core.test.js`. Shared files from the `pixora` repo: `pixora-kit.js`,
`pixora-summary.js`, `pixora-usage.js`. Bump `CACHE` in `sw.js` when files change.
