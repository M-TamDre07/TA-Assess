/**
 * TA ASSESS | Personality 30 item pilot seed
 * Jalankan seedPersonality30_() satu kali dari project Question Bank.
 *
 * Struktur instrumen:
 * 10 single choice
 * 10 essay
 * 10 multi choice
 *
 * Essay adalah respons reflektif kualitatif dan tidak dikonversi menjadi skor
 * numerik. Profil numerik saat ini menggunakan 20 item terstruktur. Ini dibuat
 * transparan agar platform tidak berpura pura menilai tulisan secara psikometrik.
 */
function seedPersonality30_() {
  const assessmentId = 'PERSONALITY-01';
  const dims = ['Openness','Conscientiousness','Extraversion','Agreeableness','Neuroticism'];

  const singleTexts = [
    'Ketika menemukan cara baru untuk menyelesaikan masalah, saya biasanya mencoba memahami beberapa kemungkinan terlebih dahulu.',
    'Saat mendapat tugas dengan tenggat waktu, saya biasanya membuat langkah kerja agar progresnya mudah dipantau.',
    'Dalam kegiatan kelompok, saya cukup nyaman memulai percakapan dan mengajak anggota lain terlibat.',
    'Jika teman sedang menghadapi masalah, saya biasanya berusaha mendengarkan sebelum memberikan tanggapan.',
    'Saat rencana berubah mendadak, saya biasanya membutuhkan waktu untuk menata kembali pikiran sebelum melanjutkan.',
    'Ketika mempelajari topik yang belum dikenal, saya tertarik mencari contoh, sudut pandang, atau kemungkinan baru.',
    'Untuk menjaga tugas tetap teratur, saya biasanya menggunakan daftar prioritas atau catatan.',
    'Di lingkungan baru, saya cukup nyaman memperkenalkan diri atau memulai interaksi sederhana.',
    'Ketika mendapat kritik terhadap pekerjaan saya, saya biasanya mencoba memisahkan masukan yang berguna dari perasaan pribadi.',
    'Saat harus mengambil keputusan penting, saya biasanya menimbang beberapa kemungkinan sebelum menentukan pilihan.'
  ];

  const essayTexts = [
    'Ceritakan pengalaman ketika Anda mencoba cara baru untuk melakukan sesuatu. Apa yang membuat Anda tertarik mencobanya?',
    'Bagaimana biasanya Anda mengatur tugas yang harus diselesaikan dalam beberapa hari?',
    'Ceritakan situasi ketika Anda berada dalam kelompok dengan orang yang belum terlalu Anda kenal.',
    'Apa yang biasanya Anda lakukan ketika seseorang bercerita tentang masalah pribadinya kepada Anda?',
    'Ceritakan pengalaman ketika rencana yang sudah Anda susun berubah secara tiba tiba. Bagaimana Anda menyesuaikan diri?',
    'Topik atau kegiatan seperti apa yang membuat Anda ingin terus mencari tahu lebih dalam?',
    'Kebiasaan apa yang paling membantu Anda menjaga pekerjaan tetap teratur?',
    'Bagaimana cara Anda biasanya menyesuaikan diri ketika berada di lingkungan sosial yang baru?',
    'Ceritakan bagaimana Anda biasanya merespons masukan atau kritik terhadap hasil pekerjaan Anda.',
    'Apa saja hal yang biasanya Anda pertimbangkan sebelum membuat keputusan yang penting bagi Anda?'
  ];

  const multiTexts = [
    'Pilih aktivitas yang paling menggambarkan hal yang Anda sukai:',
    'Pilih kebiasaan yang paling membantu Anda menyelesaikan tugas:',
    'Pilih situasi sosial yang biasanya membuat Anda nyaman:',
    'Pilih respons yang paling dekat dengan cara Anda membantu orang lain:',
    'Pilih hal yang biasanya membantu Anda menghadapi perubahan:',
    'Pilih kegiatan yang membuat Anda tertarik mengeksplorasi hal baru:',
    'Pilih cara yang biasa Anda gunakan untuk mengelola pekerjaan:',
    'Pilih aktivitas yang paling sesuai dengan kenyamanan sosial Anda:',
    'Pilih cara yang biasa Anda gunakan ketika menerima masukan:',
    'Pilih hal yang biasanya Anda lakukan sebelum mengambil keputusan:'
  ];

  const multiOptions = [
    ['Mencoba aplikasi atau alat baru','Mencari ide dari berbagai sumber','Membuat sesuatu dengan cara berbeda','Mencoba pengalaman yang belum pernah dilakukan'],
    ['Membuat daftar tugas','Menentukan prioritas','Membagi tugas menjadi beberapa langkah','Menentukan waktu untuk setiap bagian'],
    ['Berbicara dengan anggota baru','Mengikuti diskusi kelompok','Mengajak orang lain melakukan kegiatan','Bertukar cerita dengan teman'],
    ['Mendengarkan sampai selesai','Menanyakan apa yang dibutuhkan','Memberi dukungan yang sesuai','Membantu mencari langkah berikutnya'],
    ['Mencari informasi terbaru','Menyusun ulang rencana','Membicarakan perubahan dengan orang lain','Memberi waktu untuk menyesuaikan diri'],
    ['Membaca tentang topik baru','Mencoba eksperimen sederhana','Membuat ide atau karya baru','Mencari sudut pandang yang berbeda'],
    ['Membuat daftar prioritas','Menggunakan kalender atau pengingat','Merapikan bahan kerja','Mengecek kembali pekerjaan sebelum selesai'],
    ['Memulai percakapan','Mengikuti kegiatan bersama','Mencari teman untuk berdiskusi','Menyapa orang yang baru dikenal'],
    ['Mencatat bagian yang perlu diperbaiki','Meminta contoh yang lebih jelas','Membandingkan masukan dengan tujuan awal','Mendiskusikan masukan dengan orang yang dipercaya'],
    ['Mencari informasi yang relevan','Membandingkan beberapa pilihan','Memikirkan dampak keputusan','Menentukan prioritas yang paling penting']
  ];

  const optionsForSingle = (dimension) => [
    {id:'A',label:'Sangat tidak sesuai',value:'1',score:{[dimension]:1}},
    {id:'B',label:'Kurang sesuai',value:'2',score:{[dimension]:2}},
    {id:'C',label:'Cukup sesuai',value:'3',score:{[dimension]:3}},
    {id:'D',label:'Sesuai',value:'4',score:{[dimension]:4}},
    {id:'E',label:'Sangat sesuai',value:'5',score:{[dimension]:5}}
  ];

  const rows = readRows_(QB.SHEETS.QUESTIONS);
  for (let i=1;i<rows.length;i++) {
    if (String(rows[i][1]) === assessmentId && String(rows[i][14] || '') !== 'ARCHIVED') {
      spreadsheet_().getSheetByName(QB.SHEETS.QUESTIONS).getRange(i+1,15).setValue('ARCHIVED');
    }
  }

  let order = 1;
  let count = 0;
  singleTexts.forEach((text,i) => {
    const dimension = dims[i % dims.length];
    const q = {questionId:`${assessmentId}-S${String(i+1).padStart(2,'0')}`,assessmentId,version:'1.1',orderIndex:order++,itemType:'single_choice',text,dimension,required:true,reverse:false,tags:['structured','single_choice'],status:'PILOT',options:optionsForSingle(dimension),scoring:{mode:'option_score'},notes:'Item pilot. Evaluasi statistik item dilakukan setelah data uji terkumpul.'};
    upsertQuestion_(q); count++;
  });

  essayTexts.forEach((text,i) => {
    const dimension = dims[i % dims.length];
    const q = {questionId:`${assessmentId}-E${String(i+1).padStart(2,'0')}`,assessmentId,version:'1.1',orderIndex:order++,itemType:'essay',text,dimension,required:true,reverse:false,tags:['qualitative','essay'],status:'PILOT',options:[],scoring:{mode:'qualitative_only'},notes:'Respons reflektif kualitatif. Tidak termasuk skor numerik.'};
    upsertQuestion_(q); count++;
  });

  multiTexts.forEach((text,i) => {
    const dimension = dims[i % dims.length];
    const options = multiOptions[i].map((label,j) => ({id:String.fromCharCode(65+j),label,value:'1',score:{[dimension]:1}}));
    const q = {questionId:`${assessmentId}-M${String(i+1).padStart(2,'0')}`,assessmentId,version:'1.1',orderIndex:order++,itemType:'multi_choice',text,dimension,required:true,reverse:false,tags:['structured','multi_choice'],status:'PILOT',options,scoring:{mode:'sum_option_score',max:4},notes:'Jumlah pilihan terpilih menjadi indikator intensitas respons pada dimensi ini. Interpretasi tetap bersifat pilot.'};
    upsertQuestion_(q); count++;
  });

  upsertAssessment_({assessmentId,name:'Big Five Personality: Eksplorasi 30 Soal',category:'Personal Exploration',description:'Eksplorasi kecenderungan lima dimensi kepribadian melalui 30 item terstruktur dan reflektif.',status:'PILOT',version:'1.1',targetPopulation:'Umum 13+',estimatedMinutes:12,scale:{min:1,max:5}});
  return {success:true,assessmentId,count,structure:{single_choice:10,essay:10,multi_choice:10},status:'PILOT',version:'1.1'};
}
