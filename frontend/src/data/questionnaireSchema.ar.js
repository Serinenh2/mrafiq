// النسخة العربية لاستبيان تشخيص ومعالجة المعطيات الشخصية داخل المؤسسة (منصة مرافق).
// هذا الملف مستقل عن questionnaireSchema.js (الفرنسية) لأن بنية وصياغة النسخة العربية
// تختلف عن النسخة الفرنسية في عدة أقسام (وليست ترجمة حرفية لها).

export const AR_EMPLOYEES_OPTIONS = ['أقل من 10', 'من 10 إلى 49', 'من 50 إلى 249', '250 فأكثر']

export const AR_ENTREPRISE_FIELDS = [
  { key: 'name', label: 'اسم المؤسسة', type: 'text' },
  { key: 'natureType', label: 'طبيعة المؤسسة', type: 'radio',
    options: ['شركة خاصة', 'مؤسسة عمومية', 'إدارة', 'مؤسسة اقتصادية', 'أخرى'] },
  { key: 'natureTypeAutre', label: 'إذا كانت الإجابة أخرى، يرجى التحديد', type: 'text',
    showIf: { key: 'natureType', equals: 'أخرى' } },
  // القائمة يتم ملؤها ديناميكياً انطلاقاً من /processing-templates/ (انظر Questionnaire.jsx)
  { key: 'mainActivity', label: 'النشاط الرئيسي للمؤسسة', type: 'select', options: [] },
  { key: 'mainServices', label: 'أهم الأنشطة والخدمات التي تقدمها', type: 'textarea' },
  { key: 'employeesCount', label: 'عدد العمال تقريباً', type: 'radio', options: AR_EMPLOYEES_OPTIONS },
  { key: 'hasBranches', label: 'هل توجد فروع أو وحدات تابعة للمؤسسة؟', type: 'radio', options: ['نعم', 'لا'] },
  { key: 'usesSoftware', label: 'هل توجد أنظمة معلومات أو تطبيقات تستعملها المؤسسة؟', type: 'radio', options: ['نعم', 'لا'] },
]

export const AR_ACTIVITIES = [
  'تسيير الموظفين والعمال', 'التوظيف', 'الأجور', 'الحضور والانصراف', 'العطل والغيابات', 'التكوين',
  'تسيير الزبائن', 'تسيير الموردين', 'الفوترة', 'المحاسبة', 'المبيعات', 'التسويق', 'خدمة الزبائن',
  'الشكاوى', 'المراقبة والدخول إلى المؤسسة', 'كاميرات المراقبة', 'الأمن والسلامة',
  'إدارة الموقع الإلكتروني', 'التطبيقات والمنصات الرقمية', 'البريد الإلكتروني', 'البحث والدراسات',
  'إدارة المتربصين/الطلبة', 'تسيير المرضى', 'تسيير العملاء المحتملين',
]

// --- بطاقة المعالجة : تتكرر لكل عملية يتم اختيارها في القسم 2 (الأقسام 3 إلى 20) ---
export const AR_FICHE_SECTIONS = [
  { id: 'p3', title: 'القسم 3 — بطاقة تعريف المعالجة', fields: [
    { key: 'nom', label: 'ما اسم العملية أو النشاط الذي يتم فيه استعمال المعطيات الشخصية؟', type: 'text' },
    { key: 'service', label: 'ما هو القسم أو المصلحة المسؤولة عن هذه العملية؟', type: 'text' },
    { key: 'responsable', label: 'من هو المسؤول المباشر عن هذه العملية؟', type: 'text' },
    { key: 'support', label: 'هل المعالجة', type: 'radio', options: ['يدوية', 'آلية/معلوماتية', 'يدوية وآلية معاً'] },
    { key: 'depuis', label: 'متى بدأت هذه المعالجة؟', type: 'text' },
    { key: 'active', label: 'هل مازالت المعالجة مستعملة حالياً؟', type: 'radio', options: ['نعم', 'لا'] },
  ]},
  { id: 'p4', title: 'القسم 4 — لماذا تجمع المؤسسة هذه المعطيات؟', fields: [
    { key: 'finalites', label: 'لماذا تحتاج المؤسسة إلى هذه المعلومات؟', type: 'checkbox', other: true, options: [
      'تنفيذ عقد', 'تسيير الموظفين', 'دفع الأجور', 'التوظيف', 'تسيير الزبائن', 'تنفيذ الخدمات',
      'إصدار الفواتير', 'المحاسبة', 'التواصل مع الأشخاص', 'التسويق والإشهار', 'الأمن والحماية',
      'مراقبة الدخول', 'تنفيذ التزام قانوني', 'إحصائيات', 'دراسة وتحليل', 'بحث علمي',
    ]},
    { key: 'finaliteExplication', label: 'اشرح باختصار لماذا تحتاج المؤسسة إلى هذه المعطيات؟', type: 'textarea' },
  ]},
  { id: 'p5', title: 'القسم 5 — من هم الأشخاص الذين تخصهم المعطيات؟', fields: [
    { key: 'personnes', label: 'هل تجمع المؤسسة معلومات عن:', type: 'checkbox', other: true, options: [
      'العمال والموظفين', 'المترشحين للتوظيف', 'المتربصين', 'الزبائن', 'الزبائن المحتملين',
      'الموردين', 'الشركاء', 'الطلبة', 'المرضى', 'الزوار', 'الأطفال/القصر',
      'الأشخاص المتعاملين مع المؤسسة',
    ]},
    { key: 'nombrePersonnes', label: 'عدد الأشخاص المعنيين تقريباً', type: 'text' },
  ]},
  { id: 'p6', title: 'القسم 6 — ما هي المعطيات التي تجمعها المؤسسة؟', fields: [
    { key: 'donneesIdentification', label: '6.1 بيانات التعريف', type: 'checkbox', other: true, options: [
      'الاسم واللقب', 'تاريخ ومكان الميلاد', 'رقم بطاقة التعريف', 'رقم التعريف الوطني', 'العنوان',
      'رقم الهاتف', 'البريد الإلكتروني', 'صورة الشخص', 'التوقيع',
    ]},
    { key: 'donneesPro', label: '6.2 بيانات مهنية', type: 'checkbox', other: true, options: [
      'الوظيفة', 'المنصب', 'رقم الموظف', 'الأقدمية', 'المؤهلات', 'المسار المهني',
    ]},
    { key: 'donneesFin', label: '6.3 بيانات مالية', type: 'checkbox', other: true, options: [
      'رقم الحساب البنكي', 'معلومات الأجر', 'معلومات الفوترة', 'معلومات الدفع',
    ]},
    { key: 'donneesElec', label: '6.4 بيانات إلكترونية وتقنية', type: 'checkbox', other: true, options: [
      'عنوان IP', 'بيانات الدخول', 'اسم المستخدم', 'سجلات الدخول', 'بيانات استعمال التطبيق',
    ]},
    { key: 'typeSensible', label: '6.5 بيانات خاصة أو حساسة — هل يتم جمع أي من المعلومات التالية؟', type: 'checkbox', options: [
      'بيانات صحية', 'بيانات بيومترية', 'صور/فيديوهات', 'بيانات مرتبطة بالإعاقة',
      'بيانات أخرى ذات طبيعة خاصة', 'لا توجد',
    ]},
    { key: 'precisionSensible', label: 'إذا كانت الإجابة نعم، حدد نوع البيانات والغرض من استعمالها', type: 'textarea',
      showIf: { key: 'typeSensible', notIncludes: 'لا توجد' } },
  ]},
  { id: 'p7', title: 'القسم 7 — من أين تحصل المؤسسة على المعطيات؟', fields: [
    { key: 'origine', label: 'كيف تحصل المؤسسة على هذه المعطيات؟', type: 'checkbox', other: true, options: [
      'مباشرة من الشخص المعني', 'من الموظف', 'من الزبون', 'من المورد', 'من الإدارة أو هيئة عمومية',
      'من مؤسسة أخرى', 'من موقع إلكتروني', 'من تطبيق أو منصة', 'من وثائق ورقية',
    ]},
    { key: 'origineAutreNom', label: 'إذا كانت المعطيات تأتي من مصدر آخر — اسم المصدر', type: 'text' },
    { key: 'origineAutreNature', label: 'طبيعة الجهة', type: 'text' },
    { key: 'origineAutreDonnees', label: 'ما هي المعطيات التي تحصل عليها المؤسسة منها؟', type: 'text' },
    { key: 'origineAutrePourquoi', label: 'لماذا يتم الحصول عليها؟', type: 'text' },
  ]},
  { id: 'p8', title: 'القسم 8 — كيف يتم جمع المعطيات؟', fields: [
    { key: 'collecteMode', label: 'طريقة الجمع', type: 'checkbox', other: true, options: [
      'استمارة ورقية', 'عقد', 'ملف إداري', 'البريد الإلكتروني', 'الموقع الإلكتروني',
      'تطبيق معلوماتي', 'منصة إلكترونية', 'الهاتف', 'المقابلة المباشرة', 'قارئ/جهاز إلكتروني', 'كاميرا',
    ]},
    { key: 'collecteType', label: 'هل يتم الجمع', type: 'radio', options: ['يدوياً', 'آلياً', 'يدوياً وآلياً'] },
  ]},
  { id: 'p9', title: 'القسم 9 — أين توجد المعطيات؟', fields: [
    { key: 'papierOuiNon', label: '9.1 الحفظ الورقي — هل توجد ملفات ورقية؟', type: 'radio', options: ['نعم', 'لا'] },
    { key: 'papierDossier', label: 'اسم الملف/السجل', type: 'text', showIf: { key: 'papierOuiNon', equals: 'نعم' } },
    { key: 'papierNombre', label: 'عدد الملفات تقريباً', type: 'text', showIf: { key: 'papierOuiNon', equals: 'نعم' } },
    { key: 'papierLieu', label: 'مكان الحفظ', type: 'text', showIf: { key: 'papierOuiNon', equals: 'نعم' } },
    { key: 'papierAcces', label: 'من يمكنه الوصول إليها؟', type: 'text', showIf: { key: 'papierOuiNon', equals: 'نعم' } },
    { key: 'papierSecurise', label: 'هل المكان مؤمن؟', type: 'radio', options: ['نعم', 'لا'], showIf: { key: 'papierOuiNon', equals: 'نعم' } },
    { key: 'papierProtection', label: 'كيف تتم حمايته؟', type: 'text', showIf: { key: 'papierOuiNon', equals: 'نعم' } },
    { key: 'infoOuiNon', label: '9.2 الحفظ المعلوماتي — هل تحفظ المعطيات إلكترونياً؟', type: 'radio', options: ['نعم', 'لا'] },
    { key: 'infoBddNom', label: 'اسم قاعدة البيانات أو التطبيق', type: 'text', showIf: { key: 'infoOuiNon', equals: 'نعم' } },
    { key: 'infoLieuStockage', label: 'أين توجد البيانات؟', type: 'checkbox', other: true,
      options: ['خادم داخل المؤسسة', 'جهاز كمبيوتر', 'شبكة داخلية', 'خادم خارجي', 'Cloud', 'منصة إلكترونية'],
      showIf: { key: 'infoOuiNon', equals: 'نعم' } },
    { key: 'infoSystemeNom', label: 'اسم النظام أو البرنامج', type: 'text', showIf: { key: 'infoOuiNon', equals: 'نعم' } },
    { key: 'infoHebergementLieu', label: 'مكان الاستضافة', type: 'text', showIf: { key: 'infoOuiNon', equals: 'نعم' } },
    { key: 'infoProprietaire', label: 'من يملك/يدير النظام؟', type: 'text', showIf: { key: 'infoOuiNon', equals: 'نعم' } },
    { key: 'infoAcces', label: 'من لديه صلاحية الدخول؟', type: 'text', showIf: { key: 'infoOuiNon', equals: 'نعم' } },
  ]},
  { id: 'p10', title: 'القسم 10 — مدة الاحتفاظ بالمعطيات', fields: [
    { key: 'duree', label: 'إلى متى تحتفظ المؤسسة بهذه المعطيات؟', type: 'radio', options: [
      'لمدة محددة', 'إلى أجل غير محدد', 'حسب الحاجة', 'حسب مدة العقد', 'حسب مدة قانونية', 'لا نعرف',
    ]},
    { key: 'dureeValeur', label: 'مدة الاحتفاظ', type: 'text', showIf: { key: 'duree', equals: 'لمدة محددة' } },
    { key: 'dureeUnite', label: 'الوحدة', type: 'radio', options: ['أيام', 'أشهر', 'سنوات'], showIf: { key: 'duree', equals: 'لمدة محددة' } },
    { key: 'devenir', label: 'بعد انتهاء المدة ماذا يحدث للمعطيات؟', type: 'checkbox', other: true, options: [
      'الإتلاف', 'الحذف الإلكتروني', 'الأرشفة', 'إخفاء الهوية', 'الاحتفاظ بها لسبب قانوني', 'لا يوجد إجراء محدد',
    ]},
  ]},
  { id: 'p11', title: 'القسم 11 — من يستطيع الوصول إلى المعطيات؟', fields: [
    { key: 'acces', label: 'من لديه صلاحية الاطلاع أو استعمال هذه المعطيات؟', type: 'checkbox', other: true, options: [
      'المدير', 'الموارد البشرية', 'المحاسبة', 'المصلحة التجارية', 'مصلحة الإعلام الآلي',
      'الإدارة العامة', 'موظفون آخرون', 'متعاملون خارجيون', 'مؤسسات عمومية',
    ]},
    { key: 'accesParFonction', label: 'هل صلاحيات الدخول محددة حسب الوظيفة؟', type: 'radio', options: ['نعم', 'لا', 'لا أعرف'] },
    { key: 'accesTraces', label: 'هل يتم تسجيل عمليات الدخول إلى النظام؟', type: 'radio', options: ['نعم', 'لا', 'لا أعرف'] },
  ]},
  { id: 'p12', title: 'القسم 12 — أمن المعطيات', fields: [
    { key: 'securiteInfo', label: 'الحماية التقنية', type: 'checkbox', other: true, options: [
      'كلمات مرور', 'تشفير المعطيات', 'جدار حماية', 'مضاد فيروسات', 'نسخ احتياطية',
      'نظام لاسترجاع البيانات', 'مراقبة الدخول', 'تسجيل وتتبع العمليات', 'نظام مراقبة',
    ]},
    { key: 'securiteOrga', label: 'الحماية التنظيمية', type: 'checkbox', other: true, options: [
      'سياسة أمن المعلومات', 'ميثاق أمني', 'التزام بالسرية', 'إجراءات مكتوبة',
      'تحديد صلاحيات الوصول', 'تدريب الموظفين', 'إجراءات عند وقوع حادث أمني',
    ]},
    { key: 'charte', label: 'هل توجد «Charte de sécurité» أو سياسة أمن؟', type: 'radio', options: ['نعم', 'لا'] },
    { key: 'charteInfo', label: 'إذا نعم، هل تم اطلاع الموظفين المخولين بالوصول إلى المعطيات عليها والتوقيع عليها؟',
      type: 'radio', options: ['نعم', 'لا', 'غير مطبق'], showIf: { key: 'charte', equals: 'نعم' } },
  ]},
  { id: 'p13', title: 'القسم 13 — المعالجة من طرف متعاملين خارجيين', fields: [
    { key: 'sousTraitant', label: 'هل يتم الاستعانة بمؤسسة أو شخص خارجي لمعالجة هذه المعطيات؟', type: 'radio', options: ['نعم', 'لا'] },
    { key: 'stNom', label: 'اسم المتعامل', type: 'text', showIf: { key: 'sousTraitant', equals: 'نعم' } },
    { key: 'stActivite', label: 'نشاطه', type: 'text', showIf: { key: 'sousTraitant', equals: 'نعم' } },
    { key: 'stDonnees', label: 'ما هي المعطيات التي يعالجها؟', type: 'text', showIf: { key: 'sousTraitant', equals: 'نعم' } },
    { key: 'stPourquoi', label: 'لماذا يقوم بمعالجتها؟', type: 'text', showIf: { key: 'sousTraitant', equals: 'نعم' } },
    { key: 'stOu', label: 'أين تتم المعالجة؟', type: 'text', showIf: { key: 'sousTraitant', equals: 'نعم' } },
    { key: 'stContrat', label: 'هل يوجد عقد مع المتعامل؟', type: 'radio', options: ['نعم', 'لا'], showIf: { key: 'sousTraitant', equals: 'نعم' } },
    { key: 'stClauses', label: 'هل العقد يتضمن أحكاماً تتعلق بحماية المعطيات؟', type: 'radio', options: ['نعم', 'لا', 'لا أعرف'], showIf: { key: 'sousTraitant', equals: 'نعم' } },
  ]},
  { id: 'p14', title: 'القسم 14 — مشاركة أو إرسال المعطيات إلى جهات أخرى', fields: [
    { key: 'commTiers', label: 'هل يتم إرسال أو إتاحة المعطيات الشخصية لأشخاص أو جهات أخرى؟', type: 'radio', options: ['نعم', 'لا'] },
    { key: 'commNom', label: 'اسم الجهة المستقبلة', type: 'text', showIf: { key: 'commTiers', equals: 'نعم' } },
    { key: 'commDonnees', label: 'ما هي المعطيات التي ترسل إليها؟', type: 'text', showIf: { key: 'commTiers', equals: 'نعم' } },
    { key: 'commPourquoi', label: 'لماذا ترسل إليها؟', type: 'text', showIf: { key: 'commTiers', equals: 'نعم' } },
    { key: 'commMode', label: 'كيف يتم إرسالها؟', type: 'checkbox', other: true,
      options: ['بريد إلكتروني', 'منصة إلكترونية', 'اتصال مباشر بين الأنظمة', 'وثائق ورقية', 'وسيط تخزين'],
      showIf: { key: 'commTiers', equals: 'نعم' } },
    { key: 'commFondement', label: 'ما هو الأساس/الإطار القانوني لهذه المشاركة؟', type: 'text', showIf: { key: 'commTiers', equals: 'نعم' } },
    { key: 'commContrat', label: 'هل توجد اتفاقية أو عقد؟', type: 'radio', options: ['نعم', 'لا'], showIf: { key: 'commTiers', equals: 'نعم' } },
  ]},
  { id: 'p15', title: 'القسم 15 — نقل المعطيات إلى الخارج', fields: [
    { key: 'transfert', label: 'هل يتم نقل المعطيات الشخصية أو تخزينها أو إتاحتها خارج الجزائر؟', type: 'radio', options: ['نعم', 'لا', 'لا أعرف'] },
    { key: 'transfertPays', label: 'الدولة', type: 'text', showIf: { key: 'transfert', equals: 'نعم' } },
    { key: 'transfertEntite', label: 'اسم الجهة/المؤسسة', type: 'text', showIf: { key: 'transfert', equals: 'نعم' } },
    { key: 'transfertDonnees', label: 'نوع المعطيات المنقولة', type: 'text', showIf: { key: 'transfert', equals: 'نعم' } },
    { key: 'transfertRaison', label: 'سبب النقل', type: 'text', showIf: { key: 'transfert', equals: 'نعم' } },
    { key: 'transfertMethode', label: 'طريقة النقل', type: 'text', showIf: { key: 'transfert', equals: 'نعم' } },
    { key: 'transfertStockage', label: 'أين يتم التخزين؟', type: 'text', showIf: { key: 'transfert', equals: 'نعم' } },
    { key: 'transfertAccord', label: 'هل توجد اتفاقية أو عقد؟', type: 'radio', options: ['نعم', 'لا'], showIf: { key: 'transfert', equals: 'نعم' } },
    { key: 'transfertCloud', label: 'هل يتم استعمال خدمة Cloud أو منصة أجنبية؟', type: 'radio', options: ['نعم', 'لا'], showIf: { key: 'transfert', equals: 'نعم' } },
  ]},
  { id: 'p16', title: 'القسم 16 — موافقة الأشخاص المعنيين', fields: [
    { key: 'consentement', label: 'عند جمع المعطيات، هل تطلب المؤسسة موافقة الشخص المعني؟', type: 'radio', options: ['نعم', 'لا', 'حسب الحالة', 'لا أعرف'] },
    { key: 'consentementMode', label: 'كيف يتم الحصول على الموافقة؟', type: 'checkbox', other: true,
      options: ['وثيقة مكتوبة', 'استمارة', 'توقيع العقد', 'الموقع الإلكتروني', 'مربع موافقة إلكتروني', 'البريد الإلكتروني'],
      showIf: { key: 'consentement', equals: 'نعم' } },
    { key: 'consentementPreuve', label: 'هل يمكن إثبات أن الشخص أعطى موافقته؟', type: 'radio', options: ['نعم', 'لا'], showIf: { key: 'consentement', equals: 'نعم' } },
  ]},
  { id: 'p17', title: 'القسم 17 — إعلام الأشخاص المعنيين', fields: [
    { key: 'infoDroit', label: 'هل يتم إخبار الشخص عند جمع بياناته بأن المؤسسة تقوم بمعالجة بياناته؟', type: 'radio', options: ['نعم', 'لا', 'حسب الحالة', 'لا أعرف'] },
    { key: 'infoMode', label: 'كيف يتم إعلامه؟', type: 'checkbox', other: true,
      options: ['عقد', 'استمارة', 'إشعار مكتوب', 'الموقع الإلكتروني', 'بريد إلكتروني', 'شفهي'] },
    { key: 'infoService', label: 'اسم المصلحة', type: 'text' },
    { key: 'infoAdresse', label: 'العنوان', type: 'text' },
    { key: 'infoTelephone', label: 'الهاتف', type: 'text' },
    { key: 'infoEmail', label: 'البريد الإلكتروني', type: 'text' },
    { key: 'infoMesures', label: 'ما هي الإجراءات المتخذة لتسهيل ممارسة حق الإعلام؟', type: 'textarea' },
  ]},
  { id: 'p18', title: 'القسم 18 — حق الوصول', fields: [
    { key: 'droitAcces', label: 'هل يستطيع الشخص المعني طلب الاطلاع على بياناته؟', type: 'radio', options: ['نعم', 'لا', 'لا أعرف'] },
    { key: 'droitAccesDemande', label: 'كيف يقدم الطلب؟', type: 'text' },
    { key: 'droitAccesService', label: 'إلى أي مصلحة يقدم الطلب؟', type: 'text' },
    { key: 'droitAccesMesures', label: 'ما هي الإجراءات المتخذة لمعالجة طلبات الوصول؟', type: 'textarea' },
  ]},
  { id: 'p19', title: 'القسم 19 — حق التصحيح', fields: [
    { key: 'droitRectif', label: 'هل يستطيع الشخص المعني طلب تصحيح بياناته؟', type: 'radio', options: ['نعم', 'لا', 'لا أعرف'] },
    { key: 'droitRectifDemande', label: 'كيف يقدم طلب التصحيح؟', type: 'text' },
    { key: 'droitRectifService', label: 'الجهة المسؤولة عن معالجة الطلب', type: 'text' },
    { key: 'droitRectifMesures', label: 'الإجراءات المتخذة لتنفيذ التصحيح', type: 'textarea' },
  ]},
  { id: 'p20', title: 'القسم 20 — حق الاعتراض', fields: [
    { key: 'droitOppo', label: 'هل يمكن للشخص المعني الاعتراض على معالجة بياناته عندما يكون ذلك متاحاً؟', type: 'radio', options: ['نعم', 'لا', 'حسب الحالة', 'لا أعرف'] },
    { key: 'droitOppoDemande', label: 'كيف يقدم طلب الاعتراض؟', type: 'text' },
    { key: 'droitOppoService', label: 'الجهة التي تستقبل الطلب', type: 'text' },
    { key: 'droitOppoMesures', label: 'الإجراءات المتخذة لمعالجة الاعتراض', type: 'textarea' },
  ]},
]

export const AR_DIAG_FIELDS = [
  { key: 'hasInventory', label: 'هل تعرف المؤسسة جميع المعالجات التي تتضمن بيانات شخصية؟', type: 'radio', options: ['نعم', 'جزئياً', 'لا'] },
  { key: 'hasRegistre', label: 'هل توجد قائمة أو سجل للمعالجات؟', type: 'radio', options: ['نعم', 'لا'] },
  { key: 'hasPolicy', label: 'هل توجد سياسة مكتوبة لحماية المعطيات الشخصية؟', type: 'radio', options: ['نعم', 'لا', 'قيد الإعداد'] },
  { key: 'hasDPO', label: 'هل تم تحديد مسؤول عن حماية المعطيات الشخصية؟', type: 'radio', options: ['نعم', 'لا'] },
  { key: 'staffTrained', label: 'هل تلقى الموظفون تكويناً حول حماية المعطيات؟', type: 'radio', options: ['نعم', 'لا', 'بعض الموظفين فقط'] },
  { key: 'incidentProcedure', label: 'هل توجد إجراءات للتعامل مع حوادث تسرب أو فقدان المعطيات؟', type: 'radio', options: ['نعم', 'لا', 'لا أعرف'] },
  { key: 'backupTested', label: 'هل يتم اختبار النسخ الاحتياطية واسترجاع البيانات؟', type: 'radio', options: ['بانتظام', 'أحياناً', 'لا', 'لا أعرف'] },
  { key: 'dataDeleted', label: 'هل يتم حذف المعطيات التي لم تعد المؤسسة بحاجة إليها؟', type: 'radio', options: ['نعم', 'لا', 'أحياناً', 'لا أعرف'] },
]

export const AR_FINAL_FIELDS = [
  { key: 'hasOther', label: 'هل توجد أي معالجة أو استعمال للمعطيات الشخصية داخل المؤسسة لم يتم ذكره في الأسئلة السابقة؟', type: 'radio', options: ['نعم', 'لا'] },
  { key: 'detail', label: 'إذا نعم، يرجى الوصف', type: 'textarea', showIf: { key: 'hasOther', equals: 'نعم' } },
]

// --- تحديد المعالجات التي تحتاج إلى دراسة إضافية (لكل معالجة) ---
export const AR_RULES = [
  { id: 'duree_inconnue', label: 'لا توجد مدة حفظ محددة', priority: 'مرتفع',
    test: (a) => !a.duree || a.duree === 'لا نعرف' || a.duree === 'إلى أجل غير محدد',
    risk: 'عدم احترام مبدأ تحديد مدة الاحتفاظ بالمعطيات',
    action: 'تحديد مدة الاحتفاظ لهذه المعالجة',
    doc: 'سياسة الاحتفاظ بالمعطيات' },
  { id: 'securite_absente', label: 'غياب إجراءات أمنية', priority: 'مرتفع',
    test: (a) => !(a.securiteInfo?.length) && !(a.securiteOrga?.length),
    risk: 'خطر فقدان أو سرقة أو الوصول غير المرخص به إلى المعطيات',
    action: 'إعداد سياسة أمن المعطيات وتفعيل إجراءات الحماية التقنية والتنظيمية',
    doc: 'سياسة أو ميثاق أمن المعطيات' },
  { id: 'donnees_sensibles', label: 'بيانات خاصة أو حساسة', priority: 'مرتفع',
    test: (a) => Array.isArray(a.typeSensible) && a.typeSensible.length && !a.typeSensible.includes('لا توجد'),
    risk: 'معالجة ذات خطورة مرتفعة تتطلب ضمانات إضافية',
    action: 'التحقق من الأساس القانوني وتعزيز ضمانات الحماية',
    doc: 'دراسة تأثير (عند الاقتضاء)' },
  { id: 'sous_traitant_sans_contrat', label: 'لا يوجد عقد مع المناول', priority: 'مرتفع',
    test: (a) => a.sousTraitant === 'نعم' && a.stContrat === 'لا',
    risk: 'غياب الإطار التعاقدي مع المتعامل الخارجي',
    action: 'مراجعة أو إبرام عقد مع المتعامل يتضمن أحكام حماية المعطيات',
    doc: 'عقد المناولة' },
  { id: 'communication_tiers', label: 'مشاركة البيانات مع أطراف أخرى', priority: 'متوسط',
    test: (a) => a.commTiers === 'نعم',
    risk: 'نشر معطيات خارج المؤسسة يتطلب تأطيراً',
    action: 'التحقق من الأساس القانوني وتأطير المشاركة باتفاقية',
    doc: 'اتفاقية مشاركة المعطيات' },
  { id: 'transfert_etranger', label: 'نقل البيانات إلى الخارج', priority: 'مرتفع',
    test: (a) => a.transfert === 'نعم',
    risk: 'نقل خارج الجزائر دون ضمانات محققة',
    action: 'التحقق من الإطار القانوني المطبق على النقل الدولي',
    doc: 'بنود النقل الدولي للمعطيات' },
  { id: 'hebergement_cloud', label: 'استضافة عبر Cloud', priority: 'متوسط',
    test: (a) => (a.infoLieuStockage || []).includes('Cloud'),
    risk: 'فقدان التحكم في مكان وأمن تخزين المعطيات',
    action: 'التحقق من الضمانات التعاقدية مع مزود خدمة Cloud',
    doc: 'عقد/بنود مع مزود Cloud' },
  { id: 'source_inconnue', label: 'عدم معرفة مصدر البيانات', priority: 'متوسط',
    test: (a) => !(a.origine?.length),
    risk: 'صعوبة التحقق من مشروعية جمع المعطيات',
    action: 'تحديد مصدر جمع المعطيات لهذه المعالجة',
    doc: 'بطاقة المعالجة' },
  { id: 'lieu_stockage_inconnu', label: 'عدم معرفة مكان تخزين البيانات', priority: 'متوسط',
    test: (a) => a.infoOuiNon === 'نعم' && !(a.infoLieuStockage?.length),
    risk: 'غياب الرؤية على مكان تخزين المعطيات الإلكترونية',
    action: 'تحديد مكان وطريقة تخزين المعطيات المعلوماتية',
    doc: 'بطاقة المعالجة' },
  { id: 'droits_sans_mecanisme', label: 'لا توجد آلية لممارسة حقوق الأشخاص', priority: 'متوسط',
    test: (a) => !a.droitAccesMesures && !a.droitRectifMesures && !a.droitOppoMesures,
    risk: 'عدم قدرة الأشخاص المعنيين على ممارسة حقوقهم',
    action: 'إنشاء إجراء داخلي لمعالجة طلبات ممارسة الحقوق',
    doc: 'إجراء داخلي لممارسة حقوق الأشخاص' },
]

// --- تحديد على مستوى المؤسسة (القسم 21) ---
export const AR_COMPANY_RULES = [
  { id: 'pas_registre', label: 'لا توجد قائمة للمعالجات', priority: 'مرتفع',
    test: (d) => d.hasRegistre === 'لا',
    risk: 'عدم احترام الالتزام بإعداد سجل المعالجات',
    action: 'إعداد سجل المعالجات الخاص بالمؤسسة',
    doc: 'سجل المعالجات' },
  { id: 'pas_responsable', label: 'عدم تحديد مسؤول عن حماية المعطيات', priority: 'مرتفع',
    test: (d) => d.hasDPO === 'لا',
    risk: 'غياب جهة مسؤولة عن متابعة الامتثال داخل المؤسسة',
    action: 'تعيين مسؤول عن حماية المعطيات الشخصية',
    doc: 'قرار التعيين' },
  { id: 'pas_politique', label: 'غياب سياسة مكتوبة لحماية المعطيات', priority: 'متوسط',
    test: (d) => d.hasPolicy === 'لا',
    risk: 'غياب إطار داخلي رسمي لحماية المعطيات',
    action: 'إعداد سياسة مكتوبة لحماية المعطيات الشخصية',
    doc: 'سياسة حماية المعطيات' },
]

export const AR_PRIORITY_ORDER = { 'مرتفع': 0, 'متوسط': 1, 'منخفض': 2 }
