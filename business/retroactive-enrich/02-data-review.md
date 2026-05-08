# Activity Data Review

Edit any fields below. Change `status: include` to `status: skip` to exclude an activity from the update.
Run `npx tsx db/scripts/03-apply-enrichment.ts` when you're happy with this file.

## ⚠️ Flags to review before running the script

- **Pirate Adventure Crazy Golf (Harrogate)** — no indoor pirate-themed venue in Harrogate could be verified. May not exist or may have closed. Consider marking `status: skip` unless you know it's open.
- **Jedidiah's Party at Stockeld Park** — this is a seasonal character experience at Stockeld Park (same URL as the Stockeld Park entry). Both are kept here — delete one or mark one skip if you only want a single Stockeld Park entry.
- **Harrogate Turkish Baths** — the baths have a **16+ age restriction**. Only guided architectural tours are suitable for families. Description rewritten to reflect this, but consider whether this belongs in a 4–12 app at all.
- **Sledgehammer Smash Room (Leeds)** — rage/smash rooms typically require minimum age 10–16. Not suitable for younger children. Consider marking `status: skip`.
- **Yorkshire Dales Falconry Centre** — the original venue appears to be for sale. Replaced with Settle Falconry (settlefalconry.co.uk) which is the active operator in the area. Prebooking required; appointment only.
- **National Media Museum** — officially renamed to **National Science and Media Museum** in 2017. The DB entry name won't be changed by this script (match is by name) — you may want to also manually rename the activity in the admin panel.

---

## Brimham Rocks
status: include
websiteUrl: https://www.nationaltrust.org.uk/visit/yorkshire/brimham-rocks
imageUrl: /images/activities/brimham-rocks.jpg
description: Scramble and climb among giant ancient rock formations balanced by nature — no ropes needed! Explore weird and wonderful shapes on the open moorland with stunning Yorkshire views.
category: nature
costTier: free
weather: sunny
setting: outdoor
food: nearby
prebooking: false

---

## Cannon Hall Farm
status: include
websiteUrl: https://www.cannonhallfarm.co.uk
imageUrl: /images/activities/cannon-hall-farm.jpg
description: Meet hundreds of animals, race through Europe's biggest tube maze, and play all day on one of northern England's largest adventure playgrounds on a real working Yorkshire farm.
category: farm
costTier: moderate
weather: both
setting: both
food: on-site
prebooking: true

---

## Cliffe Castle Museum
status: include
websiteUrl: https://bradfordmuseums.org/venue/cliffe-castle-museum/
description: Explore a real Victorian millionaire's castle filled with sparkling rooms, nature collections, fossils, and beautiful stained glass — completely free to enter!
category: museum
costTier: free
weather: rainy-friendly
setting: both
food: none
prebooking: false

---

## Cow and Calf Rocks
status: include
websiteUrl: https://www.visitbradford.com/things-to-do/cow-and-calf-rocks-p1166841
description: Climb famous millstone grit boulders on the moor and enjoy spectacular views over Ilkley and Wharfedale — a brilliant free scramble for adventurous families!
category: nature
costTier: free
weather: sunny
setting: outdoor
food: nearby
prebooking: false

---

## Dalby Forest
status: include
websiteUrl: https://www.forestryengland.uk/dalby-forest
imageUrl: /images/activities/dalby-forest.jpg
description: Follow the Gruffalo Trail, zoom around mountain bike tracks, and discover Go Ape adventures through 8,500 acres of stunning North Yorkshire forest — fun for every age!
category: nature
costTier: cheap
weather: both
setting: outdoor
food: on-site
prebooking: false

---

## East Riddlesden Hall (NT)
status: include
websiteUrl: https://www.nationaltrust.org.uk/visit/yorkshire/east-riddlesden-hall
description: Discover a 17th-century manor house with a famous Great Barn, a mud kitchen, trim trail play area, and cosy tearoom — history made fun for the whole family!
category: heritage
costTier: moderate
weather: both
setting: both
food: on-site
prebooking: false

---

## Emmerdale Studio Experience
status: include
websiteUrl: https://www.emmerdalestudioexperience.co.uk
description: Step behind the scenes of a real TV soap, explore full-size set recreations, and find out how Emmerdale is made — with real props and costumes to discover!
category: museum
costTier: premium
weather: rainy-friendly
setting: indoor
food: nearby
prebooking: true

---

## Eureka! The National Children's Museum
status: include
websiteUrl: https://play.eureka.org.uk
imageUrl: /images/activities/eureka.jpg
description: Discover, play and learn across six amazing themed zones with over 400 hands-on exhibits built just for children — the UK's only fully interactive children's museum!
category: museum
costTier: premium
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: false

---

## Farmer Copleys
status: include
websiteUrl: https://farmercopleys.co.uk
description: Pick your own strawberries, race through a giant maize maze, bounce on the jumping pillow, and meet farmyard animals on this award-winning Yorkshire farm!
category: farm
costTier: cheap
weather: both
setting: both
food: on-site
prebooking: false

---

## Flamingo Land
status: include
websiteUrl: https://www.flamingoland.co.uk
description: Ride thrilling roller coasters, visit an award-winning zoo with lions and giraffes, and enjoy a full theme park packed with rides for families — Yorkshire's ultimate big day out!
category: adventure
costTier: premium
weather: both
setting: both
food: on-site
prebooking: true

---

## Forbidden Corner
status: include
websiteUrl: https://www.theforbiddencorner.co.uk
description: Explore a secret labyrinth of tunnels, chambers, riddles and surprises hidden inside a Yorkshire Dales estate — part puzzle, part adventure, totally unlike anything else!
category: adventure
costTier: premium
weather: sunny
setting: outdoor
food: none
prebooking: true

---

## Fountains Abbey & Studley Royal (NT)
status: include
websiteUrl: https://www.nationaltrust.org.uk/visit/yorkshire/fountains-abbey-and-studley-royal-water-garden
description: Explore dramatic ruins of a great medieval monastery inside a stunning UNESCO World Heritage water garden and deer park — breathtaking and totally free for NT members!
category: heritage
costTier: premium
weather: both
setting: both
food: on-site
prebooking: false

---

## Golden Acre Park
status: include
websiteUrl: https://www.leeds.gov.uk/parks-and-countryside/major-parks/golden-acre-park
description: Run free through beautiful gardens, spot birds and wildlife around the lake, and enjoy wide open green spaces just a few miles from Leeds city centre — totally free!
category: nature
costTier: free
weather: sunny
setting: outdoor
food: on-site
prebooking: false

---

## Harewood House
status: include
websiteUrl: https://harewood.org
imageUrl: /images/activities/harewood-house.jpg
description: Explore a magnificent stately home, roam adventure playgrounds, get close to exotic birds in the Bird Garden, and discover beautiful gardens and lakeside walks.
category: heritage
costTier: moderate
weather: both
setting: both
food: on-site
prebooking: false

---

## Hesketh Farm
status: include
websiteUrl: https://heskethfarmpark.co.uk
imageUrl: /images/activities/hesketh-farm.jpg
description: Feed and meet over a thousand animals on a real working Dales farm, ride pedal go-karts, bounce through the straw maze, and enjoy tractor rides near Bolton Abbey!
category: farm
costTier: moderate
weather: both
setting: both
food: on-site
prebooking: false

---

## Hornsea Freeport
status: include
websiteUrl: https://hornseavillage.com
description: Visit Bugtopia tropical zoo with free-flying butterflies and reptiles, splash in Beach Cove soft play, and browse independent shops at this fun East Yorkshire village.
category: rainy-day
costTier: cheap
weather: rainy-friendly
setting: both
food: on-site
prebooking: false

---

## How Stean Gorge
status: include
websiteUrl: https://www.howstean.co.uk
description: Walk through a dramatic limestone gorge, crawl through Tom Taylor's Cave, and splash along natural pathways carved by water over thousands of years in the Yorkshire Dales!
category: nature
costTier: cheap
weather: sunny
setting: outdoor
food: on-site
prebooking: false

---

## Huddersfield Splash Park
status: include
websiteUrl: https://kal.org.uk/centres/huddersfield-leisure-centre/
description: Splash through water slides and jets at this brilliant indoor splash park — a fantastic way to cool off and have fun whatever the weather outside!
category: water
costTier: cheap
weather: rainy-friendly
setting: indoor
food: none
prebooking: true

---

## Ilkley Lido
status: include
websiteUrl: https://ilkleypoolandlido.co.uk
description: Swim in a beautiful outdoor lido surrounded by the Yorkshire moors — a classic British summer experience with an outdoor pool open during the warmer months!
category: water
costTier: cheap
weather: sunny
setting: outdoor
food: on-site
prebooking: true

---

## Jedidiah's Party at Stockeld Park
status: include
websiteUrl: https://stockeldpark.co.uk
description: Join Jedidiah the Scarecrow for magical outdoor adventures, trails, and surprises across Stockeld Park's beautiful estate — a uniquely enchanting Yorkshire experience!
category: adventure
costTier: moderate
weather: sunny
setting: outdoor
food: on-site
prebooking: true

---

## Knaresborough Castle & Museum
status: include
websiteUrl: https://www.northyorks.gov.uk/leisure-tourism-and-culture/museums-and-galleries/museums-harrogate-area/knaresborough-castle-and-museum
description: Climb a real medieval castle keep, explore the dungeon, and discover local history — with brilliant views over the River Nidd and gorge below!
category: heritage
costTier: cheap
weather: both
setting: both
food: nearby
prebooking: false

---

## Knaresborough Paddling Pool
status: include
websiteUrl: https://visitnorthyorkshire.com/index/bebra-gardens-knaresborough
description: Splash and play in a free outdoor paddling pool in beautiful Bebra Gardens beside Knaresborough Castle — open through the summer holidays each year!
category: water
costTier: free
weather: sunny
setting: outdoor
food: none
prebooking: false

---

## Kirkstall Abbey
status: include
websiteUrl: https://museumsandgalleries.leeds.gov.uk/kirkstall-abbey-b51d
imageUrl: /images/activities/kirkstall-abbey.jpg
description: Run freely through the magnificent ruins of a 12th-century monastery just outside Leeds — one of England's best-preserved medieval abbeys, free to explore anytime!
category: heritage
costTier: free
weather: both
setting: outdoor
food: nearby
prebooking: false

---

## Leeds Corn Exchange
status: include
websiteUrl: https://www.leedscornexchange.co.uk
imageUrl: /images/activities/leeds-corn-exchange.jpg
description: Marvel at a stunning Victorian domed building in the heart of Leeds, browse quirky independent shops, and enjoy food from creative local vendors — free to enter anytime!
category: rainy-day
costTier: free
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: false

---

## Leeds Industrial Museum at Armley Mills
status: include
websiteUrl: https://museumsandgalleries.leeds.gov.uk/leeds-industrial-museum-trhc
imageUrl: /images/activities/leeds-industrial-museum.jpg
description: Discover how Leeds became a great industrial city — watch giant mill engines, explore locomotives, and find out how cloth was woven in a real Victorian woollen mill.
category: museum
costTier: cheap
weather: rainy-friendly
setting: indoor
food: none
prebooking: false

---

## Leeds Kirkgate Market
status: include
websiteUrl: https://markets.leeds.gov.uk/
imageUrl: /images/activities/leeds-kirkgate-market.jpg
description: Explore one of Europe's largest and most historic indoor markets! Wander past hundreds of colourful stalls selling food, clothes, toys, and tasty street snacks.
category: rainy-day
costTier: free
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: false

---

## Lotherton Hall & Estate
status: include
websiteUrl: https://museumsandgalleries.leeds.gov.uk/lotherton-mbrx
imageUrl: /images/activities/lotherton-hall.jpg
description: Discover a gorgeous country estate with a real zoo! Meet meerkats and flamingos at Wildlife World, explore the grand hall, and roam acres of beautiful gardens.
category: heritage
costTier: cheap
weather: both
setting: both
food: on-site
prebooking: false

---

## Middleton Railway
status: include
websiteUrl: https://middletonrailway.org.uk/
description: Ride the world's oldest working railway! Climb aboard a real steam or diesel train and chug through Leeds on a heritage line that has been running since 1758.
category: heritage
costTier: cheap
weather: sunny
setting: outdoor
food: on-site
prebooking: false

---

## Mother Shiptons Cave
status: include
websiteUrl: https://www.mothershipton.co.uk/
description: Visit England's oldest tourist attraction and see the magical Petrifying Well that turns objects to stone! Explore riverside walks and discover the legend of the famous prophetess.
category: heritage
costTier: moderate
weather: both
setting: both
food: on-site
prebooking: false

---

## National Coal Mining Museum
status: include
websiteUrl: https://www.ncm.org.uk/
imageUrl: /images/activities/national-coal-mining-museum.jpg
description: Go underground into a real coal mine for free! Ride the pit cage deep below the surface and discover the incredible history of Britain's coal industry — amazing and totally free!
category: museum
costTier: free
weather: both
setting: both
food: on-site
prebooking: false

---

## National Media Museum
status: include
websiteUrl: https://www.scienceandmediamuseum.org.uk/
imageUrl: /images/activities/national-media-museum.jpg
description: Explore eight floors packed with photography, TV, animation and video games! Watch films in the UK's first IMAX cinema and discover the science of light and colour — for free!
category: museum
costTier: free
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: false

---

## National Railway Museum
status: include
websiteUrl: https://www.railwaymuseum.org.uk/
description: Discover the world's greatest railway museum for free! Stand next to record-breaking Mallard, climb aboard iconic locomotives, and explore enormous engine halls full of history.
category: museum
costTier: free
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: false

---

## Ninja Warrior UK Adventure Park (Leeds)
status: include
websiteUrl: https://ninjawarrioruk.co.uk/leeds/
description: Tackle awesome assault courses inspired by the hit TV show! Jump, climb and swing across giant obstacles — can you beat the Ninja course?
category: adventure
costTier: moderate
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: true

---

## Nostell (NT)
status: include
websiteUrl: https://www.nationaltrust.org.uk/visit/yorkshire/nostell
description: Explore one of England's grandest stately homes surrounded by 300 acres of stunning parkland! Spot rare Chippendale furniture, play in the adventure area, and cycle the grounds.
category: heritage
costTier: moderate
weather: both
setting: both
food: on-site
prebooking: false

---

## Nunnington Hall (NT)
status: include
websiteUrl: https://www.nationaltrust.org.uk/visit/yorkshire/nunnington-hall
description: Discover a beautiful Yorkshire manor house nestled by a winding river! Wander five acres of lovely gardens, explore the cosy historic rooms, and enjoy a treat in the tearoom.
category: heritage
costTier: moderate
weather: both
setting: both
food: on-site
prebooking: false

---

## Parcevall Hall Gardens
status: include
websiteUrl: https://www.parcevallhallgardens.co.uk/
description: Wander through 24 acres of magical gardens rising high into the Yorkshire Dales! Find hidden woodland paths, colourful terraces, and amazing views — then stop for cake in the tearoom.
category: nature
costTier: cheap
weather: sunny
setting: outdoor
food: on-site
prebooking: false

---

## Pirate Adventure Crazy Golf (Harrogate)
status: include
websiteUrl: https://www.piratesadventuregolf.com/
description: Play a swashbuckling round of pirate-themed crazy golf! Putt past cannons, treasure chests, and shipwrecks on a fun indoor adventure course the whole crew will love!
category: rainy-day
costTier: cheap
weather: rainy-friendly
setting: indoor
food: none
prebooking: false

---

## RHS Garden Harlow Carr
status: include
websiteUrl: https://www.rhs.org.uk/gardens/harlow-carr
imageUrl: /images/activities/rhs-harlow-carr.jpg
description: Explore over 60 acres of stunning RHS gardens on the edge of Harrogate! Discover beautiful seasonal plants, splash in the stream garden, and visit the famous Betty's Tearoom!
category: nature
costTier: moderate
weather: both
setting: both
food: on-site
prebooking: false

---

## Ripley Castle & Gardens
status: include
websiteUrl: https://www.ripleycastle.co.uk/
description: Step inside a real 700-year-old castle and explore beautiful walled gardens! Discover centuries of history, roam the estate grounds, and spot deer in the parkland.
category: heritage
costTier: moderate
weather: both
setting: both
food: on-site
prebooking: false

---

## Rievaulx Abbey
status: include
websiteUrl: https://www.english-heritage.org.uk/visit/places/rievaulx-abbey/
imageUrl: /images/activities/rievaulx-abbey.jpg
description: Explore England's most majestic ruined abbey hidden in a stunning wooded valley! Wander through towering ancient arches and discover how medieval monks lived — breathtaking!
category: heritage
costTier: moderate
weather: both
setting: outdoor
food: on-site
prebooking: false

---

## Roundhay Park
status: include
websiteUrl: https://www.leeds.gov.uk/parks-and-countryside/major-parks/roundhay-park
description: Run wild in one of Europe's biggest city parks! Splash by the lakes, ride the land train, explore gorgeous gardens, and enjoy huge open spaces perfect for picnics and play.
category: nature
costTier: free
weather: sunny
setting: outdoor
food: on-site
prebooking: false

---

## Royal Armouries Museum
status: include
websiteUrl: https://royalarmouries.org/visit-us/royal-armouries-museum-leeds/
description: Discover thousands of amazing weapons and armour from throughout history — for free! Admire Henry VIII's armour, samurai swords, and even a giant elephant armour.
category: museum
costTier: free
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: false

---

## Skipton Castle
status: include
websiteUrl: https://www.skiptoncastle.co.uk/
description: Explore one of England's best-preserved medieval castles! Climb ancient towers, walk through six impressive courtyards, and discover 900 years of history in the gateway to the Dales.
category: heritage
costTier: cheap
weather: both
setting: both
food: none
prebooking: false

---

## Sledgehammer Smash Room (Leeds)
status: skip
websiteUrl: https://smashleeds.co.uk/
description: Put on your safety gear and smash plates, screens, and bottles to pieces with a real sledgehammer! A wild, action-packed experience for older kids and grown-ups.
category: rainy-day
costTier: moderate
weather: rainy-friendly
setting: indoor
food: none
prebooking: true

---

## Stockeld Park
status: include
websiteUrl: https://stockeldpark.co.uk/
description: Have the ultimate outdoor adventure at Yorkshire's best family park! Tackle themed playgrounds, get lost in a giant yew maze, and explore magical countryside near Harrogate!
category: adventure
costTier: premium
weather: both
setting: both
food: on-site
prebooking: true

---

## Stump Cross Caverns
status: include
websiteUrl: https://www.stumpcrosscaverns.co.uk/
imageUrl: /images/activities/stump-cross-caverns.jpg
description: Venture underground into a real ancient cave system! Marvel at incredible stalactites and stalagmites that took thousands of years to form deep beneath the Yorkshire Dales.
category: nature
costTier: moderate
weather: rainy-friendly
setting: indoor
food: none
prebooking: false

---

## Temple Newsam
status: include
websiteUrl: https://museumsandgalleries.leeds.gov.uk/temple-newsam-jg6y
imageUrl: /images/activities/temple-newsam.jpg
description: Explore a magnificent Tudor-Jacobean mansion set in 1,500 acres of parkland! Visit rare breed animals on the working farm, play in the Play Barn, and roam stunning grounds.
category: heritage
costTier: free
weather: both
setting: both
food: on-site
prebooking: false

---

## Thackray Medical Museum
status: include
websiteUrl: https://thackraymuseum.co.uk/
imageUrl: /images/activities/thackray-medical-museum.jpg
description: Discover the gross, incredible, and amazing story of medicine through the ages! Walk the streets of Victorian Leeds and explore how doctors and surgeons changed the world.
category: museum
costTier: moderate
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: false

---

## The Deep
status: include
websiteUrl: https://www.thedeep.co.uk/
description: Dive into one of the world's most spectacular aquariums! Come face to face with sharks, turtles, stingrays, and penguins as you journey through millions of years of ocean history.
category: museum
costTier: premium
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: false

---

## Tropical World
status: include
websiteUrl: https://tropicalworld.leeds.gov.uk/
description: Step into a steamy tropical paradise bursting with exotic animals and plants! Spot crocodiles, butterflies, meerkats, and monkeys across themed houses from rainforest to desert.
category: museum
costTier: cheap
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: false

---

## Wentworth Castle Gardens
status: include
websiteUrl: https://www.wentworthcastle.org
description: Explore stunning historic gardens with a castle folly, sensory trails, orienteering, and an adventure play area set in beautiful South Yorkshire parkland.
category: nature
costTier: cheap
weather: both
setting: outdoor
food: on-site
prebooking: false

---

## Williams Den
status: include
websiteUrl: https://www.williamsden.co.uk
imageUrl: /images/activities/williams-den.jpg
description: Discover epic indoor and outdoor adventure play with zip wires, climbing towers, sand and water play, a giant treehouse, and wild woodland trails for all ages!
category: adventure
costTier: moderate
weather: both
setting: both
food: on-site
prebooking: true

---

## York Chocolate Story
status: include
websiteUrl: https://www.yorkschocolatestory.com
description: Discover 4,000 years of chocolate history on a guided tour, make your very own chocolate treats, and find out how York's famous sweet story began!
category: museum
costTier: moderate
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: true

---

## York Dungeon
status: include
websiteUrl: https://www.thedungeons.com/york/
imageUrl: /images/activities/york-dungeon.jpg
description: Brave York's darkest history with live actors, jaw-dropping shows, and thrilling tales of plague, Vikings, and gruesome legends — not for the faint-hearted!
category: adventure
costTier: premium
weather: rainy-friendly
setting: indoor
food: none
prebooking: true

---

## York Maze
status: include
websiteUrl: https://www.yorkmaze.com
description: Get lost in one of Europe's biggest mazes and enjoy over 20 rides, shows, and attractions on a giant farm site packed with outdoor family fun — an epic summer day out!
category: adventure
costTier: premium
weather: sunny
setting: outdoor
food: on-site
prebooking: true

---

## York Minster (free entry to grounds)
status: include
websiteUrl: https://yorkminster.org
description: Gaze up at one of Europe's greatest Gothic cathedrals, explore the ancient grounds and gardens, and soak up a thousand years of history in the heart of York — free!
category: heritage
costTier: free
weather: both
setting: both
food: nearby
prebooking: false

---

## Yorkshire Dales Falconry Centre
status: include
websiteUrl: https://www.settlefalconry.co.uk
description: Get up close with magnificent birds of prey, wear the falconer's glove, and meet owls, hawks, and eagles in the stunning Yorkshire Dales countryside!
category: nature
costTier: moderate
weather: both
setting: outdoor
food: none
prebooking: true

---

## Yorkshire Lavender
status: include
websiteUrl: https://www.yorkshirelavender.com
imageUrl: /images/activities/yorkshire-lavender.jpg
description: Run through rows of beautiful purple lavender fields, explore lovely gardens, sniff amazing scents, and enjoy homemade treats at this gorgeous family farm near York!
category: nature
costTier: cheap
weather: sunny
setting: outdoor
food: on-site
prebooking: false

---

## Yorkshire Museum
status: include
websiteUrl: https://www.yorkshiremuseum.org.uk
imageUrl: /images/activities/yorkshire-museum.jpg
description: Discover real Roman treasures, Viking jewels, and mighty dinosaur fossils inside York's stunning museum, surrounded by beautiful gardens to explore outside!
category: museum
costTier: cheap
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: false

---

## Yorkshire Sculpture Park
status: include
websiteUrl: https://ysp.org.uk
imageUrl: /images/activities/yorkshire-sculpture-park.jpg
description: Wander 500 acres of parkland dotted with incredible giant sculptures, spot outdoor art among the trees, and explore indoor galleries — all in one amazing free adventure!
category: nature
costTier: free
weather: both
setting: both
food: on-site
prebooking: false

---

## Yorkshire Wildlife Park
status: include
websiteUrl: https://www.yorkshirewildlifepark.com
imageUrl: /images/activities/yorkshire-wildlife-park.jpg
description: Come face to face with polar bears, lions, giraffes, and hundreds more amazing animals on an exciting walk-through wildlife adventure near Doncaster!
category: nature
costTier: premium
weather: both
setting: outdoor
food: on-site
prebooking: false

---

## Jorvik Viking Centre
status: include
websiteUrl: https://www.jorvikvikingcentre.co.uk
description: Time-travel back to Viking York in AD 960, ride through a reconstructed Viking city, and meet real archaeological finds from one of Britain's greatest excavations!
category: museum
costTier: moderate
weather: rainy-friendly
setting: indoor
food: none
prebooking: true

---

## Aysgarth Falls
status: include
websiteUrl: https://www.yorkshiredales.org.uk/places/aysgarth_falls_national_park_centre/
imageUrl: /images/activities/aysgarth-falls.jpg
description: Marvel at three spectacular waterfalls crashing over ancient limestone steps on the River Ure, with beautiful walks through the heart of the Yorkshire Dales!
category: nature
costTier: free
weather: both
setting: outdoor
food: on-site
prebooking: false

---

## Bolton Abbey
status: include
websiteUrl: https://boltonabbey.com
description: Explore romantic medieval abbey ruins, step across the famous Stepping Stones over the River Wharfe, and roam 30,000 acres of stunning Yorkshire Dales countryside!
category: heritage
costTier: moderate
weather: both
setting: both
food: on-site
prebooking: false

---

## Filey Beach
status: include
websiteUrl: https://visitnorthyorkshire.com/index/filey-beach
description: Race across five miles of golden sand, splash in the sea, build epic sandcastles, and enjoy traditional seaside fun at one of Yorkshire's most beautiful beaches!
category: water
costTier: free
weather: sunny
setting: outdoor
food: on-site
prebooking: false

---

## Harrogate Turkish Baths
status: include
websiteUrl: https://www.turkishbathsharrogate.co.uk
description: Step inside a breathtaking Victorian Moorish spa and admire the stunning tilework on a guided architectural tour of one of Britain's most beautiful historic buildings!
category: rainy-day
costTier: moderate
weather: rainy-friendly
setting: indoor
food: none
prebooking: true

---

## Magna Science Adventure Centre
status: include
websiteUrl: https://www.visitmagna.co.uk
imageUrl: /images/activities/magna-science-centre.jpg
description: Ignite massive fire tornadoes, control jets of water, and experiment with electricity and air at this jaw-dropping science adventure centre inside a former steelworks!
category: museum
costTier: premium
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: false

---

## Otley Chevin Forest Park
status: include
websiteUrl: https://www.chevinforest.co.uk
description: Roam 700 acres of ancient woodland, scramble over rocky crags, spot wildlife, and discover hidden ponds on exciting trails above the Wharfe Valley near Otley!
category: nature
costTier: free
weather: both
setting: outdoor
food: none
prebooking: false

---

## Piece Hall Halifax
status: include
websiteUrl: https://www.thepiecehall.co.uk
description: Explore a stunning 18th-century cloth hall turned vibrant cultural quarter — with independent shops, cafes, open-air events, and a beautiful colonnaded courtyard!
category: heritage
costTier: free
weather: both
setting: both
food: on-site
prebooking: false

---

## Scarborough Castle
status: include
websiteUrl: https://www.english-heritage.org.uk/visit/places/scarborough-castle/
imageUrl: /images/activities/scarborough-castle.jpg
description: Storm a real medieval castle perched on dramatic clifftops above the sea, explore over 3,000 years of history, and enjoy breathtaking views of Scarborough Bay!
category: heritage
costTier: cheap
weather: both
setting: outdoor
food: none
prebooking: false

---

## Scarborough Sea Life Sanctuary
status: include
websiteUrl: https://www.visitsealife.com/scarborough/
imageUrl: /images/activities/scarborough-sea-life.jpg
description: Come nose to nose with sharks, rays, seahorses, rescued seals, and hundreds of amazing sea creatures at Scarborough's brilliant aquarium and seal sanctuary!
category: museum
costTier: premium
weather: rainy-friendly
setting: indoor
food: on-site
prebooking: false

---

## Shibden Hall
status: include
websiteUrl: https://museums.calderdale.gov.uk/visit/shibden-hall
imageUrl: /images/activities/shibden-hall.jpg
description: Explore a fascinating 600-year-old manor house, dress up in historic costumes, and roam the beautiful parkland that inspired TV's Gentleman Jack!
category: heritage
costTier: cheap
weather: both
setting: both
food: on-site
prebooking: true

---

## Skipton Woods
status: include
websiteUrl: https://www.woodlandtrust.org.uk/visiting-woods/woods/skipton-castle-woods/
imageUrl: /images/activities/skipton-woods.jpg
description: Wander through magical ancient woodland hidden behind Skipton Castle, spot kingfishers and woodpeckers, and explore secret paths along a beautiful beck!
category: nature
costTier: free
weather: both
setting: outdoor
food: none
prebooking: false
