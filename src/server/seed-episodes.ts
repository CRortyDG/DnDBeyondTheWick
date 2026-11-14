// Seed run sheets. DM-only: never sent to the TV or players, and server-only so
// the text never ends up in the browser bundle that the TV and phones download.
import { parseEpisode, sceneKey, sceneResolver } from "@/shared/runsheet";
import type { Episode, GameState, Scene } from "@/shared/types";

// The seed episode names scenes the way the DM says them. Pin those names to
// the seeded scene ids, so relabelling a scene later can't break the seed.
const SEED_SCENE_IDS: Record<string, string> = {
  "notice board": "s-board",
  artum: "s-artum",
  "mags wick": "s-mags",
  chef: "s-chef",
  "artum's notice": "s-notice",
  "town map": "s-map",
  "extra image": "s-extra",
  symbol: "s-symbol",
  black: "s-black",
};

export const JUST_DESSERTS_MD = String.raw`# Just Desserts

## Off the Gull's Promise
- Two or three minutes. Everyone arrives together on the Gull's Promise: strangers who noticed each other on the crossing but haven't really talked.
- They step off the ship onto the cold docks. A quick word with the ship's captain. Throwaway, but the same captain returns later.
- Optional line from the captain: "Last time we carried a peddler, she paid in coin I'd never seen before."
- Ask each player one question: "Why did you get on that boat?" One answer each, then move on.
action: scene town map

## At the Flickering Candle
- They head up to the Flickering Candle. It's empty except for Mags. Each sits at their own table and orders drinks they can't pay for.
- Mags drops by each table with one question: "What would you do with a fortune, pet?" One answer each, then move on.
- Mags has poured them all drinks. None of them can pay; she's quietly running a tab.
- If anyone looks at the notice board, let them read it on the TV.
action: scene notice board

## Artum bursts in
> "Where is everyone?!"
- The party are the only patrons. Mags shrugs.
- Why it's empty: his hired helpers quit this morning after someone fell off a ladder.
- Artum, to the party: "You. All of you. You're coming with me."
- The offer: 25 gp each for a day's work, plus a seat at the banquet for a job well done.
- Mags sells it: "Twenty-five gold? Duck, that's three months of tips."
- Artum slaps coins on the bar: "Their tab's paid. Now you owe me."
if: they still refuse → "Fine. Then at least come to the feast as guests. Free food." Either way they're in the banquet hall when the trouble starts.
action: scene Artum

## Hang the fir garlands
- The ceilings are high and the ladders are rickety. Start the breakage tally now: every failed check that breaks something costs a gold or two off their pay.
- Holding the ladder for someone needs no roll and gives the climber advantage.
check: Strength (Athletics) or Dexterity (Acrobatics) DC 12 | climb and keep balance | fail: fall (1d6 bludgeoning) or drop the garland on something breakable
check: Dexterity (Sleight of Hand) DC 10 | hang it so it looks good | fail: it's crooked and Artum notices

## The scullery china
- The scullery is a mess; matching sets are hard to find. Wheeling the crockery back takes strength and care.
check: Intelligence (Investigation) or Wisdom (Perception) DC 12 | find matching sets | fail: mismatched plates, takes twice as long
check: Strength (Athletics) DC 12 | push the heavy cart
check: Dexterity (Sleight of Hand) or Dexterity (Acrobatics) DC 12 | steer around corners | fail: a stack of plates hits the floor

## The horses
> Outside, it's carnage. One draft horse is dragging an entire fir garland down the street like a kite tail. The other has backed a fancy carriage into the fountain, and the carriage is tipping, with a very rich, very loud woman still inside. A mastiff is barking at both of them, delighted. And Bolla is in the middle of it, arms wide, yelling "EASY, EASY!" at no one in particular.
- Several problems at once so players split up. Ask "what do you do?" and pick the roll that fits; a clever idea gets advantage or just works.
- Failures make it worse: the runaway horse heads for the hall doors; the carriage tips; the dog steals a ham.
- Cut between players at the exciting moment instead of finishing one player at a time.
- Ends after 3 successes total (calm) or 3 failures (a guest gets splashed and storms in furious). About 10 minutes.
- Bolla shouts tips: "He likes his left ear scratched!"
check: Wisdom (Animal Handling) DC 13 | calm a horse
check: Strength (Athletics) DC 13 | grab and hold a bridle
check: Dexterity saving throw DC 12 | stay clear of a kick | fail: knocked prone in the snow, not hurt
check: Wisdom (Animal Handling) DC 10 | settle the dog | success: automatic if someone offers it food
- The first six guests arrive and enter the banquet.

## Seats or serving duty
- Great prep: a seat at the table. Okay: a seat, minus breakage. Bad: serving duty ("You're not sitting. You're carrying.").
- Either way, they're in the hall when the pudding attacks.

## Meet the guests
- About 3 minutes. Seat each player next to a named guest, especially the wealthy ones: a pompous merchant, a nervous young noble, a grandmother who won't stop talking. One quick exchange each.
- If there's a bard, Artum asks them to play during dinner. The attack can interrupt the song.

## Artum's toast and dessert
- Artum's toast, with a backhanded thanks to the "volunteers" depending on how prep went.
> "My new recipes, never served before!"
- The chef presents dessert proudly. Let it land.
action: scene the chef

## The pudding fight
- Pudding Gremlin: AC 11, HP 21, Claw +5 (1d4+3). Fire Breath (Recharge 6): 15 ft cone, Dex save DC 11, 2d6 fire, half on success; ready at the start, then roll a d6 at the start of each of its turns, 6 = ready. Death Burst: 5 ft around it, Dex save DC 11, 2d6 fire. Immune to fire. Can sit still and pass as an ordinary pudding.
- Create Gremlin (1/day): within 10 ft of an ordinary pudding, turns it into a new gremlin. Put ordinary puddings on the tables; that's the second wave.
- Wave 1: two gremlins. Wave 2: start of round 3 or when wave 1 drops, whichever comes first.
- Warn a round early: "On the next table, a trifle starts to tremble." Warn before Fire Breath: "Its custard starts bubbling and glowing orange."
- Give every round a stake: a pudding lunges at a guest, someone gets cornered.
- Scale: struggling party, wave 2 is one pudding; crushing it, add a third. Rough guide: start with two, let only one create a third.
- Improvised weapons everywhere (rolling pins, ladles, candelabras): 1d4.
action: initiative

## Celebration and payday
- Narrate the room for 30 seconds, then one quick question per player ("What's the first thing your character eats?").
- Pay: great 25 gp each and a seat; okay 20–25 gp minus breakage; bad 15–20 gp after deductions and serving duty. Artum docks it out loud, item by item: "minus three for the plates, two for the garland, and one for my dignity."
- Tips from wealthy guests they protected: great 5 gp each, okay 2–3 gp, bad 1 gp.
- Everyone gets a tin of Elias's spiced biscuits, no matter what.
action: bank

## The chef's confession
- Mortified, he explains he bought the recipes from a traveling merchant, and shows the pages: the same symbol on every one.
- Answer questions as him; don't push.
action: scene the chef

## The recipes won't burn
> Artum: "Throw the cursed things in the fire!" The chef tosses them in the hearth. The flames curl around the pages and won't take them. They come out cold. Not even singed.
- The chef pushes a page into the party's hands: "I don't want it in my kitchen."
- Make sure the party leaves with at least one page.
action: scene the symbol

## Level up
- "You're level 2."

## The stinger
- Tell them first: "This is for you, not your characters."
- Cut all sound before you start. Read slowly, pause on each "…", drop your voice on the last lantern line. About 45–60 seconds.
> Close your eyes.
>
> You're at the Flickering Candle. Warm. Full. Laughing with your new friends about the night you fought off a pudding.
>
> Now… let the view drift. Up, and away from your table. You see yourselves from above. Then the whole tavern: the fire, the music, the happy crowd.
>
> The view drifts toward the door… through it… and everything goes dark.
>
> Slowly, the dark gives way to moonlight. The edge of town, somewhere you don't know. A small cart, hung with tiny lanterns. An old woman beside it. And a child.
>
> The woman hands the child something small. You can't see what. The child jumps with joy.
>
> The woman smiles, waves, and walks her cart toward the Trollbark, into the dark.
>
> And as she goes… one more tiny lantern on her cart flickers to life.
>
> Open your eyes. End of episode one.
action: black

## Roll the stinger
- Press Next once they've opened their eyes: the TV plays the stinger (about 25 seconds, no sound) and holds on "End of episode one".
action: stinger
`;

/** Resolve the seed's scene names: pinned ids first, then the scenes as they are now. */
export function seedSceneResolver(scenes: Pick<Scene, "id" | "label" | "name" | "kind">[]) {
  const byLabel = sceneResolver(scenes);
  return (name: string) => {
    const pinned = SEED_SCENE_IDS[sceneKey(name)];
    if (pinned && scenes.some((s) => s.id === pinned)) return pinned;
    return byLabel(name);
  };
}

export function seedEpisodes(scenes: Pick<Scene, "id" | "label" | "name" | "kind">[]): Episode[] {
  const p = parseEpisode(JUST_DESSERTS_MD, seedSceneResolver(scenes));
  return [{ id: "ep1", title: p.title, beats: p.beats.map((b, i) => ({ id: `ep1-b${i + 1}`, ...b })) }];
}

/** Games made before run-game mode (and fresh seeds) get the seed episode when read. */
export function withSeedEpisodes<T extends GameState | null>(state: T): T {
  if (state && !state.episodes) state.episodes = seedEpisodes(state.scenes);
  return state;
}
