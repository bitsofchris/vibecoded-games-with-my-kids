// Classes and their weekly spelling lists, maintained in the repo so nobody has to type words in.
// Order here = order on the class screen (RSE on top, Quogue below).
// To publish a week: add a list to the FRONT of that class's `lists` with a new `id` and today's
// `date` (YYYY-MM-DD). The newest list (lists[0]) is what kids get when they pick the class;
// each device adds it once and keeps its progress. Text format: word: sentence — one per line.
window.SQ_CLASSES = [
  {
    id: 'rse-1', school: 'RSE', grade: 1, emoji: '🐣',
    lists: [],
  },
  {
    id: 'rse-3', school: 'RSE', grade: 3, emoji: '🚀',
    lists: [
      {
        id: 'C-4', date: '2026-10-21', name: 'List C-4 · short o & long o',
        text: `
coach: The coach blew her whistle.
frog: The frog hopped into the pond.
though: It was cold, though the sun was out.
vote: We will vote for a class pet.
block: I stacked one block on top.
sold: Mom sold our old bike.
hollow: The owl lives in a hollow tree.
own: I have my own room.
fossil: We found a fossil in the rock.
cocoa: I drink hot cocoa in winter.
olive: Dad put an olive on his pizza.
option: Pick an option from the menu.
stone: I threw a stone into the lake.
lollipop: The lollipop is red and sweet.
oatmeal: I eat oatmeal for breakfast.
sentence: Write a sentence about your dog.
reading: I like reading before bed.
bread: We baked a loaf of bread.
telephone: The telephone rang loudly.
octagon: A stop sign is an octagon.
`,
      },
    ],
  },
  {
    id: 'quogue-1', school: 'Quogue', grade: 1, emoji: '🐢',
    lists: [],
  },
  {
    id: 'quogue-3', school: 'Quogue', grade: 3, emoji: '🦈',
    lists: [],
  },
];
