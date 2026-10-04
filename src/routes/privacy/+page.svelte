<script>
	import LegalPage from '#lib/components/LegalPage.svelte';
	import { OPERATOR as O } from '#lib/legal.js';
</script>

<LegalPage title="Privacy" lede="What bento.cat keeps about you, why, and what you can do about it.">
	<h2>The short version</h2>
	<ul>
		<li>No ads or tracking pixels. We count page views without identifying visitors. Individual visit records are optional and off until you agree. We don’t sell or rent anything about you.</li>
		<li>If you have a box, we keep what you put in it and the email you sign in with.</li>
		<li>If you allow individual visit records, we save visits under a random browser key. If you’re signed in, the owner can also see your public box among their visitors.</li>
		<li>You can download everything in your box, or delete it, from the editor at any time.</li>
	</ul>

	<h2>Who is responsible</h2>
	<p>{[O.name, ...O.address].join(', ')}. Email <a href="mailto:{O.email}">{O.email}</a>. See the <a href="/imprint">imprint</a>. Write to that address for anything on this page.</p>

	<h2>When you open any page</h2>
	<p>Your browser sends your IP address, the page you asked for, the time and your browser’s user agent. Our host, Prepaid-Hoster.de, uses this to deliver the page and may keep it in short-lived server logs to keep the service running and secure. Each page also connects to our database provider (Convex) and our sign-in provider (Clerk) to load boxes and check whether you’re signed in, so they see your IP address too.</p>
	<p>Legal basis: our legitimate interest in running a working, secure website (Art. 6 (1) (f) GDPR).</p>

	<h3>What your browser stores</h3>
	<ul>
		<li><b>Your privacy choice</b> in local storage for up to 180 days, so we remember whether you allow individual visit records.</li>
		<li><b>An optional statistics key</b> in local storage, created only after you allow individual visit records. It stops an individual visit being recorded twice within half an hour. It is separate from the temporary key used for interactions and is removed when you withdraw consent or your choice expires.</li>
		<li><b>A temporary interaction key and reactions</b> in this tab’s memory, so purrs and sign-ups work without statistics consent. They disappear when the page reloads; we don’t save them in browser storage.</li>
		<li><b>Sign-in cookies</b> set by Clerk, which keep you signed in.</li>
	</ul>
	<p>The privacy choice and sign-in cookies support the features you request (§ 25 (2) no. 2 TDDDG). Storage and use of the statistics key require your consent (§ 25 (1) TDDDG and Art. 6 (1) (a) GDPR). Use “Privacy settings” in the footer of any page, or in the editor menu, to decline or withdraw consent. Withdrawal stops new visit records, removes the stored key and requests deletion of visits recorded under that key. We don’t use advertising cookies.</p>

	<h2>When you visit someone’s box</h2>
	<ul>
		<li><b>Anonymous page views.</b> Our server adds one to a box’s total when its page loads. Only the box and its running total are stored; no visitor key, account, IP address or individual view time is stored with the count. This uses no browser storage and requires no opt-in. Repeat loads, the owner’s own views and automated requests may count too, so this is not a count of unique people. Totals help rank boxes on Explore and are shown to the owner.</li>
		<li><b>Individual visits, only with consent.</b> We record the time and your statistics key, at most once every half hour per box. The owner sees visits over the last 30 days. If you’re signed in and have a box of your own, the owner can also see your box’s name, address and picture among the people who came by. Without consent, we add only to the anonymous page-view total.</li>
		<li><b>Purrs.</b> We store your visitor key against the tile, so each visitor purrs once.</li>
		<li><b>Guestbook scribbles.</b> We store your drawing, the name you give and your visitor key. Scribbles are shown to everyone who visits the box.</li>
		<li><b>Joining a list.</b> If you leave your email on a box’s “subscribe” tile, we store it with your visitor key and show it only to that box’s owner, who can download it. The owner decides what to send you; ask them, or us, to take you off.</li>
	</ul>
	<p>Anonymous totals do not identify visitors. The request needed to serve the page is processed under our legitimate interest in running and understanding the use of the service (Art. 6 (1) (f) GDPR). Legal basis for individual visits: your consent (Art. 6 (1) (a) GDPR). For interactions: providing the features you choose to use (Art. 6 (1) (b) GDPR).</p>

	<h3>Maps and music on a box</h3>
	<ul>
		<li><b>Maps.</b> If a box has a map tile, your browser loads the map pictures straight from OpenFreeMap, which sees your IP address.</li>
		<li><b>Spotify.</b> Music tiles show a cover only. Spotify’s player loads after you press Play, and from then on Spotify’s privacy policy applies.</li>
		<li><b>Links.</b> Following a link takes you to another site with its own privacy policy.</li>
	</ul>

	<h2>When you have a box</h2>
	<ul>
		<li><b>Your account.</b> Clerk handles sign-in. It keeps your email address and, if you use Google, the name and email Google shares. We keep a copy of your email and name so your box knows who owns it.</li>
		<li><b>Your box.</b> Everything you put in it: its address, name, bio, tiles, photos, videos and voice recordings. A box is public, so anyone with the link can see it, and it may appear on the Explore page. Uploaded files are stored with Convex and can be opened by anyone with their link.</li>
		<li><b>Link previews.</b> When you paste a link, our server fetches that page and keeps its title and a copy of its preview image and icon. If you add a GitHub tile, our server fetches the public contribution graph for that username from GitHub and refreshes it from time to time.</li>
		<li><b>Places.</b> When you search for a place for a map tile, what you type is sent to Photon, a search service run by komoot. If you choose to use your current location, your browser asks first, and the coordinates go to Photon to find the place’s name. We only keep the place you pick.</li>
		<li><b>Your microphone.</b> Only while you record a voice note, and only after your browser asks.</li>
		<li><b>Visit statistics.</b> The visit records described above, shown only to you.</li>
	</ul>
	<p>Legal basis: providing your box (Art. 6 (1) (b) GDPR).</p>

	<h2>Who else handles data for us</h2>
	<ul>
		<li><b>Clerk, Inc.</b> (USA): sign-in and account management.</li>
		<li><b>Convex, Inc.</b> (USA): database, file storage and server functions.</li>
		<li><b>Henrik Kramer e.K.</b>, trading as Prepaid-Hoster.de (Germany): hosts the website on servers in Frankfurt am Main.</li>
		<li><b>Google</b>: only if you choose “Continue with Google”.</li>
		<li><b>OpenFreeMap</b>: map pictures, loaded by your browser when a box shows a map.</li>
		<li><b>komoot GmbH</b> (Germany): place search in the editor.</li>
		<li><b>Spotify AB</b> (Sweden): only after you press Play on a music tile.</li>
	</ul>
	<p>Where a provider processes data on our behalf, we have a data processing agreement with them. Some providers are in the USA. Transfers there rely on the EU-U.S. Data Privacy Framework where the provider is certified, and on the EU Standard Contractual Clauses otherwise.</p>

	<h2>How long we keep things</h2>
	<ul>
		<li>Your account and box: until you delete your box.</li>
		<li>Anonymous page-view totals: until the box is deleted. Existing totals also include visits counted under the earlier opt-in system.</li>
		<li>Individual visit records: 30 days, with expired records removed by an hourly cleanup job. After withdrawal, we retain the old key as a blocking marker for 30 days to reject delayed requests from other tabs. Withdrawing consent does not remove anonymous totals.</li>
		<li>Purrs, scribbles and list sign-ups on a box: until the box is deleted. Write to us if you want yours removed sooner.</li>
		<li>Removed or unused uploaded files: 24 hours, so you can undo an edit. Deleting your box queues deletion of its uploaded files without that waiting period.</li>
		<li>Server logs at our providers: usually a few days to a few weeks.</li>
	</ul>
	<p>Deleting your box removes the public page and our account copy immediately, then cleans up its uploaded files and visitor records in batches. Shared demo assets and files still used by another box are kept. We also request closure of your Clerk sign-in account. If that fails, the editor tells you, we record the failure and retry automatically. We keep a minimal deletion record containing the sign-in identifier and deletion status to prevent an old session from recreating the account and to finish any outstanding cleanup.</p>

	<h2>Your rights</h2>
	<p>You can ask us for a copy of the data we hold about you, have it corrected or deleted, restrict how we use it, or get it in a portable format. You can object to processing based on legitimate interest, and withdraw any consent you gave, at any time. The editor’s “Download your data” button gives you everything in your box straight away.</p>
	<p>Write to <a href="mailto:{O.email}">{O.email}</a>. You also have the right to complain to a data protection authority, for example the one where you live or the one responsible for us.</p>
	<p>We don’t make automated decisions about you, and we don’t build profiles.</p>

	<h2>Children</h2>
	<p>You need to be at least 16 to make a box. Visiting boxes is fine at any age.</p>

	<h2>Changes</h2>
	<p>If we change how we handle your data, we’ll update this page and the date at the top. If it’s a big change, we’ll tell box owners by email first.</p>
</LegalPage>
