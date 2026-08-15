"""Importe le code géographique national (wilayas + communes, 2021) depuis
companies/fixtures/code_geographique_national_2021.xlsx dans Wilaya/Commune (idempotent)."""
from pathlib import Path
import openpyxl
from django.core.management.base import BaseCommand
from companies.models import Wilaya, Commune

FIXTURE = Path(__file__).resolve().parent.parent.parent / 'fixtures' / 'code_geographique_national_2021.xlsx'

class Command(BaseCommand):
    help = 'Importe le code géographique national (wilayas + communes) dans Wilaya/Commune.'

    def handle(self, *args, **opts):
        wb = openpyxl.load_workbook(FIXTURE, data_only=True)
        ws = wb.worksheets[0]

        wilayas_seen = {}
        communes_created, communes_updated = 0, 0
        for row in ws.iter_rows(min_row=2, values_only=True):
            wcode, wname_fr, wname_ar, ccode, cname_fr, cname_ar = row[:6]
            if wcode is None or ccode is None:
                continue
            wcode = f'{int(wcode):02d}'
            if wcode not in wilayas_seen:
                wilaya, _ = Wilaya.objects.update_or_create(
                    code=wcode, defaults={'name_fr': wname_fr.strip(), 'name_ar': wname_ar.strip()})
                wilayas_seen[wcode] = wilaya
            wilaya = wilayas_seen[wcode]
            _, created = Commune.objects.update_or_create(
                wilaya=wilaya, code=str(ccode),
                defaults={'name_fr': cname_fr.strip(), 'name_ar': cname_ar.strip()})
            communes_created += created
            communes_updated += not created

        self.stdout.write(self.style.SUCCESS(
            f'Wilayas : {len(wilayas_seen)} (total {Wilaya.objects.count()}). '
            f'Communes : {communes_created} créées, {communes_updated} mises à jour '
            f'(total {Commune.objects.count()}).'))
