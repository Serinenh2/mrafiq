"""Fiche de traitement individuelle en PDF (§8/§41)."""
import io
from datetime import date
from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from compliance.exports import INK, PRIMARY, BRASS

def processing_pdf(p):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18*mm, bottomMargin=18*mm)
    ss = getSampleStyleSheet()
    h1 = ParagraphStyle('h1', parent=ss['Title'], textColor=INK, fontSize=18, spaceAfter=2)
    sub = ParagraphStyle('sub', parent=ss['Normal'], textColor=BRASS, fontSize=9, spaceAfter=14)
    h2 = ParagraphStyle('h2', parent=ss['Heading2'], textColor=PRIMARY, fontSize=12, spaceBefore=12)
    body = ss['BodyText']

    def kv_table(rows):
        t = Table(rows, colWidths=[45*mm, 130*mm])
        t.setStyle(TableStyle([
            ('FONTSIZE', (0,0), (-1,-1), 9), ('GRID', (0,0), (-1,-1), .4, colors.HexColor('#C6D1E0')),
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F5F7FB')), ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4)]))
        return t

    story = [
        Paragraph(f'MRAFIQ — Fiche de traitement {p.reference}', h1),
        Paragraph(f'{p.company.name} · v{p.version} · {date.today().strftime("%d/%m/%Y")}', sub),
        HRFlowable(width='100%', color=BRASS, thickness=2), Spacer(1, 8),
        Paragraph('1. Identification', h2),
    ]
    story.append(kv_table([
        ['Nom du traitement', p.name], ['Finalité', p.purpose or '—'],
        ['Service responsable', p.department or '—'], ['Responsable', p.owner_name or '—'],
        ['Statut', p.get_status_display()], ['Support', p.get_storage_type_display() if p.storage_type else '—'],
        ['Origine des données', p.data_sources or '—'], ['Durée de conservation', p.retention_duration or '—'],
    ]))

    story.append(Paragraph('2. Personnes, données et sécurité', h2))
    story.append(kv_table([
        ['Personnes concernées', ', '.join(s.label_fr for s in p.subject_categories.all()) or '—'],
        ['Catégories de données', ', '.join(d.label_fr for d in p.data_categories.all()) or '—'],
        ['Mesures de sécurité', ', '.join(m.label_fr for m in p.security_measures.all()) or '—'],
    ]))
    items = list(p.data_items.all())
    if items:
        rows = [['Donnée', 'Sensible', 'Source', 'Conservation', 'Destinataire']]
        for it in items:
            label = it.custom_label or (it.category.label_fr if it.category else '—')
            rows.append([label, 'Oui' if it.is_sensitive else 'Non', it.source or '—',
                         it.retention or '—', it.recipient or '—'])
        t = Table(rows, colWidths=[40*mm, 18*mm, 35*mm, 35*mm, 47*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), PRIMARY), ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTSIZE', (0,0), (-1,-1), 8.5), ('GRID', (0,0), (-1,-1), .4, colors.HexColor('#C6D1E0')),
            ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4)]))
        story.append(Spacer(1, 4)); story.append(t)

    story.append(Paragraph('3. Destinataires et sous-traitants', h2))
    story.append(kv_table([
        ['Destinataires', p.recipients or '—'],
        ['Catégorie de destinataire', p.recipient_category or '—'],
        ['Sous-traitants', ', '.join(pr.name for pr in p.processors.all()) or '—'],
    ]))

    if p.transfer_abroad:
        story.append(Paragraph('4. Transfert à l\'étranger', h2))
        story.append(kv_table([
            ['Pays', p.transfer_country or '—'], ['Prestataire', p.transfer_provider or '—'],
            ['Mode de transfert', p.transfer_mode or '—'], ['Hébergement', p.transfer_hosting or '—'],
            ['Garanties', p.transfer_guarantees or '—'],
        ]))

    if p.consent_required:
        story.append(Paragraph('5. Consentement', h2))
        story.append(kv_table([
            ['Méthode', p.consent_method or '—'], ['Support', p.consent_support or '—'],
            ['Date', p.consent_date.strftime('%d/%m/%Y') if p.consent_date else '—'],
            ['Possibilité de retrait', p.consent_withdrawal or '—'],
        ]))

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "Document préparé via la plateforme MRAFIQ à des fins d'accompagnement. "
        "Il ne constitue ni une décision ni une autorisation d'une autorité administrative.",
        ParagraphStyle('foot', parent=ss['Normal'], fontSize=8, textColor=colors.HexColor('#51617A'))))
    doc.build(story)
    buf.seek(0)
    resp = HttpResponse(buf.read(), content_type='application/pdf')
    resp['Content-Disposition'] = f'attachment; filename="fiche_{p.reference}.pdf"'
    return resp
