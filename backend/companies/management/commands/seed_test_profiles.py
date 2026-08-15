"""Scénario de test à 5 profils d'entreprise (§35) : vérifie que le moteur de
questionnaire identifie correctement les traitements potentiels et adapte les
questions selon le secteur — en répondant réellement au questionnaire via le
moteur de règles (§10), pas en créant les traitements à la main."""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from companies.models import Company
from diagnostics.models import Diagnostic, Question
from diagnostics.services import apply_rules

User = get_user_model()

PROFILES = [
    dict(key='industrielle', name='Industries ALG SPA', sector='Industrie manufacturière',
         legal_form='SPA', answers=['Q-EMP', 'Q-EMP-PAIE', 'Q-ACCES', 'Q-VIDEO', 'Q-FOURN', 'Q-SANTE', 'Q-ST'],
         expected=['Gestion RH', 'Paie', "Contrôle d'accès", 'Vidéosurveillance',
                   'Gestion des fournisseurs', 'Santé et sécurité au travail']),
    dict(key='commerciale', name='Distri Commerce SARL', sector='Commerce de détail',
         legal_form='SARL', answers=['Q-EMP', 'Q-CLI', 'Q-FACT', 'Q-GESTCOM', 'Q-MKT', 'Q-WEB'],
         expected=['Gestion RH', 'Gestion des clients', 'Facturation', 'Gestion commerciale',
                   'Marketing et prospection', 'Site internet']),
    dict(key='services', name='Conseil Plus SARL', sector='Conseil aux entreprises',
         legal_form='SARL', answers=['Q-EMP', 'Q-CLI', 'Q-RECRUT', 'Q-COMPTA', 'Q-ST'],
         expected=['Gestion RH', 'Gestion des clients', 'Recrutement', 'Comptabilité']),
    dict(key='formation', name='Institut Savoir', sector='Formation professionnelle',
         legal_form='EURL', answers=['Q-EMP', 'Q-FORMATION', 'Q-VISITEURS', 'Q-ADMIN'],
         expected=['Gestion RH', 'Gestion de la formation', 'Gestion des visiteurs',
                   'Relations avec les administrations']),
    dict(key='administration', name='Direction Wilaya Test', sector='Administration publique',
         legal_form='EPA', answers=['Q-EMP', 'Q-ACCES', 'Q-VIDEO', 'Q-ADMIN', 'Q-COMMUNICATION'],
         expected=['Gestion RH', "Contrôle d'accès", 'Vidéosurveillance',
                   'Relations avec les administrations', 'Communication institutionnelle']),
]


class Command(BaseCommand):
    help = "Crée/vérifie les 5 profils d'entreprise du scénario de test (§35)."

    def handle(self, *args, **opts):
        consultant = User.objects.filter(role='consultant').first()
        passed, failed = 0, 0

        for profile in PROFILES:
            company, _ = Company.objects.get_or_create(
                name=profile['name'],
                defaults=dict(sector=profile['sector'], legal_form=profile['legal_form'],
                              wilaya='16', created_by=consultant))

            diag, _ = Diagnostic.objects.get_or_create(
                company=company, service=f"Test profil {profile['key']}",
                defaults=dict(created_by=consultant))

            for code in profile['answers']:
                question = Question.objects.get(code=code)
                answer, _ = diag.answers.get_or_create(
                    question=question, defaults={'value': 'oui', 'answered_by': consultant})
                if answer.value != 'oui':
                    answer.value = 'oui'; answer.save()
                apply_rules(diag, answer)

            created_names = set(company.processings.values_list('name', flat=True))
            missing = [name for name in profile['expected'] if name not in created_names]
            status = self.style.SUCCESS('OK') if not missing else self.style.ERROR('ÉCHEC')
            self.stdout.write(f"{profile['key']:16s} [{status}] "
                              f"{len(created_names & set(profile['expected']))}/{len(profile['expected'])} "
                              f"traitements attendus présents"
                              + (f" — manquants : {missing}" if missing else ''))
            passed += int(not missing); failed += int(bool(missing))

        self.stdout.write(self.style.SUCCESS(
            f'\nScénario 5 profils : {passed}/{len(PROFILES)} conformes.'
            if not failed else f'\nScénario 5 profils : {passed}/{len(PROFILES)} conformes, {failed} en échec.'))
