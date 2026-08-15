"""Importe les 6 modèles juridiques/administratifs (fixtures/templates/) dans DocumentTemplate."""
from pathlib import Path
from django.core.files import File
from django.core.management.base import BaseCommand
from documents.models import DocumentTemplate

TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / 'fixtures' / 'templates'

TEMPLATES = [
    dict(code='charte-securite-it', category='charte', mergeable=True, order=10,
         filename='charte-securite-it.docx',
         title_fr="Charte de sécurité des technologies de l'information",
         title_ar='ميثاق أمن تكنولوجيا المعلومات',
         description_fr="Modèle de charte définissant les règles d'utilisation sécurisée "
                         "des ressources informatiques au sein de l'entreprise.",
         description_ar='نموذج ميثاق يحدد قواعد الاستخدام الآمن لموارد تكنولوجيا المعلومات '
                         'داخل المؤسسة.'),
    dict(code='engagement-confidentialite', category='engagement', mergeable=False, order=20,
         filename='engagement-confidentialite.docx',
         title_fr='Engagement de confidentialité et de non-divulgation',
         title_ar='الالتزام بالسرية وعدم الإفشاء',
         description_fr="Modèle d'engagement individuel de confidentialité, à faire signer par "
                         "toute personne ayant accès à des données à caractère personnel. "
                         "Champs à compléter à la main.",
         description_ar='نموذج التزام فردي بالسرية، يوقّعه كل شخص له صلاحية الاطلاع على المعطيات '
                         'ذات الطابع الشخصي. يُستكمل يدويًا.'),
    dict(code='note-information', category='note', mergeable=True, order=30,
         filename='note-information.docx',
         title_fr="Note d'information relative à la protection des données personnelles",
         title_ar='مذكرة إعلامية',
         description_fr="Modèle de note d'information à destination des personnes concernées, "
                         "sur le traitement de leurs données personnelles.",
         description_ar='نموذج مذكرة إعلامية موجهة للأشخاص المعنيين بخصوص معالجة معطياتهم ذات '
                         'الطابع الشخصي.'),
    dict(code='politique-protection-donnees', category='politique', mergeable=True, order=40,
         filename='politique-protection-donnees.docx',
         title_fr='Modèle de page de politique de protection des données personnelles',
         title_ar='نموذج صفحة سياسة حماية المعطيات ذات الطابع الشخصي',
         description_fr='Modèle de page de politique de protection des données personnelles, '
                         "destiné par exemple à un site web ou un document interne.",
         description_ar='نموذج صفحة سياسة حماية المعطيات ذات الطابع الشخصي، معدّة مثلاً لموقع '
                         'إلكتروني أو وثيقة داخلية.'),
    dict(code='contrat-sous-traitant', category='contrat', mergeable=False, order=50,
         filename='contrat-sous-traitant.docx',
         title_fr='Modèle de contrat de confidentialité avec un sous-traitant',
         title_ar='نموذج عقد/اتفاق السرية مع معالج من الباطن',
         description_fr='Modèle de contrat/accord de confidentialité à conclure avec un '
                         'sous-traitant ayant accès à des données personnelles. '
                         'Champs à compléter à la main.',
         description_ar='نموذج عقد/اتفاق سرية يُبرم مع معالج من الباطن له صلاحية الاطلاع على '
                         'المعطيات ذات الطابع الشخصي. يُستكمل يدويًا.'),
    dict(code='decision-designation-dpo', category='decision', mergeable=False, order=60,
         filename='decision-designation-dpo.pdf',
         title_fr='Décision de désignation du délégué à la protection des données (DPO)',
         title_ar='مقرر تعيين مندوب حماية المعطيات ذات الطابع الشخصي',
         description_fr='Modèle de décision de désignation du délégué à la protection des '
                         "données, conformément à l'article 41 bis de la loi 18-07. "
                         'Document PDF non modifiable, à compléter et signer.',
         description_ar='نموذج مقرر تعيين مندوب حماية المعطيات ذات الطابع الشخصي طبقا للمادة '
                         '41 مكرر من القانون 18-07. وثيقة PDF غير قابلة للتعديل، تُستكمل وتُوقّع.'),
]


class Command(BaseCommand):
    help = 'Importe les modèles de documents juridiques dans DocumentTemplate (idempotent).'

    def handle(self, *args, **opts):
        created, updated = 0, 0
        for tpl in TEMPLATES:
            filename = tpl.pop('filename')
            obj, was_created = DocumentTemplate.objects.update_or_create(
                code=tpl['code'], defaults=tpl)
            if was_created or not obj.source_file:
                with open(TEMPLATES_DIR / filename, 'rb') as f:
                    obj.source_file.save(filename, File(f), save=True)
            created += was_created
            updated += not was_created
        self.stdout.write(self.style.SUCCESS(
            f'Modèles importés : {created} créés, {updated} mis à jour '
            f'(total {DocumentTemplate.objects.count()}).'))
