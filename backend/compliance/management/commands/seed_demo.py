"""Jeu de démonstration (§47) : utilisateurs, référentiel, questions, SARL Exemple Algérie."""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from companies.models import Company
from diagnostics.models import Question, QuestionRule
from processing.models import (PersonalDataCategory, DataSubjectCategory,
                               SecurityMeasure, Processor, ProcessingActivity)
from compliance.models import (Domain, LegalReference, Requirement, Assessment,
                               Gap, Action, SystemSetting, DEFAULT_SCORE_LEVELS)
from compliance.services import run_engine
from missions.models import Mission

User = get_user_model()

DOMAINS = [
    ('gouvernance','Gouvernance','الحوكمة',2),('registre','Registre','السجل',2),
    ('donnees','Données','البيانات',2),('finalites','Finalités','الغايات',1),
    ('conservation','Conservation','الحفظ',1),('securite','Sécurité','الأمن',3),
    ('sous_traitance','Sous-traitance','المناولة',2),('destinataires','Destinataires','المستلمون',1),
    ('droits','Droits des personnes','حقوق الأشخاص',2),('consentement','Consentement','الموافقة',2),
    ('transfert','Transfert international','النقل الدولي',2),('documentation','Documentation','التوثيق',1),
]
REQS = [  # (code, domaine, texte)
    ('REQ-001','finalites',"La finalité du traitement est définie, explicite et légitime."),
    ('REQ-002','donnees',"Les données collectées sont adéquates et limitées à la finalité."),
    ('REQ-003','consentement',"Le consentement des personnes est recueilli lorsqu'il est requis, avec preuve."),
    ('REQ-004','droits',"Les personnes concernées sont informées et peuvent exercer leurs droits (accès, rectification, opposition)."),
    ('REQ-005','conservation',"Une durée de conservation est définie et appliquée."),
    ('REQ-006','securite',"Des mesures de sécurité techniques et organisationnelles sont en place (accès, sauvegarde, journalisation)."),
    ('REQ-007','sous_traitance',"Chaque sous-traitant ayant accès aux données est lié par un contrat comportant des garanties."),
    ('REQ-008','transfert',"Tout transfert de données vers l'étranger est identifié, encadré et documenté."),
    ('REQ-009','registre',"Le traitement est inscrit au registre avec une fiche complète et à jour."),
    ('REQ-010','destinataires',"Les destinataires des données sont identifiés et limités au nécessaire."),
    ('REQ-011','gouvernance',"Un responsable du traitement est désigné et identifié."),
    ('REQ-012','documentation',"Les documents justificatifs (procédures, chartes, contrats) sont disponibles."),
]
QUESTIONS = [  # (code, section, texte_fr, texte_ar, root, order, pourquoi_fr, pourquoi_ar)
    ('Q-EMP','Général',"L'entreprise collecte-t-elle des données relatives à ses employés ?","هل تجمع المؤسسة بيانات تتعلق بموظفيها؟",True,10,
     "Toute gestion du personnel implique un traitement de données à caractère personnel à recenser en priorité.","إدارة الموظفين تعني معالجة بيانات شخصية يجب حصرها أولاً."),
    ('Q-EMP-PAIE','RH',"Gère-t-elle la paie en interne ?","هل تُسيّر الأجور داخليًا؟",False,11,
     "La paie implique des données financières et bancaires sensibles ; savoir si elle est internalisée oriente les mesures de sécurité à vérifier.","الأجور تتضمن بيانات مالية وبنكية حساسة، ومعرفة ما إذا كانت داخلية توجه تدابير الأمن الواجب التحقق منها."),
    ('Q-CLI','Général',"L'entreprise collecte-t-elle des données relatives à ses clients ?","هل تجمع المؤسسة بيانات تتعلق بعملائها؟",True,20,
     "Les données clients sont souvent le traitement le plus volumineux et le plus exposé de l'entreprise.","بيانات العملاء غالبًا ما تكون المعالجة الأكبر حجمًا والأكثر عرضة للمخاطر في المؤسسة."),
    ('Q-VIDEO','Sécurité',"Utilise-t-elle la vidéosurveillance ?","هل تستخدم المراقبة بالفيديو؟",True,30,
     "La vidéosurveillance capte des images de personnes identifiables et est strictement encadrée (finalité, durée de conservation, information des personnes).","المراقبة بالفيديو تلتقط صور أشخاص يمكن التعرف عليهم وتخضع لتأطير صارم (الغاية، مدة الحفظ، إعلام الأشخاص)."),
    ('Q-ACCES','Sécurité',"Utilise-t-elle un système de contrôle d'accès (badges, biométrie) ?","هل تستخدم نظام مراقبة الدخول (بطاقات، بصمات)؟",True,31,
     "Un système biométrique traite une donnée particulièrement sensible ; son usage doit être strictement proportionné au besoin.","النظام البيومتري يعالج بيانات حساسة بشكل خاص، ويجب أن يكون استخدامه متناسبًا تمامًا مع الحاجة."),
    ('Q-ST','Sous-traitance',"Des sous-traitants ont-ils accès aux données ?","هل يمكن للمناولين الوصول إلى البيانات؟",True,40,
     "Tout accès par un tiers doit être encadré par un contrat prévoyant des garanties de protection des données.","أي وصول من طرف ثالث يجب أن يُؤطَّر بعقد ينص على ضمانات حماية البيانات."),
    ('Q-TRANSF','Transfert',"Existe-t-il un transfert de données vers l'étranger ?","هل يوجد نقل للبيانات نحو الخارج؟",True,50,
     "Un transfert hors du territoire national est soumis à des conditions particulières qu'il faut identifier tôt.","النقل خارج التراب الوطني يخضع لشروط خاصة يجب تحديدها مبكرًا."),
]
RULES = [
    ('Q-EMP','oui','show_question','Q-EMP-PAIE'),
    ('Q-EMP','oui','propose_processing','Gestion RH'),
    ('Q-EMP-PAIE','oui','propose_processing','Paie'),
    ('Q-CLI','oui','propose_processing','Gestion des clients'),
    ('Q-VIDEO','oui','propose_processing','Vidéosurveillance'),
    ('Q-ACCES','oui','propose_processing',"Contrôle d'accès"),
    ('Q-ST','oui','open_module','sous_traitants'),
    ('Q-TRANSF','oui','open_module','transfert_international'),
]
DATA_CATS = [('identite','Identité','الهوية'),('coordonnees','Coordonnées','بيانات الاتصال'),
    ('pro','Données professionnelles','بيانات مهنية'),('financier','Données financières','بيانات مالية'),
    ('connexion','Données de connexion','بيانات الاتصال الرقمي'),('images','Images','صور'),
    ('biometrie','Données biométriques','بيانات بيومترية'),('sensibles','Données sensibles','بيانات حساسة')]
SUBJECTS = [('salaries','Salariés','الموظفون'),('candidats','Candidats','المترشحون'),
    ('clients','Clients','العملاء'),('fournisseurs','Fournisseurs','الموردون'),
    ('visiteurs','Visiteurs','الزوار'),('prospects','Prospects','العملاء المحتملون')]
SECURITY = [('acces','Contrôle d\'accès logique','مراقبة الدخول المنطقي'),
    ('auth','Authentification','التوثيق'),('sauvegarde','Sauvegarde','النسخ الاحتياطي'),
    ('chiffrement','Chiffrement','التشفير'),('journal','Journalisation','التسجيل'),
    ('physique','Sécurité physique','الأمن المادي'),('charte','Charte informatique','ميثاق المعلوماتية')]

class Command(BaseCommand):
    def handle(self, *args, **opts):
        # --- utilisateurs
        admin, _ = User.objects.get_or_create(username='admin', defaults=dict(
            email='admin@mrafiq.dz', role='admin', is_staff=True, is_superuser=True))
        admin.set_password('Mrafiq!Admin2026'); admin.save()
        consultant, _ = User.objects.get_or_create(username='consultant', defaults=dict(
            email='consultant@mrafiq.dz', role='consultant', first_name='Nadia', last_name='Bensalem'))
        consultant.set_password('Mrafiq!Cons2026'); consultant.save()

        # --- référentiels
        for code, fr, ar in DATA_CATS: PersonalDataCategory.objects.get_or_create(code=code, defaults={'label_fr':fr,'label_ar':ar})
        for code, fr, ar in SUBJECTS: DataSubjectCategory.objects.get_or_create(code=code, defaults={'label_fr':fr,'label_ar':ar})
        for code, fr, ar in SECURITY: SecurityMeasure.objects.get_or_create(code=code, defaults={'label_fr':fr,'label_ar':ar})
        for i,(code, fr, ar, w) in enumerate(DOMAINS):
            Domain.objects.get_or_create(code=code, defaults={'label_fr':fr,'label_ar':ar,'weight':w,'order':i})
        loi, _ = LegalReference.objects.get_or_create(
            text_name='Loi n° 18-07', defaults={'description':
            "Loi relative à la protection des personnes physiques dans le traitement des données à caractère personnel (modifiée et complétée).",
            'version':'consolidée'})
        for code, dom, txt in REQS:
            Requirement.objects.get_or_create(code=code, defaults={
                'domain': Domain.objects.get(code=dom), 'legal_reference': loi, 'text_fr': txt})
        SystemSetting.objects.get_or_create(key='score_levels', defaults={'value': DEFAULT_SCORE_LEVELS})

        # --- questionnaire dynamique
        for code, sec, fr, ar, root, order, why_fr, why_ar in QUESTIONS:
            Question.objects.get_or_create(code=code, defaults={
                'section': sec, 'text_fr': fr, 'text_ar': ar, 'is_root': root, 'order': order,
                'rationale_fr': why_fr, 'rationale_ar': why_ar})
        for qcode, val, act, target in RULES:
            QuestionRule.objects.get_or_create(
                question=Question.objects.get(code=qcode), expected_value=val,
                action=act, target=target)

        # --- entreprise de démonstration
        company, created = Company.objects.get_or_create(name='SARL Exemple Algérie', defaults=dict(
            legal_form='SARL', sector='Distribution', main_activity='Commerce de gros',
            rc_number='16/00-1234567B26', wilaya='16', address='Zone industrielle, Alger',
            employees_count=85, contact_name='K. Benali', contact_email='contact@exemple.dz',
            it_systems='ERP interne, messagerie, pointeuse biométrique',
            created_by=consultant))
        entreprise, _ = User.objects.get_or_create(username='entreprise', defaults=dict(
            email='entreprise@exemple.dz', role='company', company=company,
            first_name='Karim', last_name='Benali'))
        entreprise.set_password('Mrafiq!Entr2026'); entreprise.save()
        if entreprise.company_id != company.pk:
            entreprise.company = company; entreprise.save()

        if created or not company.processings.exists():
            st, _ = Processor.objects.get_or_create(company=company, name='InfoServ DZ',
                defaults={'service':'Hébergement ERP','has_contract':False})
            def mk(name, **kw):
                m2m = {k: kw.pop(k) for k in ('subjects','datas','security','procs') if k in kw}
                p, _ = ProcessingActivity.objects.get_or_create(company=company, name=name, defaults=kw)
                if m2m.get('subjects'): p.subject_categories.set(DataSubjectCategory.objects.filter(code__in=m2m['subjects']))
                if m2m.get('datas'): p.data_categories.set(PersonalDataCategory.objects.filter(code__in=m2m['datas']))
                if m2m.get('security'): p.security_measures.set(SecurityMeasure.objects.filter(code__in=m2m['security']))
                if m2m.get('procs'): p.processors.set(m2m['procs'])
                return p
            rh = mk('Gestion RH', status='valide', purpose='Gestion administrative du personnel',
                    department='DRH', owner_name='K. Benali', storage_type='mixte',
                    retention_duration='Durée du contrat + archivage légal',
                    recipients='DRH, Direction, CNAS', consent_required=False,
                    subjects=['salaries','candidats'], datas=['identite','coordonnees','pro'],
                    security=['acces','auth','sauvegarde'])
            paie = mk('Paie', status='verifie', purpose='Calcul et versement des salaires',
                    department='Finance', owner_name='S. Hadj', storage_type='informatique',
                    retention_duration='10 ans', recipients='Finance, banque, CNAS',
                    subjects=['salaries'], datas=['identite','financier'],
                    security=['acces','sauvegarde'], procs=[st])
            cli = mk('Gestion des clients', status='renseigne', purpose='Gestion commerciale et facturation',
                    department='Commercial', owner_name='L. Ait', storage_type='informatique',
                    retention_duration='5 ans après la fin de la relation',
                    recipients='Commercial, Finance', consent_required=True, consent_method='Formulaire',
                    subjects=['clients'], datas=['identite','coordonnees','financier'],
                    security=['acces','auth'])
            fou = mk('Gestion des fournisseurs', status='renseigne', purpose='Achats et règlements',
                    department='Achats', owner_name='S. Hadj', storage_type='informatique',
                    subjects=['fournisseurs'], datas=['identite','coordonnees','financier'])
            vid = mk('Vidéosurveillance', status='a_verifier', purpose='Sécurité des locaux',
                    department='Sécurité', owner_name='M. Cherif', storage_type='informatique',
                    retention_duration='30 jours', recipients='Service sécurité',
                    subjects=['salaries','visiteurs'], datas=['images'], security=['physique','journal'])
            acc = mk("Contrôle d'accès", status='a_verifier', purpose='Contrôle des entrées (pointeuse biométrique)',
                    department='Sécurité', owner_name='M. Cherif', storage_type='informatique',
                    transfer_abroad=False, subjects=['salaries','visiteurs'],
                    datas=['identite','biometrie'], security=['acces','physique'])

            run_engine(company, consultant)
            # évaluations réalistes → score intermédiaire, écarts et actions
            SET = {
              rh.pk:  {'REQ-001':'conforme','REQ-002':'conforme','REQ-004':'conforme','REQ-005':'conforme',
                       'REQ-006':'conforme','REQ-009':'conforme','REQ-011':'conforme','REQ-010':'conforme',
                       'REQ-012':'partiel'},
              paie.pk:{'REQ-001':'conforme','REQ-005':'conforme','REQ-006':'partiel','REQ-007':'non_conforme',
                       'REQ-009':'conforme','REQ-011':'conforme'},
              cli.pk: {'REQ-001':'conforme','REQ-003':'partiel','REQ-004':'partiel','REQ-005':'conforme',
                       'REQ-010':'conforme'},
              fou.pk: {'REQ-001':'conforme','REQ-005':'manquant','REQ-009':'partiel'},
              vid.pk: {'REQ-001':'conforme','REQ-004':'non_conforme','REQ-005':'conforme','REQ-006':'partiel'},
              acc.pk: {'REQ-002':'non_conforme','REQ-006':'partiel','REQ-004':'manquant'},
            }
            for pid, mapping in SET.items():
                for rc, status in mapping.items():
                    Assessment.objects.filter(processing_id=pid, requirement__code=rc).update(status=status)
            run_engine(company, consultant)  # génère les écarts
            Gap.objects.filter(company=company, requirement__code='REQ-007').update(severity='critique')
            Gap.objects.filter(company=company, processing=acc, requirement__code='REQ-002').update(severity='critique')

            from datetime import date, timedelta
            Action.objects.get_or_create(company=company, title='Signer un contrat de sous-traitance avec InfoServ DZ',
                defaults=dict(processing=paie, priority='haute', assignee='S. Hadj',
                              due_date=date.today()-timedelta(days=5), status='en_cours',
                              gap=Gap.objects.filter(requirement__code='REQ-007').first()))
            Action.objects.get_or_create(company=company, title="Afficher l'information vidéosurveillance sur les sites",
                defaults=dict(processing=vid, priority='haute', assignee='M. Cherif',
                              due_date=date.today()+timedelta(days=10), status='a_faire'))
            Action.objects.get_or_create(company=company, title='Limiter les données de la pointeuse au strict nécessaire',
                defaults=dict(processing=acc, priority='haute', assignee='M. Cherif',
                              due_date=date.today()+timedelta(days=21), status='a_faire'))
            Action.objects.get_or_create(company=company, title='Définir la durée de conservation fournisseurs',
                defaults=dict(processing=fou, priority='moyenne', assignee='S. Hadj',
                              due_date=date.today()+timedelta(days=30), status='a_faire'))
            Action.objects.get_or_create(company=company, title='Mettre à jour la procédure de collecte du consentement clients',
                defaults=dict(processing=cli, priority='moyenne', assignee='L. Ait',
                              due_date=date.today()+timedelta(days=14), status='termine'))

        # --- mission de démonstration
        from datetime import date, timedelta
        Mission.objects.get_or_create(company=company, subject='Mise en conformité Loi 18-07', defaults=dict(
            consultant=consultant, status='analyse',
            scope="Diagnostic, cartographie des traitements et plan d'action pour l'ensemble des services.",
            start_date=date.today()-timedelta(days=30), created_by=consultant))

        self.stdout.write(self.style.SUCCESS(
            'Seed OK — comptes : admin / consultant / entreprise (mots de passe Mrafiq!Admin2026, Mrafiq!Cons2026, Mrafiq!Entr2026)'))
