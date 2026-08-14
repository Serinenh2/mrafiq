"""Importe le catalogue de traitements types par secteur (fichier bilingue AR/FR)."""
from pathlib import Path
import openpyxl
from django.core.management.base import BaseCommand
from processing.models import ProcessingTemplate

XLSX_PATH = Path(__file__).resolve().parent.parent.parent / 'fixtures' / 'processing_templates.xlsx'
SHEET = 'BDD Traitements'
FIRST_DATA_ROW = 3  # la ligne 2 est un exemple à ignorer (voir onglet Légende)


def split_ar_fr(value):
    if not value:
        return '', ''
    ar, _, fr = str(value).partition(' / ')
    return ar.strip(), fr.strip()


class Command(BaseCommand):
    help = "Importe processing_templates.xlsx dans ProcessingTemplate (idempotent)."

    def handle(self, *args, **opts):
        wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
        ws = wb[SHEET]
        created, updated = 0, 0
        for row in ws.iter_rows(min_row=FIRST_DATA_ROW, max_col=8, values_only=True):
            ref_id, domain, name, purpose, category, subjects, data_cats, retention = row
            if ref_id is None:
                continue
            domain_ar, domain_fr = split_ar_fr(domain)
            name_ar, name_fr = split_ar_fr(name)
            purpose_ar, purpose_fr = split_ar_fr(purpose)
            category_ar, category_fr = split_ar_fr(category)
            subjects_ar, subjects_fr = split_ar_fr(subjects)
            data_ar, data_fr = split_ar_fr(data_cats)
            retention_ar, retention_fr = split_ar_fr(retention)
            obj, was_created = ProcessingTemplate.objects.update_or_create(
                ref_id=int(ref_id), defaults=dict(
                    domain_fr=domain_fr, domain_ar=domain_ar,
                    name_fr=name_fr, name_ar=name_ar,
                    purpose_fr=purpose_fr, purpose_ar=purpose_ar,
                    category_fr=category_fr, category_ar=category_ar,
                    subject_categories_fr=subjects_fr, subject_categories_ar=subjects_ar,
                    data_categories_fr=data_fr, data_categories_ar=data_ar,
                    retention_fr=retention_fr, retention_ar=retention_ar,
                ))
            created += was_created
            updated += not was_created
        self.stdout.write(self.style.SUCCESS(
            f'Templates importés : {created} créés, {updated} mis à jour '
            f'(total {ProcessingTemplate.objects.count()}).'))
