<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>{m.nav_terms()} · {m.site_name()}</title></svelte:head>

<article class="prose-page">
	<h1>{m.nav_terms()}</h1>
	<p class="draft-note">{m.legal_draft_note()}</p>
	{#if getLocale() === 'en'}
		<ol>
			<li>Reviews reflect the personal opinions of their authors, not of the site.</li>
			<li>
				Content that contains insults, profanity, threats, personal information or personal attacks
				is not allowed. Such content is removed and its author is permanently banned together with
				all of their content.
			</li>
			<li>
				Negative but honest criticism of a course or of the teaching is allowed and is not removed
				on request.
			</li>
			<li>Do not share exam questions, copyrighted material or personal data of others.</li>
			<li>
				Removal requests (for example from an instructor) can be sent to the contact address below.
				Requests are evaluated according to these rules.
			</li>
			<li>The site may change these terms. Continued use means acceptance of the current terms.</li>
		</ol>
	{:else}
		<ol>
			<li>Değerlendirmeler yazarlarının kişisel görüşleridir, sitenin görüşü değildir.</li>
			<li>
				Hakaret, küfür, tehdit, kişisel bilgi ya da kişisel saldırı içeren içerik yasaktır. Böyle
				içerikler kaldırılır ve yazarı tüm içerikleriyle birlikte kalıcı olarak uzaklaştırılır.
			</li>
			<li>
				Bir dersin ya da anlatımın olumsuz ama dürüst eleştirisi serbesttir ve talep üzerine
				kaldırılmaz.
			</li>
			<li>
				Sınav soruları, telif hakkı olan materyaller ya da başkalarının kişisel verileri
				paylaşılamaz.
			</li>
			<li>
				Kaldırma talepleri (ör. bir hocadan) aşağıdaki iletişim adresine gönderilebilir. Talepler bu
				kurallara göre değerlendirilir.
			</li>
			<li>
				Site bu koşulları değiştirebilir. Kullanmaya devam etmek güncel koşulların kabulü anlamına
				gelir.
			</li>
		</ol>
	{/if}
	{#if data.contact}<p>{m.contact()}: <a href="mailto:{data.contact}">{data.contact}</a></p>{/if}
</article>
