/**
 * TA Assess - Question Bank
 *
 * Menyimpan bank soal di Google Sheets dan menyediakan editor sederhana
 * untuk pengelola instrumen.
 *
 * Script Properties:
 * - SPREADSHEET_ID
 * - QUESTION_BANK_ADMIN_KEY
 *
 * QUESTION_BANK_ADMIN_KEY hanya dipakai untuk operasi tulis.
 * Nilainya tidak boleh disimpan di repository atau frontend.
 */

const QB = {
  VERSION: '1.0.0',
  PROP_SHEET_ID: 'SPREADSHEET_ID',
  PROP_ADMIN_KEY: 'QUESTION_BANK_ADMIN_KEY',

  SHEETS: {
    QUESTIONS: 'Question Bank',
    OPTIONS: 'Question Options',
    ASSESSMENTS: 'Assessment Catalog',
    DIMENSIONS: 'Dimension Catalog',
    SCORING: 'Scoring Rules',
    LOG: 'Question Change Log'
  },

  TYPES: [
    'likert',
    'single_choice',
    'multi_choice',
    'binary',
    'essay',
    'yes_no'
  ],

  STATUSES: [
    'DRAFT',
    'PILOT',
    'ACTIVE',
    'ARCHIVED'
  ],

  QUESTION_HEADERS: [
    'questionId',
    'assessmentId',
    'version',
    'orderIndex',
    'itemType',
    'text',
    'dimension',
    'required',
    'reverse',
    'pairId',
    'pairRole',
    'tagsJson',
    'optionsJson',
    'scoringJson',
    'status',
    'author',
    'notes',
    'updatedAt'
  ],

  OPTION_HEADERS: [
    'questionId',
    'optionId',
    'label',
    'value',
    'scoreJson',
    'orderIndex',
    'active'
  ],

  ASSESSMENT_HEADERS: [
    'assessmentId',
    'name',
    'category',
    'description',
    'status',
    'version',
    'targetPopulation',
    'estimatedMinutes',
    'scaleJson',
    'lastUpdated'
  ],

  DIMENSION_HEADERS: [
    'assessmentId',
    'dimensionId',
    'name',
    'description',
    'orderIndex',
    'active'
  ],

  SCORING_HEADERS: [
    'assessmentId',
    'dimensionId',
    'ruleType',
    'configJson',
    'version',
    'active',
    'updatedAt'
  ],

  LOG_HEADERS: [
    'timestamp',
    'eventId',
    'action',
    'questionId',
    'assessmentId',
    'actor',
    'metadataJson'
  ]
};

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = String(params.action || 'editor');

  if (action === 'questions') {
    const assessmentId = clean_(params.assessmentId, 120);
    const version = params.version
      ? clean_(params.version, 40)
      : '';

    return json_(getQuestions_(assessmentId, version));
  }

  if (action === 'catalog') {
    return json_(getCatalog_());
  }

  if (action === 'health') {
    return json_({
      success: true,
      service: 'TA Assess Question Bank',
      version: QB.VERSION,
      timestamp: new Date().toISOString()
    });
  }

  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('TA Assess Question Bank')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents;

    if (!body || body.length > 50000) {
      return json_({
        success: false,
        error: 'Payload tidak valid.'
      });
    }

    const data = parse_(body);

    if (!data) {
      return json_({
        success: false,
        error: 'JSON tidak valid.'
      });
    }

    return json_(handleWrite_(data));
  } catch (err) {
    console.error(err);

    return json_({
      success: false,
      error: 'Terjadi kesalahan server.'
    });
  }
}

function getQuestions_(assessmentId, version) {
  if (!assessmentId) {
    return {
      success: false,
      error: 'assessmentId wajib diisi.'
    };
  }

  const rows = readRows_(QB.SHEETS.QUESTIONS);
  const questions = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    if (String(row[1]) !== assessmentId) {
      continue;
    }

    if (version && String(row[2]) !== version) {
      continue;
    }

    const status = String(row[14] || 'ACTIVE');

    if (['ACTIVE', 'PILOT', 'DEMO'].indexOf(status) === -1) {
      continue;
    }

    questions.push({
      id: String(row[0]),
      assessmentId: String(row[1]),
      version: String(row[2]),
      order: Number(row[3]) || 0,
      type: String(row[4]),
      text: String(row[5]),
      dimension: String(row[6]),
      required:
        row[7] !== false &&
        String(row[7]).toLowerCase() !== 'false',
      reverse:
        row[8] === true ||
        String(row[8]).toLowerCase() === 'true',
      pairId: String(row[9] || ''),
      pairRole: String(row[10] || ''),
      tags: parseJson_(row[11], []),
      options: parseJson_(row[12], []),
      scoring: parseJson_(row[13], {})
    });
  }

  questions.sort(function (a, b) {
    return a.order - b.order;
  });

  return {
    success: true,
    service: 'TA Assess Question Bank',
    version: QB.VERSION,
    assessmentId,
    questionVersion: version || (
      questions[0] ? questions[0].version : ''
    ),
    count: questions.length,
    questions
  };
}

function getCatalog_() {
  const rows = readRows_(QB.SHEETS.ASSESSMENTS);
  const assessments = rows
    .slice(1)
    .map(function (row) {
      return {
        assessmentId: String(row[0]),
        name: String(row[1]),
        category: String(row[2]),
        description: String(row[3]),
        status: String(row[4]),
        version: String(row[5]),
        targetPopulation: String(row[6]),
        estimatedMinutes: Number(row[7]) || null,
        scale: parseJson_(row[8], {})
      };
    })
    .filter(function (assessment) {
      return assessment.assessmentId;
    });

  return {
    success: true,
    version: QB.VERSION,
    assessments
  };
}

function saveQuestionFromEditor(question, adminKey) {
  if (!authorizeWrite_(adminKey)) {
    return {
      success: false,
      error: 'Akses editor tidak sah.'
    };
  }

  return upsertQuestion_(question);
}

function archiveQuestionFromEditor(questionId, adminKey) {
  if (!authorizeWrite_(adminKey)) {
    return {
      success: false,
      error: 'Akses editor tidak sah.'
    };
  }

  return archiveQuestion_(questionId);
}

function listQuestionsForEditor(assessmentId) {
  const id = clean_(assessmentId || '', 120);
  const rows = readRows_(QB.SHEETS.QUESTIONS);
  const questions = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    if (id && String(row[1]) !== id) {
      continue;
    }

    questions.push({
      questionId: String(row[0]),
      assessmentId: String(row[1]),
      version: String(row[2]),
      order: Number(row[3]) || 0,
      itemType: String(row[4]),
      text: String(row[5]),
      dimension: String(row[6]),
      required:
        row[7] !== false &&
        String(row[7]).toLowerCase() !== 'false',
      reverse:
        row[8] === true ||
        String(row[8]).toLowerCase() === 'true',
      pairId: String(row[9] || ''),
      pairRole: String(row[10] || ''),
      tags: parseJson_(row[11], []),
      options: parseJson_(row[12], []),
      scoring: parseJson_(row[13], {}),
      status: String(row[14] || 'DRAFT'),
      notes: String(row[16] || '')
    });
  }

  questions.sort(function (a, b) {
    return a.order - b.order ||
      a.questionId.localeCompare(b.questionId);
  });

  return {
    success: true,
    questions
  };
}

function handleWrite_(data) {
  const action = String(data.action || '');

  if (!authorizeWrite_(data.adminKey)) {
    return {
      success: false,
      error: 'Akses editor tidak sah.'
    };
  }

  if (action === 'upsertQuestion') {
    return upsertQuestion_(data.question || {});
  }

  if (action === 'deleteQuestion') {
    return archiveQuestion_(data.questionId);
  }

  if (action === 'upsertAssessment') {
    return upsertAssessment_(data.assessment || {});
  }

  if (action === 'seedDemoQuestions') {
    return seedDemoQuestions_();
  }

  if (action === 'seedCatalog') {
    return seedCatalog_();
  }

  return {
    success: false,
    error: 'Action tidak didukung.'
  };
}

function upsertQuestion_(question) {
  const normalized = normalizeQuestion_(question);

  if (!normalized.ok) {
    return normalized;
  }

  const sheet = sheet_(QB.SHEETS.QUESTIONS);
  const rows = sheet.getDataRange().getValues();

  let rowNumber = -1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === normalized.question.questionId) {
      rowNumber = i + 1;
      break;
    }
  }

  const q = normalized.question;

  const values = [[
    q.questionId,
    q.assessmentId,
    q.version,
    q.orderIndex,
    q.itemType,
    q.text,
    q.dimension,
    q.required,
    q.reverse,
    q.pairId,
    q.pairRole,
    JSON.stringify(q.tags),
    JSON.stringify(q.options),
    JSON.stringify(q.scoring),
    q.status,
    q.author,
    q.notes,
    new Date()
  ]];

  if (rowNumber === -1) {
    sheet
      .getRange(sheet.getLastRow() + 1, 1, 1, values[0].length)
      .setValues(values);

    syncOptions_(q);
    logChange_('CREATE', q);
  } else {
    sheet
      .getRange(rowNumber, 1, 1, values[0].length)
      .setValues(values);

    syncOptions_(q);
    logChange_('UPDATE', q);
  }

  return {
    success: true,
    action: rowNumber === -1 ? 'created' : 'updated',
    question: q
  };
}

function archiveQuestion_(questionId) {
  const id = clean_(questionId, 120);

  if (!id) {
    return {
      success: false,
      error: 'questionId wajib diisi.'
    };
  }

  const sheet = sheet_(QB.SHEETS.QUESTIONS);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) !== id) {
      continue;
    }

    sheet.getRange(i + 1, 15).setValue('ARCHIVED');

    logChange_('ARCHIVE', {
      questionId: id,
      assessmentId: String(rows[i][1])
    });

    return {
      success: true,
      questionId: id,
      status: 'ARCHIVED'
    };
  }

  return {
    success: false,
    error: 'Soal tidak ditemukan.'
  };
}

function normalizeQuestion_(question) {
  const itemType = clean_(question.itemType, 40).toLowerCase();

  if (QB.TYPES.indexOf(itemType) === -1) {
    return {
      success: false,
      error: 'Jenis soal tidak didukung.'
    };
  }

  const text = clean_(question.text, 1000);
  const assessmentId = clean_(question.assessmentId, 120);
  const questionId = clean_(question.questionId, 120);

  if (!questionId || !assessmentId || !text) {
    return {
      success: false,
      error: 'questionId, assessmentId, dan text wajib diisi.'
    };
  }

  const options = Array.isArray(question.options)
    ? question.options
        .slice(0, 20)
        .map(function (option, index) {
          return {
            id: clean_(
              option.id || ('OPT-' + (index + 1)),
              60
            ),
            label: clean_(option.label, 200),
            value: clean_(
              option.value == null
                ? String(index + 1)
                : option.value,
              60
            ),
            score:
              option.score &&
              typeof option.score === 'object'
                ? option.score
                : {}
          };
        })
        .filter(function (option) {
          return option.label;
        })
    : [];

  const choiceTypes = [
    'single_choice',
    'multi_choice',
    'binary',
    'yes_no'
  ];

  if (
    choiceTypes.indexOf(itemType) !== -1 &&
    options.length < 2
  ) {
    return {
      success: false,
      error: 'Soal pilihan harus memiliki minimal dua opsi.'
    };
  }

  const tags = Array.isArray(question.tags)
    ? question.tags
        .slice(0, 12)
        .map(function (tag) {
          return clean_(tag, 50);
        })
        .filter(Boolean)
    : [];

  const status = String(
    question.status || 'DRAFT'
  ).toUpperCase();

  return {
    ok: true,
    question: {
      questionId,
      assessmentId,
      version: clean_(question.version || '1.0', 40),
      orderIndex: Math.max(
        0,
        Number(question.orderIndex) || 0
      ),
      itemType,
      text,
      dimension: clean_(question.dimension || '', 120),
      required: question.required !== false,
      reverse: Boolean(question.reverse),
      pairId: clean_(question.pairId || '', 120),
      pairRole: clean_(question.pairRole || '', 40),
      tags,
      options,
      scoring:
        question.scoring &&
        typeof question.scoring === 'object'
          ? question.scoring
          : {},
      status: QB.STATUSES.indexOf(status) >= 0
        ? status
        : 'DRAFT',
      author: clean_(
        question.author || 'TA Assess Contributor',
        120
      ),
      notes: clean_(question.notes || '', 1000)
    }
  };
}

function upsertAssessment_(assessment) {
  const id = clean_(assessment.assessmentId, 120);
  const name = clean_(assessment.name, 200);

  if (!id || !name) {
    return {
      success: false,
      error: 'assessmentId dan name wajib diisi.'
    };
  }

  const row = [
    id,
    name,
    clean_(assessment.category || '', 100),
    clean_(assessment.description || '', 500),
    clean_(assessment.status || 'DRAFT', 30),
    clean_(assessment.version || '1.0', 40),
    clean_(assessment.targetPopulation || '', 120),
    Number(assessment.estimatedMinutes) || '',
    JSON.stringify(
      assessment.scale &&
      typeof assessment.scale === 'object'
        ? assessment.scale
        : {}
    ),
    new Date()
  ];

  const sheet = sheet_(QB.SHEETS.ASSESSMENTS);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) !== id) {
      continue;
    }

    sheet
      .getRange(i + 1, 1, 1, row.length)
      .setValues([row]);

    return {
      success: true,
      action: 'updated',
      assessmentId: id
    };
  }

  sheet
    .getRange(sheet.getLastRow() + 1, 1, 1, row.length)
    .setValues([row]);

  return {
    success: true,
    action: 'created',
    assessmentId: id
  };
}

function seedCatalog_() {
  const samples = [
    [
      'PERSONALITY-01',
      'Big Five Personality',
      'Personal Exploration',
      'Eksplorasi kecenderungan lima dimensi kepribadian.',
      'DEMO',
      '0.2',
      'Umum 13+',
      5,
      '{"min":1,"max":5,"labels":["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]}'
    ],
    [
      'CAREER-01',
      'Career Interest Exploration',
      'Career Exploration',
      'Eksplorasi minat aktivitas kerja berbasis RIASEC.',
      'DEMO',
      '0.2',
      'SMA ke atas',
      5,
      '{"min":1,"max":5}'
    ],
    [
      'LEARNING-01',
      'Learning Preferences',
      'Education',
      'Eksplorasi preferensi strategi belajar.',
      'PILOT',
      '0.2',
      'Pelajar',
      5,
      '{"min":1,"max":5}'
    ]
  ];

  samples.forEach(function (row) {
    upsertAssessment_({
      assessmentId: row[0],
      name: row[1],
      category: row[2],
      description: row[3],
      status: row[4],
      version: row[5],
      targetPopulation: row[6],
      estimatedMinutes: row[7],
      scale: parseJson_(row[8], {})
    });
  });

  return {
    success: true,
    count: samples.length
  };
}

function seedDemoQuestions_() {
  const questions = [
    {
      questionId: 'PERSONALITY-01-Q01',
      assessmentId: 'PERSONALITY-01',
      orderIndex: 1,
      itemType: 'likert',
      text: 'Saya banyak melakukan hal-hal kreatif dan imajinatif.',
      dimension: 'Openness',
      reverse: false,
      status: 'DEMO',
      tags: ['positive_keyed']
    },
    {
      questionId: 'PERSONALITY-01-Q02',
      assessmentId: 'PERSONALITY-01',
      orderIndex: 2,
      itemType: 'likert',
      text: 'Saya adalah orang yang terorganisir dan disiplin.',
      dimension: 'Conscientiousness',
      reverse: false,
      status: 'DEMO',
      tags: ['positive_keyed']
    },
    {
      questionId: 'PERSONALITY-01-Q03',
      assessmentId: 'PERSONALITY-01',
      orderIndex: 3,
      itemType: 'likert',
      text: 'Saya senang menghabiskan waktu bersama orang lain dan acara sosial.',
      dimension: 'Extraversion',
      reverse: false,
      status: 'DEMO',
      tags: ['positive_keyed']
    },
    {
      questionId: 'PERSONALITY-01-Q04',
      assessmentId: 'PERSONALITY-01',
      orderIndex: 4,
      itemType: 'likert',
      text: 'Saya peduli dan berempati terhadap perasaan orang lain.',
      dimension: 'Agreeableness',
      reverse: false,
      status: 'DEMO',
      tags: ['positive_keyed']
    },
    {
      questionId: 'PERSONALITY-01-Q05',
      assessmentId: 'PERSONALITY-01',
      orderIndex: 5,
      itemType: 'likert',
      text: 'Saya sering merasa cemas atau khawatir tentang berbagai hal.',
      dimension: 'Neuroticism',
      reverse: false,
      status: 'DEMO',
      tags: ['positive_keyed']
    },
    {
      questionId: 'PERSONALITY-01-Q06',
      assessmentId: 'PERSONALITY-01',
      orderIndex: 6,
      itemType: 'likert',
      text: 'Saya selalu mencari pengalaman dan hal baru.',
      dimension: 'Openness',
      reverse: false,
      status: 'DEMO',
      tags: ['positive_keyed']
    },
    {
      questionId: 'PERSONALITY-01-Q07',
      assessmentId: 'PERSONALITY-01',
      orderIndex: 7,
      itemType: 'likert',
      text: 'Saya sering menunda-nunda tugas atau pekerjaan.',
      dimension: 'Conscientiousness',
      reverse: true,
      status: 'DEMO',
      tags: ['reverse_keyed']
    },
    {
      questionId: 'PERSONALITY-01-Q08',
      assessmentId: 'PERSONALITY-01',
      orderIndex: 8,
      itemType: 'likert',
      text: 'Saya lebih suka berada di rumah daripada bergaul dengan banyak orang.',
      dimension: 'Extraversion',
      reverse: true,
      status: 'DEMO',
      tags: ['reverse_keyed']
    },
    {
      questionId: 'PERSONALITY-01-Q09',
      assessmentId: 'PERSONALITY-01',
      orderIndex: 9,
      itemType: 'likert',
      text: 'Saya tidak terlalu peduli dengan kebutuhan orang lain.',
      dimension: 'Agreeableness',
      reverse: true,
      status: 'DEMO',
      tags: ['reverse_keyed']
    },
    {
      questionId: 'PERSONALITY-01-Q10',
      assessmentId: 'PERSONALITY-01',
      orderIndex: 10,
      itemType: 'likert',
      text: 'Saya merasa diri saya stabil dan emosi terkontrol.',
      dimension: 'Neuroticism',
      reverse: true,
      status: 'DEMO',
      tags: ['reverse_keyed']
    },
    {
      questionId: 'CAREER-01-Q01',
      assessmentId: 'CAREER-01',
      orderIndex: 1,
      itemType: 'likert',
      text: 'Saya senang bekerja dengan tangan dan alat.',
      dimension: 'Realistic',
      status: 'DEMO',
      tags: ['activity_preference']
    },
    {
      questionId: 'CAREER-01-Q02',
      assessmentId: 'CAREER-01',
      orderIndex: 2,
      itemType: 'likert',
      text: 'Saya menyukai menganalisis data dan memecahkan masalah kompleks.',
      dimension: 'Investigative',
      status: 'DEMO',
      tags: ['activity_preference']
    },
    {
      questionId: 'CAREER-01-Q03',
      assessmentId: 'CAREER-01',
      orderIndex: 3,
      itemType: 'likert',
      text: 'Saya senang mengekspresikan diri melalui seni atau kreativitas.',
      dimension: 'Artistic',
      status: 'DEMO',
      tags: ['activity_preference']
    },
    {
      questionId: 'CAREER-01-Q04',
      assessmentId: 'CAREER-01',
      orderIndex: 4,
      itemType: 'likert',
      text: 'Saya senang membantu orang lain dan memberikan dukungan.',
      dimension: 'Social',
      status: 'DEMO',
      tags: ['activity_preference']
    },
    {
      questionId: 'CAREER-01-Q05',
      assessmentId: 'CAREER-01',
      orderIndex: 5,
      itemType: 'likert',
      text: 'Saya termotivasi oleh tantangan dan pencapaian target.',
      dimension: 'Enterprising',
      status: 'DEMO',
      tags: ['activity_preference']
    },
    {
      questionId: 'CAREER-01-Q06',
      assessmentId: 'CAREER-01',
      orderIndex: 6,
      itemType: 'likert',
      text: 'Saya menyukai bekerja dengan sistem, aturan, dan organisasi yang jelas.',
      dimension: 'Conventional',
      status: 'DEMO',
      tags: ['activity_preference']
    },
    {
      questionId: 'LEARNING-01-Q01',
      assessmentId: 'LEARNING-01',
      orderIndex: 1,
      itemType: 'likert',
      text: 'Saya lebih mudah memahami dengan melihat diagram atau gambar.',
      dimension: 'Visual',
      status: 'PILOT',
      tags: ['preference']
    },
    {
      questionId: 'LEARNING-01-Q02',
      assessmentId: 'LEARNING-01',
      orderIndex: 2,
      itemType: 'likert',
      text: 'Saya belajar lebih baik melalui diskusi dan mendengarkan penjelasan.',
      dimension: 'Auditory',
      status: 'PILOT',
      tags: ['preference']
    },
    {
      questionId: 'LEARNING-01-Q03',
      assessmentId: 'LEARNING-01',
      orderIndex: 3,
      itemType: 'likert',
      text: 'Saya suka membaca dan menulis untuk memahami konsep baru.',
      dimension: 'Reading/Writing',
      status: 'PILOT',
      tags: ['preference']
    },
    {
      questionId: 'LEARNING-01-Q04',
      assessmentId: 'LEARNING-01',
      orderIndex: 4,
      itemType: 'likert',
      text: 'Saya belajar paling baik dengan melakukan praktik langsung.',
      dimension: 'Kinesthetic',
      status: 'PILOT',
      tags: ['preference']
    }
  ];

  let count = 0;

  questions.forEach(function (question) {
    const normalized = normalizeQuestion_(question);

    if (normalized.ok) {
      upsertQuestion_(normalized.question);
      count++;
    }
  });

  return {
    success: true,
    count
  };
}

function syncOptions_(question) {
  const sheet = sheet_(QB.SHEETS.OPTIONS);
  const rows = sheet.getDataRange().getValues();

  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]) === question.questionId) {
      sheet.deleteRow(i + 1);
    }
  }

  if (!question.options.length) {
    return;
  }

  const values = question.options.map(function (option, index) {
    return [
      question.questionId,
      option.id,
      option.label,
      option.value,
      JSON.stringify(option.score || {}),
      index + 1,
      true
    ];
  });

  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      values.length,
      values[0].length
    )
    .setValues(values);
}

function authorizeWrite_(key) {
  const expected = PropertiesService
    .getScriptProperties()
    .getProperty(QB.PROP_ADMIN_KEY);

  if (!expected || !key) {
    return false;
  }

  return safeEqual_(String(key), String(expected));
}

function logChange_(action, question) {
  sheet_(QB.SHEETS.LOG).appendRow([
    new Date(),
    Utilities.getUuid(),
    action,
    clean_(question.questionId || '', 120),
    clean_(question.assessmentId || '', 120),
    getActor_(),
    JSON.stringify({
      version: question.version || '',
      status: question.status || ''
    })
  ]);
}

function getActor_() {
  try {
    return Session.getActiveUser().getEmail() || 'webapp-user';
  } catch (_) {
    return 'webapp-user';
  }
}

function ensureWorkbook_() {
  const ss = spreadsheet_();

  ensureSheet_(
    ss,
    QB.SHEETS.QUESTIONS,
    QB.QUESTION_HEADERS
  );

  ensureSheet_(
    ss,
    QB.SHEETS.OPTIONS,
    QB.OPTION_HEADERS
  );

  ensureSheet_(
    ss,
    QB.SHEETS.ASSESSMENTS,
    QB.ASSESSMENT_HEADERS
  );

  ensureSheet_(
    ss,
    QB.SHEETS.DIMENSIONS,
    QB.DIMENSION_HEADERS
  );

  ensureSheet_(
    ss,
    QB.SHEETS.SCORING,
    QB.SCORING_HEADERS
  );

  ensureSheet_(
    ss,
    QB.SHEETS.LOG,
    QB.LOG_HEADERS
  );
}

function spreadsheet_() {
  const id = PropertiesService
    .getScriptProperties()
    .getProperty(QB.PROP_SHEET_ID);

  if (id) {
    return SpreadsheetApp.openById(id);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();

  if (!active) {
    throw new Error('SPREADSHEET_ID belum dikonfigurasi.');
  }

  return active;
}

function sheet_(name) {
  const sh = spreadsheet_().getSheetByName(name);

  if (!sh) {
    throw new Error('Sheet ' + name + ' belum tersedia.');
  }

  return sh;
}

function readRows_(name) {
  return sheet_(name).getDataRange().getValues();
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet
      .getRange(1, 1, 1, headers.length)
      .setValues([headers]);
  }

  sheet.setFrozenRows(1);

  sheet
    .getRange(1, 1, 1, headers.length)
    .setFontWeight('bold');
}

function parse_(raw) {
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function parseJson_(value, fallback) {
  try {
    return JSON.parse(String(value || ''));
  } catch (_) {
    return fallback;
  }
}

function clean_(value, max) {
  return String(value == null ? '' : value)
    .trim()
    .substring(0, max);
}

function safeEqual_(a, b) {
  a = String(a);
  b = String(b);

  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;

  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diff === 0;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
