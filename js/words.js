/* ============================================================
   Word bank: 450+ simple English words across common categories
   Ticker: preview words shown on the start screen
============================================================ */

'use strict';

/* ════════════════════════════════════════════════════════
   RAW WORD BANK
════════════════════════════════════════════════════════ */
const RAW_WORDS = `
run jump skip hop walk fly swim dive roll spin leap
cat dog bird fish bear wolf deer fox owl hawk snake
sun moon star rain snow wind fire cloud river lake
red blue green bold fast slow high low good best
home door room wall floor roof light dark warm cold
book read word text note list task plan goal step
tree leaf bark root seed fruit vine stem bud bloom
hand foot arm leg face head neck back side palm
food salt rice milk soup cake loaf beef corn
ball game play win lose draw team race pass kick
mind heart soul body brain nerve bone skin form
road path lane fork hill rock cliff cave arch bay
art draw paint sing dance write build make fix
word line page turn flip scan read sort find clear
cup dish bowl fork spoon tray rack shelf box jar
joy calm hope love care kind warm safe bold free
rock sand dust ash mud clay soil pit mound
sea wave tide surf foam beach shore cliff cove cape
day week year noon dawn dusk time hour past now
coat vest belt boot sock hat glove scarf tie cap
bus car van jet ship boat raft sled bike tram
ring bell horn drum flute harp beat note tone
card chip wire plug port link node flow bank store
lock key gate fence wall post sign mark flag pole
chat talk send type echo call ping text buzz post
pack bag wrap seal send ship sort load move haul
act fact plan task step move draw link pair list
form fill sort send keep drop save undo redo copy
blue bold base beam bind bite blow born both brew
calm card cast cave chip clip clue coat code coil
core cost crop cube curl
dark dash data date dawn deal deep deny desk dial
dive dome door down drop drum dual dump dust
earn easy edge emit epic even ever exit eyes
face fact fade fail fair fall fame fast feel fell
fill film find fire firm fish five flag flat flew
flip flow foam fold fond font fork form free fuel
full fund fuse
gain gale game gate gave gaze glad glow glue gone
good grab gray grew grid grin grip grow gulf
half halt hand hard harm heat held help here hide
high hill hint hold hole home hook hope horn host
hour hung hunt hurt
icon idle inch iron isle item
jump just keen kept king knit know
land lane lark last late lead leaf lean leap left
lend less lift like link list live lock long look
loop loud love luck
made mail main make mark maze mean meet melt
mesh mild mile milk mill mind mint miss mix mode
mold moon more move much must
nail name near neat next nick node noon norm note
oath only open oval over
pace pack page pair park part pass path peak pick
pile pink pipe plan play plot plus pole pond pool
port pour
race rack rain rank rate read real reed reef rest
rich ride ring rise road rock role root rope rose
rule rune rush
safe said sail salt same sand save scan seal seek
self send sent ship shot show shut side sigh silk
silo sink site size skin skip slim slip slot slow
snap soft soil sold sole some song sort soul span
spin star stay stem step stir stop such suit surf
swift swim
tail take talk tall tape task tent test text than
then they thin tide tile time tiny toll tone took
tool torn town tram trap tree trim trio trip true
tune turn twin type
unit upon urge user
vale veil vibe view vine volt vote
wade wait wake walk warm warp wave weld well went
west wide wild will wind wine wing wink wire wise
wish wolf word wore work worn wove wrap writ
yard year zero zone zoom
hercules computer
holiday morning picture teacher country station
brother kitchen monster diamond chocolate 
language building hospital exercise elephant 
umbrella internet backpack lightningfast
ultrareaction
hyperactive
megacomputer
cybersecurity
multiplayer
counterattack
battlefield
championship
speedometer
microprocessor
cryptography
electromagnetism
counterproductive
intercontinental
telecommunication
adventure
electric
favorite
mountain
business
important
creative
solution
triangle
dinosaur
keyboard
shopping
engineer
footballer
beautiful
dangerous
fantastic
education
telephone
different
`.trim().split(/\s+/).filter(w => /^[a-zA-Z]{2,8}$/.test(w));

/* De-duplicate */
const WORDS = [...new Set(RAW_WORDS)];

/* ════════════════════════════════════════════════════════
   Words that scroll across the start screen preview strip
════════════════════════════════════════════════════════ */
const TICK_SAMPLE = [
  'jump', 'swift', 'bloom', 'storm', 'river', 'flame', 'quest', 'brave',
  'stone', 'orbit', 'spark', 'drift', 'frost', 'shine', 'pulse', 'grove',
  'trace', 'glide', 'bound', 'crisp', 'steep', 'lunar', 'tidal', 'brisk',
  'flare', 'crest', 'swirl', 'gleam', 'forge', 'scout', 'blaze', 'radar',
];

/* ════════════════════════════════════════════════════════
   BUILD TICKER DOM
   Call once on page load
════════════════════════════════════════════════════════ */
function buildTicker() {
  const tickerEl = document.getElementById('ticker');
  [...TICK_SAMPLE, ...TICK_SAMPLE].forEach(w => {
    const el = document.createElement('div');
    el.className   = 't-chip';
    el.textContent = w;
    tickerEl.appendChild(el);
  });
}
