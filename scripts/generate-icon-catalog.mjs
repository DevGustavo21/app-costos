import fs from 'node:fs';
import lucide from '@iconify-json/lucide/icons.json' with { type: 'json' };
import mdi from '@iconify-json/mdi/icons.json' with { type: 'json' };
import fa6 from '@iconify-json/fa6-solid/icons.json' with { type: 'json' };
import gi from '@iconify-json/game-icons/icons.json' with { type: 'json' };

const ANIMAL_KEYWORDS = ["cow","bull","ox","cattle","pig","hog","sheep","goat","horse","donkey","mule","chicken","hen","rooster","duck","goose","turkey","rabbit","bunny","cat","dog","fish","shark","whale","dolphin","bird","eagle","owl","bee","butterfly","elephant","lion","tiger","bear","wolf","fox","deer","monkey","panda","snake","frog","turtle","crab","lobster","shrimp","animal","paw","pet","livestock","zoo","insect","spider","bat","mouse","rat","hamster","kangaroo","koala","penguin","seal","camel","llama","alpaca","buffalo","dove","parrot","peacock","flamingo","giraffe","hippo","rhino","zebra","squirrel","hedgehog","beaver","otter","moose","reindeer","ant","worm","snail","octopus","squid","jellyfish","starfish","crocodile","alligator","lizard","gecko","chameleon","dragonfly","ladybug","mosquito","fly","scorpion","beetle","mantis","grasshopper","caterpillar","beehive"];

function isAnimal(name) {
  const n = name.toLowerCase();
  return ANIMAL_KEYWORDS.some((kw) => n.includes(kw));
}

const collections = [
  ['lucide', lucide],
  ['mdi', mdi],
  ['fa6-solid', fa6],
  ['game-icons', gi],
];

const allIconIds = [];
const animalIconIds = [];
const iconIdSet = new Set();

for (const [prefix, data] of collections) {
  for (const name of Object.keys(data.icons)) {
    const id = `${prefix}:${name}`;
    if (!iconIdSet.has(id)) {
      iconIdSet.add(id);
      allIconIds.push(id);
      if (isAnimal(name)) animalIconIds.push(id);
    }
  }
}

const SUGGESTED_BUSINESS = ["lucide:store","lucide:building-2","lucide:factory","lucide:warehouse","lucide:tractor","lucide:wheat","lucide:leaf","lucide:truck","lucide:package","lucide:shopping-bag","lucide:coffee","lucide:utensils-crossed","lucide:beef","lucide:milk","lucide:hotel","lucide:bed","lucide:stethoscope","lucide:hammer","lucide:wrench","lucide:briefcase"];
const SUGGESTED_ANIMALS = ["mdi:cow","mdi:pig","mdi:sheep","mdi:horse","mdi:fish","mdi:cat","mdi:dog","mdi:duck","mdi:rabbit","mdi:bee","mdi:elephant","mdi:bird","fa6-solid:cow","fa6-solid:horse","fa6-solid:fish","fa6-solid:cat","fa6-solid:dog","fa6-solid:dove","game-icons:cow","game-icons:pig","game-icons:sheep","game-icons:chicken","game-icons:duck","game-icons:elephant","lucide:fish","lucide:cat","lucide:dog","lucide:rabbit","lucide:bird"].filter((id) => iconIdSet.has(id));

const content = `// Auto-generated — run: npm run icons:generate
export const ALL_ICON_IDS: string[] = ${JSON.stringify(allIconIds)};
export const ANIMAL_ICON_IDS: string[] = ${JSON.stringify(animalIconIds)};
export const SUGGESTED_BUSINESS_ICONS: string[] = ${JSON.stringify(SUGGESTED_BUSINESS)};
export const SUGGESTED_ANIMAL_ICONS: string[] = ${JSON.stringify(SUGGESTED_ANIMALS)};
export const ICON_ID_SET = new Set<string>(ALL_ICON_IDS);
`;

fs.writeFileSync('src/lib/business-unit-icon-ids.generated.ts', content);
console.log('Generated', allIconIds.length, 'icons,', animalIconIds.length, 'animals');
