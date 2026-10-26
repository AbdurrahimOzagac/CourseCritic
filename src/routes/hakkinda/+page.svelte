<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>{m.nav_about()} · {m.site_name()}</title></svelte:head>

<article class="prose-page">
	<h1>{m.nav_about()}</h1>
	{#if getLocale() === 'en'}
		<p>
			CourseCritic helps students choose courses by sharing their experiences. Every review belongs
			to a specific course, instructor and term (for example "BBM 342, taught by X in 2025-2026
			Fall"), because the same course can be very different depending on who teaches it and when.
		</p>
		<h2>How it works</h2>
		<ul>
			<li>Anyone can browse courses and reviews without signing in.</li>
			<li>
				To write a review you sign in with your university e-mail address. This keeps reviews from
				real students and makes manipulation harder.
			</li>
			<li>Reviews are shown as "Anonymous student". No nickname, no e-mail, no profile.</li>
			<li>
				You can write one review per course, instructor and term. You can edit or delete it at any
				time.
			</li>
		</ul>
		<h2>Rules</h2>
		<ul>
			<li>
				Criticise the course and the teaching, not the person. Insults, profanity and personal
				attacks are not allowed.
			</li>
			<li>
				Users who post insulting content are permanently banned and all their content is deleted.
			</li>
			<li>
				Any user can report a review. Reviews with several reports are hidden until an admin checks
				them.
			</li>
		</ul>
		<p>This site is an independent student project and is not affiliated with any university.</p>
	{:else}
		<p>
			DersSeç, öğrencilerin deneyimlerini paylaşarak birbirlerine ders seçiminde yardım ettiği bir
			platformdur. Her değerlendirme belirli bir ders, hoca ve döneme aittir (ör. "BBM 342, X
			hocanın 2025-2026 Güz döneminde verdiği ders"). Çünkü aynı ders, kimin verdiğine ve hangi
			dönem alındığına göre çok farklı olabilir.
		</p>
		<h2>Nasıl çalışır?</h2>
		<ul>
			<li>Dersleri ve değerlendirmeleri herkes giriş yapmadan görebilir.</li>
			<li>
				Değerlendirme yazmak için üniversite e-posta adresinle giriş yaparsın. Böylece
				değerlendirmeler gerçek öğrencilerden gelir ve manipülasyon zorlaşır.
			</li>
			<li>
				Değerlendirmeler "Anonim öğrenci" olarak görünür. Takma ad, e-posta ya da profil yoktur.
			</li>
			<li>
				Her ders, hoca ve dönem için bir değerlendirme yazabilirsin. İstediğin zaman düzenleyebilir
				ya da silebilirsin.
			</li>
		</ul>
		<h2>Kurallar</h2>
		<ul>
			<li>Kişiyi değil, dersi ve anlatımı eleştir. Hakaret, küfür ve kişisel saldırı yasaktır.</li>
			<li>
				Hakaret içeren içerik paylaşan kullanıcılar, tüm içerikleriyle birlikte sistemden kalıcı
				olarak uzaklaştırılır.
			</li>
			<li>
				Her kullanıcı bir değerlendirmeyi bildirebilir. Birkaç bildirim alan değerlendirmeler admin
				inceleyene kadar gizlenir.
			</li>
		</ul>
		<p>Bu site bağımsız bir öğrenci projesidir, herhangi bir üniversiteyle resmi bağı yoktur.</p>
	{/if}
	{#if data.contact}<p>{m.contact()}: <a href="mailto:{data.contact}">{data.contact}</a></p>{/if}
</article>
