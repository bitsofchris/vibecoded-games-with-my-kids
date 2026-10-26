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
        id: 'C-5', date: '2026-10-26', name: 'List C-5 · oo & long u',
        text: `
fruit: I eat fruit for a snack.
cute: The puppy is so cute.
mule: The mule carried our bags.
stool: I sat on a tall stool.
few: I have a few crayons left.
rules: We follow the rules in class.
new: I got a new backpack.
knew: She knew all the answers.
bedroom: My bedroom has a blue rug.
musical: We saw a musical with songs.
rescue: The firefighter will rescue the cat.
spoon: I eat soup with a spoon.
computer: Dad typed on the computer.
moon: The moon is bright tonight.
perfume: Mom's perfume smells like roses.
height: We marked my height on the wall.
silent: The library is silent.
reply: Please reply to my letter.
barbecue: We had burgers at the barbecue.
suitcase: I packed my suitcase for the trip.
`,
      },
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
    lists: [
      {
        id: 'digraphs-ck', date: '2026-10-22', name: 'Consonant digraphs',
        text: `
back: I sit in the back seat.
neck: A giraffe has a long neck.
chick: The baby chick is yellow.
witch: The witch has a big hat.
quick: The bunny is very quick.
shock: The cold water was a shock!
rock: I sat on a big rock.
luck: Good luck at your game!
she: She has a red bike.
he: He likes to run.
for: This cake is for you.
or: Do you want milk or juice?
`,
      },
    ],
  },
  {
    id: 'quogue-3', school: 'Quogue', grade: 3, emoji: '🦈',
    lists: [
      {
        id: 'ing-ed-endings', date: '2026-10-26', name: '-ing and -ed endings',
        text: `
decorating: We are decorating the cake.
celebrating: We are celebrating my birthday.
erupted: The volcano erupted with red lava.
encouraged: My coach encouraged me to try.
exploding: Fireworks were exploding in the sky.
traveling: We are traveling to see Grandma.
clogging: Leaves are clogging the drain.
studied: I studied my spelling words.
dropped: I dropped my ice cream cone.
treating: Mom is treating us to pizza.
`,
      },
      {
        id: 'ow-sound', date: '2026-10-22', name: 'ow sound',
        text: `
however: I was tired, however I kept going.
found: I found my lost shoe.
surround: Trees surround our little house.
mountain: We hiked up the mountain.
allowance: I saved my allowance for a toy.
flounder: A flounder is a flat fish.
coward: The brave knight was no coward.
lounge: Cats love to lounge in the sun.
amount: Add a small amount of salt.
around: The dog ran around the yard.
`,
      },
    ],
  },
];
