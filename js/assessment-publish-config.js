/* TA ASSESS | Public assessment metadata */
(function(){
  if(typeof assessments==='undefined')return;
  if(assessments.personality){
    const a=assessments.personality;
    a.name='Big Five Personality: Eksplorasi 30 Soal';
    a.description='Eksplorasi kecenderungan lima dimensi kepribadian melalui 30 item terstruktur dan reflektif untuk eksplorasi diri.';
    a.details.developmentStatus='PILOT';a.details.validationStatus='Belum divalidasi secara psikometrik';a.details.items=30;a.details.version='1.0';a.details.instrumentVersion='1.0';a.details.scoringVersion='1.0';a.details.timeEstimate='10 sampai 15 menit';a.details.intendedUse='Eksplorasi diri dan bahan refleksi personal.';a.details.excludedUse='Tidak untuk diagnosis, seleksi kerja atau pendidikan, atau keputusan formal.';a.details.lastUpdated='2026-09-06';
  }
  if(assessments.career){
    const a=assessments.career;
    a.name='Eksplorasi Minat Karier';
    a.description='Eksplorasi kecenderungan minat aktivitas kerja berdasarkan kerangka RIASEC untuk bahan eksplorasi awal.';
    a.details.developmentStatus='PILOT';a.details.validationStatus='Belum divalidasi secara psikometrik';a.details.items=10;a.details.version='1.0';a.details.instrumentVersion='1.0';a.details.scoringVersion='1.0';a.details.timeEstimate='5 sampai 7 menit';
  }
  if(assessments.learning){
    const a=assessments.learning;
    a.name='Preferensi Belajar';
    a.description='Eksplorasi preferensi belajar sebagai bahan refleksi strategi belajar personal.';
    a.details.developmentStatus='PILOT';a.details.validationStatus='Belum divalidasi secara psikometrik';a.details.items=10;a.details.version='1.0';a.details.instrumentVersion='1.0';a.details.scoringVersion='1.0';a.details.timeEstimate='5 sampai 7 menit';
  }
})();
