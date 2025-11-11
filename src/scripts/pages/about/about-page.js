import PushNotificationHelper from "../../utils/push-notification-helper";
export default class AboutPage {
  async render() {
    return `
      <section class="container about-page">
        <div class="about-header">
          <h1>Tentang StoryShare</h1>
          <p>Berbagi Momen, Menghubungkan Pengalaman.</p>
        </div>

        <div class="about-content card">
          <div class="card-body">
            <h2>Misi Kami</h2>
            <p>
              StoryShare dibangun sebagai platform sederhana untuk para siswa dan alumni Dicoding
              agar dapat berbagi cerita, pengalaman belajar, proyek yang dikerjakan,
              atau momen inspiratif lainnya selama perjalanan mereka di dunia teknologi.
              Kami percaya bahwa setiap cerita memiliki nilai dan dapat memberikan
              inspirasi serta motivasi bagi orang lain.
            </p>

            <h2>Fitur Utama</h2>
            <ul>
              <li>🌐 <strong>Bagikan Cerita :</strong>Unggah foto dan tulis deskripsi pengalaman Anda.</li>
              <li>📍 <strong>Tandai Lokasi :</strong> (Opsional) Tambahkan lokasi pada cerita Anda agar orang lain tahu di mana momen itu terjadi.</li>
              <li>🗺️ <strong>Jelajahi Peta : </strong> Lihat cerita-cerita dari pengguna lain yang tersebar di peta.</li>
              <li>🌓 <strong>Mode Gelap/Terang :</strong> Sesuaikan tampilan aplikasi sesuai preferensi Anda.</li>
              <li>📱 <strong>Desain Responsif :</strong> Nikmati pengalaman yang sama baik di desktop maupun perangkat mobile.</li>
            </ul>

            <h2>Teknologi</h2>
            <p>
              Aplikasi ini dibangun menggunakan teknologi web modern, termasuk:
            </p>
            <ul>
              <li>HTML, CSS, dan JavaScript</li>
              <li>Webpack sebagai module bundler</li>
              <li>LeafletJS untuk pemetaan interaktif</li>
              <li>Dicoding Story API sebagai backend</li>
              <li>Arsitektur SPA (Single-Page Application) dengan MVP (Model-View-Presenter)</li>
              <li>View Transitions API untuk animasi perpindahan halaman</li>
            </ul>

            <h2>Kontribusi</h2>
            <p>
              Proyek ini merupakan bagian dari submission kelas "Menjadi Front-End Web Developer Expert" di Dicoding Academy.
              Terima kasih telah menggunakan StoryShare!
            </p>

            <div class="about-contact mt-lg">
               <h2>Hubungi Pengembang</h2>
               <p>
                  Anda bisa menemukan saya di: <br>
                  Instagram: <a href="https://www.instagram.com/Ngrhaa_18/" target="_blank" rel="noopener noreferrer">@Ngrhaa_18</a> <br>
                  GitHub: <a href="https://github.com/NUGRAHA18" target="_blank" rel="noopener noreferrer">NUGRAHA18</a>
               </p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const subscribeButton = document.getElementById("subscribe-push-button");
    if (subscribeButton) {
      subscribeButton.addEventListener("click", (event) => {
        event.preventDefault();
        PushNotificationHelper.askPermission();
      });
    }
  }
}
