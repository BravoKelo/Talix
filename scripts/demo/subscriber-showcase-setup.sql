-- Development-only subscriber showcase data.
-- This script changes demo content only; it does not change schema, billing, auth,
-- subscription enforcement, or production data.

begin;

update public.subscriptions s
set name = v.name,
    description = v.description,
    website_path = 'talix_template',
    website_template = v.template,
    website_live_template = v.template,
    header_photo_url = 'https://talix-git-feature-website-owner-onboarding-bravokelo.vercel.app' || v.hero,
    logo_url = null,
    header_identity = 'name',
    accent = v.accent
from (values
  ('restaurant-demo', 'Cedar & Stone Kitchen', 'Cedar & Stone Kitchen began around a shared table and a simple idea: neighborhood food should feel generous, seasonal, and unhurried. Our kitchen turns familiar ingredients into comforting breakfasts, bright lunches, fresh bakery favorites, and easy pickup meals made for everyday life.', 'order_first', '/demo-showcase/cedar-stone-kitchen-hero.webp', '#a6482f'),
  ('equipment-rental-demo', 'Northline Tool Rental', 'Northline Tool Rental helps homeowners, tradespeople, and small crews get the right equipment without buying what they only need for a day. Every rental is inspected between jobs, and our counter team can help match tools, safety gear, and consumables to the work ahead.', 'browse_shop', '/demo-showcase/northline-tool-rental-hero.webp', '#c66a2b'),
  ('hospitality-demo', 'Harborlight Guest House', 'Harborlight Guest House is a relaxed coastal stay shaped by quiet mornings, thoughtful details, and genuinely local hospitality. Our guest shop brings together the practical essentials, welcome gifts, and waterside comforts visitors most often want during their stay.', 'visit_order', '/demo-showcase/harborlight-guest-house-hero.webp', '#326b78'),
  ('hair-salon-demo', 'Marlow & Finch Salon', 'Marlow & Finch Salon pairs considered cuts and color with practical care that works beyond the appointment. Our stylists choose every cleanser, treatment, finishing product, and accessory for healthy hair, effortless routines, and results clients can recreate at home.', 'story_shop', '/demo-showcase/marlow-finch-salon-hero.webp', '#8f5848'),
  ('marina-demo', 'Bluewater Marina Supply', 'Bluewater Marina Supply serves boaters with dependable dockside gear, safety essentials, and practical advice from people who know the harbor. Whether preparing for a weekend cruise or handling routine maintenance, customers can find the basics they need before leaving the dock.', 'visit_order', '/demo-showcase/bluewater-marina-hero.webp', '#23667a'),
  ('retail-demo', 'Field & Found', 'Field & Found is a neighborhood shop for useful objects with lasting character. We choose tactile stationery, thoughtful home accents, dependable bags, and easy gifts that earn a place in daily routines rather than adding clutter.', 'browse_shop', '/demo-showcase/field-found-hero.webp', '#8a5b38'),
  ('new-business-demo', 'Juniper Pet Supply', 'Juniper Pet Supply makes everyday care simpler with durable walking gear, wholesome treats, well-designed feeding essentials, and playful enrichment for dogs and cats. Our team favors practical products, honest materials, and friendly guidance for every stage of life.', 'browse_shop', '/demo-showcase/juniper-pet-supply-hero.webp', '#3f6f58')
) as v(slug, name, description, template, hero, accent)
where s.slug = v.slug;

update public.locations l
set name = v.new_name,
    address = v.address,
    phone = v.phone,
    hours = v.hours
from public.subscriptions s,
(values
  ('restaurant-demo','Dining Room','Cedar & Stone Kitchen','145 Alder Street, Port Alder, WA 98104','202-555-0101','Mon–Fri 7 am–8 pm; Sat–Sun 8 am–8 pm'),
  ('restaurant-demo','Second Location','Riverside Counter','28 Riverwalk Avenue, Port Alder, WA 98109','202-555-0102','Mon–Fri 7 am–3 pm; Sat–Sun 8 am–3 pm'),
  ('restaurant-demo','Private Studio','Catering Kitchen','410 Foundry Lane, Port Alder, WA 98134','202-555-0103','By appointment'),
  ('equipment-rental-demo','Equipment Counter','Northline Central Yard','725 Foundry Road, Port Alder, WA 98134','202-555-0111','Mon–Fri 6:30 am–6 pm; Sat 7 am–4 pm'),
  ('equipment-rental-demo','Second Location','Northline East Yard','1840 Ridgeway Drive, Port Alder, WA 98118','202-555-0112','Mon–Fri 7 am–5:30 pm; Sat 8 am–3 pm'),
  ('equipment-rental-demo','Private Studio','Service Workshop','730 Foundry Road, Port Alder, WA 98134','202-555-0113','Staff access only'),
  ('hospitality-demo','Guest Shop','Harborlight Guest House','12 Beacon Point Road, Port Alder, WA 98121','202-555-0121','Front desk and guest shop open daily, 7 am–10 pm'),
  ('hospitality-demo','Second Location','Harborlight Beach House','86 Shoreline Way, Port Alder, WA 98116','202-555-0122','Guest services daily, 8 am–8 pm'),
  ('hospitality-demo','Private Studio','Guest Services Office','14 Beacon Point Road, Port Alder, WA 98121','202-555-0123','Staff access only'),
  ('hair-salon-demo','Main Salon','Marlow & Finch — Alder Street','320 Alder Street, Port Alder, WA 98104','202-555-0131','Tue–Fri 9 am–7 pm; Sat 9 am–5 pm'),
  ('hair-salon-demo','Second Location','Marlow & Finch — North Market','55 North Market Lane, Port Alder, WA 98103','202-555-0132','Tue–Fri 10 am–7 pm; Sat 9 am–5 pm'),
  ('hair-salon-demo','Private Studio','Education Studio','322 Alder Street, Port Alder, WA 98104','202-555-0133','Classes by reservation'),
  ('marina-demo','Harbor Shop','Bluewater Harbor Shop','1 Marina Walk, Port Alder, WA 98121','202-555-0141','Daily 7 am–7 pm; fuel dock closes at 6 pm'),
  ('marina-demo','Second Location','Bluewater Boatyard Counter','640 Channel Road, Port Alder, WA 98134','202-555-0142','Mon–Sat 7 am–5 pm'),
  ('marina-demo','Private Studio','Service Dock','Pier 4, Port Alder Marina, WA 98121','202-555-0143','Service appointments only'),
  ('retail-demo','Main Store','Field & Found — Alder Street','216 Alder Street, Port Alder, WA 98104','202-555-0151','Mon–Sat 10 am–6 pm; Sun 11 am–4 pm'),
  ('retail-demo','Market Annex','Field & Found — Market Annex','42 North Market Lane, Port Alder, WA 98103','202-555-0152','Tue–Sat 10 am–5 pm'),
  ('retail-demo','Studio (unpublished)','Field & Found Studio','218 Alder Street, Port Alder, WA 98104','202-555-0153','Workshops by reservation'),
  ('new-business-demo','First Location','Juniper Pet Supply','908 Greenway Avenue, Port Alder, WA 98115','202-555-0161','Mon–Fri 9 am–7 pm; Sat–Sun 9 am–6 pm'),
  ('new-business-demo','Future Location','Juniper Grooming Room','910 Greenway Avenue, Port Alder, WA 98115','202-555-0162','Appointments available soon')
) as v(slug, old_name, new_name, address, phone, hours)
where s.slug = v.slug and l.subscription_id = s.id and l.name = v.old_name;

-- Distinct, production-quality brand systems for each subscriber showcase.
update public.subscriptions s
set logo_url = 'https://talix-git-feature-website-owner-onboarding-bravokelo.vercel.app' || v.logo,
    header_mode = 'custom',
    header_layout = v.layout,
    header_identity = 'name',
    header_background = v.header_background,
    storefront_text = v.storefront_text,
    storefront_button = v.storefront_button,
    storefront_font = v.font,
    storefront_text_size = 'standard',
    tile_corners = v.corners,
    tile_spacing = v.spacing
from (values
  ('restaurant-demo','/demo-showcase/cedar-stone-mark.svg','left','#34251f','#302821','#8f3d2c','serif','subtle','comfortable'),
  ('equipment-rental-demo','/demo-showcase/northline-mark.svg','search','#17242d','#20272b','#c65f27','sans','subtle','compact'),
  ('hospitality-demo','/demo-showcase/harborlight-mark.svg','minimal','#eef3f1','#23363d','#326b78','serif','subtle','comfortable'),
  ('hair-salon-demo','/demo-showcase/marlow-finch-mark.svg','left','#332a28','#342b29','#8f5848','serif','subtle','comfortable'),
  ('marina-demo','/demo-showcase/bluewater-mark.svg','centered','#153f4c','#1f3540','#23667a','sans','subtle','comfortable'),
  ('retail-demo','/demo-showcase/field-found-mark.svg','centered','#25463f','#25332f','#25463f','serif','subtle','compact'),
  ('new-business-demo','/demo-showcase/juniper-mark.svg','left','#294b3a','#28362f','#3f6f58','sans','subtle','comfortable')
) as v(slug,logo,layout,header_background,storefront_text,storefront_button,font,corners,spacing)
where s.slug = v.slug;

-- Replace fixture language with useful, customer-facing catalog copy.
update public.products p
set description = case
  when s.slug = 'restaurant-demo' and p.category = 'Kitchen' then p.name || ' prepared to order with seasonal ingredients and the balanced, comforting flavors our neighborhood kitchen is known for.'
  when s.slug = 'restaurant-demo' and p.category = 'Bakery' then p.name || ' baked in small batches for a tender crumb, rich flavor, and an easy addition to breakfast or an afternoon coffee.'
  when s.slug = 'restaurant-demo' and p.category = 'Drinks' then p.name || ' served chilled or freshly brewed and ready to round out a meal or brighten the middle of the day.'
  when s.slug = 'equipment-rental-demo' and p.category = 'Workshop' then p.name || ' maintained and inspected between rentals for dependable performance on repairs, renovations, and weekend projects.'
  when s.slug = 'equipment-rental-demo' and p.category = 'Site Essentials' then p.name || ' selected for a safer, better-organized work area and reliable everyday use on residential and light commercial jobs.'
  when s.slug = 'equipment-rental-demo' and p.category = 'Safety' then p.name || ' chosen for practical protection and comfortable wear while cutting, sanding, drilling, and handling materials.'
  when s.slug = 'equipment-rental-demo' and p.category = 'Consumables' then p.name || ' sized for common workshop tasks and stocked to keep projects moving without a second supply run.'
  when s.slug = 'hospitality-demo' and p.category = 'Guest Essentials' then p.name || ' selected for comfort and convenience when a traveler needs one more useful item during their stay.'
  when s.slug = 'hospitality-demo' and p.category = 'Welcome Gifts' then p.name || ' thoughtfully presented as an easy arrival surprise, host gift, or small reminder of time by the water.'
  when s.slug = 'hospitality-demo' and p.category = 'Pool & Leisure' then p.name || ' made for unhurried afternoons at the beach, pool, and along the harbor walk.'
  when s.slug = 'hair-salon-demo' and p.category = 'Hair Care' then p.name || ' chosen by our stylists to support healthy hair, manageable texture, and a reliable at-home routine.'
  when s.slug = 'hair-salon-demo' and p.category = 'Styling' then p.name || ' for flexible control, touchable finish, and polished results without unnecessary weight or stiffness.'
  when s.slug = 'hair-salon-demo' and p.category = 'Accessories' then p.name || ' designed to make daily styling gentler, quicker, and easier to repeat at home.'
  when s.slug = 'marina-demo' and p.category = 'Onboard' then p.name || ' built for practical storage and easy handling during a day on the water.'
  when s.slug = 'marina-demo' and p.category = 'Dockside' then p.name || ' selected for dependable everyday use while securing, protecting, and preparing a boat at the dock.'
  when s.slug = 'marina-demo' and p.category = 'Boat Care' then p.name || ' suited to routine cleaning and upkeep in a marine environment.'
  when s.slug = 'marina-demo' and p.category = 'Safety' then p.name || ' chosen as a straightforward addition to a well-prepared onboard safety kit.'
  when s.slug = 'marina-demo' and p.category = 'Harbor Shop' then p.name || ' made for comfortable days around the marina and easy weekends on the water.'
  else replace(replace(replace(p.description, 'This demo item is intentionally unavailable online.', 'Currently available in store only.'), 'Available at the Market Annex demo location.', 'Available at our Market Annex location.'), 'This item intentionally has no image so the storefront fallback can be reviewed.', 'Made on softly textured stock and left blank inside for a personal note.')
end
from public.subscriptions s
where p.subscription_id = s.id
  and s.slug in ('restaurant-demo','equipment-rental-demo','hospitality-demo','hair-salon-demo','marina-demo','retail-demo');

-- Feature photography used above the fold and in previews.
update public.products p
set image_url = 'https://talix-git-feature-website-owner-onboarding-bravokelo.vercel.app' || v.image
from (values
  ('07aa9755-2e27-49c5-a19c-279cb3c83c5c'::uuid,'/demo-showcase/cedar-stone-breakfast-sandwich.webp'),
  ('159c84ea-17d5-46ea-8f5b-17765b4f5e94'::uuid,'/demo-showcase/cedar-stone-butter-croissant.webp'),
  ('f2b01ff9-9fc0-4d98-812f-22279b29570c'::uuid,'/demo-showcase/cedar-stone-chocolate-brownie.webp'),
  ('bd327f07-0661-4b46-8370-a63e65bb80f7'::uuid,'/demo-showcase/cedar-stone-roasted-vegetable-bowl.webp'),
  ('edd7d7e3-1c4e-400c-847a-948a04df5d7b'::uuid,'/demo-showcase/northline-compact-drill.webp'),
  ('ef6bdb1e-588c-47a2-8ca1-79c26514344e'::uuid,'/demo-showcase/northline-drill-bit-set.webp'),
  ('633e51de-420d-408a-ae9e-00d1f406c5fb'::uuid,'/demo-showcase/northline-dust-mask-pack.webp'),
  ('13a29aa3-c3a8-4724-a991-fd42d6908728'::uuid,'/demo-showcase/marlow-finch-daily-shampoo.webp'),
  ('3c437271-793a-46cc-91df-549edc91ae40'::uuid,'/demo-showcase/marlow-finch-finishing-mist.webp'),
  ('8d2b9bc2-5652-4297-bd8a-cd2f277251b4'::uuid,'/demo-showcase/marlow-finch-heat-protection-spray.webp'),
  ('174c458e-1bf9-4d95-b079-aa1d00597ba1'::uuid,'/demo-showcase/harborlight-canvas-day-bag.webp'),
  ('2bc07272-b4f6-45fe-8054-cac6f916b5b5'::uuid,'/demo-showcase/harborlight-chocolate-selection.webp'),
  ('9aae255b-0742-42f2-90e7-a6ee00c95b00'::uuid,'/demo-showcase/harborlight-cotton-slippers.webp'),
  ('af004cab-c966-48c0-acba-7b5c0c4f7288'::uuid,'/demo-showcase/harborlight-travel-toiletry-kit.webp'),
  ('748a25fc-5e3c-459b-803f-f89caeae7605'::uuid,'/demo-showcase/bluewater-adult-buoyancy-vest.webp'),
  ('d9c7cb90-efd2-4a27-b2e1-a2866e7cbec3'::uuid,'/demo-showcase/bluewater-boat-fender.webp'),
  ('411f5bb7-a07c-4719-871d-bc8eccfe66ec'::uuid,'/demo-showcase/bluewater-boat-wash.webp'),
  ('c5f6ea4b-3b2d-4e8c-8c97-e69bb07d44cf'::uuid,'/demo-showcase/bluewater-floating-key-ring.webp'),
  ('2c609d7e-a3d1-4d9c-8e4f-10dd92c492dc'::uuid,'/demo-showcase/bluewater-deck-brush.webp'),
  ('cb335403-97e5-43ae-89d2-9184d5f6b1dc'::uuid,'/demo-showcase/bluewater-dock-line.webp'),
  ('119eb4ab-8a33-4ffb-836f-b983d9b743a6'::uuid,'/demo-showcase/bluewater-dry-storage-bag.webp'),
  ('6d3843a2-d3f5-4658-9b94-569b5db4c5ee'::uuid,'/demo-showcase/bluewater-harbor-cap.webp'),
  ('9be8db0b-b513-47b7-a1dc-a2feb4057733'::uuid,'/demo-showcase/bluewater-marine-sponge.webp'),
  ('512d585b-d0fe-4a29-acd8-244dc2619928'::uuid,'/demo-showcase/bluewater-microfiber-cloth-set.webp'),
  ('7ccf621d-0cc7-41ae-a32d-40f98c073b96'::uuid,'/demo-showcase/bluewater-signal-whistle.webp'),
  ('fd74d07e-a1b6-4811-80b0-1f7dca4f093b'::uuid,'/demo-showcase/bluewater-waterproof-torch.webp'),
  ('dd7c0d64-31af-4631-a91d-acb01cf7cc5f'::uuid,'/demo-showcase/northline-extension-cable.webp'),
  ('8d24a31b-74ec-49fb-858c-34ee0f5574c5'::uuid,'/demo-showcase/northline-folding-work-stand.webp'),
  ('30dbda2f-9dd7-42e7-8153-26466825608c'::uuid,'/demo-showcase/northline-hand-tool-kit.webp'),
  ('e5ac5273-8593-4112-b5ef-e33096446e8d'::uuid,'/demo-showcase/northline-hearing-protection.webp'),
  ('141c2762-12d0-4371-8aec-a82238c69c29'::uuid,'/demo-showcase/northline-orbital-sander.webp'),
  ('54cee2cb-7e50-494e-a4e5-f5894e9a3e2d'::uuid,'/demo-showcase/northline-safety-glasses.webp'),
  ('816a05e9-9245-4f96-b5c3-382f30b72886'::uuid,'/demo-showcase/northline-sanding-disc-pack.webp'),
  ('2887ac5c-5b50-4dd6-ae7d-cebd475d4ec8'::uuid,'/demo-showcase/northline-work-gloves.webp'),
  ('0c828a4d-d628-432c-a007-954b22a44bc1'::uuid,'/demo-showcase/northline-work-light.webp'),
  ('5582dd3a-6662-4f8c-8ca8-83d92884c879'::uuid,'/demo-showcase/marlow-finch-hydrating-conditioner.webp'),
  ('8a00babb-40db-4425-92e1-29a75564c04d'::uuid,'/demo-showcase/marlow-finch-paddle-brush.webp'),
  ('d4e52160-750c-4ff2-8a70-8e9e35b4b319'::uuid,'/demo-showcase/marlow-finch-scalp-care-serum.webp'),
  ('738af428-e990-46e5-90aa-0df982d9c25f'::uuid,'/demo-showcase/marlow-finch-scrunchie-trio.webp'),
  ('d7b61261-b16b-45d3-9b91-25522b5fbbaf'::uuid,'/demo-showcase/marlow-finch-soft-hair-wrap.webp'),
  ('bf7d8dea-dded-483a-b239-731b0353b650'::uuid,'/demo-showcase/marlow-finch-styling-cream.webp'),
  ('4edf9da8-4e78-42d7-8ab8-7b7d6127d20e'::uuid,'/demo-showcase/marlow-finch-texture-spray.webp'),
  ('b67efd12-62b9-40e7-b62c-bf3dfa2fbfd9'::uuid,'/demo-showcase/marlow-finch-weekly-hair-mask.webp'),
  ('055f1b7d-a3d2-47fe-9e4f-e451e3445512'::uuid,'/demo-showcase/marlow-finch-wide-tooth-comb.webp'),
  ('26ed623b-40b2-4b01-9e22-ab834270aa87'::uuid,'/demo-showcase/harborlight-guest-journal.webp'),
  ('08f760ae-c5d7-4d98-9a4f-add0c4470b9f'::uuid,'/demo-showcase/harborlight-local-welcome-basket.webp'),
  ('3e802889-ff38-4d98-b7a3-988e94d2afc7'::uuid,'/demo-showcase/harborlight-postcard-set.webp'),
  ('cbf539aa-a696-4b53-84c2-ad78d1186617'::uuid,'/demo-showcase/harborlight-reusable-water-bottle.webp'),
  ('b3cbad27-e710-4540-b110-8174b986aad0'::uuid,'/demo-showcase/harborlight-sleep-mask.webp'),
  ('beeb1df3-1c76-4fe0-88cd-0668cced6337'::uuid,'/demo-showcase/harborlight-sun-care-lotion.webp'),
  ('e34932f7-66ae-42ab-9b25-56cfed025ca2'::uuid,'/demo-showcase/harborlight-travel-toothbrush-set.webp'),
  ('43f76893-36e3-48ba-9008-5861053171d7'::uuid,'/demo-showcase/harborlight-woven-beach-towel.webp'),
  ('c423ced9-4e73-4b16-a33b-8eb79c72875c'::uuid,'/demo-showcase/cedar-stone-garden-salad.webp'),
  ('8910f936-8edc-410f-90a4-1bbc174031a9'::uuid,'/demo-showcase/cedar-stone-grilled-cheese.webp'),
  ('4df746d7-750f-4dde-b8ce-5ed595bb964a'::uuid,'/demo-showcase/cedar-stone-herb-flatbread.webp'),
  ('47748579-55b0-4649-81b4-27344f6d73d7'::uuid,'/demo-showcase/cedar-stone-house-coffee.webp'),
  ('83528ab5-cde9-47c6-99e9-cf3530f09232'::uuid,'/demo-showcase/cedar-stone-iced-tea.webp'),
  ('d3dbbcfd-7d28-45a8-8153-1e56f48265ea'::uuid,'/demo-showcase/cedar-stone-lemon-cake.webp'),
  ('a8115cbb-65fc-4e22-9f21-1261ca791bc7'::uuid,'/demo-showcase/cedar-stone-sparkling-water.webp'),
  ('693f8e61-e87a-4280-9d65-5cf296bf2a9a'::uuid,'/demo-showcase/cedar-stone-tomato-soup.webp'),
  ('38242a83-5164-4068-b5ba-95ed869e8efb'::uuid,'/demo-showcase/field-found-canvas-pencil-case.webp'),
  ('e0d9d9e1-022f-46c0-b5e1-4c142400e125'::uuid,'/demo-showcase/field-found-canvas-weekender.webp'),
  ('4d55bddf-3581-462b-aae8-fe4300c2ce9c'::uuid,'/demo-showcase/field-found-compact-umbrella.webp'),
  ('30cfa8c4-26ad-40f4-b441-26d401547868'::uuid,'/demo-showcase/field-found-cotton-tea-towel-pair.webp'),
  ('ebb042f8-3917-4679-b33a-5a2382ede0dc'::uuid,'/demo-showcase/field-found-desk-essentials-set.webp'),
  ('6d767275-bc02-4850-a47d-e170e27ccc48'::uuid,'/demo-showcase/field-found-everyday-canvas-tote.webp'),
  ('178b62c4-f9c5-45d3-9aa7-2f3894f77851'::uuid,'/demo-showcase/field-found-everyday-gift-box.webp'),
  ('f6a9f4e5-84ea-4ac1-8468-14a2628a1883'::uuid,'/demo-showcase/field-found-everyday-key-loop.webp'),
  ('04086ed0-0e05-4561-be29-d0e75b546eb2'::uuid,'/demo-showcase/field-found-everyday-notebook.webp'),
  ('87423890-fcc9-416e-9f85-7454a75e4979'::uuid,'/demo-showcase/field-found-insulated-travel-cup.webp'),
  ('3d4258fc-4869-42fc-b5f3-db4ac8e2276a'::uuid,'/demo-showcase/field-found-notebook-duo.webp'),
  ('8439a415-3d1f-46dc-8538-54bad70a32da'::uuid,'/demo-showcase/field-found-pocket-zip-pouch.webp'),
  ('692063d0-8548-46b7-84c8-ebf735babd80'::uuid,'/demo-showcase/field-found-reusable-water-bottle.webp'),
  ('e5fe782d-a29d-49c0-a781-9e538af7f9a1'::uuid,'/demo-showcase/field-found-small-ceramic-planter.webp'),
  ('86625b1f-4f02-41d8-ab74-6a3332ad37ca'::uuid,'/demo-showcase/field-found-small-ceramic-tray.webp'),
  ('76335458-e91a-4016-8ac7-e30fcee222ad'::uuid,'/demo-showcase/field-found-soft-cotton-throw.webp'),
  ('8f2bd667-5adc-4043-8a06-66399782a55c'::uuid,'/demo-showcase/field-found-soft-woven-scarf.webp'),
  ('8134b53e-8f4b-4764-871d-7096c2d6a6a7'::uuid,'/demo-showcase/field-found-studio-ceramic-mug.webp'),
  ('c94aaf6e-2fc0-445e-8460-3308fd8d87b4'::uuid,'/demo-showcase/field-found-weekly-desk-planner.webp'),
  ('6582ef60-c313-4c75-95f4-f16fd24d818a'::uuid,'/demo-showcase/field-found-woven-storage-basket.webp'),
  ('5e9f5d37-b947-4663-82e8-8bc8e8cbb1b1'::uuid,'/demo-showcase/field-found-amber-jar-candle.webp'),
  ('ac73af7b-dba8-4928-ac66-04d427f61d70'::uuid,'/demo-showcase/field-found-brass-writing-pen.webp'),
  ('3f0f6f49-dbd5-4fcf-ada4-d9f4055b5bfb'::uuid,'/demo-showcase/field-found-bud-vase.webp')
) as v(id,image)
where p.id = v.id;

-- Turn the former empty-state account into a complete seventh sales demo.
update public.products p
set name = 'Braided Walking Leash',
    description = 'A soft but durable forest-green rope leash with a comfortable leather handle and solid brass hardware for everyday walks.',
    price_cents = 4200,
    image_url = 'https://talix-git-feature-website-owner-onboarding-bravokelo.vercel.app/demo-showcase/juniper-braided-walking-leash.webp',
    available = true,
    category = 'Walking'
where p.id = '5025545b-630f-4399-9b5c-8b4f2c2b07c5';

update public.products p
set name = 'Ceramic Food Bowl',
    description = 'A low, weighty stoneware bowl with a durable sage glaze that stays put through breakfast and dinner.',
    price_cents = 3600,
    image_url = 'https://talix-git-feature-website-owner-onboarding-bravokelo.vercel.app/demo-showcase/juniper-ceramic-food-bowl.webp',
    available = true,
    category = 'Feeding'
where p.id = 'f19c014d-e429-4304-863e-17d3ff1b4881';

insert into public.products (subscription_id, location_id, name, description, price_cents, image_url, available, options, category)
select s.id, l.id, v.name, v.description, v.price_cents,
       case when v.image_url is null then null else 'https://talix-git-feature-website-owner-onboarding-bravokelo.vercel.app' || v.image_url end,
       v.available, '[]'::jsonb, v.category
from public.subscriptions s
join public.locations l on l.subscription_id=s.id and l.published=true
cross join (values
  ('Natural Dog Treats','Small-batch oat and pumpkin treats with a crisp texture, simple ingredients, and an easy-to-break shape for training.',1400,'/demo-showcase/juniper-natural-dog-treats.webp',true,'Treats'),
  ('Everyday Collar','An adjustable woven collar with smooth edges, sturdy hardware, and a low-profile buckle for comfortable daily wear.',2800,null,true,'Walking'),
  ('Wool Tug Toy','A sturdy hand-felted tug toy made for supervised play, gentle games, and plenty of tail-wagging interaction.',2200,null,true,'Play'),
  ('Slow Feeder Insert','A flexible food-safe insert that helps enthusiastic eaters slow down without replacing a favorite bowl.',1800,null,true,'Feeding'),
  ('Coat & Paw Balm','A gentle unscented balm for dry paws, noses, and small rough patches, packed in a travel-friendly tin.',1600,null,true,'Care'),
  ('Canvas Treat Pouch','A washable clip-on pouch with a wide opening for quick rewards during walks and training sessions.',2600,null,true,'Walking')
) as v(name,description,price_cents,image_url,available,category)
where s.slug='new-business-demo'
  and not exists (select 1 from public.products p where p.subscription_id=s.id and p.name=v.name)
  and l.id=(select l2.id from public.locations l2 where l2.subscription_id=s.id and l2.published=true order by l2.id limit 1);

update public.products p
set image_url = 'https://talix-git-feature-website-owner-onboarding-bravokelo.vercel.app' || v.image
from (values
  ('1dee7cd0-cdf4-4c85-a051-d540933fca1c'::uuid,'/demo-showcase/juniper-canvas-treat-pouch.webp'),
  ('1b6e7683-4133-4a9a-80e4-f9d1c4bdbc63'::uuid,'/demo-showcase/juniper-coat-paw-balm.webp'),
  ('cda63d6d-8c2a-458a-9290-b63ccb04525b'::uuid,'/demo-showcase/juniper-everyday-collar.webp'),
  ('449514bc-9c1d-4822-ae9b-7e92d2cbfb16'::uuid,'/demo-showcase/juniper-slow-feeder-insert.webp'),
  ('76225564-8277-411c-bee7-3b87c7592f73'::uuid,'/demo-showcase/juniper-wool-tug-toy.webp'),
  ('89c1cb4e-5eda-4e8d-a9ea-7cc060957fbf'::uuid,'/demo-showcase/field-found-simple-greeting-card.webp')
) as v(id,image)
where p.id = v.id;

commit;
