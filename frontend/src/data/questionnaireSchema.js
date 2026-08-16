// Schéma statique du "Questionnaire de diagnostic des traitements de données
// à caractère personnel" (plateforme MRAFEQ). Piloté en local (pas d'appel API) :
// chaque section décrit ses champs de façon déclarative pour un rendu générique.

export const EMPLOYEES_OPTIONS = ['Moins de 10', '10 à 49', '50 à 249', '250 et plus']

export const ENTREPRISE_FIELDS = [
  { key: 'name', label: "Dénomination de l'entreprise", type: 'text' },
  // options peuplées dynamiquement depuis /processing-templates/ (voir Questionnaire.jsx)
  { key: 'sector', label: "Secteur d'activité", type: 'select', options: [] },
  { key: 'mainActivity', label: 'Activité principale', type: 'text' },
  { key: 'mainServices', label: 'Principales activités ou services proposés', type: 'textarea' },
  { key: 'employeesCount', label: 'Nombre approximatif de salariés', type: 'radio', options: EMPLOYEES_OPTIONS },
  { key: 'hasBranches', label: "L'entreprise possède-t-elle des agences, succursales ou établissements ?", type: 'radio', options: ['Oui', 'Non'] },
  { key: 'branchesDetail', label: 'Si oui, préciser', type: 'text', showIf: { key: 'hasBranches', equals: 'Oui' } },
  { key: 'usesSoftware', label: 'L\'entreprise utilise-t-elle des logiciels, applications ou plateformes informatiques ?', type: 'radio', options: ['Oui', 'Non'] },
  { key: 'softwareDetail', label: 'Si oui, lesquels ?', type: 'text', showIf: { key: 'usesSoftware', equals: 'Oui' } },
]

export const ACTIVITIES = [
  'Gestion des ressources humaines', 'Recrutement', 'Gestion des salariés', 'Gestion des salaires',
  'Gestion des absences', 'Gestion des congés', 'Gestion des formations', 'Gestion des clients',
  'Gestion des prospects', 'Gestion des fournisseurs', 'Gestion des contrats', 'Facturation',
  'Comptabilité', 'Ventes', 'Marketing', 'Prospection commerciale', 'Service après-vente',
  'Gestion des réclamations', "Contrôle d'accès", 'Vidéosurveillance', 'Sécurité', 'Site Internet',
  'Application mobile', 'Plateforme numérique', 'Messagerie électronique', 'Gestion des visiteurs',
  'Gestion des stagiaires',
]

// --- Fiche de traitement : répétée pour chaque activité sélectionnée (Parties 3 à 20) ---
export const FICHE_SECTIONS = [
  { id: 'p3', title: '3. Identification du traitement', fields: [
    { key: 'nom', label: 'Nom de cette activité ou opération', type: 'text' },
    { key: 'service', label: 'Service responsable de cette activité', type: 'text' },
    { key: 'responsable', label: 'Responsable de cette activité', type: 'text' },
    { key: 'depuis', label: 'Depuis quand cette activité existe-t-elle ?', type: 'text' },
    { key: 'active', label: 'Cette activité est-elle toujours réalisée actuellement ?', type: 'radio', options: ['Oui', 'Non'] },
    { key: 'support', label: 'Comment les données sont-elles traitées ?', type: 'radio', options: ['Sur papier', 'Informatiquement', 'Sur papier et informatiquement'] },
  ]},
  { id: 'p4', title: '4. Finalité du traitement', fields: [
    { key: 'finalites', label: "Pourquoi l'entreprise collecte-t-elle et utilise-t-elle ces données ?", type: 'checkbox', other: true, options: [
      'Gestion administrative', 'Gestion des salariés', 'Recrutement', 'Gestion des rémunérations',
      "Exécution d'un contrat", 'Gestion des clients', 'Gestion des fournisseurs', 'Facturation',
      'Comptabilité', "Fourniture d'un service", 'Communication avec les personnes',
      'Prospection commerciale', 'Marketing', 'Sécurité', "Contrôle d'accès",
      "Respect d'une obligation légale", 'Statistiques', 'Études', 'Recherche',
    ]},
    { key: 'finaliteExplication', label: 'Expliquez simplement pourquoi votre entreprise a besoin de ces données', type: 'textarea' },
  ]},
  { id: 'p5', title: '5. Personnes concernées', fields: [
    { key: 'personnes', label: 'Quelles catégories de personnes sont concernées par ce traitement ?', type: 'checkbox', other: true, options: [
      'Salariés', 'Anciens salariés', "Candidats à l'emploi", 'Stagiaires', 'Clients',
      'Clients potentiels', 'Fournisseurs', 'Prestataires', 'Partenaires', 'Visiteurs',
      'Utilisateurs du site Internet', "Utilisateurs d'une application", 'Étudiants', 'Patients',
      'Enfants ou mineurs',
    ]},
    { key: 'nombrePersonnes', label: 'Nombre approximatif de personnes concernées', type: 'text' },
  ]},
  { id: 'p6', title: '6. Quelles données sont collectées ?', fields: [
    { key: 'donneesIdentification', label: "A. Données d'identification", type: 'checkbox', other: true, options: [
      'Nom et prénom', 'Date de naissance', 'Lieu de naissance', "Numéro de carte d'identité",
      "Numéro d'identification national", 'Adresse', 'Téléphone', 'Adresse électronique',
      'Photographie', 'Signature',
    ]},
    { key: 'donneesPro', label: 'B. Données professionnelles', type: 'checkbox', other: true, options: [
      'Fonction', 'Poste occupé', 'Matricule', 'Diplômes', 'Qualifications',
      'Expérience professionnelle', 'Parcours professionnel', 'Données relatives au contrat',
    ]},
    { key: 'donneesFin', label: 'C. Données financières', type: 'checkbox', other: true, options: [
      'Salaire', 'Coordonnées bancaires', 'Informations de paiement', 'Informations de facturation',
      'Informations fiscales',
    ]},
    { key: 'donneesElec', label: 'D. Données électroniques', type: 'checkbox', other: true, options: [
      'Identifiant utilisateur', 'Adresse IP', 'Identifiants de connexion', 'Historique de connexion',
      'Données de navigation', "Données d'utilisation d'une application", 'Logs',
    ]},
    { key: 'donneesSensibles', label: 'E. Le traitement concerne-t-il des données présentant un caractère particulier ou sensible ?', type: 'radio', options: ['Oui', 'Non', 'Je ne sais pas'] },
    { key: 'typeSensible', label: 'Si oui, lesquelles ?', type: 'checkbox', other: true,
      options: ['Données de santé', 'Données biométriques', 'Données relatives au handicap', 'Images/vidéos'],
      showIf: { key: 'donneesSensibles', equals: 'Oui' } },
    { key: 'precisionSensible', label: 'Préciser', type: 'textarea', showIf: { key: 'donneesSensibles', equals: 'Oui' } },
  ]},
  { id: 'p7', title: '7. Origine des données', fields: [
    { key: 'origine', label: "Comment l'entreprise obtient-elle ces données ?", type: 'checkbox', other: true, options: [
      'Directement auprès de la personne concernée', 'Auprès du salarié', 'Auprès du client',
      'Auprès du fournisseur', "Auprès d'une administration", "Auprès d'une autre entreprise",
      'Depuis un site Internet', 'Depuis une application', 'Depuis une plateforme',
      'Depuis des documents papier',
    ]},
    { key: 'origineOrgNom', label: "Si les données proviennent d'une autre organisation — Nom de l'organisation", type: 'text' },
    { key: 'origineOrgDonnees', label: 'Quelles données sont obtenues ?', type: 'text' },
    { key: 'origineOrgPourquoi', label: 'Pourquoi sont-elles obtenues ?', type: 'text' },
  ]},
  { id: 'p8', title: '8. Mode de collecte', fields: [
    { key: 'collecteMode', label: 'Comment les données sont-elles recueillies ?', type: 'checkbox', other: true, options: [
      'Formulaire papier', 'Contrat', 'Dossier administratif', 'Courrier électronique',
      'Site Internet', 'Application', 'Plateforme', 'Téléphone', 'Entretien', 'Caméra',
      'Dispositif électronique',
    ]},
    { key: 'collecteType', label: 'La collecte est-elle', type: 'radio', options: ['Manuelle', 'Informatique', 'Manuelle et informatique'] },
  ]},
  { id: 'p9', title: '9. Conservation des données', fields: [
    { key: 'papierOuiNon', label: 'Support papier', type: 'radio', options: ['Oui', 'Non'] },
    { key: 'papierDossier', label: 'Nom du dossier ou registre', type: 'text', showIf: { key: 'papierOuiNon', equals: 'Oui' } },
    { key: 'papierLieu', label: 'Lieu de conservation', type: 'text', showIf: { key: 'papierOuiNon', equals: 'Oui' } },
    { key: 'papierAcces', label: 'Qui peut accéder aux dossiers ?', type: 'text', showIf: { key: 'papierOuiNon', equals: 'Oui' } },
    { key: 'papierProtection', label: 'Comment les documents sont-ils protégés ?', type: 'text', showIf: { key: 'papierOuiNon', equals: 'Oui' } },
    { key: 'infoOuiNon', label: 'Support informatique', type: 'radio', options: ['Oui', 'Non'] },
    { key: 'infoLogiciel', label: 'Nom du logiciel ou système', type: 'text', showIf: { key: 'infoOuiNon', equals: 'Oui' } },
    { key: 'infoBdd', label: 'Nom de la base de données', type: 'text', showIf: { key: 'infoOuiNon', equals: 'Oui' } },
    { key: 'infoLieuStockage', label: 'Lieu de stockage', type: 'checkbox', other: true,
      options: ['Ordinateur', 'Serveur interne', 'Réseau interne', 'Serveur externe', 'Cloud', 'Plateforme Internet'],
      showIf: { key: 'infoOuiNon', equals: 'Oui' } },
    { key: 'infoPays', label: 'Pays où les données sont hébergées', type: 'text', showIf: { key: 'infoOuiNon', equals: 'Oui' } },
  ]},
  { id: 'p10', title: '10. Durée de conservation', fields: [
    { key: 'duree', label: "Pendant combien de temps l'entreprise conserve-t-elle ces données ?", type: 'radio', options: [
      'Quelques jours', 'Quelques mois', '1 an', 'Plusieurs années', 'Pendant la durée du contrat',
      'Pendant une durée imposée par la réglementation', "Jusqu'à la fin de la relation avec la personne",
      'Sans durée définie', 'Nous ne savons pas',
    ]},
    { key: 'dureePrecise', label: 'Durée précise si connue', type: 'text' },
    { key: 'devenir', label: 'À la fin de cette durée, que deviennent les données ?', type: 'checkbox', other: true, options: [
      'Suppression', 'Destruction des documents papier', 'Suppression informatique', 'Archivage',
      'Anonymisation', 'Conservation pour une obligation légale', "Rien n'est prévu",
    ]},
  ]},
  { id: 'p11', title: '11. Personnes ayant accès aux données', fields: [
    { key: 'acces', label: 'Qui peut consulter ou utiliser les données ?', type: 'checkbox', other: true, options: [
      'Direction générale', 'Ressources humaines', 'Comptabilité', 'Service commercial',
      'Service informatique', 'Service juridique', 'Direction', 'Autres salariés',
      'Prestataires externes', 'Sous-traitants', 'Administrations',
    ]},
    { key: 'accesParFonction', label: 'Les accès sont-ils définis selon les fonctions ?', type: 'radio', options: ['Oui', 'Non', 'Je ne sais pas'] },
    { key: 'accesComptesIndiv', label: 'Les accès sont-ils protégés par des comptes individuels ?', type: 'radio', options: ['Oui', 'Non', 'Partiellement'] },
    { key: 'accesTraces', label: 'Les accès sont-ils enregistrés ou tracés ?', type: 'radio', options: ['Oui', 'Non', 'Je ne sais pas'] },
  ]},
  { id: 'p12', title: '12. Sécurité des traitements et des données', fields: [
    { key: 'securiteInfo', label: 'Sécurité informatique', type: 'checkbox', other: true, options: [
      'Mot de passe', 'Authentification individuelle', 'Antivirus', 'Pare-feu', 'Chiffrement',
      'Sauvegarde', 'Sauvegarde externalisée', 'Contrôle des accès', 'Journalisation', 'Traçabilité',
      'Plan de récupération des données',
    ]},
    { key: 'securitePhysique', label: 'Sécurité physique', type: 'checkbox', other: true, options: [
      'Locaux sécurisés', 'Armoires fermées', 'Accès limité aux dossiers',
      "Contrôle d'accès aux locaux", 'Vidéosurveillance',
    ]},
    { key: 'securiteOrga', label: 'Mesures organisationnelles', type: 'checkbox', other: true, options: [
      'Politique de sécurité', 'Charte de sécurité', 'Engagement de confidentialité',
      'Procédures écrites', 'Gestion des habilitations', 'Formation du personnel',
      "Procédure en cas d'incident", 'Audit de sécurité',
    ]},
    { key: 'charte', label: 'Existe-t-il une charte de sécurité ?', type: 'radio', options: ['Oui', 'Non'] },
    { key: 'charteInfo', label: 'Si oui, les personnes ayant accès aux données ont-elles été informées de cette charte ?', type: 'radio', options: ['Oui', 'Non'], showIf: { key: 'charte', equals: 'Oui' } },
  ]},
  { id: 'p13', title: '13. Sous-traitants', fields: [
    { key: 'sousTraitant', label: "L'entreprise fait-elle appel à une autre entreprise ou à un prestataire pour traiter ces données ?", type: 'radio', options: ['Oui', 'Non'] },
    { key: 'stNom', label: 'Nom du sous-traitant', type: 'text', showIf: { key: 'sousTraitant', equals: 'Oui' } },
    { key: 'stActivite', label: 'Activité du sous-traitant', type: 'text', showIf: { key: 'sousTraitant', equals: 'Oui' } },
    { key: 'stDonnees', label: 'Quelles données traite-t-il ?', type: 'text', showIf: { key: 'sousTraitant', equals: 'Oui' } },
    { key: 'stPourquoi', label: 'Pourquoi traite-t-il ces données ?', type: 'text', showIf: { key: 'sousTraitant', equals: 'Oui' } },
    { key: 'stOu', label: 'Où réalise-t-il le traitement ?', type: 'text', showIf: { key: 'sousTraitant', equals: 'Oui' } },
    { key: 'stContrat', label: 'Existe-t-il un contrat avec le sous-traitant ?', type: 'radio', options: ['Oui', 'Non'], showIf: { key: 'sousTraitant', equals: 'Oui' } },
    { key: 'stClauses', label: 'Le contrat contient-il des clauses relatives à la protection des données ?', type: 'radio', options: ['Oui', 'Non', 'Je ne sais pas'], showIf: { key: 'sousTraitant', equals: 'Oui' } },
  ]},
  { id: 'p14', title: '14. Communication à des tiers', fields: [
    { key: 'commTiers', label: "Les données sont-elles communiquées à d'autres personnes ou organisations ?", type: 'radio', options: ['Oui', 'Non'] },
    { key: 'commNom', label: "Nom de l'organisation destinataire", type: 'text', showIf: { key: 'commTiers', equals: 'Oui' } },
    { key: 'commDonnees', label: 'Quelles données lui sont communiquées ?', type: 'text', showIf: { key: 'commTiers', equals: 'Oui' } },
    { key: 'commPourquoi', label: 'Pourquoi lui sont-elles communiquées ?', type: 'text', showIf: { key: 'commTiers', equals: 'Oui' } },
    { key: 'commMode', label: 'Comment les données sont-elles transmises ?', type: 'checkbox', other: true,
      options: ['E-mail', 'Plateforme', 'Système informatique', 'Document papier', 'Clé/support électronique'],
      showIf: { key: 'commTiers', equals: 'Oui' } },
    { key: 'commContrat', label: 'Existe-t-il un contrat ou une convention ?', type: 'radio', options: ['Oui', 'Non'], showIf: { key: 'commTiers', equals: 'Oui' } },
    { key: 'commCadre', label: 'Quel est le cadre ou fondement de cette communication ?', type: 'text', showIf: { key: 'commTiers', equals: 'Oui' } },
  ]},
  { id: 'p15', title: "15. Transfert à l'étranger", fields: [
    { key: 'transfert', label: 'Les données sont-elles transférées, accessibles ou hébergées à l\'étranger ?', type: 'radio', options: ['Oui', 'Non', 'Je ne sais pas'] },
    { key: 'transfertPays', label: 'Pays concerné', type: 'text', showIf: { key: 'transfert', equals: 'Oui' } },
    { key: 'transfertDest', label: "Nom du destinataire/hébergeur", type: 'text', showIf: { key: 'transfert', equals: 'Oui' } },
    { key: 'transfertDonnees', label: 'Quelles données sont concernées ?', type: 'text', showIf: { key: 'transfert', equals: 'Oui' } },
    { key: 'transfertPourquoi', label: 'Pourquoi sont-elles transférées ?', type: 'text', showIf: { key: 'transfert', equals: 'Oui' } },
    { key: 'transfertStockage', label: 'Où sont-elles effectivement stockées ?', type: 'text', showIf: { key: 'transfert', equals: 'Oui' } },
    { key: 'transfertCloud', label: 'Utilisez-vous un service Cloud étranger ?', type: 'radio', options: ['Oui', 'Non', 'Je ne sais pas'], showIf: { key: 'transfert', equals: 'Oui' } },
  ]},
  { id: 'p16', title: '16. Consentement', fields: [
    { key: 'consentement', label: 'La personne concernée donne-t-elle son consentement avant la collecte ou l\'utilisation de ses données ?', type: 'radio', options: ['Oui', 'Non', 'Selon les cas', 'Je ne sais pas'] },
    { key: 'consentementMode', label: 'Comment le consentement est-il recueilli ?', type: 'checkbox', other: true,
      options: ['Document papier signé', 'Formulaire', 'Contrat', 'Site Internet', 'Case à cocher', 'E-mail'],
      showIf: { key: 'consentement', equals: 'Oui' } },
    { key: 'consentementPreuve', label: "L'entreprise conserve-t-elle une preuve du consentement ?", type: 'radio', options: ['Oui', 'Non'], showIf: { key: 'consentement', equals: 'Oui' } },
  ]},
  { id: 'p17', title: "17. Droit à l'information", fields: [
    { key: 'infoDroit', label: "La personne est-elle informée de l'utilisation de ses données ?", type: 'radio', options: ['Oui', 'Non', 'Selon les cas', 'Je ne sais pas'] },
    { key: 'infoMode', label: 'Comment est-elle informée ?', type: 'checkbox', other: true,
      options: ['Contrat', 'Formulaire', "Notice d'information", 'Site Internet', 'E-mail', 'Oralement'] },
    { key: 'infoService', label: 'Quel service peut être contacté par la personne concernée ?', type: 'text' },
    { key: 'infoAdresse', label: 'Adresse', type: 'text' },
    { key: 'infoTelephone', label: 'Téléphone', type: 'text' },
    { key: 'infoEmail', label: 'E-mail', type: 'text' },
  ]},
  { id: 'p18', title: "18. Droit d'accès", fields: [
    { key: 'droitAcces', label: 'La personne peut-elle demander à accéder à ses données ?', type: 'radio', options: ['Oui', 'Non', 'Je ne sais pas'] },
    { key: 'droitAccesDemande', label: 'Comment peut-elle faire sa demande ?', type: 'text' },
    { key: 'droitAccesService', label: 'À quel service doit-elle s\'adresser ?', type: 'text' },
    { key: 'droitAccesProcedure', label: 'Existe-t-il une procédure interne pour traiter les demandes ?', type: 'radio', options: ['Oui', 'Non'] },
  ]},
  { id: 'p19', title: '19. Droit de rectification', fields: [
    { key: 'droitRectif', label: 'La personne peut-elle demander la correction de ses données ?', type: 'radio', options: ['Oui', 'Non', 'Je ne sais pas'] },
    { key: 'droitRectifDemande', label: 'Comment peut-elle effectuer sa demande ?', type: 'text' },
    { key: 'droitRectifService', label: 'Quel service traite la demande ?', type: 'text' },
    { key: 'droitRectifProcedure', label: 'Existe-t-il une procédure interne ?', type: 'radio', options: ['Oui', 'Non'] },
  ]},
  { id: 'p20', title: "20. Droit d'opposition", fields: [
    { key: 'droitOppo', label: "La personne peut-elle exercer son droit d'opposition lorsque celui-ci est applicable ?", type: 'radio', options: ['Oui', 'Non', 'Selon les cas', 'Je ne sais pas'] },
    { key: 'droitOppoDemande', label: 'Comment la demande est-elle introduite ?', type: 'text' },
    { key: 'droitOppoService', label: 'Quel service reçoit la demande ?', type: 'text' },
    { key: 'droitOppoProcedure', label: 'Existe-t-il une procédure interne ?', type: 'radio', options: ['Oui', 'Non'] },
  ]},
]

export const DIAG_FIELDS = [
  { key: 'hasInventory', label: "L'entreprise dispose-t-elle d'une liste de tous ses traitements de données personnelles ?", type: 'radio', options: ['Oui', 'Non', 'En cours'] },
  { key: 'hasRegistre', label: "L'entreprise dispose-t-elle d'un registre des traitements ?", type: 'radio', options: ['Oui', 'Non', 'En cours'] },
  { key: 'hasDPO', label: 'Une personne est-elle désignée pour assurer la protection des données ?', type: 'radio', options: ['Oui', 'Non'] },
  { key: 'hasPolicy', label: 'Existe-t-il une politique interne de protection des données ?', type: 'radio', options: ['Oui', 'Non', 'En cours'] },
  { key: 'staffTrained', label: 'Le personnel a-t-il reçu une sensibilisation ou une formation ?', type: 'radio', options: ['Oui', 'Non', 'Une partie du personnel'] },
  { key: 'incidentProcedure', label: 'Existe-t-il une procédure en cas de perte, divulgation ou incident de sécurité ?', type: 'radio', options: ['Oui', 'Non', 'Je ne sais pas'] },
  { key: 'dataDeleted', label: 'Les données qui ne sont plus nécessaires sont-elles supprimées ?', type: 'radio', options: ['Oui', 'Non', 'Parfois', 'Je ne sais pas'] },
  { key: 'retentionDefined', label: 'Les durées de conservation sont-elles définies pour les différents traitements ?', type: 'radio', options: ['Oui', 'Non', 'Partiellement'] },
]

export const FINAL_FIELDS = [
  { key: 'hasOther', label: "Existe-t-il dans votre entreprise d'autres opérations, fichiers, logiciels, applications, dossiers ou activités utilisant des informations concernant des personnes qui n'ont pas été mentionnés dans ce questionnaire ?", type: 'radio', options: ['Oui', 'Non', 'Je ne sais pas'] },
  { key: 'detail', label: 'Si oui, préciser', type: 'textarea', showIf: { key: 'hasOther', equals: 'Oui' } },
]

// --- Détection automatique des points de non-conformité (par traitement) ---
export const RULES = [
  { id: 'duree_inconnue', label: 'Durée de conservation inconnue', priority: 'Haute',
    test: (a) => !a.duree || a.duree === 'Nous ne savons pas' || a.duree === 'Sans durée définie',
    risk: 'Non-respect du principe de limitation de la durée de conservation',
    action: 'Définir et documenter une durée de conservation pour ce traitement',
    doc: 'Politique de conservation des données' },
  { id: 'securite_absente', label: 'Absence de mesures de sécurité', priority: 'Haute',
    test: (a) => !(a.securiteInfo?.length) && !(a.securitePhysique?.length) && !(a.securiteOrga?.length),
    risk: 'Risque de perte, de vol ou d\'accès non autorisé aux données',
    action: 'Mettre en place des mesures de sécurité techniques, physiques et organisationnelles',
    doc: 'Charte / politique de sécurité' },
  { id: 'proc_acces_absente', label: "Absence de procédure de traitement des demandes d'accès", priority: 'Moyenne',
    test: (a) => a.droitAccesProcedure === 'Non',
    risk: "Incapacité à répondre aux demandes d'accès dans les délais",
    action: "Formaliser une procédure de traitement des demandes d'accès",
    doc: "Procédure droit d'accès" },
  { id: 'proc_rectif_absente', label: 'Absence de procédure de rectification', priority: 'Moyenne',
    test: (a) => a.droitRectifProcedure === 'Non',
    risk: 'Incapacité à corriger des données inexactes ou incomplètes',
    action: 'Formaliser une procédure de rectification',
    doc: 'Procédure droit de rectification' },
  { id: 'info_absente', label: "Absence d'information des personnes concernées", priority: 'Haute',
    test: (a) => a.infoDroit === 'Non',
    risk: "Non-respect du droit à l'information",
    action: "Rédiger et diffuser une notice d'information",
    doc: "Notice / mention d'information" },
  { id: 'donnees_particulieres', label: 'Présence de données particulières ou sensibles', priority: 'Haute',
    test: (a) => a.donneesSensibles === 'Oui',
    risk: 'Traitement à risque élevé nécessitant des garanties renforcées',
    action: 'Vérifier la base légale et renforcer les garanties de protection',
    doc: "Analyse d'impact (le cas échéant)" },
  { id: 'sous_traitant_sans_contrat', label: 'Sous-traitant sans contrat', priority: 'Haute',
    test: (a) => a.sousTraitant === 'Oui' && a.stContrat === 'Non',
    risk: "Absence d'encadrement contractuel du sous-traitant",
    action: 'Signer un contrat de sous-traitance avec clauses de protection des données',
    doc: 'Contrat de sous-traitance' },
  { id: 'communication_tiers', label: 'Communication de données à des tiers', priority: 'Moyenne',
    test: (a) => a.commTiers === 'Oui',
    risk: "Diffusion de données hors de l'entreprise à encadrer",
    action: 'Vérifier le fondement et encadrer la communication par convention',
    doc: 'Convention de communication de données' },
  { id: 'transfert_international', label: 'Transfert international de données', priority: 'Haute',
    test: (a) => a.transfert === 'Oui',
    risk: 'Transfert hors du pays sans garanties vérifiées',
    action: 'Vérifier le cadre légal applicable au transfert international',
    doc: 'Clauses de transfert international' },
  { id: 'hebergement_cloud', label: 'Hébergement Cloud', priority: 'Moyenne',
    test: (a) => (a.infoLieuStockage || []).includes('Cloud'),
    risk: 'Perte de maîtrise sur la localisation et la sécurité des données',
    action: 'Vérifier les garanties contractuelles du prestataire Cloud',
    doc: 'Contrat / clauses avec le prestataire Cloud' },
]

// --- Détection au niveau de l'entreprise (Partie 21) ---
export const COMPANY_RULES = [
  { id: 'pas_registre', label: 'Absence de registre des traitements', priority: 'Haute',
    test: (d) => d.hasRegistre === 'Non',
    risk: 'Non-respect de l\'obligation de tenue d\'un registre des traitements',
    action: 'Constituer le registre des traitements de l\'entreprise',
    doc: 'Registre des traitements' },
  { id: 'pas_responsable', label: 'Absence de responsable identifié pour la protection des données', priority: 'Haute',
    test: (d) => d.hasDPO === 'Non',
    risk: 'Absence de pilotage de la conformité au sein de l\'entreprise',
    action: 'Désigner un responsable de la protection des données',
    doc: 'Décision de désignation' },
  { id: 'pas_politique', label: 'Absence de politique de protection des données', priority: 'Moyenne',
    test: (d) => d.hasPolicy === 'Non',
    risk: 'Absence de cadre interne formalisé pour la protection des données',
    action: 'Rédiger une politique interne de protection des données',
    doc: 'Politique de protection des données' },
]

export const PRIORITY_ORDER = { Haute: 0, Moyenne: 1, Basse: 2 }
