<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>{m.nav_privacy()} · {m.site_name()}</title></svelte:head>

<article class="prose-page">
	<h1>{m.nav_privacy()}</h1>
	<p class="draft-note">{m.legal_draft_note()}</p>
	{#if getLocale() === 'en'}
		<h2>What we store</h2>
		<ul>
			<li>
				<strong>Not your e-mail address.</strong> When you sign in, your address is used once to send
				the code and then discarded. We only store a keyed one-way hash (HMAC) of it. This lets us recognise
				the same account and enforce bans, but the address cannot be read back from the database.
			</li>
			<li>Your reviews, linked to that anonymous account.</li>
			<li>
				A session cookie that keeps you signed in. Your language choice is stored in a cookie too.
			</li>
			<li>We do not log IP addresses and do not use analytics or advertising trackers.</li>
		</ul>
		<h2>What others see</h2>
		<p>
			Reviews are shown as "Anonymous student" with the course, instructor and term. Instructor
			names are shown because they teach the course; there are no instructor ratings or rankings.
		</p>
		<h2>Third parties</h2>
		<p>
			The site runs on Cloudflare. Sign-in codes are sent through an e-mail provider, which
			processes your address to deliver the message.
		</p>
		<h2>Your rights</h2>
		<p>
			You can edit or delete your reviews, and delete your account with all of its content, from the
			"My account" page.
		</p>
		<p>
			When you delete your account, the reasons you wrote in your reports are deleted too. The
			reports themselves keep counting, without any link to you, so that deleting and re-creating an
			account cannot be used to report the same review again.
		</p>
	{:else}
		<h2>Ne saklıyoruz?</h2>
		<ul>
			<li>
				<strong>E-posta adresini saklamıyoruz.</strong> Giriş yaparken adresin sadece kodu göndermek için
				bir kez kullanılır. Veritabanında yalnızca adresin gizli anahtarla alınmış tek yönlü özeti (HMAC)
				tutulur. Bu sayede aynı hesabı tanıyabilir ve banları uygulayabiliriz, ama adres veritabanından
				geri okunamaz.
			</li>
			<li>Bu anonim hesaba bağlı değerlendirmelerin.</li>
			<li>Seni içeride tutan bir oturum çerezi. Dil tercihin de bir çerezde saklanır.</li>
			<li>IP adresi kaydı tutmuyoruz, analiz ya da reklam takibi kullanmıyoruz.</li>
		</ul>
		<h2>Başkaları ne görür?</h2>
		<p>
			Değerlendirmeler ders, hoca ve dönemle birlikte "Anonim öğrenci" olarak görünür. Hoca isimleri
			dersi verdikleri için görünür; hoca puanlaması ya da sıralaması yoktur.
		</p>
		<h2>Üçüncü taraflar</h2>
		<p>
			Site Cloudflare üzerinde çalışır. Giriş kodları bir e-posta sağlayıcısı üzerinden gönderilir;
			sağlayıcı iletiyi teslim etmek için adresini işler.
		</p>
		<h2>Hakların</h2>
		<p>
			"Hesabım" sayfasından değerlendirmelerini düzenleyebilir, silebilir ya da hesabını tüm
			içeriğiyle birlikte silebilirsin.
		</p>
		<p>
			Hesabını sildiğinde bildirimlerinde yazdığın nedenler de silinir. Bildirimin kendisi, sana
			bağlanamayacak şekilde sayılmaya devam eder; böylece hesap silip yeniden açarak aynı yorum
			tekrar bildirilemez.
		</p>
	{/if}
	{#if data.contact}<p>{m.contact()}: <a href="mailto:{data.contact}">{data.contact}</a></p>{/if}
</article>
